"""
agent/subagents/profile_agent.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Subagent: Profile Synthesis & Export.

Assembles the final portable profile from all pipeline stages.
Enforces confidence legend presence (Article II.3).
Generates QR payload and exports to JSON/PDF.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
import time
import uuid
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from agent.subagents.verification_agent import VerificationResult
from agent.subagents.risk_agent import RiskReport
from agent.subagents.matching_agent import MatchingResult
from core.config_loader import SystemConfig

logger = logging.getLogger("unmapped.profile_agent")

PROFILE_BASE_URL = "https://unmapped.io/profile"


# ── Profile Agent ─────────────────────────────────────────────────────────────

class ProfileAgent:
    """
    Subagent: synthesizes the final user profile.

    Non-negotiable outputs (from Article II.3 + Article I.4):
    - confidence_legend MUST be present in every profile
    - unverified skills shown separately, clearly labeled
    - evidence_path for every skill showing its derivation
    - profile saved to local storage (offline-first)
    """

    PROFILES_PATH = Path("data/local_sessions")

    def __init__(self, config: SystemConfig):
        self.config = config

    async def run(
        self,
        verification_result: VerificationResult,
        risk_report:         RiskReport,
        matching_result:     MatchingResult,
        skill_graph,
    ) -> dict:
        """
        Synthesize the final portable profile.
        """
        start      = time.monotonic()
        profile_id = f"UMP-{self.config.meta.country_code}-2026-{str(uuid.uuid4())[:8].upper()}"

        # ── Categorize skills by tier ─────────────────────────────────────────
        all_skills      = verification_result.verified_skills
        tier2_skills    = [s for s in all_skills if s.get("tier", 0) == 2]
        tier1_skills    = [s for s in all_skills if s.get("tier", 0) == 1]
        tier0_skills    = [s for s in all_skills if s.get("tier", 0) == 0]

        # ── Build evidence paths ──────────────────────────────────────────────
        def build_evidence_path(skill: dict) -> str:
            tier = skill.get("tier", 0)
            if tier == 2:
                return "Stated in narrative → Confirmed in Mirror Test → Verified via scenario"
            elif tier == 1:
                return "Stated in narrative → Confirmed in Mirror Test"
            else:
                return "Stated in narrative — not yet confirmed"

        def enrich_skill(skill: dict) -> dict:
            s = dict(skill)
            s["evidence_path"]   = build_evidence_path(skill)
            s["plain_language"]  = skill.get("skill_label", "")
            return s

        # ── Get adjacent skills from graph ────────────────────────────────────
        skill_ids  = [s.get("taxonomy_id", "") for s in tier1_skills + tier2_skills]
        risk_scores= {s["skill_id"]: s["local_calibrated"]
                      for s in risk_report.skill_scores}
        adjacent   = skill_graph.get_resilience_pathways(skill_ids, risk_scores, top_n=3)

        adjacent_enriched = []
        for adj in adjacent:
            adjacent_enriched.append({
                "label":             adj.get("label", adj.get("skill_id", "")),
                "adjacency_distance":adj.get("adjacency_distance", 1),
                "resilience_value":  "HIGH" if adj.get("resilience_score", 0) > 0.6 else "MODERATE",
                "note": (
                    f"One step from your current skills. "
                    f"Increases your automation resilience significantly."
                ),
            })

        # ── Confidence legend (MANDATORY — Article II.3) ─────────────────────
        ui = self.config.ui_strings
        confidence_legend = {
            ui.get("tier_demonstrated", "DEMONSTRATED"): ui.get("confidence_legend_demonstrated", ""),
            ui.get("tier_recognized",   "RECOGNIZED"):   ui.get("confidence_legend_recognized", ""),
            ui.get("tier_unverified",   "UNVERIFIED"):   ui.get("confidence_legend_unverified", ""),
        }

        # ── Data sources used ─────────────────────────────────────────────────
        data_sources = [
            {"name": "ESCO Taxonomy",          "vintage": self.config.taxonomy.version},
            {"name": "O*NET Task Statements",  "vintage": "28.0"},
            {"name": f"ILOSTAT Wages",
             "vintage_year": self.config.labor_data.data_vintage_year},
        ]

        # ── Assemble profile ──────────────────────────────────────────────────
        profile = {
            "profile_id":       profile_id,
            "generated_at":     datetime.utcnow().isoformat() + "Z",
            "config_context":   self.config.meta.config_id,
            "country":          self.config.meta.country_code,
            "context_label":    self.config.meta.context_label,

            "skills":           [enrich_skill(s) for s in tier2_skills + tier1_skills],
            "unverified_skills":[enrich_skill(s) for s in tier0_skills],
            "adjacent_skills":  adjacent_enriched,

            "automation_context": {
                "composite_risk_band":   risk_report.composite_band,
                "local_calibrated_score":risk_report.composite_local,
                "global_baseline_score": risk_report.composite_global,
                "durable_skills":        risk_report.durable_skills,
                "disclosure":            risk_report.disclosure,
                "resilience_pathways":   risk_report.resilience_pathways,
            },

            "opportunities": {
                "ranked":        matching_result.opportunities[:5],  # top 5
                "econ_signals":  [s.to_dict() for s in matching_result.econ_signals],
            },

            "wittgenstein_context": risk_report.wittgenstein_projection,

            "confidence_legend": confidence_legend,   # ← MANDATORY

            "data_sources_used": data_sources,

            "portability": {
                "qr_payload":    f"{PROFILE_BASE_URL}/{profile_id}",
                "format":        "UNMAPPED-JSON-v1",
                "exportable_as": ["JSON", "QR"],
            },
        }

        # Validate confidence_legend is present (build-time guard)
        assert "confidence_legend" in profile and len(profile["confidence_legend"]) == 3, \
            "CONSTITUTION VIOLATION: confidence_legend missing or incomplete (Article II.3)"

        # ── Save locally (offline-first) ──────────────────────────────────────
        session_path = self.PROFILES_PATH / profile_id
        session_path.mkdir(parents=True, exist_ok=True)
        with open(session_path / "profile.json", "w", encoding="utf-8") as f:
            json.dump(profile, f, indent=2, ensure_ascii=False)

        elapsed = time.monotonic() - start
        logger.info(
            f"Profile synthesized in {elapsed:.2f}s: {profile_id} | "
            f"Tier2={len(tier2_skills)} Tier1={len(tier1_skills)} Tier0={len(tier0_skills)}"
        )
        return profile

    async def on_config_swap(self, new_config: SystemConfig) -> None:
        self.config = new_config
        logger.info(f"ProfileAgent: reloaded for config {new_config.meta.config_id}")
