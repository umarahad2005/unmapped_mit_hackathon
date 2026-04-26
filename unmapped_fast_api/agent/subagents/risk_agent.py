"""
agent/subagents/risk_agent.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Subagent: Automation Risk & Resilience Engine.

Owns the risk domain. Computes locally-calibrated automation risk,
loads Wittgenstein projections, builds resilience pathways, and
enforces the duty-of-care rule: no risk disclosed without a pathway.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
from dataclasses import dataclass
from pathlib import Path

from agent.subagents.verification_agent import VerificationResult
from core.config_loader import SystemConfig
from core.risk.calibration import RiskCalibrationEngine, CalibratedRiskScore

logger = logging.getLogger("unmapped.risk_agent")


# ── Wittgenstein Loader ───────────────────────────────────────────────────────

class WittgensteinLoader:
    PROJECTIONS_PATH = Path("data/wittgenstein/projections.json")

    @classmethod
    def get_projections(cls, country_iso3: str, scenario: str) -> list[dict]:
        if not cls.PROJECTIONS_PATH.exists():
            logger.warning("Wittgenstein data not found — run seed_data.py")
            return []
        with open(cls.PROJECTIONS_PATH, encoding="utf-8") as f:
            data = json.load(f)
        country_data = data.get("countries", {}).get(country_iso3, {})
        if country_data.get("scenario") != scenario:
            logger.warning(
                f"Wittgenstein: scenario mismatch for {country_iso3}. "
                f"Requested {scenario}, found {country_data.get('scenario')}"
            )
        return country_data.get("projections", [])


# ── Risk Report ───────────────────────────────────────────────────────────────

@dataclass
class RiskReport:
    skill_scores:      list[dict]    # per-skill calibrated scores
    composite_band:    str           # LOW/MODERATE/HIGH/CRITICAL
    composite_local:   float
    composite_global:  float
    durable_skills:    list[str]
    high_risk_count:   int
    resilience_pathways: list[dict]
    wittgenstein_projection: list[dict]
    disclosure:        str           # mandatory disclosure text

    def to_dict(self) -> dict:
        return {
            "composite_band":    self.composite_band,
            "composite_local":   self.composite_local,
            "composite_global":  self.composite_global,
            "durable_skills":    self.durable_skills,
            "high_risk_count":   self.high_risk_count,
            "skill_scores":      self.skill_scores,
            "resilience_pathways": self.resilience_pathways,
            "wittgenstein_projection": self.wittgenstein_projection,
            "disclosure":        self.disclosure,
        }


# ── Risk Agent ────────────────────────────────────────────────────────────────

class RiskAgent:
    """
    Subagent: owns automation risk and resilience.

    Duty-of-care rule (Article IV.4):
    Every HIGH/CRITICAL risk disclosure MUST be paired with ≥1 resilience pathway.
    If no pathway exists, the agent creates a generic upskilling note.
    Distress without direction is not honesty — it is harm.
    """

    def __init__(self, config: SystemConfig, skill_graph):
        self.config     = config
        self.graph      = skill_graph
        self.calibrator = RiskCalibrationEngine(config)

    async def run(self, verification_result: VerificationResult) -> RiskReport:
        """
        Run the full risk pipeline.
        Returns a RiskReport with calibrated scores, resilience pathways,
        Wittgenstein projections, and mandatory disclosure.
        """
        skills = [s for s in verification_result.verified_skills if s.get("tier", 0) >= 1]

        # ── Step 1: Calibrate each skill's automation risk ───────────────────
        calibrated: list[CalibratedRiskScore] = self.calibrator.calibrate_many(skills)

        # ── Step 2: Compute composite risk profile ───────────────────────────
        composite = self.calibrator.get_composite_risk(calibrated)

        # ── Step 3: Build skill risk score dict for graph queries ────────────
        risk_scores = {s.skill_id: s.local_calibrated for s in calibrated}
        skill_ids   = [s.skill_id for s in calibrated]

        # ── Step 4: Get resilience pathways from graph ───────────────────────
        pathways = self.graph.get_resilience_pathways(skill_ids, risk_scores)

        # ── Step 5: Duty-of-care enforcement ─────────────────────────────────
        if composite["composite_band"] in ("HIGH", "CRITICAL") and not pathways:
            # Inject a generic pathway to ensure no risk disclosure without direction
            pathways = [{
                "skill_id":          "GENERIC_UPSKILL",
                "label":             "Digital literacy basics",
                "resilience_score":  0.6,
                "adjacency_distance": 2,
                "note": (
                    "Building basic digital skills significantly increases "
                    "resilience across most occupations in your region."
                ),
            }]
            logger.info("Duty-of-care: injected generic pathway for HIGH/CRITICAL risk profile")

        # ── Step 6: Wittgenstein projections ─────────────────────────────────
        wit_data = WittgensteinLoader.get_projections(
            self.config.wittgenstein.country_iso3,
            self.config.wittgenstein.projection_scenario,
        )
        target_years = self.config.wittgenstein.target_years
        projections  = [p for p in wit_data if p.get("year") in target_years]

        # ── Step 7: Build disclosure text (Article IV.1 mandate) ─────────────
        infra   = self.config.automation.infrastructure_tier
        country = self.config.meta.country_code
        itu     = self.config.automation.itu_penetration_rate
        disclosure = (
            f"These risk scores have been adjusted for {country}'s digital "
            f"infrastructure ({infra} tier, {itu:.0%} internet penetration). "
            f"Global automation risk scores are based on Frey & Osborne (2017). "
            f"Local calibration reflects the actual infrastructure required to "
            f"execute automation — which varies significantly by region."
        )

        report = RiskReport(
            skill_scores         = [s.to_dict() for s in calibrated],
            composite_band       = composite["composite_band"],
            composite_local      = composite["composite_local"],
            composite_global     = composite["composite_global"],
            durable_skills       = composite["durable_skills"],
            high_risk_count      = composite["high_risk_count"],
            resilience_pathways  = pathways,
            wittgenstein_projection = projections,
            disclosure           = disclosure,
        )

        logger.info(
            f"Risk engine complete: composite band={report.composite_band} "
            f"(local={report.composite_local:.2f}, global={report.composite_global:.2f}) "
            f"| {len(pathways)} resilience pathways"
        )
        return report

    async def on_config_swap(self, new_config: SystemConfig) -> None:
        self.config     = new_config
        self.calibrator = RiskCalibrationEngine(new_config)
        logger.info(f"RiskAgent: reloaded for config {new_config.meta.config_id}")
