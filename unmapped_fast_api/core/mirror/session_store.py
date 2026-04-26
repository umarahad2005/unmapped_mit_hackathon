"""
core/mirror/session_store.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Mirror Test session persistence.

FastAPI mirror endpoints are stateless by default; this store persists
Mirror cards + responses per session_id under data/local_sessions/.
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger("unmapped.mirror_session_store")


@dataclass
class MirrorSession:
    session_id: str
    created_at: float
    updated_at: float
    cards: list[dict]
    responses: dict[str, str]  # skill_id -> "YES"|"NO"|"SOMETIMES"

    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "cards": self.cards,
            "responses": self.responses,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "MirrorSession":
        return cls(
            session_id=str(data["session_id"]),
            created_at=float(data.get("created_at", time.time())),
            updated_at=float(data.get("updated_at", time.time())),
            cards=list(data.get("cards", [])),
            responses=dict(data.get("responses", {})),
        )


class MirrorSessionStore:
    BASE_PATH = Path("data/local_sessions")

    def __init__(self, base_path: Path | None = None):
        self.base_path = Path(base_path) if base_path else self.BASE_PATH

    def _path(self, session_id: str) -> Path:
        return self.base_path / session_id / "mirror_session.json"

    def load(self, session_id: str) -> MirrorSession | None:
        path = self._path(session_id)
        if not path.exists():
            return None
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            return MirrorSession.from_dict(data)
        except Exception as e:
            logger.warning(f"Failed to load mirror session {session_id}: {e}")
            return None

    def save(self, session: MirrorSession) -> None:
        path = self._path(session.session_id)
        path.parent.mkdir(parents=True, exist_ok=True)
        session.updated_at = time.time()
        with open(path, "w", encoding="utf-8") as f:
            json.dump(session.to_dict(), f, indent=2, ensure_ascii=False)

