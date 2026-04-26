"""
agent/skills/mirror_card_writer.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Skill: O*NET task statement → plain-language mirror card via Gemini.

Uses gemini-2.0-flash (fast, cheap) — 2 sentences max, 150 tokens max.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import re
import time

from agent.agent_config import MODEL_FLASH, TOKEN_BUDGETS, MAX_RETRIES, RETRY_DELAY_SEC
from core.config_loader import SystemConfig

logger = logging.getLogger("unmapped.mirror_card_writer")

REWRITER_SYSTEM_PROMPT = """Rewrite the following occupational task statement for a person with no formal education in this field.

Rules:
- Use simple, direct, everyday language
- Maximum 2 sentences total
- Do not use jargon, technical abbreviations, or the word "utilize"
- The person should immediately recognize whether this describes their own work
- Write in {language}
- Return ONLY the rewritten text — no quotes, no preamble, no explanation, no markdown"""


class MirrorCardWriterSkill:
    """Atomic skill: technical task statement → plain-language card text (Gemini Flash)."""

    def __init__(self, config: SystemConfig):
        self.config = config

    def run(self, task_statement: str) -> str:
        """
        Rewrite a single O*NET task statement. Returns plain text (max 2 sentences).
        Falls back to cleaned original if API fails.
        """
        from core.gemini_client import call_gemini

        system = REWRITER_SYSTEM_PROMPT.format(language=self.config.language.primary)

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                start = time.monotonic()
                text  = call_gemini(
                    model_id          = MODEL_FLASH,
                    system_prompt     = system,
                    user_prompt       = task_statement,
                    max_output_tokens = TOKEN_BUDGETS["mirror_card_writer"],
                    temperature       = 0.3,
                )
                elapsed = time.monotonic() - start
                logger.debug(f"Card rewritten in {elapsed:.2f}s: '{text[:60]}...'")
                return text
            except Exception as e:
                logger.warning(f"Card rewriter attempt {attempt} failed: {e}")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY_SEC * attempt)

        logger.warning("Card rewriter failed all attempts — using fallback")
        return self._fallback_rewrite(task_statement)

    def _fallback_rewrite(self, task_statement: str) -> str:
        text = task_statement.strip()
        text = re.sub(r'\(O\*NET[^)]*\)', '', text).strip()
        if text and not text.endswith('.'):
            text += '.'
        return text


class MirrorCardCache:
    """In-memory cache for rewritten mirror cards (avoids duplicate API calls)."""

    def __init__(self):
        self._cache: dict[str, str] = {}

    def get(self, task_id: str) -> str | None:
        return self._cache.get(task_id)

    def set(self, task_id: str, card_text: str) -> None:
        self._cache[task_id] = card_text

    def get_or_write(self, task_id: str, task_statement: str, writer: MirrorCardWriterSkill) -> str:
        cached = self.get(task_id)
        if cached:
            logger.debug(f"Cache hit for task {task_id}")
            return cached
        card_text = writer.run(task_statement)
        self.set(task_id, card_text)
        return card_text
