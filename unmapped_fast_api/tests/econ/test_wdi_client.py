import json
from pathlib import Path

import pytest


def test_wdi_client_caches_latest_point(tmp_path, monkeypatch):
    from core.econ.wdi_client import WdiClient

    calls = {"n": 0}

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            # WDI shape: [meta, rows]
            return [
                {"page": 1},
                [
                    {"date": "2024", "value": 123.0},
                    {"date": "2023", "value": None},
                ],
            ]

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def get(self, url, params=None, headers=None):
            calls["n"] += 1
            return FakeResponse()

    import httpx

    monkeypatch.setattr(httpx, "Client", FakeClient)

    client = WdiClient(cache_dir=tmp_path, cache_ttl_seconds=99999)
    p1 = client.get_latest_point("GH", "NY.GDP.PCAP.CD")
    assert p1.year == 2024
    assert p1.value == 123.0
    assert calls["n"] == 1

    # Second call should hit cache, not network
    p2 = client.get_latest_point("GH", "NY.GDP.PCAP.CD")
    assert p2.year == 2024
    assert p2.value == 123.0
    assert calls["n"] == 1

    cache_files = list(Path(tmp_path).glob("*.json"))
    assert cache_files, "Expected at least one cache file"
    cached = json.loads(cache_files[0].read_text(encoding="utf-8"))
    assert cached["year"] == 2024

