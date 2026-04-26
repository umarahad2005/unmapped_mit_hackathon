"""
agent/subagents/graph_agent.py
─────────────────────────────────────────────────────────────────────────────
UNMAPPED — Subagent: Skill Adjacency Graph.

Owns the graph domain. Builds the NetworkX skill graph at boot from seeded
taxonomy data. Provides adjacency queries used by Mirror, Verification,
Risk, and Matching agents. Reloads when config is swapped.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
from pathlib import Path

from core.config_loader import SystemConfig

logger = logging.getLogger("unmapped.graph_agent")

# ── Skill Graph (wraps NetworkX) ─────────────────────────────────────────────

class SkillGraph:
    """In-memory skill adjacency graph."""

    def __init__(self):
        try:
            import networkx as nx
            self._G = nx.Graph()
            self._nx = nx
        except ImportError:
            logger.warning("NetworkX not installed — using dict-based fallback graph")
            self._G = None
            self._nx = None
            self._adj: dict[str, dict[str, float]] = {}

    def add_node(self, skill_id: str, **attrs) -> None:
        if self._nx:
            self._G.add_node(skill_id, **attrs)
        else:
            self._adj.setdefault(skill_id, {})

    def add_edge(self, skill_a: str, skill_b: str, weight: float, source: str) -> None:
        if self._nx:
            self._G.add_edge(skill_a, skill_b, weight=weight, source=source)
        else:
            self._adj.setdefault(skill_a, {})[skill_b] = weight
            self._adj.setdefault(skill_b, {})[skill_a] = weight

    def get_adjacent(
        self,
        skill_id: str,
        depth: int = 1,
        min_weight: float = 0.4,
    ) -> list[str]:
        """Return skill IDs within `depth` hops with weight >= min_weight."""
        if self._nx:
            try:
                subgraph = self._nx.ego_graph(self._G, skill_id, radius=depth)
                return [
                    n for n in subgraph.nodes()
                    if n != skill_id
                    and self._G.get_edge_data(skill_id, n, {}).get("weight", 0) >= min_weight
                ]
            except Exception:
                return []
        else:
            # Fallback: direct neighbors only
            return [
                s for s, w in self._adj.get(skill_id, {}).items()
                if w >= min_weight
            ]

    def get_resilience_pathways(
        self,
        current_skill_ids: list[str],
        risk_scores: dict[str, float],
        top_n: int = 5,
    ) -> list[dict]:
        """Return adjacent skills ordered by resilience value."""
        from agent.agent_config import GRAPH_MAX_DEPTH, GRAPH_MIN_EDGE_WEIGHT

        candidates: set[str] = set()
        for skill_id in current_skill_ids:
            candidates.update(self.get_adjacent(skill_id, depth=GRAPH_MAX_DEPTH))
        candidates -= set(current_skill_ids)

        def resilience_score(s: str) -> float:
            node_attrs = {}
            if self._nx and s in self._G.nodes:
                node_attrs = self._G.nodes[s]
            auto_risk = risk_scores.get(s, 0.5)
            demand    = node_attrs.get("demand_signal", 0.5)
            return (1 - auto_risk) * demand

        ranked = sorted(candidates, key=resilience_score, reverse=True)[:top_n]

        results = []
        for skill_id in ranked:
            node_attrs = {}
            if self._nx and skill_id in self._G.nodes:
                node_attrs = dict(self._G.nodes[skill_id])
            results.append({
                "skill_id":         skill_id,
                "label":            node_attrs.get("label", skill_id),
                "resilience_score": round(resilience_score(skill_id), 3),
                "adjacency_distance": 1,  # simplified for hackathon
            })
        return results

    def prune_adjacencies(self, skill_id: str) -> None:
        """Remove edges from a skill (Mirror Test NO response)."""
        if self._nx and skill_id in self._G:
            edges = list(self._G.edges(skill_id))
            self._G.remove_edges_from(edges)
        elif skill_id in self._adj:
            self._adj[skill_id] = {}

    @property
    def node_count(self) -> int:
        if self._nx:
            return self._G.number_of_nodes()
        return len(self._adj)

    @property
    def edge_count(self) -> int:
        if self._nx:
            return self._G.number_of_edges()
        return sum(len(v) for v in self._adj.values()) // 2


class GraphAgent:
    """
    Subagent: builds and owns the skill adjacency graph.
    Called at orchestrator boot. Shared reference passed to all subagents.
    """

    ESCO_SKILLS_PATH     = Path("data/esco/skills.json")
    ESCO_ADJACENCY_PATH  = Path("data/esco/adjacencies.json")

    def __init__(self, config: SystemConfig):
        self.config = config
        self._graph: SkillGraph | None = None

    async def build(self) -> SkillGraph:
        """Build the skill graph from taxonomy data. Returns in-memory graph."""
        import time
        start = time.monotonic()

        graph = SkillGraph()

        # Load skills (nodes)
        if self.ESCO_SKILLS_PATH.exists():
            with open(self.ESCO_SKILLS_PATH, encoding="utf-8") as f:
                skill_data = json.load(f)
            for skill in skill_data.get("skills", []):
                graph.add_node(
                    skill["id"],
                    label=skill.get("label", skill["id"]),
                    type=skill.get("type", "unknown"),
                    automation_risk=skill.get("automation_risk_base"),
                    taxonomy=self.config.taxonomy.primary,
                    demand_signal=0.5,   # Default; updated by matching agent
                )
        else:
            logger.warning(
                f"ESCO skills not found at {self.ESCO_SKILLS_PATH}. "
                "Run: python scripts/seed_data.py"
            )

        # Load adjacencies (edges)
        if self.ESCO_ADJACENCY_PATH.exists():
            with open(self.ESCO_ADJACENCY_PATH, encoding="utf-8") as f:
                adj_data = json.load(f)
            for edge in adj_data.get("adjacencies", []):
                graph.add_edge(
                    edge["skill_a"],
                    edge["skill_b"],
                    weight=edge["relatedness_score"],
                    source=edge["source"],
                )
        else:
            logger.warning("ESCO adjacencies not found — graph will have no edges")

        elapsed = time.monotonic() - start
        self._graph = graph
        logger.info(
            f"Skill graph built in {elapsed:.2f}s: "
            f"{graph.node_count} nodes, {graph.edge_count} edges"
        )
        return graph

    async def on_config_swap(self, new_config: SystemConfig) -> None:
        """Reload graph when config is swapped (registered with ConfigWatcher)."""
        self.config = new_config
        logger.info(f"GraphAgent: reloading for config {new_config.meta.config_id}")
        await self.build()

    def get_graph(self) -> SkillGraph:
        if self._graph is None:
            raise RuntimeError("Graph not built. Call build() first.")
        return self._graph
