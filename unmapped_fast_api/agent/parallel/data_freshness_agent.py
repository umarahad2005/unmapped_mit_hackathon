"""
agent/parallel/data_freshness_agent.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Parallel Agent: Data Freshness Monitor.

Runs at system boot (fire-and-forget). Validates every dataset in
data/freshness.json against its staleness threshold. Emits structured
warnings that the UI can consume to display badges.

This agent never blocks the main pipeline. It writes to a shared
freshness_status.json that the UI polling layer reads.
─────────────────────────────────────────────────────────────────────────────
"""

import asyncio
import json
import logging
from datetime import datetime, date
from pathlib import Path
from typing import Literal

logger = logging.getLogger("unmapped.freshness_agent")

# ── Status Types ─────────────────────────────────────────────────────────────

FreshnessStatus = Literal["CURRENT", "WARNING", "STALE", "UNKNOWN"]

class DatasetFreshnessResult:
    def __init__(
        self,
        dataset_id:    str,
        display_name:  str,
        source:        str,
        vintage_year:  int,
        status:        FreshnessStatus,
        age_years:     float,
        threshold:     int,
        country_code:  str,
        warning_message: str | None = None,
    ):
        self.dataset_id       = dataset_id
        self.display_name     = display_name
        self.source           = source
        self.vintage_year     = vintage_year
        self.status           = status
        self.age_years        = age_years
        self.threshold        = threshold
        self.country_code     = country_code
        self.warning_message  = warning_message

    def to_dict(self) -> dict:
        return {
            "dataset_id":      self.dataset_id,
            "display_name":    self.display_name,
            "source":          self.source,
            "vintage_year":    self.vintage_year,
            "status":          self.status,
            "age_years":       round(self.age_years, 1),
            "threshold_years": self.threshold,
            "country_code":    self.country_code,
            "warning_message": self.warning_message,
        }


class DataFreshnessAgent:
    """
    Parallel agent that validates dataset staleness on boot.
    Writes results to data/freshness_status.json for UI consumption.
    """

    def __init__(
        self,
        freshness_path: str | Path = "data/freshness.json",
        output_path:    str | Path = "data/freshness_status.json",
    ):
        self.freshness_path = Path(freshness_path)
        self.output_path    = Path(output_path)
        self.current_year   = datetime.now().year

    async def run(self) -> list[DatasetFreshnessResult]:
        """
        Main entry point. Called by orchestrator as a background task.
        Returns list of results and writes to output_path.
        """
        logger.info("DataFreshnessAgent starting validation...")

        if not self.freshness_path.exists():
            logger.error(f"freshness.json not found at {self.freshness_path}")
            return []

        with open(self.freshness_path, encoding="utf-8") as f:
            freshness_data = json.load(f)

        results = []
        stale_count   = 0
        warning_count = 0

        for dataset in freshness_data.get("datasets", []):
            result = self._evaluate_dataset(dataset)
            results.append(result)

            if result.status == "STALE":
                stale_count += 1
                logger.warning(
                    f"STALE dataset: {result.display_name} "
                    f"(vintage {result.vintage_year}, "
                    f"age {result.age_years:.1f}y > threshold {result.threshold}y)"
                )
            elif result.status == "WARNING":
                warning_count += 1
                logger.info(
                    f"WARNING dataset: {result.display_name} "
                    f"(vintage {result.vintage_year}, age {result.age_years:.1f}y)"
                )

        # Write status for UI consumption
        await self._write_status(results)

        logger.info(
            f"DataFreshnessAgent complete: "
            f"{len(results)} datasets checked, "
            f"{stale_count} STALE, {warning_count} WARNING"
        )

        return results

    def _evaluate_dataset(self, dataset: dict) -> DatasetFreshnessResult:
        """Evaluate a single dataset's freshness."""
        dataset_id   = dataset["id"]
        vintage_year = dataset["vintage_year"]
        threshold    = dataset.get("staleness_threshold_years", 3)
        age_years    = self.current_year - vintage_year

        if age_years > threshold + 2:
            status = "STALE"
            warning_message = (
                f"This data is {age_years} years old — significantly beyond "
                f"the {threshold}-year threshold. Use with strong caution."
            )
        elif age_years > threshold:
            status = "WARNING"
            warning_message = (
                f"This data is {age_years} years old "
                f"(threshold: {threshold} years). May not reflect current conditions."
            )
        else:
            status = "CURRENT"
            warning_message = None

        return DatasetFreshnessResult(
            dataset_id    = dataset_id,
            display_name  = dataset.get("display_name", dataset_id),
            source        = dataset.get("source", "Unknown"),
            vintage_year  = vintage_year,
            status        = status,
            age_years     = age_years,
            threshold     = threshold,
            country_code  = dataset.get("country_code", "GLOBAL"),
            warning_message = warning_message,
        )

    async def _write_status(self, results: list[DatasetFreshnessResult]) -> None:
        """Write freshness status JSON for UI layer to consume."""
        summary = {
            "checked_at": datetime.utcnow().isoformat() + "Z",
            "total":      len(results),
            "current":    sum(1 for r in results if r.status == "CURRENT"),
            "warning":    sum(1 for r in results if r.status == "WARNING"),
            "stale":      sum(1 for r in results if r.status == "STALE"),
            "datasets":   [r.to_dict() for r in results],
        }

        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.output_path, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)

    def get_status_for_country(
        self,
        results: list[DatasetFreshnessResult],
        country_code: str,
    ) -> list[dict]:
        """Filter freshness results for a specific country (for UI display)."""
        return [
            r.to_dict() for r in results
            if r.country_code in (country_code, "GLOBAL")
        ]


# ── Standalone run ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    import asyncio
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    agent = DataFreshnessAgent()
    results = asyncio.run(agent.run())
    print(f"\nValidated {len(results)} datasets.")
    stale = [r for r in results if r.status in ("STALE", "WARNING")]
    if stale:
        print("\nDatasets requiring attention:")
        for r in stale:
            print(f"  [{r.status}] {r.display_name} (vintage {r.vintage_year})")
