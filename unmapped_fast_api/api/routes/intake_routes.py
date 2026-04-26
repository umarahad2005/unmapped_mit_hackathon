"""api/routes/intake_routes.py — Narrative intake and skill extraction endpoint"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.config_loader import get_config
from agent.subagents.intake_agent import IntakeAgent

router = APIRouter()


class IntakeRequest(BaseModel):
    narrative: str
    session_id: str | None = None


@router.post("/intake/extract")
async def extract_skills(request: IntakeRequest):
    """
    Extracts candidate skills from a free-form narrative.
    Saves narrative locally BEFORE API call (offline-first mandate).
    Returns all skills at Tier 0 (UNVERIFIED).
    """
    if not request.narrative or len(request.narrative.strip()) < 10:
        raise HTTPException(status_code=400, detail="Narrative too short — minimum 10 characters")

    config = get_config()
    agent  = IntakeAgent(config)

    try:
        result = await agent.run(request.narrative, session_id=request.session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

    return {
        "session_id":      result.session_id,
        "config_id":       result.config_id,
        "candidate_skills":result.to_dict(),
        "extraction_gaps": result.extraction_gaps,
        "skill_count":     result.count,
        "next_step":       "mirror_test",
    }
