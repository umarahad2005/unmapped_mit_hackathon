"""
agent/subagents/mirror_agent.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Subagent: Mirror Test Engine.

Drives the full adaptive Mirror Test loop.
Hard limits: 15 cards max, 5 minutes max (Article III.2).
Runs integrity check after completion.
─────────────────────────────────────────────────────────────────────────────
"""

import asyncio
import json
import logging
import time
from dataclasses import dataclass, field
from pathlib import Path

from agent.agent_config import MIRROR_MAX_CARDS, MIRROR_MAX_SECONDS
from agent.skills.mirror_card_writer import MirrorCardWriterSkill, MirrorCardCache
from agent.subagents.intake_agent import CandidateSkillSet
from core.config_loader import SystemConfig
from core.mirror.router import MirrorRouter, MirrorSessionState
from core.mirror.integrity import IntegrityChecker

logger = logging.getLogger("unmapped.mirror_agent")


# ── Data Types ────────────────────────────────────────────────────────────────

@dataclass
class MirrorCard:
    skill_id:         str
    skill_label:      str
    task_id:          str
    original_task:    str
    plain_language:   str
    card_number:      int

    def to_dict(self) -> dict:
        return {
            "skill_id":       self.skill_id,
            "skill_label":    self.skill_label,
            "task_id":        self.task_id,
            "plain_language": self.plain_language,
            "card_number":    self.card_number,
        }


@dataclass
class MirrorResult:
    tier1_skill_ids:  list[str]
    all_skills:       list[dict]        # skills with updated tiers
    cards_shown:      int
    elapsed_seconds:  float
    integrity_flag:   bool
    integrity_message: str
    session_summary:  dict

    @property
    def tier1_count(self) -> int:
        return len(self.tier1_skill_ids)


# ── Task Statement Loader ─────────────────────────────────────────────────────

class OnetTaskLoader:
    """Loads O*NET task statements from local cache."""

    TASKS_PATH = Path("data/onet/task_statements.json")
    _cache: dict[str, list[dict]] | None = None

    @classmethod
    def load_all(cls) -> list[dict]:
        if cls._cache is not None:
            return list(cls._cache.values())
        if not cls.TASKS_PATH.exists():
            logger.warning(
                f"O*NET tasks not found at {cls.TASKS_PATH}. "
                "Run: python scripts/seed_data.py"
            )
            return []
        with open(cls.TASKS_PATH, encoding="utf-8") as f:
            data = json.load(f)
        tasks = data.get("tasks", [])
        cls._cache = {t["task_id"]: t for t in tasks}
        return tasks

    @classmethod
    def get_tasks_for_skill(cls, skill_id: str, max_tasks: int = 3) -> list[dict]:
        """Get O*NET task statements relevant to a skill taxonomy ID."""
        all_tasks = cls.load_all()
        matching = [
            t for t in all_tasks
            if skill_id in t.get("taxonomy_skills", [])
        ]
        return matching[:max_tasks]

    @classmethod
    def get_fallback_task(cls, skill_label: str) -> dict:
        """Return a generic task when no O*NET match found."""
        return {
            "task_id": f"fallback_{hash(skill_label) % 10000}",
            "task":    f"Do work related to {skill_label.lower()}.",
            "taxonomy_skills": [],
        }


# ── Mirror Agent ──────────────────────────────────────────────────────────────

class MirrorAgent:
    """
    Subagent: drives the adaptive Mirror Test.

    The Mirror Test is the system's core epistemological innovation —
    showing real task descriptions and asking "does this describe your work?"
    is recognition, not recall (the stronger form of self-assessment).
    """

    def __init__(self, config: SystemConfig, skill_graph):
        self.config      = config
        self.graph       = skill_graph
        self.router      = MirrorRouter(skill_graph)
        self.writer      = MirrorCardWriterSkill(config)
        self.card_cache  = MirrorCardCache()
        self.checker     = IntegrityChecker()

    async def run(
        self,
        candidate_skills: CandidateSkillSet,
        response_provider=None,   # Callable for interactive mode; None for API mode
    ) -> MirrorResult:
        """
        Run the full Mirror Test.

        In API mode: returns all cards at once (frontend drives interaction).
        In interactive mode: response_provider is called per card.
        """
        start   = time.monotonic()
        state   = MirrorSessionState(candidate_skills.skills)

        # Build initial card queue from candidate skills
        pending_skill_ids = list(state.tier0_skill_ids)
        cards_presented:  list[MirrorCard] = []

        current_skill_id = pending_skill_ids[0] if pending_skill_ids else None
        card_number      = 0

        while current_skill_id and card_number < MIRROR_MAX_CARDS:
            # ── Hard time limit (Article III.2) ──────────────────────────────
            elapsed = time.monotonic() - start
            if elapsed > MIRROR_MAX_SECONDS:
                logger.warning(
                    f"Mirror Test: 5-minute limit hit at card {card_number} — "
                    "ending early with partial results"
                )
                break

            # ── Load task statement ───────────────────────────────────────────
            tasks = OnetTaskLoader.get_tasks_for_skill(current_skill_id)
            if not tasks:
                tasks = [OnetTaskLoader.get_fallback_task(current_skill_id)]

            task     = tasks[0]  # Use first (most representative) task
            task_id  = task["task_id"]
            raw_task = task["task"]

            # ── Rewrite in plain language ─────────────────────────────────────
            plain_text = self.card_cache.get_or_write(task_id, raw_task, self.writer)

            # Find label for this skill
            skill_obj = next(
                (s for s in candidate_skills.skills if s.taxonomy_id == current_skill_id),
                None
            )
            skill_label = skill_obj.skill_label if skill_obj else current_skill_id

            card = MirrorCard(
                skill_id       = current_skill_id,
                skill_label    = skill_label,
                task_id        = task_id,
                original_task  = raw_task,
                plain_language = plain_text,
                card_number    = card_number + 1,
            )
            cards_presented.append(card)
            card_number += 1

            # ── Get response ──────────────────────────────────────────────────
            if response_provider:
                # Interactive / test mode
                response = await response_provider(card)
            else:
                # API mode: return cards, wait for external responses
                # (frontend will call /api/mirror/respond for each card)
                state.record_response(current_skill_id, "PENDING")
                current_skill_id = self.router.get_next_card(
                    current_skill_id, "PENDING", state
                )
                continue

            # ── Route based on response ───────────────────────────────────────
            state.record_response(current_skill_id, response)
            current_skill_id = self.router.get_next_card(
                current_skill_id, response, state
            )

            logger.debug(
                f"Card {card_number}/{MIRROR_MAX_CARDS}: "
                f"skill={skill_label[:30]} response={response} "
                f"→ next={current_skill_id}"
            )

        # ── Integrity check ───────────────────────────────────────────────────
        integrity = self.checker.check(state.responses)

        tier1_ids = list(state.tier1_skills)
        if integrity.integrity_flag:
            # Cap at Tier 1 — already the case, just log and attach notice
            logger.info(
                f"Integrity flag: {integrity.contradiction_count} contradictions "
                "— all skills capped at Tier 1"
            )

        # ── Build updated skill list ──────────────────────────────────────────
        updated_skills = []
        for skill in candidate_skills.skills:
            s = skill.to_dict()
            if skill.taxonomy_id in tier1_ids:
                s["tier"]       = 1
                s["tier_label"] = self.config.ui_strings.get("tier_recognized", "RECOGNIZED")
            updated_skills.append(s)

        elapsed = time.monotonic() - start

        result = MirrorResult(
            tier1_skill_ids  = tier1_ids,
            all_skills       = updated_skills,
            cards_shown      = card_number,
            elapsed_seconds  = round(elapsed, 2),
            integrity_flag   = integrity.integrity_flag,
            integrity_message= integrity.user_message or "",
            session_summary  = {
                **state.to_summary(),
                "cards_presented": [c.to_dict() for c in cards_presented],
                "elapsed_seconds": round(elapsed, 2),
            },
        )

        logger.info(
            f"Mirror Test complete: {card_number} cards, "
            f"{len(tier1_ids)} Tier 1 upgrades, "
            f"elapsed {elapsed:.1f}s "
            f"{'[INTEGRITY FLAG]' if integrity.integrity_flag else ''}"
        )
        return result

    async def on_config_swap(self, new_config: SystemConfig) -> None:
        self.config = new_config
        self.writer = MirrorCardWriterSkill(new_config)
        logger.info(f"MirrorAgent: reloaded for config {new_config.meta.config_id}")
