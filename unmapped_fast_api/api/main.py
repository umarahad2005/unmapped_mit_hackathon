"""
api/main.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — FastAPI application entry point.

Boots the system: validates config, launches parallel agents,
registers all API routes.
─────────────────────────────────────────────────────────────────────────────
"""

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level   = logging.INFO,
    format  = "%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt = "%H:%M:%S",
)
logger = logging.getLogger("unmapped.api")


# ── Startup / Shutdown ────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Boot sequence — runs before accepting any requests."""

    # 1. Validate + load config
    from core.config_loader import initialize_config
    active_config_path = os.getenv("UNMAPPED_CONFIG", "config/ghana_urban.json")
    logger.info(f"Loading config: {active_config_path}")
    config = initialize_config(active_config_path)
    logger.info(f"Config loaded: {config.meta.config_id} | {config.meta.context_label}")

    # 2. Seed data check
    if not Path("data/onet/task_statements.json").exists():
        logger.warning("O*NET data not found — running seed_data.py...")
        import subprocess, sys
        subprocess.run([sys.executable, "scripts/seed_data.py"], check=False)

    # 3. Boot parallel agents
    from agent.parallel.data_freshness_agent import DataFreshnessAgent
    from agent.parallel.config_watcher_agent import get_watcher

    asyncio.create_task(DataFreshnessAgent().run(), name="data_freshness")
    asyncio.create_task(get_watcher().watch(),     name="config_watcher")

    logger.info("UNMAPPED API ready ✓")
    yield
    logger.info("UNMAPPED API shutting down")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title       = "UNMAPPED Skills Infrastructure API",
    description = "Open, localizable skills assessment infrastructure — MIT Hackathon 2026",
    version     = "1.0.0",
    lifespan    = lifespan,
)

cors_origins = os.getenv("UNMAPPED_CORS_ORIGINS", "http://localhost:3000").split(",")
cors_origins = [o.strip() for o in cors_origins if o.strip()]
if not cors_origins:
    cors_origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins  = cors_origins,  # In production: set UNMAPPED_CORS_ORIGINS
    allow_methods  = ["*"],
    allow_headers  = ["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────

from api.routes import config_routes, intake_routes, mirror_routes, profile_routes, match_routes

app.include_router(config_routes.router,  prefix="/api", tags=["Config"])
app.include_router(intake_routes.router,  prefix="/api", tags=["Intake"])
app.include_router(mirror_routes.router,  prefix="/api", tags=["Mirror Test"])
app.include_router(profile_routes.router, prefix="/api", tags=["Profile"])
app.include_router(match_routes.router,   prefix="/api", tags=["Matching"])


@app.get("/", tags=["Health"])
async def root():
    from core.config_loader import get_config
    config = get_config()
    return {
        "system":     "UNMAPPED Skills Infrastructure",
        "version":    "1.0.0",
        "status":     "operational",
        "active_config": config.meta.config_id,
        "country":    config.meta.country_code,
        "hackathon":  "MIT Global AI Hackathon 2026",
    }
