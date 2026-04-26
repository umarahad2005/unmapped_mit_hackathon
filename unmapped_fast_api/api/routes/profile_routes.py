"""api/routes/profile_routes.py — Profile retrieval and full pipeline endpoint"""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class PipelineRequest(BaseModel):
    narrative:  str
    session_id: str | None = None


@router.post("/pipeline/run")
async def run_pipeline(request: PipelineRequest):
    """
    Run the full UNMAPPED pipeline for a user session.
    Narrative → Extract → Mirror → Verify → Risk + Match → Profile.
    """
    from core.config_loader import get_config
    from agent.orchestrator import run_full_pipeline

    config = get_config()
    try:
        profile = await run_full_pipeline(request.narrative)
        return {"status": "success", "profile": profile}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/profile/{profile_id}")
async def get_profile(profile_id: str):
    """Returns the portable profile JSON for a given profile ID."""
    profile_path = Path(f"data/local_sessions/{profile_id}/profile.json")
    if not profile_path.exists():
        raise HTTPException(status_code=404, detail=f"Profile {profile_id} not found")
    with open(profile_path, encoding="utf-8") as f:
        profile = json.load(f)
    return profile
