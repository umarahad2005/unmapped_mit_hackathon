"""
core/config_loader.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — System configuration loader and singleton.
Validates config at load time. Refuses to return invalid config.
This is the single source of truth for all country-specific behavior.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import os
from pathlib import Path
from typing import Optional
import jsonschema
from pydantic import BaseModel, field_validator, model_validator

# ── Sub-models ───────────────────────────────────────────────────────────────

class MetaConfig(BaseModel):
    config_id:     str
    country_code:  str
    context_label: str
    last_updated:  str

class LanguageConfig(BaseModel):
    primary:          str
    secondary:        Optional[str] = None
    script_direction: str
    ui_strings_path:  str

class TaxonomyConfig(BaseModel):
    primary:            str
    fallback:           str
    version:            str
    mapping_table_path: str

class LaborDataConfig(BaseModel):
    wage_source:                str
    wage_endpoint:              Optional[str] = None
    sector_growth_source:       str
    employment_structure_source:Optional[str] = None
    data_vintage_year:          int
    staleness_threshold_years:  int
    living_wage_threshold:      float
    currency:                   str
    regional_label:             Optional[str] = None

class AutomationConfig(BaseModel):
    base_scores:            str
    task_indices:           Optional[str] = None
    infrastructure_tier:    str
    itu_penetration_rate:   float
    calibration_multiplier: float

    @field_validator("calibration_multiplier")
    @classmethod
    def multiplier_in_range(cls, v: float) -> float:
        if not (0.0 < v <= 1.0):
            raise ValueError(f"calibration_multiplier must be in (0, 1], got {v}")
        return v

    @field_validator("itu_penetration_rate")
    @classmethod
    def penetration_in_range(cls, v: float) -> float:
        if not (0.0 <= v <= 1.0):
            raise ValueError(f"itu_penetration_rate must be in [0, 1], got {v}")
        return v

class EducationConfig(BaseModel):
    credential_taxonomy:    str
    hci_score:              float
    step_dataset_available: bool = False
    level_mapping:          dict[str, int]

class OpportunitiesConfig(BaseModel):
    types_enabled:                 list[str]
    formal_employment_accessibility: float

class StructuralBarriersConfig(BaseModel):
    wbl_score:                    float
    gender_mobility_restriction:  bool
    gender_workplace_restriction: bool
    disability_data_available:    bool = False

class WittgensteinConfig(BaseModel):
    country_iso3:        str
    projection_scenario: str
    target_years:        list[int]

class FeedbackConfig(BaseModel):
    contact_method: str
    checkin_days:   list[int]

# ── Master Config ────────────────────────────────────────────────────────────

class SystemConfig(BaseModel):
    meta:               MetaConfig
    language:           LanguageConfig
    taxonomy:           TaxonomyConfig
    labor_data:         LaborDataConfig
    automation:         AutomationConfig
    education:          EducationConfig
    opportunities:      OpportunitiesConfig
    structural_barriers:StructuralBarriersConfig
    wittgenstein:       WittgensteinConfig
    ui_strings:         dict[str, str]
    feedback:           FeedbackConfig

    @model_validator(mode="after")
    def validate_ui_strings_complete(self) -> "SystemConfig":
        required_keys = [
            "intake_prompt", "intake_subtext", "intake_placeholder",
            "continue_button", "mirror_question", "mirror_yes",
            "mirror_sometimes", "mirror_no", "verification_intro",
            "feedback_question", "tier_unverified", "tier_recognized",
            "tier_demonstrated", "confidence_legend_unverified",
            "confidence_legend_recognized", "confidence_legend_demonstrated",
            "stale_data_warning", "inaccessible_opportunity",
        ]
        missing = [k for k in required_keys if k not in self.ui_strings]
        if missing:
            raise ValueError(f"ui_strings missing required keys: {missing}")
        return self

# ── Schema Validation (pre-pydantic, catches structural errors early) ────────

SCHEMA_PATH = Path(__file__).parent.parent / "config" / "config.schema.json"

def _validate_against_schema(raw: dict) -> None:
    """Validate raw dict against JSON Schema. Raises jsonschema.ValidationError."""
    if not SCHEMA_PATH.exists():
        raise FileNotFoundError(f"Config schema not found at {SCHEMA_PATH}")
    with open(SCHEMA_PATH) as f:
        schema = json.load(f)
    jsonschema.validate(instance=raw, schema=schema)

# ── Loader ───────────────────────────────────────────────────────────────────

def load_config(path: str | Path) -> SystemConfig:
    """
    Load, schema-validate, and Pydantic-validate a config file.
    Raises descriptive errors if invalid. System refuses to boot with invalid config.
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")

    with open(path, encoding="utf-8") as f:
        raw = json.load(f)

    # Layer 1: JSON Schema validation (structural)
    try:
        _validate_against_schema(raw)
    except jsonschema.ValidationError as e:
        raise ValueError(
            f"Config schema validation failed for '{path.name}':\n"
            f"  Path: {' → '.join(str(p) for p in e.absolute_path)}\n"
            f"  Error: {e.message}"
        ) from e

    # Layer 2: Pydantic validation (business logic constraints)
    try:
        config = SystemConfig(**raw)
    except Exception as e:
        raise ValueError(
            f"Config business logic validation failed for '{path.name}': {e}"
        ) from e

    return config

# ── Singleton ────────────────────────────────────────────────────────────────

_active_config: Optional[SystemConfig] = None
_active_config_path: Optional[str] = None

def get_config() -> SystemConfig:
    """Return the active config singleton. Raises if not yet initialized."""
    if _active_config is None:
        raise RuntimeError(
            "Config not initialized. Call initialize_config() at startup."
        )
    return _active_config

def initialize_config(path: str | Path) -> SystemConfig:
    """Load config and set as active singleton."""
    global _active_config, _active_config_path
    config = load_config(path)
    _active_config = config
    _active_config_path = str(path)
    return config

def hot_swap_config(config_id: str, config_dir: str | Path = "config") -> SystemConfig:
    """
    Swap the active config by config_id without restarting.
    config_id maps to a file: config/{config_id}.json
    Returns the newly active config.
    """
    global _active_config, _active_config_path
    config_path = Path(config_dir) / f"{config_id}.json"
    config = load_config(config_path)
    _active_config = config
    _active_config_path = str(config_path)
    return config
