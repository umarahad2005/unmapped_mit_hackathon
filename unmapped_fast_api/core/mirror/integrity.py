"""
core/mirror/integrity.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Mirror Test anti-gaming integrity checker.

Detects contradictory response patterns across semantically similar tasks.
Never penalizes users — downgrades to Tier 1 max with a transparency notice.
(Article VII.3)
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from dataclasses import dataclass
from typing import Optional

from agent.agent_config import INTEGRITY_MAX_CONTRADICTIONS

logger = logging.getLogger("unmapped.integrity")

# ── Known semantically similar skill pairs ────────────────────────────────────
# If a user says YES to one and NO to the other, that's a contradiction signal.

KNOWN_SEMANTIC_PAIRS: list[tuple[str, str]] = [
    ("S5.6.0", "S5.6.1"),   # electronic repair ↔ component testing
    ("S5.6.0", "S5.6.2"),   # electronic repair ↔ circuit fault diagnosis
    ("S5.6.1", "S5.6.2"),   # component testing ↔ circuit fault diagnosis
    ("S1.2.1", "S1.2.3"),   # customer communication ↔ conflict resolution
    ("S6.1.0", "S6.1.1"),   # business operations ↔ bookkeeping
    ("S2.1.0", "S2.1.1"),   # agricultural oversight ↔ produce grading
    ("S3.1.0", "S3.2.1"),   # materials handling ↔ electrical wiring
]

# ── Result Types ──────────────────────────────────────────────────────────────

@dataclass
class IntegrityResult:
    integrity_flag: bool
    contradiction_count: int
    contradictions: list[dict]
    action: Optional[str]          # "cap_at_tier_1" or None
    user_message: Optional[str]    # Always in plain language


class IntegrityChecker:
    """
    Checks a completed Mirror Test session for contradictory response patterns.

    Design rule (Article VII.3):
    - Flags are never punishments
    - Flagged profiles are downgraded to Tier 1 max (not zeroed out)
    - User is always told why in plain language
    - The system is transparent about what happened
    """

    def check(self, responses: dict[str, str]) -> IntegrityResult:
        """
        Check session responses for contradictions.

        responses: dict mapping skill_id → "YES" | "NO" | "SOMETIMES"
        """
        contradictions = []

        for skill_a, skill_b in KNOWN_SEMANTIC_PAIRS:
            response_a = responses.get(skill_a)
            response_b = responses.get(skill_b)

            # Only flag if both were answered (not just one)
            if response_a is None or response_b is None:
                continue

            # A contradiction is YES+NO or NO+YES on semantically near-identical skills
            is_contradiction = (
                (response_a == "YES" and response_b == "NO") or
                (response_a == "NO"  and response_b == "YES")
            )

            if is_contradiction:
                contradictions.append({
                    "skill_a":    skill_a,
                    "skill_b":    skill_b,
                    "response_a": response_a,
                    "response_b": response_b,
                    "flag":       "CONTRADICTORY_RESPONSES",
                })
                logger.debug(
                    f"Contradiction detected: {skill_a}={response_a} "
                    f"vs {skill_b}={response_b}"
                )

        count = len(contradictions)

        if count > INTEGRITY_MAX_CONTRADICTIONS:
            logger.info(
                f"Integrity flag triggered: {count} contradictions "
                f"(threshold: {INTEGRITY_MAX_CONTRADICTIONS})"
            )
            return IntegrityResult(
                integrity_flag     = True,
                contradiction_count= count,
                contradictions     = contradictions,
                action             = "cap_at_tier_1",
                user_message       = (
                    "Some of your answers seemed inconsistent with each other. "
                    "We've noted this — your strongest skills are still captured, "
                    "and they'll be shown as 'Recognized' rather than 'Demonstrated' "
                    "until we can confirm them another way."
                ),
            )

        return IntegrityResult(
            integrity_flag      = False,
            contradiction_count = count,
            contradictions      = contradictions,
            action              = None,
            user_message        = None,
        )
