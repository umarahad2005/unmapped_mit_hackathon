"""
agent/parallel/feedback_agent.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Parallel Agent: Outcome Feedback Collector.

Schedules 30/90-day check-ins after opportunity matches.
Stores responses anonymously (match_hash only — no user PII).
Feeds aggregate signals back into matching calibration.

Article VII.5: "A system that never learns from its outcomes is
infrastructure that silently degrades."
─────────────────────────────────────────────────────────────────────────────
"""

import asyncio
import hashlib
import json
import logging
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Literal

from core.config_loader import get_config

logger = logging.getLogger("unmapped.feedback_agent")

# ── Types ─────────────────────────────────────────────────────────────────────

FeedbackResponse = Literal["YES", "PARTIAL", "NO"]

class ScheduledCheckin:
    def __init__(
        self,
        match_id:       str,
        config_context: str,
        days:           int,
    ):
        # We hash the match_id immediately — never store raw
        self.match_hash    = hashlib.sha256(match_id.encode()).hexdigest()[:16]
        self.config_context= config_context
        self.due_at        = time.time() + (days * 86400)
        self.days_offset   = days
        self.sent          = False

    def is_due(self) -> bool:
        return time.time() >= self.due_at and not self.sent

    def to_dict(self) -> dict:
        return {
            "match_hash":    self.match_hash,     # NEVER the raw match_id
            "config_context":self.config_context,
            "due_at":        self.due_at,
            "days_offset":   self.days_offset,
            "sent":          self.sent,
        }


class FeedbackAgent:
    """
    Parallel agent for post-match outcome tracking.

    Privacy model:
    - match_id is hashed on receipt — raw ID is never stored
    - Responses are stored against match_hash only
    - No user PII is ever associated with feedback records
    - Aggregate signals visible in policymaker dashboard only
    """

    RESPONSES_PATH = Path("data/feedback_responses.jsonl")
    QUEUE_PATH     = Path("data/feedback_queue.json")

    def __init__(self):
        self._queue: list[ScheduledCheckin] = []
        self._load_queue()

    def schedule(self, match_id: str) -> None:
        """
        Schedule 30 and 90-day check-ins for a match.
        Called by orchestrator after profile generation.
        """
        config = get_config()
        checkin_days = config.feedback.checkin_days

        for days in checkin_days:
            checkin = ScheduledCheckin(
                match_id       = match_id,
                config_context = config.meta.config_id,
                days           = days,
            )
            self._queue.append(checkin)
            logger.info(
                f"Scheduled {days}-day check-in "
                f"(match_hash: {checkin.match_hash[:8]}...)"
            )

        self._save_queue()

    def record_response(self, match_hash: str, response: FeedbackResponse) -> None:
        """
        Record a user's feedback response.
        Stored anonymously — match_hash only, no user linkage.
        """
        record = {
            "match_hash":     match_hash,   # hashed — not raw match_id
            "response":       response,     # YES / PARTIAL / NO
            "timestamp":      datetime.utcnow().isoformat() + "Z",
            "config_context": get_config().meta.config_id,
        }

        self.RESPONSES_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(self.RESPONSES_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")

        logger.info(
            f"Feedback recorded: {response} for match {match_hash[:8]}..."
        )

    def get_aggregate_signals(self) -> dict:
        """
        Return aggregate feedback signals for policymaker dashboard.
        Never returns individual records.
        """
        if not self.RESPONSES_PATH.exists():
            return {"total": 0, "yes": 0, "partial": 0, "no": 0, "success_rate": None}

        counts = {"YES": 0, "PARTIAL": 0, "NO": 0}
        with open(self.RESPONSES_PATH, encoding="utf-8") as f:
            for line in f:
                record = json.loads(line.strip())
                counts[record["response"]] = counts.get(record["response"], 0) + 1

        total = sum(counts.values())
        return {
            "total":        total,
            "yes":          counts["YES"],
            "partial":      counts["PARTIAL"],
            "no":           counts["NO"],
            "success_rate": round(counts["YES"] / total, 3) if total > 0 else None,
        }

    async def run(self) -> None:
        """
        Background loop: checks for due check-ins every hour.
        Fires check-in notifications via configured contact method.
        """
        logger.info("FeedbackAgent started — monitoring check-in queue")

        while True:
            due = [c for c in self._queue if c.is_due()]
            for checkin in due:
                await self._send_checkin(checkin)
                checkin.sent = True

            if due:
                self._save_queue()

            await asyncio.sleep(3600)  # Check every hour

    async def _send_checkin(self, checkin: ScheduledCheckin) -> None:
        """
        Fire a check-in notification.
        Contact method is from config (sms / push / email).
        """
        config = get_config()
        method = config.feedback.contact_method

        logger.info(
            f"Sending {checkin.days_offset}-day check-in via {method} "
            f"(match_hash: {checkin.match_hash[:8]}...)"
        )

        # In production: integrate with SMS gateway (Twilio/Africa's Talking)
        # or push notification service. For demo: log only.
        if method == "sms":
            logger.info(
                f"[SMS] Would send: \"{config.ui_strings['feedback_question']}\""
            )
        elif method == "push":
            logger.info(f"[PUSH] Would send feedback check-in")
        else:
            logger.info(f"[{method.upper()}] Would send feedback check-in")

    def _save_queue(self) -> None:
        self.QUEUE_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(self.QUEUE_PATH, "w", encoding="utf-8") as f:
            json.dump([c.to_dict() for c in self._queue], f, indent=2)

    def _load_queue(self) -> None:
        if not self.QUEUE_PATH.exists():
            return
        with open(self.QUEUE_PATH, encoding="utf-8") as f:
            saved = json.load(f)
        # Reconstruct unsent check-ins only (don't re-fire sent ones)
        for item in saved:
            if not item.get("sent", False):
                checkin = object.__new__(ScheduledCheckin)
                checkin.match_hash     = item["match_hash"]
                checkin.config_context = item["config_context"]
                checkin.due_at         = item["due_at"]
                checkin.days_offset    = item["days_offset"]
                checkin.sent           = False
                self._queue.append(checkin)
