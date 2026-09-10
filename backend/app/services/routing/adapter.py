"""
Routing Provider Adapter Abstraction.

Distinguishes between configured graph providers and unconfigured environments.
Matches Document 02 Section 5.1 & Hard Governance Rules.
"""

from abc import ABC, abstractmethod
from typing import Optional
from backend.app.schemas.evacuation import RouteDetails
from backend.app.services.routing.engine import RoutingGraph, GraphRoutingEngine


class BaseRoutingProvider(ABC):
    """Abstract routing provider interface."""

    @property
    @abstractmethod
    def is_available(self) -> bool:
        """Indicates whether real road network graph / provider is available."""
        pass

    @abstractmethod
    def plan_route(
        self,
        origin_lat: float,
        origin_lon: float,
        dest_lat: float,
        dest_lon: float,
        avoid_flood_zones: bool = True
    ) -> Optional[RouteDetails]:
        """Plans safe evacuation path on available road network."""
        pass


class NullRoutingProvider(BaseRoutingProvider):
    """Default unconfigured provider.
    
    Refuses to fabricate routes when no real road network is loaded.
    """

    @property
    def is_available(self) -> bool:
        return False

    def plan_route(
        self,
        origin_lat: float,
        origin_lon: float,
        dest_lat: float,
        dest_lon: float,
        avoid_flood_zones: bool = True
    ) -> Optional[RouteDetails]:
        return None


class GraphRoutingProvider(BaseRoutingProvider):
    """Provider operating on an explicit in-memory road network graph."""

    def __init__(self, graph: RoutingGraph):
        self.graph = graph

    @property
    def is_available(self) -> bool:
        return bool(self.graph and self.graph.nodes)

    def plan_route(
        self,
        origin_lat: float,
        origin_lon: float,
        dest_lat: float,
        dest_lon: float,
        avoid_flood_zones: bool = True
    ) -> Optional[RouteDetails]:
        if not self.is_available:
            return None
        return GraphRoutingEngine.compute_route(
            graph=self.graph,
            origin_lat=origin_lat,
            origin_lon=origin_lon,
            dest_lat=dest_lat,
            dest_lon=dest_lon,
            avoid_flood_zones=avoid_flood_zones
        )
