"""
agent/adk/
─────────────────────────────────────────────────────────────────────────────
Gemini ADK agents that reach out to live data via google_search grounding.

Two agents ship here:

  • job_aggregator   — given a youth user's skills profile + country, finds
                       current job openings via web search, returns a ranked
                       list of structured listings.

  • course_finder    — given the user's skill gaps + country, finds current
                       course offerings (Coursera / edX / NSDC / TEVTA / etc.)
                       to close those gaps.

Both agents have **offline fallbacks** — curated country-specific lists that
ship inside this package — so the demo works without an internet connection,
without a Google API key, or when ADK isn't installed. The API layer always
returns the same Pydantic shape; only the `source` field differs (`"live"` vs
`"offline_curated"`).

Why ADK and not raw Gemini?
  ADK gives us:
   - The `google_search` tool (real-time, Gemini-grounded)
   - A clean Agent / Runner pattern that we can extend with more tools later
   - Structured output via Pydantic schemas
─────────────────────────────────────────────────────────────────────────────
"""

from .schemas import (
    JobListing,
    JobSearchRequest,
    JobSearchResponse,
    CourseOffering,
    CourseSearchRequest,
    CourseSearchResponse,
)

__all__ = [
    "JobListing",
    "JobSearchRequest",
    "JobSearchResponse",
    "CourseOffering",
    "CourseSearchRequest",
    "CourseSearchResponse",
]
