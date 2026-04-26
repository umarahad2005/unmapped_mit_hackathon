"""
agent/skills/skill_extraction.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Skill: Narrative → Tier 0 skill extraction via Gemini.

Single responsibility: takes a narrative text + config, returns a
structured list of CandidateSkill objects all at Tier 0 (UNVERIFIED).

Uses structured JSON output — no prose preambles ever returned.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
import time
from dataclasses import dataclass, field
from typing import Literal

from agent.agent_config import (
    MODEL_PRO,
    TOKEN_BUDGETS,
    MAX_RETRIES,
    RETRY_DELAY_SEC,
)
from core.config_loader import SystemConfig

logger = logging.getLogger("unmapped.skill_extraction")

# ── Data Types ────────────────────────────────────────────────────────────────

SignalType = Literal["STATED", "INFERRED"]
SkillType  = Literal["technical", "transferable", "domain"]

@dataclass
class CandidateSkill:
    skill_label:  str
    taxonomy:     str
    taxonomy_id:  str
    evidence_text:str
    signal_type:  SignalType
    skill_type:   SkillType
    tier:         int = 0
    tier_label:   str = "UNVERIFIED"

    def to_dict(self) -> dict:
        return {
            "skill_label":   self.skill_label,
            "taxonomy":      self.taxonomy,
            "taxonomy_id":   self.taxonomy_id,
            "evidence_text": self.evidence_text,
            "signal_type":   self.signal_type,
            "skill_type":    self.skill_type,
            "tier":          self.tier,
            "tier_label":    self.tier_label,
        }

@dataclass
class ExtractionResult:
    extracted_skills: list[CandidateSkill] = field(default_factory=list)
    inferred_skills:  list[CandidateSkill] = field(default_factory=list)
    extraction_gaps:  list[str]            = field(default_factory=list)
    raw_response:     str                  = ""

    @property
    def all_skills(self) -> list[CandidateSkill]:
        return self.extracted_skills + self.inferred_skills

    @property
    def total_count(self) -> int:
        return len(self.all_skills)

# ── System Prompt ─────────────────────────────────────────────────────────────

EXTRACTION_SYSTEM_PROMPT = """You are a skills extraction specialist for the UNMAPPED system.
Your job is to extract demonstrable skill signals from a person's narrative description of their work and experience.

Active taxonomy: {taxonomy}
Country context: {context_label}
Language: {language}

Rules:
1. Extract only skills evidenced by specific actions or outcomes described — not vague claims
2. Map each skill to its exact taxonomy node ID (use realistic IDs for the active taxonomy)
3. Distinguish between: technical skills, transferable skills, and domain knowledge
4. Flag skills that are strongly implied but not explicitly stated as INFERRED vs STATED
5. Always include evidence_text: the exact phrase from the narrative that supports this skill
6. Return JSON only. No preamble. No explanation outside the JSON structure.

OUTPUT FORMAT (strict JSON, nothing else):
{{
  "extracted_skills": [
    {{
      "skill_label": "Electronic equipment repair",
      "taxonomy": "ESCO",
      "taxonomy_id": "S5.6.0",
      "evidence_text": "running a phone repair business since she was 17",
      "signal_type": "STATED",
      "skill_type": "technical"
    }}
  ],
  "inferred_skills": [
    {{
      "skill_label": "Customer communication",
      "taxonomy": "ESCO",
      "taxonomy_id": "S1.2.1",
      "evidence_text": "has a regular base of customers who come back",
      "signal_type": "INFERRED",
      "skill_type": "transferable"
    }}
  ],
  "extraction_gaps": ["User mentioned training others but did not specify what field"]
}}"""

# ── Skill Extraction ──────────────────────────────────────────────────────────

class SkillExtractionSkill:
    """
    Atomic skill: narrative → Tier 0 candidate skills.
    Wraps a single Gemini call with retry logic.
    """

    def __init__(self, config: SystemConfig):
        self.config = config

    def _build_system_prompt(self) -> str:
        return EXTRACTION_SYSTEM_PROMPT.format(
            taxonomy      = self.config.taxonomy.primary,
            context_label = self.config.meta.context_label,
            language      = self.config.language.primary,
        )

    def _clean_json(self, raw: str) -> str:
        """Strip markdown fences if Gemini wraps JSON in ```json ... ```"""
        raw = raw.strip()
        if raw.startswith("```"):
            lines = raw.splitlines()
            # Remove first and last fence lines
            lines = [l for l in lines if not l.strip().startswith("```")]
            raw = "\n".join(lines).strip()
        return raw

    def _parse_response(self, raw: str) -> ExtractionResult:
        """Parse Gemini's JSON response into typed objects."""
        try:
            data = json.loads(self._clean_json(raw))
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error in extraction response: {e}")
            logger.debug(f"Raw response (first 500 chars): {raw[:500]}")
            return ExtractionResult(extraction_gaps=["Extraction parse error — response was not valid JSON"])

        def parse_skills(skill_list: list[dict], signal_type: SignalType) -> list[CandidateSkill]:
            skills = []
            for s in skill_list:
                try:
                    skills.append(CandidateSkill(
                        skill_label   = s.get("skill_label", "Unknown skill"),
                        taxonomy      = s.get("taxonomy", self.config.taxonomy.primary),
                        taxonomy_id   = s.get("taxonomy_id", "UNMAPPED"),
                        evidence_text = s.get("evidence_text", ""),
                        signal_type   = s.get("signal_type", signal_type),
                        skill_type    = s.get("skill_type", "technical"),
                        tier          = 0,
                        tier_label    = "UNVERIFIED",
                    ))
                except Exception as parse_err:
                    logger.warning(f"Skipping malformed skill entry: {parse_err}")
            return skills

        return ExtractionResult(
            extracted_skills = parse_skills(data.get("extracted_skills", []), "STATED"),
            inferred_skills  = parse_skills(data.get("inferred_skills", []), "INFERRED"),
            extraction_gaps  = data.get("extraction_gaps", []),
            raw_response     = raw,
        )

    def run(self, narrative: str) -> ExtractionResult:
        """
        Extract skills from narrative. Synchronous.
        Returns ExtractionResult with all skills at Tier 0.
        """
        if len(narrative.split()) < 5:
            return ExtractionResult(
                extraction_gaps=["Narrative too short to extract skills"]
            )

        from core.gemini_client import call_gemini
        system_prompt = self._build_system_prompt()

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                logger.info(
                    f"Extracting skills (attempt {attempt}) | "
                    f"narrative length: {len(narrative.split())} words"
                )
                start = time.monotonic()

                raw = call_gemini(
                    model_id          = MODEL_PRO,
                    system_prompt     = system_prompt,
                    user_prompt       = narrative,
                    max_output_tokens = TOKEN_BUDGETS["skill_extraction"],
                    temperature       = 0.1,   # low temp for structured output
                )

                elapsed = time.monotonic() - start
                result  = self._parse_response(raw)

                logger.info(
                    f"Extraction complete in {elapsed:.2f}s: "
                    f"{len(result.extracted_skills)} stated, "
                    f"{len(result.inferred_skills)} inferred, "
                    f"{len(result.extraction_gaps)} gaps"
                )
                return result

            except Exception as e:
                logger.warning(f"Extraction attempt {attempt} failed: {e}")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY_SEC * (attempt ** 1.5))
                else:
                    logger.error("All extraction attempts failed")
                    return ExtractionResult(
                        extraction_gaps=[f"Extraction failed after {MAX_RETRIES} attempts: {str(e)}"]
                    )

        return ExtractionResult(extraction_gaps=["Extraction did not complete"])
