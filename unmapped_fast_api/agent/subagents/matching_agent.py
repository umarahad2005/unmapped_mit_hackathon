"""
agent/subagents/matching_agent.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Subagent: Opportunity Matching & Econometric Signals.

Owns the matching domain. Pulls labor market signals, scores opportunities,
ranks them, and returns a minimum of 2 econometric signals to the UI.

Article V.2: "The user-facing interface must visibly surface at minimum
two real econometric signals in plain language."
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from dataclasses import dataclass, field

from agent.subagents.verification_agent import VerificationResult
from core.config_loader import SystemConfig
from core.matching.scorer import OpportunityScorer, SAMPLE_OPPORTUNITIES

logger = logging.getLogger("unmapped.matching_agent")


# ── Data Types ────────────────────────────────────────────────────────────────

@dataclass
class EconSignal:
    signal_type:   str    # "WAGE_FLOOR" | "SECTOR_GROWTH"
    value:         float
    plain_language: str
    source:        str
    vintage_year:  int
    is_stale:      bool
    currency:      str = ""
    period:        str = ""

    def to_dict(self) -> dict:
        return {
            "signal_type":    self.signal_type,
            "value":          self.value,
            "plain_language": self.plain_language,
            "source":         self.source,
            "vintage_year":   self.vintage_year,
            "is_stale":       self.is_stale,
            "currency":       self.currency,
            "period":         self.period,
        }


@dataclass
class MatchingResult:
    opportunities:  list[dict]
    econ_signals:   list[EconSignal]
    country_code:   str

    @property
    def signal_count(self) -> int:
        return len(self.econ_signals)

    def to_dict(self) -> dict:
        return {
            "opportunities":  self.opportunities,
            "econ_signals":   [s.to_dict() for s in self.econ_signals],
            "country_code":   self.country_code,
        }


# ── Signal Builder ────────────────────────────────────────────────────────────

class EconSignalBuilder:
    """
    Builds the 2 required econometric signals for the youth dashboard.
    Uses sample data for hackathon; in production, calls ILOSTAT + Data360 APIs.
    """

    # Sample wage data by country
    WAGE_DATA = {
        "GH": {"median": 900, "range": "GHS 800–1,400", "currency": "GHS",
               "sector": "electronics repair", "vintage": 2023, "source": "ILOSTAT"},
        "BD": {"median": 11000, "range": "BDT 8,000–14,000", "currency": "BDT",
               "sector": "manufacturing", "vintage": 2022, "source": "ILO South Asia"},
    }

    GROWTH_DATA = {
        "GH": {"rate": 0.08, "sector": "Electronics & Repair", "base_year": 2020,
               "vintage": 2023, "source": "Data360 / World Bank"},
        "BD": {"rate": 0.06, "sector": "Garments & Textiles", "base_year": 2019,
               "vintage": 2022, "source": "Data360 / World Bank"},
    }

    def build_wage_signal(self, config: SystemConfig) -> EconSignal:
        cc    = config.meta.country_code
        data  = self.WAGE_DATA.get(cc, self.WAGE_DATA["GH"])
        stale = (2026 - data["vintage"]) > config.labor_data.staleness_threshold_years

        return EconSignal(
            signal_type   = "WAGE_FLOOR",
            value         = data["median"],
            plain_language= (
                f"Workers in {data['sector']} in your region typically earn "
                f"between {data['range']} per month."
            ),
            source        = data["source"],
            vintage_year  = data["vintage"],
            is_stale      = stale,
            currency      = data["currency"],
            period        = "monthly",
        )

    def build_growth_signal(self, config: SystemConfig) -> EconSignal:
        cc    = config.meta.country_code
        data  = self.GROWTH_DATA.get(cc, self.GROWTH_DATA["GH"])
        stale = (2026 - data["vintage"]) > config.labor_data.staleness_threshold_years
        direction = "growing" if data["rate"] > 0 else "shrinking"

        return EconSignal(
            signal_type   = "SECTOR_GROWTH",
            value         = data["rate"],
            plain_language= (
                f"Employment in {data['sector']} in your country has been {direction} "
                f"({abs(data['rate'])*100:.1f}% change since {data['base_year']})."
            ),
            source        = data["source"],
            vintage_year  = data["vintage"],
            is_stale      = stale,
            period        = f"{data['base_year']}–2023",
        )


# ── Matching Agent ────────────────────────────────────────────────────────────

class MatchingAgent:
    """
    Subagent: owns opportunity matching.

    Guarantees:
    - Minimum 2 econometric signals always returned
    - Inaccessible opportunities shown but clearly marked
    - Every score includes component breakdown
    - Stale data always flagged
    """

    def __init__(self, config: SystemConfig):
        self.config        = config
        self.scorer        = OpportunityScorer(config)
        self.signal_builder= EconSignalBuilder()

    async def run(self, verification_result: VerificationResult) -> MatchingResult:
        """
        Score and rank opportunities for a verified skill profile.
        """
        skills       = verification_result.verified_skills
        country_code = self.config.meta.country_code

        # ── Load opportunities for this country ───────────────────────────────
        opps = SAMPLE_OPPORTUNITIES.get(country_code, SAMPLE_OPPORTUNITIES.get("GH", []))

        # Filter to enabled opportunity types only
        enabled_types = self.config.opportunities.types_enabled
        opps = [o for o in opps if o["type"] in enabled_types]

        logger.info(
            f"Matching: {len(skills)} skills against "
            f"{len(opps)} opportunities for {country_code}"
        )

        # ── Score and rank ────────────────────────────────────────────────────
        scored = [self.scorer.score(skills, opp) for opp in opps]
        ranked = self.scorer.rank(scored)

        # ── Build econometric signals (≥2 required by Article V.2) ───────────
        signals = [
            self.signal_builder.build_wage_signal(self.config),
            self.signal_builder.build_growth_signal(self.config),
        ]

        result = MatchingResult(
            opportunities = ranked,
            econ_signals  = signals,
            country_code  = country_code,
        )

        logger.info(
            f"Matching complete: {len(ranked)} opportunities ranked, "
            f"{result.signal_count} econometric signals built"
        )
        return result

    async def on_config_swap(self, new_config: SystemConfig) -> None:
        self.config         = new_config
        self.scorer         = OpportunityScorer(new_config)
        self.signal_builder = EconSignalBuilder()
        logger.info(f"MatchingAgent: reloaded for config {new_config.meta.config_id}")
