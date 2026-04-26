#!/usr/bin/env python3
"""
scripts/validate_config.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Boot-time config validator. Run before starting the system.
Exits 0 on success. Exits 1 with descriptive error on failure.

Usage:
    python scripts/validate_config.py config/ghana_urban.json
    python scripts/validate_config.py config/bangladesh_rural.json
    python scripts/validate_config.py --all              # validates all JSONs in config/
─────────────────────────────────────────────────────────────────────────────
"""

import sys
import json
import os
from pathlib import Path

# Allow importing from project root
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.config_loader import load_config

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def validate_file(config_path: Path) -> bool:
    """Validate a single config file. Returns True if valid."""
    print(f"\n{BOLD}Validating:{RESET} {config_path.name}")

    try:
        config = load_config(config_path)
    except FileNotFoundError as e:
        print(f"  {RED}[FAIL] FILE NOT FOUND:{RESET} {e}")
        return False
    except ValueError as e:
        print(f"  {RED}[FAIL] VALIDATION FAILED:{RESET}\n{e}")
        return False
    except Exception as e:
        print(f"  {RED}[FAIL] UNEXPECTED ERROR:{RESET} {e}")
        return False

    # Additional semantic checks beyond schema
    warnings = []

    if config.labor_data.data_vintage_year < 2020:
        warnings.append(f"Labor data vintage ({config.labor_data.data_vintage_year}) is very old")

    if config.automation.itu_penetration_rate < 0.05:
        warnings.append(f"ITU penetration rate ({config.automation.itu_penetration_rate}) is extremely low — verify")

    if len(config.opportunities.types_enabled) < 1:
        warnings.append("No opportunity types enabled — matching engine will return empty results")

    if warnings:
        for w in warnings:
            print(f"  {YELLOW}[WARN] {RESET} {w}")

    print(f"  {GREEN}[OK] VALID{RESET} — config_id: {config.meta.config_id} | country: {config.meta.country_code} | taxonomy: {config.taxonomy.primary}")
    return True


def main() -> None:
    args = sys.argv[1:]

    if not args:
        print(f"{RED}Usage: python validate_config.py <config_file_path> [--all]{RESET}")
        sys.exit(1)

    if "--all" in args:
        config_dir = Path("config")
        if not config_dir.exists():
            print(f"{RED}✗ config/ directory not found{RESET}")
            sys.exit(1)
        config_files = list(config_dir.glob("*.json"))
        config_files = [f for f in config_files if f.name != "config.schema.json"]
        if not config_files:
            print(f"{YELLOW}No config files found in config/{RESET}")
            sys.exit(0)
    else:
        config_files = [Path(p) for p in args]

    results = []
    for config_path in config_files:
        results.append(validate_file(config_path))

    total   = len(results)
    passed  = sum(results)
    failed  = total - passed

    print(f"\n{'─'*50}")
    print(f"{BOLD}Results:{RESET} {GREEN}{passed} passed{RESET} / {RED}{failed} failed{RESET} / {total} total")

    if failed > 0:
        print(f"{RED}[FAIL] System would REFUSE TO BOOT with {failed} invalid config(s){RESET}")
        sys.exit(1)
    else:
        print(f"{GREEN}[OK] All configs valid — system may boot{RESET}")
        sys.exit(0)


if __name__ == "__main__":
    main()
