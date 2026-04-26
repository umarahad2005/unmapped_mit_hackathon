"""api/routes/mirror_routes.py — Mirror Test card and response endpoints"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
from pathlib import Path
import json

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
    from core.mirror.session_store import MirrorSession, MirrorSessionStore
    from core.mirror.integrity import IntegrityChecker

    config = get_config()
    cards  = []

    # Try to resolve skill labels from seeded taxonomy data (best-effort)
    label_map: dict[str, str] = {}
    skills_path = Path("data/esco/skills.json")
    if skills_path.exists():
        try:
            with open(skills_path, encoding="utf-8") as f:
                data = json.load(f)
            for s in data.get("skills", []):
                sid = s.get("id")
                if sid:
                    label_map[sid] = s.get("label", sid)
        except Exception:
            label_map = {}

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
            "skill_label":    label_map.get(skill_id, skill_id),
        })

    # Persist session cards to local storage so /mirror/respond can be meaningful.
    store = MirrorSessionStore()
    session = MirrorSession(
        session_id=request.session_id,
        created_at=0.0,
        updated_at=0.0,
        cards=cards,
        responses={},
    )
    store.save(session)

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
    """
    Record a Mirror Test response. Returns tier upgrade result.

    Persists per-session responses and runs an integrity check (anti-gaming).
    """
    from core.mirror.session_store import MirrorSessionStore
    from core.mirror.integrity import IntegrityChecker

    store = MirrorSessionStore()
    session = store.load(request.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Mirror session not found — request /mirror/cards first")

    # Record response (idempotent overwrite)
    session.responses[request.skill_id] = request.response
    store.save(session)

    checker = IntegrityChecker()
    integrity = checker.check(session.responses)

    tier_upgraded = request.response == "YES"
    new_tier = 1 if tier_upgraded else 0

    return {
        "session_id":    request.session_id,
        "skill_id":      request.skill_id,
        "response":      request.response,
        "tier_upgraded": tier_upgraded,
        "new_tier":      new_tier,
        "new_tier_label":"RECOGNIZED" if new_tier == 1 else "UNVERIFIED",
        "card_number":   request.card_number,
        "integrity_flag": integrity.integrity_flag,
        "integrity_message": integrity.user_message,
        "contradiction_count": integrity.contradiction_count,
        "responses_recorded": len(session.responses),
    }
