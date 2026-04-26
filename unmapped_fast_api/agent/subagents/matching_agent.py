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
    Uses real public datasets (World Bank WDI) with local caching for hackathon;
    in production, can be swapped to ILOSTAT/Data360 per config.
    """

    def build_wage_signal(self, config: SystemConfig) -> EconSignal:
        """
        Hackathon implementation: uses WDI GDP per capita as an income floor proxy.

        Indicator (default): NY.GDP.PCAP.CD
        """
        from core.econ.wdi_client import WdiClient

        indicator = (config.labor_data.wage_endpoint or "NY.GDP.PCAP.CD").strip()
        point = WdiClient().get_latest_point(config.meta.country_code, indicator)
        stale = (2026 - point.year) > config.labor_data.staleness_threshold_years

        return EconSignal(
            signal_type="INCOME_FLOOR_PROXY",
            value=point.value,
            plain_language=(
                f"Latest GDP per person is about {point.value:,.0f} USD per year "
                f"(year {point.year}). This is a proxy for local income floor, not a wage contract."
            ),
            source=point.source,
            vintage_year=point.year,
            is_stale=stale,
            currency="USD",
            period="annual",
        )

    def build_growth_signal(self, config: SystemConfig) -> EconSignal:
        """
        Hackathon implementation: uses WDI youth unemployment rate.

        Indicator (default): SL.UEM.1524.ZS (Unemployment, youth total (% of total labor force ages 15-24))
        """
        from core.econ.wdi_client import WdiClient

        # Reuse the existing config field for portability: wage_endpoint is “signal A”.
        # Sector growth source is “signal B” (indicator code).
        indicator = (config.labor_data.sector_growth_source or "SL.UEM.1524.ZS").strip()
        point = WdiClient().get_latest_point(config.meta.country_code, indicator)
        stale = (2026 - point.year) > config.labor_data.staleness_threshold_years

        return EconSignal(
            signal_type="YOUTH_UNEMPLOYMENT_RATE",
            value=point.value,
            plain_language=(
                f"Youth unemployment is {point.value:.1f}% (ages 15–24, year {point.year}). "
                f"Higher values mean fewer immediate wage opportunities."
            ),
            source=point.source,
            vintage_year=point.year,
            is_stale=stale,
            period="annual",
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
