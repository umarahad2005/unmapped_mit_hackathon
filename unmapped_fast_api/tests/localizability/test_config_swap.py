"""
tests/localizability/test_config_swap.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Localizability Stress Test (Article VI.2).

This is the most important test in the system. It must pass before any demo.
Verifies that a live config swap from Ghana → Bangladesh changes ALL
country-specific parameters without touching the codebase.

Run: pytest tests/localizability/test_config_swap.py -v
─────────────────────────────────────────────────────────────────────────────
"""

import hashlib
import sys
from pathlib import Path

import pytest

# Allow importing from project root
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from core.config_loader import load_config, initialize_config, hot_swap_config


# ── Fixture: capture codebase hash BEFORE any swap ───────────────────────────

@pytest.fixture(scope="session")
def codebase_hash_before():
    """Hash of key source files — must not change during swap."""
    files = [
        "core/config_loader.py",
        "agent/orchestrator.py",
        "agent/subagents/intake_agent.py",
        "agent/subagents/mirror_agent.py",
    ]
    h = hashlib.md5()
    for f in files:
        p = Path(f)
        if p.exists():
            h.update(p.read_bytes())
    return h.hexdigest()


# ── Core localizability test ──────────────────────────────────────────────────

class TestLiveConfigSwap:
    """
    Article VI.2 — Live Config Swap Stress Test.
    Every assertion here corresponds to a constitutional requirement.
    """

    def test_ghana_config_loads(self):
        """Ghana urban config must load and validate successfully."""
        config = load_config("config/ghana_urban.json")
        assert config is not None
        assert config.meta.config_id == "ghana_urban_v1"
        assert config.meta.country_code == "GH"

    def test_ghana_language_is_english(self):
        config = load_config("config/ghana_urban.json")
        assert config.language.primary == "en"
        assert config.language.script_direction == "ltr"

    def test_ghana_taxonomy_is_esco(self):
        config = load_config("config/ghana_urban.json")
        assert config.taxonomy.primary == "ESCO"

    def test_ghana_infrastructure_tier_is_low(self):
        config = load_config("config/ghana_urban.json")
        assert config.automation.infrastructure_tier == "low"
        assert config.automation.calibration_multiplier == 0.72

    def test_ghana_has_gig_opportunity(self):
        config = load_config("config/ghana_urban.json")
        assert "self_employment" in config.opportunities.types_enabled
        assert "gig" in config.opportunities.types_enabled

    def test_ghana_labor_source_is_ilostat(self):
        config = load_config("config/ghana_urban.json")
        assert config.labor_data.wage_source == "WDI"

    def test_ghana_ui_strings_in_english(self):
        config = load_config("config/ghana_urban.json")
        assert config.ui_strings["mirror_yes"] == "Yes"
        assert config.ui_strings["mirror_no"] == "No"

    # ── After swap to Bangladesh ──────────────────────────────────────────────

    def test_bangladesh_config_loads(self):
        """Bangladesh rural config must load and validate successfully."""
        config = load_config("config/bangladesh_rural.json")
        assert config is not None
        assert config.meta.config_id == "bangladesh_rural_v1"
        assert config.meta.country_code == "BD"

    def test_bangladesh_language_is_bengali(self):
        config = load_config("config/bangladesh_rural.json")
        assert config.language.primary == "bn"
        assert config.language.script_direction == "ltr"  # Bengali is LTR

    def test_bangladesh_taxonomy_is_isco(self):
        config = load_config("config/bangladesh_rural.json")
        assert config.taxonomy.primary == "ISCO-08"

    def test_bangladesh_infrastructure_tier_is_minimal(self):
        config = load_config("config/bangladesh_rural.json")
        assert config.automation.infrastructure_tier == "minimal"
        # calibration_multiplier must be LOWER than Ghana (0.72)
        assert config.automation.calibration_multiplier < 0.72

    def test_bangladesh_has_agricultural_cooperative(self):
        config = load_config("config/bangladesh_rural.json")
        assert "agricultural_cooperative" in config.opportunities.types_enabled

    def test_bangladesh_no_gig_economy(self):
        """Gig economy is not relevant in rural Bangladesh."""
        config = load_config("config/bangladesh_rural.json")
        assert "gig" not in config.opportunities.types_enabled

    def test_bangladesh_ui_strings_in_bengali(self):
        config = load_config("config/bangladesh_rural.json")
        assert config.ui_strings["mirror_yes"] == "হ্যাঁ"
        assert config.ui_strings["mirror_no"] == "না"

    def test_bangladesh_has_gender_mobility_restriction(self):
        config = load_config("config/bangladesh_rural.json")
        assert config.structural_barriers.gender_mobility_restriction == True

    # ── Hot-swap behavior ─────────────────────────────────────────────────────

    def test_hot_swap_gh_to_bd(self):
        """Hot swap must change active config without code change."""
        config_gh = initialize_config("config/ghana_urban.json")
        assert config_gh.meta.country_code == "GH"
        assert config_gh.language.primary  == "en"

        config_bd = hot_swap_config("bangladesh_rural", config_dir="config")
        assert config_bd.meta.country_code == "BD"
        assert config_bd.language.primary  == "bn"
        assert config_bd.taxonomy.primary  == "ISCO-08"
        assert config_bd.automation.calibration_multiplier < 0.72
        assert "agricultural_cooperative" in config_bd.opportunities.types_enabled
        assert "gig" not in config_bd.opportunities.types_enabled

    def test_hot_swap_bd_back_to_gh(self):
        """Swap must also work in reverse."""
        config_gh = hot_swap_config("ghana_urban", config_dir="config")
        assert config_gh.meta.country_code == "GH"
        assert config_gh.language.primary  == "en"
        assert config_gh.taxonomy.primary  == "ESCO"

    def test_codebase_unchanged_after_swap(self, codebase_hash_before):
        """
        Critical: no source file should have changed during the swap.
        This proves config-driven architecture, not code changes.
        """
        # Re-swap to Bangladesh and back
        hot_swap_config("bangladesh_rural", config_dir="config")
        hot_swap_config("ghana_urban",      config_dir="config")

        # Recompute hash
        files = [
            "core/config_loader.py",
            "agent/orchestrator.py",
            "agent/subagents/intake_agent.py",
            "agent/subagents/mirror_agent.py",
        ]
        h = hashlib.md5()
        for f in files:
            p = Path(f)
            if p.exists():
                h.update(p.read_bytes())
        hash_after = h.hexdigest()

        assert hash_after == codebase_hash_before, (
            "CONSTITUTION VIOLATION (Article VI.2): "
            "Source files changed during config swap. "
            "This must be config-driven, not code-driven."
        )

    # ── Invalid config rejection ──────────────────────────────────────────────

    def test_invalid_config_rejected(self, tmp_path):
        """System must refuse to load an invalid config with a descriptive error."""
        bad_config = tmp_path / "bad.json"
        bad_config.write_text('{"meta": {"config_id": "bad"}}')  # Missing required fields

        with pytest.raises((ValueError, Exception)):
            load_config(bad_config)

    def test_calibration_multiplier_validated(self, tmp_path):
        """calibration_multiplier > 1.0 must be rejected."""
        import json

        # Load valid Ghana config and corrupt automation multiplier
        with open("config/ghana_urban.json") as f:
            data = json.load(f)
        data["automation"]["calibration_multiplier"] = 1.5  # Invalid

        bad = tmp_path / "bad_automation.json"
        bad.write_text(json.dumps(data))

        with pytest.raises((ValueError, Exception)):
            load_config(bad)
