"""
agent/adk/schemas.py
─────────────────────────────────────────────────────────────────────────────
Pydantic schemas for the talent-job and course-finder ADK agents.

These models are the contract between the agents (live or fallback) and the
FastAPI routes / frontend. The frontend should never need to know whether a
result came from a live web search or the offline curated list.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field, HttpUrl


# ── Job aggregator ────────────────────────────────────────────────────────────


class JobListing(BaseModel):
    """A single job posting matched to the user's skills profile."""

    title: str = Field(..., description="Job title as posted.")
    employer: str = Field(..., description="Hiring organisation.")
    location: str = Field(..., description="City / region of the role.")
    country_code: str = Field(..., description="ISO-3 country code, e.g. PAK / GHA / BGD.")
    employment_type: Literal[
        "formal", "informal", "self_employment", "apprenticeship", "gig", "training_pathway"
    ] = Field(..., description="Type of employment, mapped to the system's opportunity taxonomy.")
    isco_codes: list[str] = Field(default_factory=list, description="Best-fit ISCO-08 4-digit codes.")
    skills_required: list[str] = Field(default_factory=list, description="Top 3-5 required skills.")
    wage_floor_local: Optional[float] = Field(None, description="Monthly wage floor in local currency.")
    wage_currency: Optional[str] = Field(None, description="ISO-4217 currency code.")
    apply_url: Optional[HttpUrl] = Field(None, description="Where to apply, if known.")
    posted_at: Optional[str] = Field(None, description="ISO date the listing was posted.")
    match_score: float = Field(..., ge=0.0, le=1.0, description="0..1 fit vs the user's profile.")
    match_reasons: list[str] = Field(default_factory=list, description="Why we matched (skills overlap, etc.).")
    accessibility_note: Optional[str] = Field(
        None,
        description=(
            "Honest note when a structural barrier may apply (e.g. WBL gender mobility "
            "restriction). Never silently filter — surface and let the user decide."
        ),
    )


class JobSearchRequest(BaseModel):
    """Input from the assess / skills page when the user clicks 'Find jobs'."""

    country_code: str = Field(..., description="ISO-3 country code, e.g. PAK / GHA / BGD.")
    skills: list[str] = Field(..., description="Plain-language skills the user has confirmed.")
    isco_codes: list[str] = Field(default_factory=list, description="Best-fit ISCO 4-digit codes.")
    max_results: int = Field(default=8, ge=1, le=20)
    accept_informal: bool = Field(default=True, description="Include informal / gig / self-employment.")


class JobSearchResponse(BaseModel):
    listings: list[JobListing]
    source: Literal["live_adk", "offline_curated", "mixed"] = Field(
        ..., description="Where the data came from, surfaced honestly to the user."
    )
    note: Optional[str] = Field(None, description="Honest-about-limits text the UI can render verbatim.")


# ── Course finder ─────────────────────────────────────────────────────────────


class CourseOffering(BaseModel):
    """A training opportunity matched to the user's skill gaps."""

    title: str = Field(..., description="Course / programme title.")
    provider: str = Field(..., description="Coursera, edX, NSDC, TEVTA, etc.")
    delivery: Literal["online", "in_person", "hybrid", "mobile_first"] = Field(
        ..., description="How it's delivered."
    )
    country_code: str = Field(..., description="ISO-3 country code (or 'GLOBAL' for international).")
    skill_targets: list[str] = Field(default_factory=list, description="Skills this course closes / builds.")
    duration_weeks: Optional[int] = Field(None, description="Approximate length in weeks.")
    cost_local: Optional[float] = Field(None, description="Cost in local currency (or 0 for free).")
    cost_currency: Optional[str] = Field(None, description="ISO-4217 currency.")
    is_free: bool = Field(default=False)
    certification: Optional[str] = Field(None, description="Credential awarded, if any.")
    enroll_url: Optional[HttpUrl] = Field(None)
    starts_at: Optional[str] = Field(None, description="Next intake date or 'self_paced'.")
    relevance_score: float = Field(..., ge=0.0, le=1.0, description="0..1 fit vs the user's gap.")
    relevance_reasons: list[str] = Field(default_factory=list)


class CourseSearchRequest(BaseModel):
    """Input from the skill gap analysis."""

    country_code: str = Field(..., description="ISO-3 country code.")
    skill_gaps: list[str] = Field(..., description="Skills the user is missing or weak on.")
    isco_codes: list[str] = Field(default_factory=list)
    max_results: int = Field(default=6, ge=1, le=20)
    free_only: bool = Field(default=False)
    delivery_preference: Optional[Literal["online", "in_person", "hybrid", "mobile_first"]] = Field(default=None)


class CourseSearchResponse(BaseModel):
    courses: list[CourseOffering]
    source: Literal["live_adk", "offline_curated", "mixed"]
    note: Optional[str] = None
