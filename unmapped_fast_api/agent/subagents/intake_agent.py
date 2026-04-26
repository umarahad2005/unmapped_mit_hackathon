"""
agent/subagents/intake_agent.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Subagent: Narrative Intake.

Owns the intake domain. Validates narrative, saves to local storage
BEFORE any API call (offline-first mandate), runs skill extraction,
attaches taxonomy IDs, and returns a validated CandidateSkillSet.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
import time
from dataclasses import dataclass, field
from pathlib import Path

from agent.skills.skill_extraction import SkillExtractionSkill, CandidateSkill, ExtractionResult
from core.config_loader import SystemConfig

logger = logging.getLogger("unmapped.intake_agent")

# ── Data Types ────────────────────────────────────────────────────────────────

@dataclass
class CandidateSkillSet:
    skills:          list[CandidateSkill]
    extraction_gaps: list[str]
    config_id:       str
    narrative_hash:  str  # SHA-256 of narrative — not the narrative itself
    session_id:      str

    @property
    def count(self) -> int:
        return len(self.skills)

    def to_dict(self) -> dict:
        return {
            "session_id":      self.session_id,
            "config_id":       self.config_id,
            "skill_count":     self.count,
            "skills":          [s.to_dict() for s in self.skills],
            "extraction_gaps": self.extraction_gaps,
        }


# ── Local Storage (file-based, simulates IndexedDB for backend) ───────────────

class LocalStorage:
    """Simple file-based local storage for offline-first persistence."""

    BASE_PATH = Path("data/local_sessions")

    def save(self, session_id: str, key: str, data: dict) -> None:
        path = self.BASE_PATH / session_id
        path.mkdir(parents=True, exist_ok=True)
        with open(path / f"{key}.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        logger.debug(f"Saved {key} for session {session_id}")

    def load(self, session_id: str, key: str) -> dict | None:
        path = self.BASE_PATH / session_id / f"{key}.json"
        if not path.exists():
            return None
        with open(path, encoding="utf-8") as f:
            return json.load(f)


# ── Intake Agent ──────────────────────────────────────────────────────────────

class IntakeAgent:
    """
    Subagent: owns narrative intake.

    Critical sequence (Article I.2 offline-first mandate):
    1. Validate narrative
    2. Save narrative to local storage  ← BEFORE any API call
    3. Extract skills via Gemini
    4. Save results to local storage
    5. Return CandidateSkillSet
    """

    MIN_WORDS     = 20
    MAX_WORDS     = 2000
    CHUNK_SIZE    = 500   # chunk narratives >MAX_WORDS at this boundary

    def __init__(self, config: SystemConfig):
        self.config    = config
        self.storage   = LocalStorage()
        self.extractor = SkillExtractionSkill(config)

    async def run(self, narrative: str, session_id: str | None = None) -> CandidateSkillSet:
        """
        Full intake pipeline.
        session_id: optional, generated if not provided.
        """
        import hashlib
        import uuid

        session_id = session_id or str(uuid.uuid4())[:8]
        start      = time.monotonic()

        # ── Step 1: Validate ─────────────────────────────────────────────────
        narrative    = narrative.strip()
        word_count   = len(narrative.split())

        if word_count < self.MIN_WORDS:
            logger.info(
                f"Narrative too short ({word_count} words). "
                f"Min: {self.MIN_WORDS}. Proceeding anyway (nudge, not block)."
            )

        # Truncate if over limit
        if word_count > self.MAX_WORDS:
            narrative = " ".join(narrative.split()[:self.MAX_WORDS])
            logger.info(f"Narrative truncated to {self.MAX_WORDS} words")

        narrative_hash = hashlib.sha256(narrative.encode()).hexdigest()[:16]

        # ── Step 2: Save BEFORE API call (offline-first mandate) ────────────
        self.storage.save(session_id, "narrative", {
            "text":           narrative,
            "word_count":     word_count,
            "timestamp":      time.time(),
            "narrative_hash": narrative_hash,
            "config_id":      self.config.meta.config_id,
        })
        logger.info(
            f"Narrative saved locally (session: {session_id}, "
            f"words: {word_count}) — API call starting"
        )

        # ── Step 3: Extract skills ───────────────────────────────────────────
        result: ExtractionResult = self.extractor.run(narrative)

        # ── Step 4: Validate taxonomy IDs ────────────────────────────────────
        # Load valid IDs from local data (if available)
        valid_ids = self._load_valid_taxonomy_ids()
        validated_skills = []
        for skill in result.all_skills:
            if valid_ids and skill.taxonomy_id not in valid_ids:
                logger.warning(
                    f"Skill '{skill.skill_label}' has unmapped taxonomy ID "
                    f"'{skill.taxonomy_id}' — marking as UNMAPPED"
                )
                skill.taxonomy_id = f"UNMAPPED_{skill.taxonomy_id}"
            validated_skills.append(skill)

        # ── Step 5: Build CandidateSkillSet ─────────────────────────────────
        skill_set = CandidateSkillSet(
            skills          = validated_skills,
            extraction_gaps = result.extraction_gaps,
            config_id       = self.config.meta.config_id,
            narrative_hash  = narrative_hash,
            session_id      = session_id,
        )

        # ── Step 6: Persist results ──────────────────────────────────────────
        self.storage.save(session_id, "candidate_skills", skill_set.to_dict())

        elapsed = time.monotonic() - start
        logger.info(
            f"Intake complete in {elapsed:.2f}s: "
            f"{skill_set.count} skills extracted "
            f"({len(result.extraction_gaps)} gaps)"
        )

        return skill_set

    def _load_valid_taxonomy_ids(self) -> set[str] | None:
        """Load valid taxonomy IDs from local ESCO data, if available."""
        skills_path = Path("data/esco/skills.json")
        if not skills_path.exists():
            return None
        try:
            with open(skills_path, encoding="utf-8") as f:
                data = json.load(f)
            return {s["id"] for s in data.get("skills", [])}
        except Exception as e:
            logger.warning(f"Could not load taxonomy IDs: {e}")
            return None

    async def on_config_swap(self, new_config: SystemConfig) -> None:
        """Reload extractor when config swaps."""
        self.config    = new_config
        self.extractor = SkillExtractionSkill(new_config)
        logger.info(f"IntakeAgent: reloaded for config {new_config.meta.config_id}")
