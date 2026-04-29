"""
agent/adk/course_finder.py
─────────────────────────────────────────────────────────────────────────────
Course Finder — a Gemini ADK agent that searches the live web for current
course offerings (Coursera, edX, NSDC / Skill India, TEVTA, NAVTTC, BRAC,
SEIP, DigiSkills, Andela, Moringa, etc.) that close the user's skill gaps.

Mirrors the talent agent's shape: live path via ADK + google_search, with a
deterministic offline fallback in agent/adk/fallback_data.py.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import json
import logging
import os
from typing import Optional

from .schemas import (
    CourseOffering,
    CourseSearchRequest,
    CourseSearchResponse,
)
from .fallback_data import get_fallback_courses

logger = logging.getLogger("unmapped.adk.course_finder")


# ── ADK availability guard ────────────────────────────────────────────────────

_ADK_AVAILABLE = False
try:
    from google.adk.agents import LlmAgent  # type: ignore
    from google.adk.tools import google_search  # type: ignore
    from google.adk.runners import InMemoryRunner  # type: ignore
    from google.genai import types as genai_types  # type: ignore
    _ADK_AVAILABLE = True
except Exception as e:  # pragma: no cover
    logger.info("google-adk not available (%s); course_finder will use offline fallback.", e)


# ── Agent definition ──────────────────────────────────────────────────────────


_INSTRUCTION = """\
You are the UNMAPPED Course Finder. Given a youth user's skill gaps and country,
find currently-available training programmes that close those gaps.

RULES
- Use the google_search tool to find LIVE programmes with confirmable enrolment URLs.
- Prefer in-country, government-backed or well-known providers (TEVTA, NAVTTC,
  NSDC / Skill India, BRAC, SEIP, DigiSkills.pk, Andela ALC, NEP, etc.).
- If nothing local fits, surface a credible international option (Coursera / edX /
  Khan Academy / Codecademy) with clear cost.
- Mark `is_free: true` only when the course is truly free (no certificate-fee gotcha).
- Mobile-first delivery is a positive signal for LMIC youth on shared devices.

OUTPUT FORMAT
Return ONLY valid JSON matching this schema (no prose, no markdown fences):
{
  "courses": [
    {
      "title":             "Course title",
      "provider":          "Provider name",
      "delivery":          "online|in_person|hybrid|mobile_first",
      "country_code":      "ISO-3 country or 'GLOBAL'",
      "skill_targets":     ["Skill 1", "Skill 2"],
      "duration_weeks":    12,
      "cost_local":        0,
      "cost_currency":     "PKR",
      "is_free":           true,
      "certification":     "Credential awarded",
      "enroll_url":        "https://...",
      "starts_at":         "2025-05-15 OR self_paced OR rolling_intake",
      "relevance_score":   0.82,
      "relevance_reasons": ["Why this closes the gap"]
    }
  ]
}
"""


def _build_agent() -> "Optional[LlmAgent]":
    if not _ADK_AVAILABLE:
        return None
    if not os.getenv("GOOGLE_API_KEY") and not os.getenv("GEMINI_API_KEY"):
        logger.info("No GOOGLE_API_KEY/GEMINI_API_KEY set; falling back to offline data.")
        return None

    try:
        return LlmAgent(
            name="unmapped_course_finder",
            model="gemini-2.0-flash",
            description=(
                "Finds current course offerings via google_search to close the user's "
                "skill gaps in their country."
            ),
            instruction=_INSTRUCTION,
            tools=[google_search],
        )
    except Exception as e:
        logger.warning("Failed to build course_finder agent: %s", e)
        return None


# ── Public entry point ────────────────────────────────────────────────────────


async def find_courses(req: CourseSearchRequest) -> CourseSearchResponse:
    """
    Try the live ADK path; fall back to curated offline data on any failure.
    """
    agent = _build_agent()

    # Path A — live ADK
    if agent is not None:
        try:
            free_clause = "Free programmes only." if req.free_only else ""
            delivery_clause = (
                f"Delivery preference: {req.delivery_preference}." if req.delivery_preference else ""
            )

            user_prompt = (
                f"Country: {req.country_code}. "
                f"Skill gaps to close: {', '.join(req.skill_gaps) if req.skill_gaps else 'general upskilling'}. "
                f"Find up to {req.max_results} current course offerings. "
                f"{free_clause} {delivery_clause}"
            ).strip()

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
            if raw.startswith("```"):
                raw = raw.strip("`")
                raw = raw.split("\n", 1)[1] if "\n" in raw else raw
                if raw.lower().startswith("json"):
                    raw = raw[4:].strip()
                if raw.endswith("```"):
                    raw = raw.rsplit("```", 1)[0].strip()

            parsed = json.loads(raw)
            courses = [CourseOffering(**item) for item in parsed.get("courses", [])]
            if req.free_only:
                courses = [c for c in courses if c.is_free]
            courses = courses[: req.max_results]

            if not courses:
                raise ValueError("Live ADK returned zero courses; falling through to offline.")

            return CourseSearchResponse(
                courses=courses,
                source="live_adk",
                note=(
                    "Programmes sourced live via Google Search grounding through Gemini ADK. "
                    "Confirm enrolment terms (especially certificate fees) on each provider's site."
                ),
            )

        except Exception as e:
            logger.warning("Live ADK course search failed (%s); using offline fallback.", e)

    # Path B — offline curated
    courses = get_fallback_courses(req.country_code, req.max_results)
    if req.free_only:
        courses = [c for c in courses if c.is_free]
    return CourseSearchResponse(
        courses=courses,
        source="offline_curated",
        note=(
            "Live search unavailable — showing curated, real programmes operating in this "
            "country today. Confirm enrolment terms on each provider's site."
        ),
    )
