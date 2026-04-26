"""
agent/skills/scenario_scorer.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Skill: Score a user's micro-verification response via Gemini.

Scores on 3 dimensions (0-3 each, 9 total):
  decision_logic, local_context_awareness, practical_reasoning

7+ → DEMONSTRATED (Tier 2)
4–6 → stays RECOGNIZED (Tier 1, noted as strong)
<4  → stays Tier 1, no penalty
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
import time
from dataclasses import dataclass
from typing import Literal

from agent.agent_config import (
    MODEL_PRO,
    TOKEN_BUDGETS,
    MAX_RETRIES,
    RETRY_DELAY_SEC,
    SCENARIO_TIER2_THRESHOLD,
    SCENARIO_TIER1_MIN,
)
from agent.skills.scenario_generator import ScenarioCard
from core.config_loader import SystemConfig

logger = logging.getLogger("unmapped.scenario_scorer")

TierOutcome = Literal["DEMONSTRATED", "RECOGNIZED"]

SCORER_SYSTEM_PROMPT = """You are evaluating a skill verification response for the UNMAPPED skills assessment system.

Skill being assessed: {skill_label}
Scenario presented: {scenario_text}
Question asked: {question}
User's response: {user_response}

Score the response on three dimensions (0–3 each):
- decision_logic: Does the reasoning follow a logical diagnostic or action path?
- local_context_awareness: Does the response reflect awareness of local constraints and realities?
- practical_reasoning: Does the response show hands-on experience rather than theoretical knowledge?

Scoring guide:
  3 = Strong evidence of this quality
  2 = Some evidence, with gaps
  1 = Weak or indirect evidence
  0 = No evidence or contradictory

Total 7–9 = DEMONSTRATED (Tier 2)
Total 4–6 = RECOGNIZED (stays Tier 1, noted as strong)
Total 0–3 = stays Tier 1, no penalty

Write reasoning_note in plain language shown directly to the user. Be encouraging.
Return JSON only — no preamble, no markdown fences.

OUTPUT FORMAT (strict JSON):
{{
  "scores": {{
    "decision_logic": 0,
    "local_context_awareness": 0,
    "practical_reasoning": 0
  }},
  "total": 0,
  "tier_outcome": "DEMONSTRATED or RECOGNIZED",
  "reasoning_note": "Plain language explanation for the user"
}}"""


@dataclass
class ScoringResult:
    scores:          dict[str, int]
    total:           int
    tier_outcome:    TierOutcome
    reasoning_note:  str
    skill_id:        str
    advanced_to_tier2: bool

    def to_dict(self) -> dict:
        return {
            "skill_id":           self.skill_id,
            "scores":             self.scores,
            "total":              self.total,
            "tier_outcome":       self.tier_outcome,
            "advanced_to_tier2":  self.advanced_to_tier2,
            "reasoning_note":     self.reasoning_note,
        }


class ScenarioScorerSkill:
    def __init__(self, config: SystemConfig):
        self.config = config

    def _clean_json(self, raw: str) -> str:
        raw = raw.strip()
        if raw.startswith("```"):
            lines = [l for l in raw.splitlines() if not l.strip().startswith("```")]
            raw = "\n".join(lines).strip()
        return raw

    def run(self, scenario: ScenarioCard, user_response: str) -> ScoringResult:
        """Score a user's response. Never regresses a skill — worst case is Tier 1 retained."""
        from core.gemini_client import call_gemini

        system = SCORER_SYSTEM_PROMPT.format(
            skill_label   = scenario.skill_label,
            scenario_text = scenario.scenario_text,
            question      = scenario.question,
            user_response = user_response,
        )

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                raw  = call_gemini(
                    model_id          = MODEL_PRO,
                    system_prompt     = system,
                    user_prompt       = "Score this response.",
                    max_output_tokens = TOKEN_BUDGETS["scenario_scorer"],
                    temperature       = 0.1,
                )
                data   = json.loads(self._clean_json(raw))
                scores = data.get("scores", {})
                total  = data.get("total", sum(scores.values()))

                # Enforce thresholds (never trust the model's tier alone)
                if total >= SCENARIO_TIER2_THRESHOLD:
                    tier_outcome = "DEMONSTRATED"
                    advanced     = True
                else:
                    tier_outcome = "RECOGNIZED"
                    advanced     = False

                return ScoringResult(
                    scores            = scores,
                    total             = total,
                    tier_outcome      = tier_outcome,
                    reasoning_note    = data.get("reasoning_note", ""),
                    skill_id          = scenario.skill_id,
                    advanced_to_tier2 = advanced,
                )

            except Exception as e:
                logger.warning(f"Scoring attempt {attempt} failed: {e}")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY_SEC * attempt)

        # Safe fallback — stays at Tier 1, no penalty
        return ScoringResult(
            scores            = {"decision_logic": 1, "local_context_awareness": 1, "practical_reasoning": 1},
            total             = 3,
            tier_outcome      = "RECOGNIZED",
            reasoning_note    = "We had trouble evaluating your response, but your skill is still recorded.",
            skill_id          = scenario.skill_id,
            advanced_to_tier2 = False,
        )
