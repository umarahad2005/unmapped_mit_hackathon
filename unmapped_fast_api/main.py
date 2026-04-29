"""
main.py  (root-level entry point)
────────────────────────────────────────────────────────────────────────────────
Re-exports the FastAPI `app` object so cloud runners that auto-discover via
`fastapi-cli` / `uvicorn main:app` can find it without needing to know the
internal `api/` package structure.

Start command used by Procfile / Railway / Render:
    uvicorn main:app --host 0.0.0.0 --port $PORT
────────────────────────────────────────────────────────────────────────────────
"""

from api.main import app  # noqa: F401  — re-export for uvicorn discovery

__all__ = ["app"]
