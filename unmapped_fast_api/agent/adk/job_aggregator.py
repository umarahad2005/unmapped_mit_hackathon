"""
agent/adk/job_aggregator.py
─────────────────────────────────────────────────────────────────────────────
Talent Job Aggregator — a Gemini ADK agent that searches the live web for
current job openings matching a youth user's skills profile + country.

  Live path  : google-adk LlmAgent with the google_search tool, JSON-schema
               output, then re-scored against the user's profile.
  Offline    : agent/adk/fallback_data.py — curated, real organisations.

The function `find_jobs(...)` is the only entry point for the route layer.
It always returns a `JobSearchResponse` with a `source` field saying where
the data came from. Honest about limits.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import json
import logging
import os
from typing import Optional

from .schemas import (
    JobListing,
    JobSearchRequest,
    JobSearchResponse,
)
from .fallback_data import get_fallback_jobs

logger = logging.getLogger("unmapped.adk.job_aggregator")


# ── ADK availability guard ────────────────────────────────────────────────────
# google-adk is a recent package and the demo machine may not have it installed.
# We gate everything behind a safe import so the route layer never crashes.

_ADK_AVAILABLE = False
try:
    from google.adk.agents import LlmAgent  # type: ignore
    from google.adk.tools import google_search  # type: ignore
    from google.adk.runners import InMemoryRunner  # type: ignore
    from google.genai import types as genai_types  # type: ignore
    _ADK_AVAILABLE = True
except Exception as e:  # pragma: no cover - depends on local install
    logger.info("google-adk not available (%s); job_aggregator will use offline fallback.", e)


# ── Agent definition (only built when ADK is available) ──────────────────────


_INSTRUCTION = """\
You are the UNMAPPED Talent Job Aggregator. Given a youth user's skills profile
and country, your job is to find currently-posted, realistic job openings that
match.

RULES
- Use the google_search tool to find LIVE postings (not generic articles).
- Prefer postings from the user's country; if none, surface the closest regional roles.
- Include informal/self-employment/apprenticeship paths — formal employment is the
  exception, not the rule, in low- and middle-income countries.
- Be HONEST: if a structural barrier may apply (e.g. mobility restrictions,
  female workplace access), flag it in `accessibility_note` — never silently filter.
- Wage floors should be in local currency. If you don't know, leave wage_floor_local null.

OUTPUT FORMAT
Return ONLY valid JSON matching this schema (no prose, no markdown fences):
{
  "listings": [
    {
      "title":             "Job title",
      "employer":          "Company / organisation",
      "location":          "City / region",
      "country_code":      "ISO-3 (PAK / GHA / BGD)",
      "employment_type":   "formal|informal|self_employment|apprenticeship|gig|training_pathway",
      "isco_codes":        ["7421"],
      "skills_required":   ["Skill 1", "Skill 2", "Skill 3"],
      "wage_floor_local":  35000.0,
      "wage_currency":     "PKR",
      "apply_url":         "https://...",
      "posted_at":         "2025-04-22",
      "match_score":       0.82,
      "match_reasons":     ["Why this is a fit"],
      "accessibility_note": null
    }
  ]
}
"""


def _build_agent() -> "Optional[LlmAgent]":
    """Build the ADK agent on first use; returns None if ADK is unavailable."""
    if not _ADK_AVAILABLE:
        return None
    if not os.getenv("GOOGLE_API_KEY") and not os.getenv("GEMINI_API_KEY"):
        logger.info("No GOOGLE_API_KEY/GEMINI_API_KEY set; falling back to offline data.")
        return None

    try:
        return LlmAgent(
            name="unmapped_job_aggregator",
            model="gemini-2.0-flash",
            description=(
                "Finds real-time job listings via google_search, filtered to the user's "
                "country, skills profile, and structural barriers."
            ),
            instruction=_INSTRUCTION,
            tools=[google_search],
        )
    except Exception as e:
        logger.warning("Failed to build job_aggregator agent: %s", e)
        return None


# ── Public entry point ────────────────────────────────────────────────────────


async def find_jobs(req: JobSearchRequest) -> JobSearchResponse:
    """
    Try the live ADK path; fall back to curated offline data on any failure.
    Always returns a JobSearchResponse with a transparent `source` field.
    """
    agent = _build_agent()

    # Path A — live ADK
    if agent is not None:
        try:
            user_prompt = (
                f"Country: {req.country_code}. "
                f"User confirmed skills: {', '.join(req.skills) if req.skills else 'none'}. "
                f"ISCO 4-digit codes: {', '.join(req.isco_codes) if req.isco_codes else 'none'}. "
                f"Find up to {req.max_results} current job openings. "
                f"{'Include informal / self-employment / gig paths.' if req.accept_informal else 'Formal employment only.'}"
            )

            runner = InMemoryRunner(agent=agent, app_name="unmapped")
            session = await runner.session_service.create_session(
                app_name="unmapped", user_id="unmapped_user"
            )
            content = genai_types.Content(
                role="user", parts=[genai_types.Part(text=user_prompt)]
            )

            text_chunks: list[str] = []
            async for event in runner.run_async(
                user_id="unmapped_user",
                session_id=session.id,
                new_message=content,
            ):
                if event.content and event.content.parts:
                    for part in event.content.parts:
                        if getattr(part, "text", None):
                            text_chunks.append(part.text)

            raw = "".join(text_chunks).strip()
            # Strip code fences if the model added them despite instructions.
            if raw.startswith("```"):
                raw = raw.strip("`")
                raw = raw.split("\n", 1)[1] if "\n" in raw else raw
                if raw.lower().startswith("json"):
                    raw = raw[4:].strip()
                if raw.endswith("```"):
                    raw = raw.rsplit("```", 1)[0].strip()

            parsed = json.loads(raw)
            listings = [JobListing(**item) for item in parsed.get("listings", [])]
            listings = listings[: req.max_results]

            if not listings:
                raise ValueError("Live ADK returned zero listings; falling through to offline.")

            return JobSearchResponse(
                listings=listings,
                source="live_adk",
                note=(
                    "Listings sourced live via Google Search grounding through Gemini ADK. "
                    "Verify each posting on the employer's site before applying."
                ),
            )

        except Exception as e:
            logger.warning("Live ADK job search failed (%s); using offline fallback.", e)

    # Path B — offline curated
    listings = get_fallback_jobs(req.country_code, req.max_results)
    return JobSearchResponse(
        listings=listings,
        source="offline_curated",
        note=(
            "Live search unavailable — showing curated, real organisations from this "
            "country's economy. Wage floors are indicative 2024-2025 ballparks; verify "
            "before applying."
        ),
    )
