"""
agent/agent_config.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Shared agent configuration: model IDs, token budgets, retry logic.
All Gemini calls in the agent layer import constants from here.
Never hardcode model IDs or token limits in individual skill files.
─────────────────────────────────────────────────────────────────────────────
"""

from dataclasses import dataclass

# ── Model Selection ──────────────────────────────────────────────────────────
# Pro for complex reasoning tasks; Flash for speed/cost tasks
MODEL_PRO   = "gemini-2.0-flash"           # replaces Sonnet — best reasoning
MODEL_FLASH = "gemini-2.0-flash"           # replaces Haiku  — fastest / cheapest
# Note: gemini-2.0-flash is free-tier eligible and fast enough for all tasks

# ── Convenience aliases (old names kept for backward compat) ─────────────────
MODEL_SONNET = MODEL_PRO
MODEL_HAIKU  = MODEL_FLASH

# ── Token Budgets per Skill Call ─────────────────────────────────────────────
# Gemini uses max_output_tokens. Calibrated to worst-case output needs.
TOKEN_BUDGETS: dict[str, int] = {
    "skill_extraction":    1000,   # Pro   — structured JSON, up to ~10 skills
    "mirror_card_writer":   150,   # Flash — 2 sentences max
    "scenario_generator":   400,   # Pro   — scenario JSON
    "scenario_scorer":      300,   # Pro   — scoring JSON
    "evidence_analyzer":    500,   # Pro   — vision analysis JSON
    "profile_narrator":     300,   # Flash — summary paragraph
}

# ── Model Assignment per Skill ───────────────────────────────────────────────
SKILL_MODELS: dict[str, str] = {
    "skill_extraction":   MODEL_PRO,
    "mirror_card_writer": MODEL_FLASH,
    "scenario_generator": MODEL_PRO,
    "scenario_scorer":    MODEL_PRO,
    "evidence_analyzer":  MODEL_PRO,
    "profile_narrator":   MODEL_FLASH,
}

# ── Retry Configuration ──────────────────────────────────────────────────────
MAX_RETRIES     = 3
RETRY_DELAY_SEC = 1.5   # exponential: delay * (attempt ** 1.5)
TIMEOUT_SEC     = 30    # max wait for any single Gemini call

# ── Mirror Test Hard Limits ──────────────────────────────────────────────────
MIRROR_MAX_CARDS     = 15
MIRROR_MAX_SECONDS   = 300   # 5 minutes — hard constraint (Article III.2)

# ── Verification Limits ──────────────────────────────────────────────────────
VERIFICATION_MAX_SKILLS = 5   # top N Tier 1 skills enter verification

# ── Graph Limits ─────────────────────────────────────────────────────────────
GRAPH_MIN_EDGE_WEIGHT  = 0.4  # minimum adjacency weight to traverse
GRAPH_MAX_DEPTH        = 2    # max hops for adjacency queries
RESILIENCE_TOP_N       = 5    # max resilience pathway suggestions

# ── Risk Band Thresholds ─────────────────────────────────────────────────────
RISK_BANDS: dict[str, tuple[float, float]] = {
    "LOW":      (0.00, 0.30),
    "MODERATE": (0.30, 0.55),
    "HIGH":     (0.55, 0.75),
    "CRITICAL": (0.75, 1.01),
}

# ── Match Score Weights ──────────────────────────────────────────────────────
# Must sum to 1.0 (enforced by validate_weights() below)
MATCH_WEIGHTS: dict[str, float] = {
    "skill_alignment":          0.40,
    "wage_viability":           0.25,
    "sector_growth":            0.20,
    "structural_accessibility": 0.15,
}

def validate_weights() -> None:
    total = sum(MATCH_WEIGHTS.values())
    assert abs(total - 1.0) < 1e-9, f"Match weights must sum to 1.0, got {total}"

validate_weights()

# ── Staleness Thresholds ─────────────────────────────────────────────────────
STALENESS_WARNING_YEARS = 3   # yellow warning in UI
STALENESS_ERROR_YEARS   = 5   # red flag + disclosure note

# ── Infrastructure Tier Multipliers ─────────────────────────────────────────
# Used in risk calibration (Article IV.1)
INFRASTRUCTURE_MULTIPLIERS: dict[str, float] = {
    "high":    1.00,   # Full exposure (Singapore, South Korea)
    "medium":  0.85,   # Partial exposure (Brazil, South Africa)
    "low":     0.72,   # Constrained (Ghana, Nigeria)
    "minimal": 0.55,   # Very limited (rural LMICs, Bangladesh)
}

# ── Tier Upgrade Thresholds ──────────────────────────────────────────────────
# Scenario scoring: total out of 9 points
SCENARIO_TIER2_THRESHOLD = 7   # 7+ → DEMONSTRATED (Tier 2)
SCENARIO_TIER1_MIN       = 4   # 4–6 → stays RECOGNIZED (Tier 1, noted as strong)

# ── Integrity Check ──────────────────────────────────────────────────────────
INTEGRITY_MAX_CONTRADICTIONS = 2  # >2 triggers cap_at_tier_1 + transparency notice

# ── Feedback Schedule ────────────────────────────────────────────────────────
FEEDBACK_CHECKIN_DAYS = [30, 90]

# ── API Endpoints ────────────────────────────────────────────────────────────
API_PREFIX = "/api"
ENDPOINTS  = {
    "config_active": f"{API_PREFIX}/config/active",
    "config_swap":   f"{API_PREFIX}/config/swap",
    "intake_extract":f"{API_PREFIX}/intake/extract",
    "mirror_cards":  f"{API_PREFIX}/mirror/cards",
    "mirror_respond":f"{API_PREFIX}/mirror/respond",
    "verify":        f"{API_PREFIX}/verify",
    "profile":       f"{API_PREFIX}/profile",
    "match":         f"{API_PREFIX}/match",
    "signals":       f"{API_PREFIX}/signals",
}
