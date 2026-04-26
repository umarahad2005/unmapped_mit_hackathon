"""api/routes/match_routes.py — Matching and econometric signals endpoints"""

from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/signals/{country_code}")
async def get_signals(country_code: str):
    """Returns configured econometric signals for a country."""
    from core.config_loader import get_config
    from agent.subagents.matching_agent import EconSignalBuilder

    config  = get_config()
    if config.meta.country_code != country_code.upper():
        raise HTTPException(
            status_code=400,
            detail=f"Active config is for {config.meta.country_code}, not {country_code}"
        )

    builder  = EconSignalBuilder()
    signals  = [
        builder.build_wage_signal(config).to_dict(),
        builder.build_growth_signal(config).to_dict(),
    ]
    return {
        "country_code": country_code.upper(),
        "signals":      signals,
        "signal_count": len(signals),
        "note":         "Minimum 2 signals always returned (Article V.2)",
    }


@router.post("/match")
async def match_opportunities(skill_ids: list[str]):
    """Returns ranked opportunity matches for a skill profile."""
    from core.config_loader import get_config
    from core.matching.scorer import OpportunityScorer, SAMPLE_OPPORTUNITIES

    config  = get_config()
    scorer  = OpportunityScorer(config)

    # Build minimal skill dicts from IDs
    skills = [{"taxonomy_id": sid, "skill_id": sid, "tier": 1} for sid in skill_ids]

    opps = SAMPLE_OPPORTUNITIES.get(config.meta.country_code, [])
    opps = [o for o in opps if o["type"] in config.opportunities.types_enabled]

    scored = [scorer.score(skills, opp) for opp in opps]
    ranked = scorer.rank(scored)

    return {
        "country_code":    config.meta.country_code,
        "opportunities":   ranked,
        "total":           len(ranked),
        "note":            "Inaccessible opportunities shown but marked — never hidden",
    }
