"""
agent/skills/scenario_generator.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Skill: Generate micro-verification scenario via Gemini.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
import time
from dataclasses import dataclass

from agent.agent_config import MODEL_PRO, TOKEN_BUDGETS, MAX_RETRIES, RETRY_DELAY_SEC
from core.config_loader import SystemConfig

logger = logging.getLogger("unmapped.scenario_generator")

SCENARIO_SYSTEM_PROMPT = """Generate a single, realistic scenario question to verify someone's competency.

Country context: {context_label}
Skill being verified: {skill_label}
Skill taxonomy ID: {taxonomy_id}

Rules:
1. The scenario MUST be grounded in local, realistic context — not abstract or Western-biased
2. Do NOT ask for a "correct answer" — ask what they would do and why
3. Maximum 3 sentences for the scenario setup
4. Maximum 1 sentence for the question
5. The question should reveal decision-making process, not memorized facts
6. Write in {language}
7. Return JSON only — no preamble, no markdown fences

OUTPUT FORMAT (strict JSON):
{{
  "scenario_text": "...",
  "question": "...",
  "skill_being_verified": "...",
  "scoring_dimensions": ["decision_logic", "local_context_awareness", "practical_reasoning"]
}}"""


@dataclass
class ScenarioCard:
    scenario_text:        str
    question:             str
    skill_being_verified: str
    scoring_dimensions:   list[str]
    skill_id:             str
    skill_label:          str

    def to_dict(self) -> dict:
        return {
            "scenario_text":        self.scenario_text,
            "question":             self.question,
            "skill_being_verified": self.skill_being_verified,
            "scoring_dimensions":   self.scoring_dimensions,
            "skill_id":             self.skill_id,
            "skill_label":          self.skill_label,
        }


class ScenarioGeneratorSkill:
    def __init__(self, config: SystemConfig):
        self.config = config

    def _clean_json(self, raw: str) -> str:
        raw = raw.strip()
        if raw.startswith("```"):
            lines = [l for l in raw.splitlines() if not l.strip().startswith("```")]
            raw = "\n".join(lines).strip()
        return raw

    def run(self, skill_id: str, skill_label: str) -> ScenarioCard:
        from core.gemini_client import call_gemini

        system = SCENARIO_SYSTEM_PROMPT.format(
            context_label = self.config.meta.context_label,
            skill_label   = skill_label,
            taxonomy_id   = skill_id,
            language      = self.config.language.primary,
        )

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                raw  = call_gemini(
                    model_id          = MODEL_PRO,
                    system_prompt     = system,
                    user_prompt       = f"Generate a verification scenario for: {skill_label}",
                    max_output_tokens = TOKEN_BUDGETS["scenario_generator"],
                    temperature       = 0.4,
                )
                data = json.loads(self._clean_json(raw))
                return ScenarioCard(
                    scenario_text        = data.get("scenario_text", ""),
                    question             = data.get("question", ""),
                    skill_being_verified = data.get("skill_being_verified", skill_label),
                    scoring_dimensions   = data.get("scoring_dimensions", ["decision_logic", "local_context_awareness", "practical_reasoning"]),
                    skill_id             = skill_id,
                    skill_label          = skill_label,
                )
            except Exception as e:
                logger.warning(f"Scenario generation attempt {attempt} failed: {e}")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY_SEC * attempt)

        # Fallback
        return ScenarioCard(
            scenario_text        = f"You are working on a task that requires {skill_label.lower()}. Something unexpected goes wrong.",
            question             = "What steps would you take to handle this situation?",
            skill_being_verified = skill_label,
            scoring_dimensions   = ["decision_logic", "local_context_awareness", "practical_reasoning"],
            skill_id             = skill_id,
            skill_label          = skill_label,
        )
