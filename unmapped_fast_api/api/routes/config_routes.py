"""api/routes/config_routes.py — Config management endpoints"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.config_loader import get_config, hot_swap_config
from agent.parallel.config_watcher_agent import get_watcher

router = APIRouter()


class SwapRequest(BaseModel):
    config_id: str


@router.get("/config/active")
async def get_active_config():
    """Returns the currently active configuration context."""
    config = get_config()
    return {
        "config_id":     config.meta.config_id,
        "country_code":  config.meta.country_code,
        "context_label": config.meta.context_label,
        "language":      config.language.primary,
        "taxonomy":      config.taxonomy.primary,
        "last_updated":  config.meta.last_updated,
    }


@router.post("/config/swap")
async def swap_config(request: SwapRequest):
    """
    Live config swap — swaps active configuration without restart.
    This is the endpoint that powers the Ghana → Bangladesh demo.
    Must complete in < 2 seconds. (Article VI.2)
    """
    try:
        result = await get_watcher().request_swap(request.config_id)
        if result["status"] == "timeout":
            raise HTTPException(status_code=504, detail="Config swap timed out")
        return {
            "status":    "swapped",
            "config_id": request.config_id,
            "elapsed_ms":result.get("elapsed_ms"),
            "validation":"passed",
            "active":    request.config_id,
        }
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
