"""
api/routes/talent_routes.py
─────────────────────────────────────────────────────────────────────────────
FastAPI routes that surface the two new ADK agents:

  POST /api/jobs/find      → live job aggregator (live ADK or offline fallback)
  POST /api/courses/find   → course finder        (live ADK or offline fallback)

Both routes always return a 200 with a `source` field (`live_adk` /
`offline_curated`) so the frontend can render the matching label.
─────────────────────────────────────────────────────────────────────────────
"""

import logging

from fastapi import APIRouter, HTTPException

from agent.adk.schemas import (
    JobSearchRequest,
    JobSearchResponse,
    CourseSearchRequest,
    CourseSearchResponse,
)
from agent.adk.job_aggregator import find_jobs
from agent.adk.course_finder import find_courses

logger = logging.getLogger("unmapped.routes.talent")

router = APIRouter()


@router.post("/jobs/find", response_model=JobSearchResponse)
async def jobs_find(req: JobSearchRequest):
    """
    Find current job openings for a youth user.
    Live web search via Gemini ADK when GOOGLE_API_KEY is configured;
    curated offline data otherwise.
    """
    try:
        return await find_jobs(req)
    except Exception as e:
        logger.exception("jobs/find failed catastrophically")
        raise HTTPException(status_code=500, detail=f"job aggregator error: {e}")


@router.post("/courses/find", response_model=CourseSearchResponse)
async def courses_find(req: CourseSearchRequest):
    """
    Find current course offerings to close the user's skill gaps.
    Live web search via Gemini ADK when GOOGLE_API_KEY is configured;
    curated offline data otherwise.
    """
    try:
        return await find_courses(req)
    except Exception as e:
        logger.exception("courses/find failed catastrophically")
        raise HTTPException(status_code=500, detail=f"course finder error: {e}")
