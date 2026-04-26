#!/usr/bin/env python3
"""
scripts/test_backend.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Backend smoke test. Run while the server is live on :8000.
Tests every key endpoint. Shows PASS/FAIL with response previews.

Usage:
    python scripts/test_backend.py
    python scripts/test_backend.py --base-url http://localhost:8000
─────────────────────────────────────────────────────────────────────────────
"""

import sys
import json
import argparse
import urllib.request
import urllib.error
from typing import Any

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"


def request(method: str, url: str, body: dict | None = None) -> tuple[int, dict]:
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, {"error": e.reason}
    except Exception as e:
        return 0, {"error": str(e)}


def check(label: str, status: int, body: dict, expect_status: int = 200, expect_keys: list[str] | None = None):
    ok = status == expect_status
    if ok and expect_keys:
        ok = all(k in body for k in expect_keys)

    badge = f"{GREEN}[PASS]{RESET}" if ok else f"{RED}[FAIL]{RESET}"
    print(f"  {badge}  {label}")
    if not ok:
        print(f"         Status: {status} | Body: {json.dumps(body)[:200]}")
    else:
        # Show a short preview of the response
        preview = json.dumps(body)[:120]
        print(f"         {CYAN}{preview}{RESET}")
    return ok


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:8000")
    args = parser.parse_args()
    base = args.base_url.rstrip("/")

    print(f"\n{BOLD}UNMAPPED Backend Smoke Test{RESET}")
    print(f"Target: {CYAN}{base}{RESET}\n")

    passed = []
    failed = []

    def run(label, method, path, body=None, expect=200, keys=None):
        url    = f"{base}{path}"
        status, resp = request(method, url, body)
        ok = check(label, status, resp, expect, keys)
        (passed if ok else failed).append(label)

    # ── Health ─────────────────────────────────────────────────────────────────
    print(f"{BOLD}Health:{RESET}")
    run(
        "GET / — system status",
        "GET", "/",
        keys=["system", "status", "active_config", "country"]
    )

    # ── Docs ──────────────────────────────────────────────────────────────────
    print(f"\n{BOLD}API Docs:{RESET}")
    run("GET /docs — Swagger UI available", "GET", "/docs", expect=200)
    run("GET /openapi.json — schema present", "GET", "/openapi.json",
        keys=["openapi", "info", "paths"])

    # ── Config endpoints ──────────────────────────────────────────────────────
    print(f"\n{BOLD}Config:{RESET}")
    run(
        "GET /api/config/active — returns active config",
        "GET", "/api/config/active",
        keys=["config_id", "country_code", "language", "taxonomy"]
    )
    run(
        "POST /api/config/swap → bangladesh_rural",
        "POST", "/api/config/swap",
        body={"config_id": "bangladesh_rural"},
        keys=["status", "config_id"]
    )
    run(
        "POST /api/config/swap → india_rural",
        "POST", "/api/config/swap",
        body={"config_id": "india_rural"},
        keys=["status", "config_id"]
    )
    run(
        "POST /api/config/swap → ghana_urban (back)",
        "POST", "/api/config/swap",
        body={"config_id": "ghana_urban"},
        keys=["status", "config_id"]
    )
    run(
        "POST /api/config/swap — invalid config → 400",
        "POST", "/api/config/swap",
        body={"config_id": "nonexistent_country"},
        expect=400
    )

    # ── Econometric signals ───────────────────────────────────────────────────
    print(f"\n{BOLD}Market Signals:{RESET}")
    run(
        "GET /api/signals/GH — 2 econometric signals",
        "GET", "/api/signals/GH",
        keys=["country_code", "signals", "signal_count"]
    )

    # ── Matching ──────────────────────────────────────────────────────────────
    print(f"\n{BOLD}Opportunity Matching:{RESET}")
    run(
        "POST /api/match — skills → ranked opportunities",
        "POST", "/api/match",
        body=["S5.6.0", "S1.2.1"],
        keys=["opportunities", "total"]
    )

    # ── Mirror cards ──────────────────────────────────────────────────────────
    print(f"\n{BOLD}Mirror Test:{RESET}")
    run(
        "POST /api/mirror/cards — returns card deck",
        "POST", "/api/mirror/cards",
        body={"session_id": "test001", "skill_ids": ["S5.6.0", "S1.2.1"]},
        keys=["cards", "max_cards", "question"]
    )
    run(
        "POST /api/mirror/respond — YES response",
        "POST", "/api/mirror/respond",
        body={"session_id": "test001", "skill_id": "S5.6.0",
              "response": "YES", "card_number": 1},
        keys=["tier_upgraded", "new_tier"]
    )

    # ── Intake (no Gemini key needed — returns error gracefully) ─────────────
    print(f"\n{BOLD}Intake (no API key check):{RESET}")
    run(
        "POST /api/intake/extract — too short → 400",
        "POST", "/api/intake/extract",
        body={"narrative": "hi"},
        expect=400
    )

    # ── Summary ───────────────────────────────────────────────────────────────
    total = len(passed) + len(failed)
    print(f"\n{'─'*55}")
    print(f"{BOLD}Results: {GREEN}{len(passed)} passed{RESET} / {RED}{len(failed)} failed{RESET} / {total} total{RESET}")

    if failed:
        print(f"\n{RED}Failed tests:{RESET}")
        for f in failed:
            print(f"  - {f}")
        sys.exit(1)
    else:
        print(f"\n{GREEN}All backend endpoints healthy!{RESET}")
        print(f"\nNow open: {CYAN}{args.base_url}/docs{RESET}")
        print(f"Try the interactive API explorer to test /api/intake/extract with your Gemini key.")
        sys.exit(0)


if __name__ == "__main__":
    main()
