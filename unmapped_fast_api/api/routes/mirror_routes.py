"""api/routes/mirror_routes.py — Mirror Test card and response endpoints"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal

from core.config_loader import get_config

router = APIRouter()


class MirrorCardsRequest(BaseModel):
    session_id: str
    skill_ids:  list[str]


class MirrorRespondRequest(BaseModel):
    session_id:  str
    skill_id:    str
    response:    Literal["YES", "NO", "SOMETIMES"]
    card_number: int


@router.post("/mirror/cards")
async def get_mirror_cards(request: MirrorCardsRequest):
    """
    Returns Mirror Test cards for the given skill IDs.
    Cards are pre-rewritten in plain language.
    NO Gemini call made here — uses O*NET fallback text (fast, offline).
    """
    from agent.subagents.mirror_agent import OnetTaskLoader
    from agent.agent_config import MIRROR_MAX_CARDS

    config = get_config()
    cards  = []

    for i, skill_id in enumerate(request.skill_ids[:MIRROR_MAX_CARDS]):
        tasks = OnetTaskLoader.get_tasks_for_skill(skill_id)
        if not tasks:
            tasks = [OnetTaskLoader.get_fallback_task(skill_id)]
        task = tasks[0]
        cards.append({
            "skill_id":       skill_id,
            "task_id":        task["task_id"],
            "plain_language": task["task"],   # raw O*NET text (Gemini rewrite in prod)
            "card_number":    i + 1,
        })

    return {
        "session_id": request.session_id,
        "cards":      cards,
        "max_cards":  MIRROR_MAX_CARDS,
        "question":   config.ui_strings.get("mirror_question", "Does this describe your work?"),
        "options": {
            "yes":       config.ui_strings.get("mirror_yes", "Yes"),
            "sometimes": config.ui_strings.get("mirror_sometimes", "Sometimes"),
            "no":        config.ui_strings.get("mirror_no", "No"),
        },
    }


@router.post("/mirror/respond")
async def record_mirror_response(request: MirrorRespondRequest):
    """Record a Mirror Test response. Returns tier upgrade result."""
    tier_upgraded = request.response == "YES"
    return {
        "session_id":    request.session_id,
        "skill_id":      request.skill_id,
        "response":      request.response,
        "tier_upgraded": tier_upgraded,
        "new_tier":      1 if tier_upgraded else 0,
        "new_tier_label":"RECOGNIZED" if tier_upgraded else "UNVERIFIED",
        "card_number":   request.card_number,
    }
