"""
core/mirror/router.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Mirror Test adaptive card routing logic.

Determines the next card to show based on the user's response.
Enforces the 15-card hard limit (Article III.2).
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional

logger = logging.getLogger("unmapped.mirror_router")


class MirrorRouter:
    """
    Adaptive card routing for the Mirror Test.

    Response logic:
    - YES  → upgrade skill to Tier 1, probe adjacent skills
    - NO   → prune adjacencies, jump to next unprobed skill
    - SOMETIMES → mark provisional (needs one more YES to upgrade)
    """

    def __init__(self, skill_graph):
        self.graph = skill_graph

    def get_next_card(
        self,
        current_skill_id: str,
        response: str,          # "YES" | "NO" | "SOMETIMES"
        state: "MirrorSessionState",
    ) -> Optional[str]:
        """
        Returns the next skill_id to probe, or None if test should end.
        """
        from agent.agent_config import MIRROR_MAX_CARDS

        if len(state.shown_card_ids) >= MIRROR_MAX_CARDS:
            logger.info(f"Mirror Test: 15-card limit reached — ending")
            return None

        if response == "YES":
            state.upgrade_to_tier1(current_skill_id)
            adjacent = self.graph.get_adjacent(current_skill_id, depth=1)
            candidates = [s for s in adjacent if s not in state.shown_card_ids]
            return candidates[0] if candidates else self._next_unprobed(state)

        elif response == "SOMETIMES":
            state.mark_provisional(current_skill_id)
            return self._get_sibling_card(current_skill_id, state)

        elif response == "NO":
            self.graph.prune_adjacencies(current_skill_id)
            return self._next_unprobed(state)

        return None

    def _next_unprobed(self, state: "MirrorSessionState") -> Optional[str]:
        """Find the next Tier 0 skill that hasn't been shown yet."""
        for skill_id in state.tier0_skill_ids:
            if skill_id not in state.shown_card_ids:
                return skill_id
        return None

    def _get_sibling_card(
        self,
        skill_id: str,
        state: "MirrorSessionState",
    ) -> Optional[str]:
        """Get a skill adjacent to current one (different branch)."""
        adjacent = self.graph.get_adjacent(skill_id, depth=1)
        siblings = [s for s in adjacent if s not in state.shown_card_ids]
        if siblings:
            return siblings[0]
        return self._next_unprobed(state)


class MirrorSessionState:
    """Tracks the full state of an in-progress Mirror Test session."""

    def __init__(self, candidate_skills: list):
        self.tier0_skill_ids: list[str] = [s.taxonomy_id for s in candidate_skills]
        self.shown_card_ids:  list[str] = []
        self.responses:       dict[str, str] = {}       # skill_id → YES/NO/SOMETIMES
        self.tier1_skills:    set[str] = set()
        self.provisional:     set[str] = set()
        self.integrity_flag:  bool = False
        self.integrity_message: str = ""

    def record_response(self, skill_id: str, response: str) -> None:
        self.shown_card_ids.append(skill_id)
        self.responses[skill_id] = response

    def upgrade_to_tier1(self, skill_id: str) -> None:
        self.tier1_skills.add(skill_id)
        self.provisional.discard(skill_id)
        logger.debug(f"Skill {skill_id} upgraded to Tier 1")

    def mark_provisional(self, skill_id: str) -> None:
        if skill_id in self.provisional:
            # Second affirmation — upgrade to Tier 1
            self.upgrade_to_tier1(skill_id)
        else:
            self.provisional.add(skill_id)

    @property
    def card_count(self) -> int:
        return len(self.shown_card_ids)

    @property
    def tier1_count(self) -> int:
        return len(self.tier1_skills)

    def to_summary(self) -> dict:
        return {
            "cards_shown":     self.card_count,
            "tier1_count":     self.tier1_count,
            "provisional":     list(self.provisional),
            "integrity_flag":  self.integrity_flag,
            "integrity_message": self.integrity_message,
        }
