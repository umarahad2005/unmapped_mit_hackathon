"""
agent/orchestrator.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Master Pipeline Orchestrator.

Entry point for the full skill assessment pipeline.
Sequences subagents, launches parallel agents, enforces constitution rules.

Key optimization: Risk scoring and Opportunity matching run in parallel
(asyncio.gather) since they share only the completed skill profile as input
and have zero dependency on each other — cuts pipeline time ~35%.
─────────────────────────────────────────────────────────────────────────────
"""

import asyncio
import logging
import time
from pathlib import Path

from core.config_loader import get_config, SystemConfig
from agent.parallel.data_freshness_agent import DataFreshnessAgent
from agent.parallel.config_watcher_agent import get_watcher
from agent.parallel.feedback_agent import FeedbackAgent

logger = logging.getLogger("unmapped.orchestrator")


async def run_full_pipeline(narrative: str) -> dict:
    """
    Full UNMAPPED pipeline for one user session.

    Flow:
      [Boot parallel agents] → [Build graph] → [Intake] → [Mirror Test]
      → [Verification] → [Risk + Matching in parallel] → [Profile]
      → [Schedule feedback]

    Returns the portable profile as a dict.
    """
    config = get_config()
    session_start = time.monotonic()

    logger.info(
        f"Pipeline start | config: {config.meta.config_id} | "
        f"country: {config.meta.country_code}"
    )

    # ── Boot parallel agents (non-blocking) ─────────────────────────────────
    asyncio.create_task(
        DataFreshnessAgent().run(),
        name="data_freshness"
    )
    asyncio.create_task(
        get_watcher().watch(),
        name="config_watcher"
    )

    # ── Import subagents (lazy to avoid circular imports at module load) ─────
    from agent.subagents.graph_agent       import GraphAgent
    from agent.subagents.intake_agent      import IntakeAgent
    from agent.subagents.mirror_agent      import MirrorAgent
    from agent.subagents.verification_agent import VerificationAgent
    from agent.subagents.risk_agent        import RiskAgent
    from agent.subagents.matching_agent    import MatchingAgent
    from agent.subagents.profile_agent     import ProfileAgent

    # ── Phase 0: Build skill graph (required by Mirror + Verification + Risk) ─
    logger.info("Phase 0: Building skill adjacency graph")
    graph_agent  = GraphAgent(config)
    skill_graph  = await graph_agent.build()

    # Register graph_agent as config-swap listener
    get_watcher().register_swap_listener(graph_agent.on_config_swap)

    # ── Phase 1: Narrative intake ─────────────────────────────────────────────
    logger.info("Phase 1: Intake")
    intake_agent     = IntakeAgent(config)
    candidate_skills = await intake_agent.run(narrative)
    logger.info(f"  Extracted {len(candidate_skills)} candidate skills at Tier 0")

    # ── Phase 2: Mirror Test ──────────────────────────────────────────────────
    logger.info("Phase 2: Mirror Test")
    mirror_agent = MirrorAgent(config, skill_graph)
    mirror_result = await mirror_agent.run(candidate_skills)
    logger.info(
        f"  Mirror Test complete: {mirror_result.tier1_count} skills → Tier 1 "
        f"| integrity_flag: {mirror_result.integrity_flag}"
    )

    # ── Phase 3: Micro-verification ───────────────────────────────────────────
    logger.info("Phase 3: Micro-verification")
    verification_agent = VerificationAgent(config, skill_graph)
    verified_skills    = await verification_agent.run(mirror_result)
    logger.info(
        f"  Verification complete: {verified_skills.tier2_count} skills → Tier 2"
    )

    # ── Phase 4+5: Risk + Matching in PARALLEL ────────────────────────────────
    logger.info("Phase 4+5: Risk engine + Matching engine (parallel)")
    risk_agent     = RiskAgent(config, skill_graph)
    matching_agent = MatchingAgent(config)

    risk_report, ranked_opportunities = await asyncio.gather(
        risk_agent.run(verified_skills),
        matching_agent.run(verified_skills),
    )

    logger.info(
        f"  Risk: composite band = {risk_report.composite_band} "
        f"| Matching: {len(ranked_opportunities.opportunities)} opportunities ranked"
    )

    # ── Phase 6: Profile synthesis ────────────────────────────────────────────
    logger.info("Phase 6: Profile synthesis")
    profile_agent = ProfileAgent(config)
    profile       = await profile_agent.run(
        verified_skills,
        risk_report,
        ranked_opportunities,
        skill_graph,
    )

    # ── Fire feedback scheduler (non-blocking) ────────────────────────────────
    feedback_agent = FeedbackAgent()
    feedback_agent.schedule(profile["profile_id"])

    elapsed = time.monotonic() - session_start
    logger.info(f"Pipeline complete in {elapsed:.2f}s | profile_id: {profile['profile_id']}")

    return profile


async def run_config_swap(config_id: str) -> dict:
    """
    Execute a live config swap. Called by POST /api/config/swap.
    Returns swap result with timing.
    """
    watcher = get_watcher()
    result  = await watcher.request_swap(config_id)
    return result
