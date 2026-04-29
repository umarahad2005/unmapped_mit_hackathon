"""
core/risk/calibration.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Automation risk calibration engine.

Takes global Frey-Osborne scores and calibrates them to local infrastructure
reality using ITU penetration data and infrastructure tier.

Article IV.1: "The system presents the calibrated, local risk score —
not the global baseline — and discloses both figures with the delta explained."
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
from pathlib import Path
from typing import Literal

from agent.agent_config import INFRASTRUCTURE_MULTIPLIERS, RISK_BANDS
from core.config_loader import SystemConfig

logger = logging.getLogger("unmapped.risk_calibration")

RiskBand = Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]


# ── Data Types ────────────────────────────────────────────────────────────────

class CalibratedRiskScore:
    def __init__(
        self,
        skill_id:          str,
        skill_label:       str,
        global_baseline:   float,
        local_calibrated:  float,
        calibration_delta: float,
        risk_band:         RiskBand,
        explanation:       str,
    ):
        self.skill_id          = skill_id
        self.skill_label       = skill_label
        self.global_baseline   = global_baseline
        self.local_calibrated  = local_calibrated
        self.calibration_delta = calibration_delta
        self.risk_band         = risk_band
        self.explanation       = explanation

    def to_dict(self) -> dict:
        return {
            "skill_id":          self.skill_id,
            "skill_label":       self.skill_label,
            "global_baseline":   self.global_baseline,
            "local_calibrated":  self.local_calibrated,
            "calibration_delta": self.calibration_delta,
            "risk_band":         self.risk_band,
            "explanation":       self.explanation,
        }


# ── Frey-Osborne Score Loader ─────────────────────────────────────────────────

class FreyOsborneLoader:
    """
    Reads Frey & Osborne (2013) automation probabilities from
    data/frey_osborne/scores.json. The file ships three lookup tables:

      • scores[]               — SOC-keyed entries (canonical Frey-Osborne format)
      • isco_scores            — ISCO-08 4-digit → probability (project's lingua franca)
      • isco_major_group_means — final fallback by ISCO 1-digit major group

    Resolution order for `get_score_for_skill(taxonomy_id)`:
      1. ESCO direct lookup (a small curated table for the engine's own ESCO IDs)
      2. ISCO 4-digit lookup (when taxonomy_id parses as `\\d{4}`)
      3. ISCO major-group mean (when taxonomy_id parses as `\\d{4}` but the
         exact 4-digit isn't in isco_scores — uses the first digit)
      4. Default 0.50 (moderate)
    """

    SCORES_PATH = Path("data/frey_osborne/scores.json")

    _soc_cache:           dict[str, float] | None = None  # SOC code → probability
    _isco_cache:          dict[str, float] | None = None  # ISCO 4-digit → probability
    _major_group_cache:   dict[str, float] | None = None  # ISCO 1-digit → probability

    # Curated ESCO → probability fallback for skills tagged with the engine's
    # own ESCO IDs (a small set; not from the JSON because ESCO/SOC do not
    # cross-walk one-to-one).
    ESCO_TO_FREY: dict[str, float] = {
        "S5.6.0": 0.67,   # Electronic equipment repair
        "S5.6.1": 0.72,   # Component testing
        "S5.6.2": 0.58,   # Circuit fault diagnosis
        "S1.2.1": 0.30,   # Customer communication
        "S1.2.3": 0.22,   # Conflict resolution
        "S6.1.0": 0.45,   # Business operations
        "S6.1.1": 0.81,   # Basic bookkeeping
        "S2.1.0": 0.51,   # Agricultural oversight
        "S2.1.1": 0.55,   # Produce grading
        "S3.1.0": 0.62,   # Materials handling
        "S3.2.1": 0.40,   # Electrical wiring
        "S1.4.0": 0.25,   # Teaching
        "S4.1.0": 0.35,   # Basic patient care
    }

    # ── Public lookups ────────────────────────────────────────────────────────

    @classmethod
    def get_score(cls, onet_soc: str) -> float | None:
        """Direct SOC lookup. None if not in the dataset."""
        cls._ensure_loaded()
        return cls._soc_cache.get(onet_soc) if cls._soc_cache else None

    @classmethod
    def get_score_by_isco(cls, isco_code: str) -> float | None:
        """
        ISCO-first lookup with major-group fallback.
        Accepts 4-digit codes like "7421"; 3-digit codes fall back to major group.
        Returns None if neither resolves.
        """
        cls._ensure_loaded()
        if not isco_code or not cls._isco_cache:
            return None
        code = str(isco_code).strip()
        # 4-digit exact
        if code in cls._isco_cache:
            return cls._isco_cache[code]
        # Major-group fallback (first digit)
        if cls._major_group_cache and code[:1] in cls._major_group_cache:
            return cls._major_group_cache[code[:1]]
        return None

    @classmethod
    def get_score_for_skill(cls, taxonomy_id: str) -> float:
        """
        Resolve any taxonomy_id (ESCO, ISCO 4-digit, ISCO major group) to a
        Frey-Osborne probability. Falls back to 0.50 (moderate) when nothing
        in the resolution chain matches.
        """
        if not taxonomy_id:
            return 0.50

        # 1. ESCO direct
        if taxonomy_id in cls.ESCO_TO_FREY:
            return cls.ESCO_TO_FREY[taxonomy_id]

        # 2/3. ISCO (4-digit or major-group fallback)
        # Accept both bare "7421" and prefixed "ISCO-7421" / "ISCO/7421"
        clean = taxonomy_id.split("/")[-1].split("-")[-1].strip()
        if clean.isdigit() and 1 <= len(clean) <= 4:
            isco_score = cls.get_score_by_isco(clean)
            if isco_score is not None:
                return isco_score

        # 4. Default
        return 0.50

    # ── Internals ─────────────────────────────────────────────────────────────

    @classmethod
    def _ensure_loaded(cls) -> None:
        if cls._soc_cache is None:
            cls._load()

    @classmethod
    def _load(cls) -> None:
        if not cls.SCORES_PATH.exists():
            logger.warning("Frey-Osborne scores not found — run seed_data.py")
            cls._soc_cache = {}
            cls._isco_cache = {}
            cls._major_group_cache = {}
            return

        with open(cls.SCORES_PATH, encoding="utf-8") as f:
            data = json.load(f)

        cls._soc_cache = {
            s["onet_soc"]: s["probability"]
            for s in data.get("scores", [])
            if "onet_soc" in s and "probability" in s
        }

        # Strip helper keys (those starting with "_") from ISCO maps.
        raw_isco = data.get("isco_scores", {}) or {}
        cls._isco_cache = {
            k: v for k, v in raw_isco.items()
            if not k.startswith("_") and isinstance(v, (int, float))
        }

        raw_groups = data.get("isco_major_group_means", {}) or {}
        cls._major_group_cache = {
            k: v for k, v in raw_groups.items()
            if not k.startswith("_") and isinstance(v, (int, float))
        }

        logger.info(
            "Frey-Osborne loaded: %d SOC scores, %d ISCO 4-digit, %d major-group means.",
            len(cls._soc_cache), len(cls._isco_cache), len(cls._major_group_cache),
        )


# ── Calibration Engine ────────────────────────────────────────────────────────

class RiskCalibrationEngine:
    """
    Calibrates global automation risk scores to local infrastructure reality.

    Formula:
      calibrated = global_baseline × infrastructure_multiplier × itu_fine_tune
      itu_fine_tune = 0.5 + (itu_penetration_rate × 0.5)

    Article IV.1 requirement: Both global and local scores MUST be surfaced.
    """

    def __init__(self, config: SystemConfig):
        self.config = config

    def calibrate(self, skill_id: str, skill_label: str) -> CalibratedRiskScore:
        """Calibrate a single skill's automation risk."""
        base_score  = FreyOsborneLoader.get_score_for_skill(skill_id)
        infra_tier  = self.config.automation.infrastructure_tier
        itu_rate    = self.config.automation.itu_penetration_rate

        multiplier  = INFRASTRUCTURE_MULTIPLIERS.get(infra_tier, 0.72)
        fine_tune   = 0.5 + (itu_rate * 0.5)
        calibrated  = base_score * multiplier * fine_tune

        # Clamp to [0, 1]
        calibrated  = max(0.0, min(1.0, calibrated))
        delta       = base_score - calibrated

        risk_band   = self._get_risk_band(calibrated)
        explanation = (
            f"Global automation risk ({base_score:.0%}) adjusted for "
            f"{self.config.meta.country_code} infrastructure "
            f"({infra_tier} tier, {itu_rate:.0%} digital penetration). "
            f"Local risk is {delta:.0%} lower than the global baseline."
        )

        return CalibratedRiskScore(
            skill_id          = skill_id,
            skill_label       = skill_label,
            global_baseline   = round(base_score, 3),
            local_calibrated  = round(calibrated, 3),
            calibration_delta = round(delta, 3),
            risk_band         = risk_band,
            explanation       = explanation,
        )

    def calibrate_many(self, skills: list[dict]) -> list[CalibratedRiskScore]:
        """Calibrate all skills in a profile."""
        results = []
        for skill in skills:
            skill_id    = skill.get("taxonomy_id", skill.get("skill_id", ""))
            skill_label = skill.get("skill_label", "")
            if skill_id and not skill_id.startswith("UNMAPPED"):
                results.append(self.calibrate(skill_id, skill_label))
        return results

    def get_composite_risk(self, calibrated_scores: list[CalibratedRiskScore]) -> dict:
        """Compute composite risk profile across all skills."""
        if not calibrated_scores:
            return {
                "composite_local":  0.5,
                "composite_global": 0.5,
                "composite_band":   "MODERATE",
                "high_risk_count":  0,
                "durable_skills":   [],
            }

        locals_  = [s.local_calibrated  for s in calibrated_scores]
        globals_ = [s.global_baseline   for s in calibrated_scores]

        comp_local  = sum(locals_)  / len(locals_)
        comp_global = sum(globals_) / len(globals_)

        durable = [
            s.skill_label for s in calibrated_scores
            if s.risk_band in ("LOW", "MODERATE") and s.local_calibrated < 0.45
        ]

        high_risk = [
            s for s in calibrated_scores
            if s.risk_band in ("HIGH", "CRITICAL")
        ]

        return {
            "composite_local":  round(comp_local, 3),
            "composite_global": round(comp_global, 3),
            "composite_band":   self._get_risk_band(comp_local),
            "high_risk_count":  len(high_risk),
            "durable_skills":   durable[:3],  # show top 3
        }

    def _get_risk_band(self, score: float) -> RiskBand:
        for band, (lo, hi) in RISK_BANDS.items():
            if lo <= score < hi:
                return band
        return "MODERATE"
