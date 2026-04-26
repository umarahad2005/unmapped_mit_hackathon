"""
core/matching/scorer.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Opportunity match scoring engine.

Composite score = skill_alignment(40%) + wage_viability(25%)
               + sector_growth(20%) + structural_accessibility(15%)

Article V.1: "Opportunity matching is grounded in what is locally reachable,
not globally possible."
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional

from agent.agent_config import MATCH_WEIGHTS
from core.config_loader import SystemConfig

logger = logging.getLogger("unmapped.matching_scorer")


# ── Sample opportunity data (for hackathon demo) ──────────────────────────────

SAMPLE_OPPORTUNITIES = {
    "GH": [
        {
            "id": "GH-OPP-001",
            "title": "Mobile Phone Repair Technician",
            "type": "self_employment",
            "required_skills": ["S5.6.0", "S5.6.1", "S1.2.1"],
            "wage_floor": 800,
            "sector": "electronics_repair",
            "sector_growth_rate": 0.08,
            "requires_mobility": False,
            "source": "ILOSTAT West Africa",
            "vintage_year": 2023,
        },
        {
            "id": "GH-OPP-002",
            "title": "Electronics Repair Shop Apprentice",
            "type": "informal_wage",
            "required_skills": ["S5.6.0"],
            "wage_floor": 500,
            "sector": "electronics_repair",
            "sector_growth_rate": 0.08,
            "requires_mobility": False,
            "source": "ILOSTAT West Africa",
            "vintage_year": 2023,
        },
        {
            "id": "GH-OPP-003",
            "title": "Small Business Operator",
            "type": "self_employment",
            "required_skills": ["S6.1.0", "S1.2.1"],
            "wage_floor": 700,
            "sector": "informal_trade",
            "sector_growth_rate": 0.04,
            "requires_mobility": False,
            "source": "World Bank Enterprise Survey",
            "vintage_year": 2021,
        },
        {
            "id": "GH-OPP-004",
            "title": "TVET Electronics Training Program",
            "type": "training_pathway",
            "required_skills": [],
            "wage_floor": 0,
            "sector": "education",
            "sector_growth_rate": 0.12,
            "requires_mobility": True,
            "source": "Ghana TVET",
            "vintage_year": 2023,
        },
    ],
    "BD": [
        {
            "id": "BD-OPP-001",
            "title": "Agricultural Cooperative Member",
            "type": "agricultural_cooperative",
            "required_skills": ["S2.1.0", "S2.1.1"],
            "wage_floor": 8000,
            "sector": "agriculture",
            "sector_growth_rate": 0.03,
            "requires_mobility": False,
            "source": "ILO South Asia",
            "vintage_year": 2022,
        },
        {
            "id": "BD-OPP-002",
            "title": "Home-Based Tailoring (Self-Employment)",
            "type": "self_employment",
            "required_skills": ["S3.1.0"],
            "wage_floor": 7000,
            "sector": "garments",
            "sector_growth_rate": 0.06,
            "requires_mobility": False,
            "source": "ILO South Asia",
            "vintage_year": 2022,
        },
    ],
}


# ── Scorer ────────────────────────────────────────────────────────────────────

class OpportunityScorer:
    """
    Scores opportunities against a user's skill profile.
    Always shows component breakdown so user can see why a match scored as it did.
    """

    def __init__(self, config: SystemConfig):
        self.config = config

    def score(self, skill_profile: list[dict], opportunity: dict) -> dict:
        """
        Score one opportunity. Returns dict with composite + component breakdown.
        """
        barriers = self.config.structural_barriers

        # 1. Skill alignment
        required = opportunity.get("required_skills", [])
        user_ids  = {s.get("taxonomy_id", s.get("skill_id", "")) for s in skill_profile
                     if s.get("tier", 0) >= 1}
        if required:
            alignment = len(set(required) & user_ids) / len(required)
        else:
            alignment = 1.0  # training pathway — no skill requirement

        # 2. Wage viability
        living_wage = self.config.labor_data.get("living_wage_threshold", 0) if hasattr(
            self.config.labor_data, "get"
        ) else getattr(self.config.labor_data, "living_wage_threshold", 0)
        wage_floor  = opportunity.get("wage_floor", 0)
        if living_wage > 0 and wage_floor > 0:
            wage_viability = min(wage_floor / living_wage, 1.0)
        elif wage_floor == 0:
            wage_viability = 0.3  # training pathway — no immediate wage
        else:
            wage_viability = 0.5

        # 3. Sector growth
        growth_rate   = opportunity.get("sector_growth_rate", 0)
        growth_score  = min(max(growth_rate * 5, 0.0), 1.0)  # normalize 0-20% → 0-1

        # 4. Structural accessibility
        requires_mobility = opportunity.get("requires_mobility", False)
        mobility_blocked  = getattr(barriers, "gender_mobility_restriction", False)

        if requires_mobility and mobility_blocked:
            accessibility = 0.1   # Heavily downweighted — not hidden
            accessibility_note = self.config.ui_strings.get("inaccessible_opportunity", "")
        else:
            accessibility = 1.0
            accessibility_note = ""

        # Composite (weights from agent_config)
        composite = (
            alignment        * MATCH_WEIGHTS["skill_alignment"]          +
            wage_viability   * MATCH_WEIGHTS["wage_viability"]           +
            growth_score     * MATCH_WEIGHTS["sector_growth"]            +
            accessibility    * MATCH_WEIGHTS["structural_accessibility"]
        )

        return {
            "opportunity_id":    opportunity["id"],
            "title":             opportunity["title"],
            "type":              opportunity["type"],
            "composite_score":   round(composite, 3),
            "components": {
                "skill_alignment":          round(alignment, 3),
                "wage_viability":           round(wage_viability, 3),
                "sector_growth":            round(growth_score, 3),
                "structural_accessibility": round(accessibility, 3),
            },
            "is_accessible":      accessibility > 0.5,
            "accessibility_note": accessibility_note,
            "wage_floor":         opportunity.get("wage_floor"),
            "sector":             opportunity.get("sector"),
            "data_source":        opportunity.get("source"),
            "data_vintage_year":  opportunity.get("vintage_year"),
            "is_stale": (
                2026 - opportunity.get("vintage_year", 2026)
            ) > self.config.labor_data.staleness_threshold_years
            if hasattr(self.config.labor_data, "staleness_threshold_years")
            else False,
        }

    def rank(self, scored: list[dict]) -> list[dict]:
        """Sort by composite score descending. Never remove inaccessible ones."""
        return sorted(scored, key=lambda x: x["composite_score"], reverse=True)
