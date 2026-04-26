"""
agent/subagents/verification_agent.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Subagent: Micro-Verification Engine.

Selects the top 3–5 Tier 1 skills by relevance × demand, runs
scenario or evidence verification for each, and advances qualifying
skills to Tier 2 (DEMONSTRATED).

Article III.3: "Fail or skip → stays Tier 1. No penalty. No regression."
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import time
from dataclasses import dataclass, field

from agent.agent_config import VERIFICATION_MAX_SKILLS
from agent.skills.scenario_generator import ScenarioGeneratorSkill
from agent.skills.scenario_scorer import ScenarioScorerSkill
from agent.subagents.mirror_agent import MirrorResult
from core.config_loader import SystemConfig

logger = logging.getLogger("unmapped.verification_agent")


# ── Data Types ────────────────────────────────────────────────────────────────

@dataclass
class VerificationEntry:
    skill_id:       str
    skill_label:    str
    taxonomy_id:    str
    relevance_score: float
    verification_type: str      # "scenario" | "evidence" | "skipped"
    tier:           int = 1     # starts at 1, may advance to 2
    tier_label:     str = "RECOGNIZED"
    reasoning_note: str = ""
    scenario_score: int = 0


@dataclass
class VerificationResult:
    verified_skills:  list[dict]   # all skills with final tiers
    tier2_skills:     list[str]    # IDs of skills that advanced to Tier 2
    tier2_count:      int = 0

    def __post_init__(self):
        self.tier2_count = len(self.tier2_skills)


# ── Skill Ranker ──────────────────────────────────────────────────────────────

class Tier1SkillRanker:
    """
    Ranks Tier 1 skills by composite relevance score.
    relevance = skill_alignment_weight × local_demand_signal
    """

    def rank(self, skills: list[dict], config: SystemConfig) -> list[dict]:
        """
        Returns skills sorted by relevance descending.
        Currently uses skill_type as a proxy (technical > domain > transferable).
        In production: multiply by ILOSTAT demand signal for the skill's occupation.
        """
        type_weights = {"technical": 0.8, "domain": 0.6, "transferable": 0.4}

        def score(s: dict) -> float:
            type_w = type_weights.get(s.get("skill_type", "technical"), 0.5)
            tier   = s.get("tier", 0)
            return type_w * (1 + tier * 0.1)

        return sorted(
            [s for s in skills if s.get("tier", 0) >= 1],
            key=score,
            reverse=True,
        )


# ── Verification Agent ────────────────────────────────────────────────────────

class VerificationAgent:
    """
    Subagent: runs micro-verification for top Tier 1 skills.

    Design rules:
    - Only top N skills enter verification (N = VERIFICATION_MAX_SKILLS)
    - Each skill gets exactly ONE challenge (scenario or evidence)
    - Skipping is always allowed — skill stays at Tier 1
    - Tier 1 can never regress to Tier 0 from a failed verification
    """

    def __init__(self, config: SystemConfig, skill_graph):
        self.config     = config
        self.graph      = skill_graph
        self.ranker     = Tier1SkillRanker()
        self.generator  = ScenarioGeneratorSkill(config)
        self.scorer     = ScenarioScorerSkill(config)

    async def run(
        self,
        mirror_result: MirrorResult,
        response_provider=None,   # Optional async callable for interactive mode
    ) -> VerificationResult:
        """
        Run micro-verification on top Tier 1 skills.
        Returns VerificationResult with all skills at their final tiers.
        """
        start = time.monotonic()
        all_skills  = mirror_result.all_skills
        tier1_skills = [s for s in all_skills if s.get("tier", 0) == 1]

        # ── Rank and select top N ─────────────────────────────────────────────
        ranked = self.ranker.rank(tier1_skills, self.config)
        top_skills = ranked[:VERIFICATION_MAX_SKILLS]

        logger.info(
            f"Verification: {len(tier1_skills)} Tier 1 skills, "
            f"top {len(top_skills)} selected for verification"
        )

        tier2_ids = []
        verification_notes: dict[str, dict] = {}

        for skill in top_skills:
            skill_id    = skill.get("taxonomy_id", skill.get("skill_id", ""))
            skill_label = skill.get("skill_label", "")

            logger.info(f"Verifying: {skill_label} ({skill_id})")

            # ── Determine verification type ───────────────────────────────────
            # For hackathon: always scenario (evidence upload requires file handling)
            v_type = "scenario"

            # ── Generate scenario ─────────────────────────────────────────────
            scenario = self.generator.run(skill_id, skill_label)

            if response_provider:
                # Interactive mode: get user response
                user_response = await response_provider(scenario)
                if user_response is None or user_response.strip().lower() in ("skip", ""):
                    logger.info(f"Skipped: {skill_label}")
                    verification_notes[skill_id] = {
                        "verification_type": "skipped",
                        "reasoning_note":    "Verification skipped. Skill remains Recognized.",
                    }
                    continue

                # ── Score response ────────────────────────────────────────────
                result = self.scorer.run(scenario, user_response)
                verification_notes[skill_id] = result.to_dict()

                if result.advanced_to_tier2:
                    tier2_ids.append(skill_id)
                    logger.info(f"  → Tier 2: {skill_label} (score: {result.total}/9)")
                else:
                    logger.info(f"  → Tier 1 retained: {skill_label} (score: {result.total}/9)")
            else:
                # API mode: generate scenario, store for frontend to retrieve
                verification_notes[skill_id] = {
                    "verification_type": v_type,
                    "scenario":          scenario.to_dict(),
                    "status":            "pending_response",
                }

        # ── Build final skill list with updated tiers ─────────────────────────
        final_skills = []
        for skill in all_skills:
            s = dict(skill)
            skill_id = s.get("taxonomy_id", s.get("skill_id", ""))

            if skill_id in tier2_ids:
                s["tier"]       = 2
                s["tier_label"] = self.config.ui_strings.get("tier_demonstrated", "DEMONSTRATED")
                s["evidence_path"] = (
                    s.get("evidence_path", "Stated → Mirror Test →")
                    + " Verified via scenario"
                )
                note = verification_notes.get(skill_id, {})
                s["reasoning_note"] = note.get("reasoning_note", "")

            if skill_id in verification_notes and skill_id not in tier2_ids:
                s["reasoning_note"] = verification_notes[skill_id].get("reasoning_note", "")

            final_skills.append(s)

        elapsed = time.monotonic() - start
        logger.info(
            f"Verification complete in {elapsed:.2f}s: "
            f"{len(tier2_ids)} skills advanced to Tier 2"
        )

        return VerificationResult(
            verified_skills = final_skills,
            tier2_skills    = tier2_ids,
        )

    async def on_config_swap(self, new_config: SystemConfig) -> None:
        self.config    = new_config
        self.generator = ScenarioGeneratorSkill(new_config)
        self.scorer    = ScenarioScorerSkill(new_config)
        logger.info(f"VerificationAgent: reloaded for {new_config.meta.config_id}")
