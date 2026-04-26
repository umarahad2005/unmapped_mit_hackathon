"""
core/econ/wdi_client.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — World Bank WDI data client with local cache.

Used to satisfy the hackathon requirement: surface ≥2 real econometric signals
in plain language, and keep the demo resilient under low bandwidth.
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from pathlib import Path

import httpx

logger = logging.getLogger("unmapped.wdi_client")


DEFAULT_CACHE_DIR = Path("data/cache/wdi")


@dataclass(frozen=True)
class WdiPoint:
    indicator: str
    country: str
    year: int
    value: float
    source: str = "World Bank WDI"


class WdiClient:
    """
    Minimal WDI client:
    - Fetches latest non-null value for (country, indicator)
    - Caches responses on disk to support low-bandwidth demos
    """

    BASE_URL = "https://api.worldbank.org/v2"

    def __init__(
        self,
        cache_dir: Path = DEFAULT_CACHE_DIR,
        timeout_s: float = 6.0,
        cache_ttl_seconds: int = 60 * 60 * 24 * 7,  # 7 days
    ):
        self.cache_dir = Path(cache_dir)
        self.timeout_s = timeout_s
        self.cache_ttl_seconds = cache_ttl_seconds
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def get_latest_point(self, country_iso2: str, indicator: str) -> WdiPoint:
        """
        Returns latest non-null value.
        Raises RuntimeError if no value can be fetched or found in cache.
        """
        country = country_iso2.upper()
        cache_path = self._cache_path(country, indicator)

        cached = self._load_cache_if_fresh(cache_path)
        if cached is not None:
            return cached

        try:
            point = self._fetch_latest_point(country, indicator)
            self._save_cache(cache_path, point)
            return point
        except Exception as e:
            logger.warning(f"WDI fetch failed ({country}, {indicator}): {e}")
            cached_any = self._load_cache(cache_path)
            if cached_any is not None:
                return cached_any
            raise RuntimeError(f"WDI data unavailable for {country}:{indicator}") from e

    def _fetch_latest_point(self, country: str, indicator: str) -> WdiPoint:
        url = f"{self.BASE_URL}/country/{country}/indicator/{indicator}"
        params = {
            "format": "json",
            "per_page": 60,  # enough to find latest non-null values
        }
        with httpx.Client(timeout=self.timeout_s) as client:
            resp = client.get(url, params=params, headers={"User-Agent": "UNMAPPED/1.0"})
            resp.raise_for_status()
            payload = resp.json()

        # WDI returns: [meta, [ {date, value, indicator, country, ...}, ... ]]
        if not isinstance(payload, list) or len(payload) < 2 or not isinstance(payload[1], list):
            raise RuntimeError("Unexpected WDI response shape")

        rows = payload[1]
        for row in rows:
            try:
                value = row.get("value")
                year = int(row.get("date"))
                if value is None:
                    continue
                return WdiPoint(indicator=indicator, country=country, year=year, value=float(value))
            except Exception:
                continue

        raise RuntimeError("No non-null datapoint found in WDI response")

    def _cache_path(self, country: str, indicator: str) -> Path:
        safe = indicator.replace("/", "_").replace(":", "_")
        return self.cache_dir / f"{country}_{safe}.json"

    def _save_cache(self, path: Path, point: WdiPoint) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "saved_at": time.time(),
                    "indicator": point.indicator,
                    "country": point.country,
                    "year": point.year,
                    "value": point.value,
                    "source": point.source,
                },
                f,
                indent=2,
            )

    def _load_cache_if_fresh(self, path: Path) -> WdiPoint | None:
        data = self._load_cache(path)
        if data is None:
            return None
        saved_at = float(data.get("saved_at", 0))
        if time.time() - saved_at > self.cache_ttl_seconds:
            return None
        return self._point_from_cache(data)

    def _load_cache(self, path: Path) -> dict | None:
        if not path.exists():
            return None
        try:
            with open(path, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    def _point_from_cache(self, data: dict) -> WdiPoint | None:
        try:
            return WdiPoint(
                indicator=str(data["indicator"]),
                country=str(data["country"]),
                year=int(data["year"]),
                value=float(data["value"]),
                source=str(data.get("source", "World Bank WDI")),
            )
        except Exception:
            return None

