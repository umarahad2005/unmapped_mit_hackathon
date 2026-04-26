"""
agent/parallel/config_watcher_agent.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Parallel Agent: Config Hot-Swap Watcher.

Runs continuously after boot. Listens for config swap signals (from API or
internal queue). On swap trigger, loads the new config, validates it, and
notifies all registered subagents to reload their state.

This is what makes the live Ghana → Bangladesh demo work in <2 seconds
with no page reload and no code change. (Article VI.1 + VI.2)
─────────────────────────────────────────────────────────────────────────────
"""

import asyncio
import logging
import time
from pathlib import Path
from typing import Callable, Awaitable, Any

from core.config_loader import hot_swap_config, SystemConfig

logger = logging.getLogger("unmapped.config_watcher")

# ── Types ─────────────────────────────────────────────────────────────────────

SwapCallback = Callable[[SystemConfig], Awaitable[None]]

# ── Agent ────────────────────────────────────────────────────────────────────

class ConfigWatcherAgent:
    """
    Parallel agent that manages config hot-swaps.

    Subagents register callbacks via register_swap_listener().
    When swap() is called (from API route), all listeners are notified.
    Swap completes in <2 seconds. No restart required.
    """

    def __init__(self, config_dir: str | Path = "config"):
        self.config_dir   = Path(config_dir)
        self._listeners:  list[SwapCallback] = []
        self._swap_queue: asyncio.Queue[str] = asyncio.Queue()
        self._active_config_id: str | None   = None
        self._swap_history: list[dict]        = []

    def register_swap_listener(self, callback: SwapCallback) -> None:
        """
        Register a callback to be invoked on config swap.
        Subagents call this at initialization to reload their state on swap.
        """
        self._listeners.append(callback)
        logger.debug(f"Registered swap listener: {callback.__qualname__}")

    async def request_swap(self, config_id: str) -> dict:
        """
        Public method: request a config swap by config_id.
        Called by the API route POST /api/config/swap.
        Returns swap result.
        """
        await self._swap_queue.put(config_id)
        # Wait for the swap to complete (with timeout)
        start = time.monotonic()
        while time.monotonic() - start < 5.0:
            await asyncio.sleep(0.05)
            if self._active_config_id == config_id:
                elapsed = time.monotonic() - start
                return {
                    "status":     "swapped",
                    "config_id":  config_id,
                    "elapsed_ms": round(elapsed * 1000),
                    "listeners_notified": len(self._listeners),
                }
        return {
            "status":    "timeout",
            "config_id": config_id,
            "message":   "Swap did not complete within 5 seconds",
        }

    async def watch(self) -> None:
        """
        Main watch loop. Runs as a background task.
        Processes swap requests from the queue.
        """
        logger.info("ConfigWatcherAgent started — watching for swap requests")

        while True:
            try:
                config_id = await asyncio.wait_for(
                    self._swap_queue.get(),
                    timeout=1.0
                )
            except asyncio.TimeoutError:
                continue  # No swap pending, keep watching

            await self._execute_swap(config_id)

    async def _execute_swap(self, config_id: str) -> None:
        """Execute a config swap: load, validate, notify all listeners."""
        start = time.monotonic()
        logger.info(f"Executing config swap → {config_id}")

        try:
            new_config = hot_swap_config(config_id, self.config_dir)
        except (FileNotFoundError, ValueError) as e:
            logger.error(f"Config swap FAILED for '{config_id}': {e}")
            return

        # Notify all listeners concurrently
        if self._listeners:
            results = await asyncio.gather(
                *[listener(new_config) for listener in self._listeners],
                return_exceptions=True,
            )
            errors = [r for r in results if isinstance(r, Exception)]
            if errors:
                logger.warning(
                    f"Config swap completed but {len(errors)} listener(s) reported errors: {errors}"
                )

        elapsed = time.monotonic() - start
        self._active_config_id = config_id
        self._swap_history.append({
            "config_id":  config_id,
            "timestamp":  time.time(),
            "elapsed_ms": round(elapsed * 1000),
            "listeners":  len(self._listeners),
        })

        logger.info(
            f"Config swap complete: {config_id} in {elapsed*1000:.0f}ms "
            f"({len(self._listeners)} listeners notified)"
        )

    def get_swap_history(self) -> list[dict]:
        """Return log of all swaps (for debugging / demo)."""
        return self._swap_history

    @property
    def active_config_id(self) -> str | None:
        return self._active_config_id


# ── Global singleton ─────────────────────────────────────────────────────────
# Subagents import this and call register_swap_listener() at init.

_watcher: ConfigWatcherAgent | None = None

def get_watcher() -> ConfigWatcherAgent:
    global _watcher
    if _watcher is None:
        _watcher = ConfigWatcherAgent()
    return _watcher
