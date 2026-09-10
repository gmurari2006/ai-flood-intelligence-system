"""
Safe Evacuation Graph Routing Engine.

Implements pure-Python Dijkstra pathfinding on road network graphs with dynamic flood avoidance.
Matches Document 02 Section 5.1 & Document 05 Section 8.1 (FR-08).
"""

import math
import heapq
from typing import Dict, List, Optional, Tuple, Any
from backend.app.schemas.evacuation import RouteDetails, RoutePathGeoJSON


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two coordinates in kilometers."""
    r = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2 +
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


class RoutingGraph:
    """In-memory road network graph representation for evacuation pathfinding."""

    def __init__(self):
        self.nodes: Dict[str, Tuple[float, float]] = {}  # node_id -> (lat, lon)
        self.edges: Dict[str, List[Dict[str, Any]]] = {}  # u -> [{to: v, distance_km: float, is_flooded: bool}]

    def add_node(self, node_id: str, latitude: float, longitude: float):
        """Adds a road junction/waypoint node."""
        self.nodes[node_id] = (latitude, longitude)
        if node_id not in self.edges:
            self.edges[node_id] = []

    def add_edge(
        self,
        u: str,
        v: str,
        distance_km: Optional[float] = None,
        is_flooded: bool = False,
        bidirectional: bool = True
    ):
        """Adds a road segment edge between nodes."""
        if u not in self.nodes or v not in self.nodes:
            raise ValueError(f"Nodes {u} and {v} must be added before adding edge.")

        if distance_km is None:
            lat1, lon1 = self.nodes[u]
            lat2, lon2 = self.nodes[v]
            distance_km = haversine_distance_km(lat1, lon1, lat2, lon2)

        self.edges[u].append({"to": v, "distance_km": distance_km, "is_flooded": is_flooded})
        if bidirectional:
            self.edges[v].append({"to": u, "distance_km": distance_km, "is_flooded": is_flooded})

    def find_nearest_node(self, lat: float, lon: float) -> Optional[str]:
        """Finds nearest road junction node in graph to given coordinate."""
        if not self.nodes:
            return None

        best_node = None
        min_dist = float("inf")
        for node_id, (n_lat, n_lon) in self.nodes.items():
            dist = haversine_distance_km(lat, lon, n_lat, n_lon)
            if dist < min_dist:
                min_dist = dist
                best_node = node_id
        return best_node

    def find_shortest_path(
        self,
        start_node: str,
        end_node: str,
        avoid_flood: bool = True
    ) -> Optional[Tuple[List[str], float, str]]:
        """Dijkstra shortest path algorithm avoiding submerged/flooded edges.
        
        Returns: (path_node_ids, total_distance_km, route_status)
        """
        if start_node not in self.nodes or end_node not in self.nodes:
            return None

        if start_node == end_node:
            return [start_node], 0.0, "SAFE_DRY_PATH"

        distances = {node: float("inf") for node in self.nodes}
        distances[start_node] = 0.0
        previous = {node: None for node in self.nodes}
        pq = [(0.0, start_node)]

        while pq:
            current_dist, u = heapq.heappop(pq)

            if current_dist > distances[u]:
                continue

            if u == end_node:
                break

            for edge in self.edges.get(u, []):
                v = edge["to"]
                is_flooded = edge.get("is_flooded", False)

                if avoid_flood and is_flooded:
                    # Penalize flooded edge heavily so Dijkstra selects dry alternatives
                    edge_weight = edge["distance_km"] * 100.0
                else:
                    edge_weight = edge["distance_km"]

                new_dist = current_dist + edge_weight
                if new_dist < distances[v]:
                    distances[v] = new_dist
                    previous[v] = u
                    heapq.heappush(pq, (new_dist, v))

        if distances[end_node] == float("inf"):
            return None

        # Reconstruct path
        path = []
        curr = end_node
        while curr is not None:
            path.append(curr)
            curr = previous[curr]
        path.reverse()

        # Calculate actual physical distance and check if path traversed any flooded edge
        actual_distance = 0.0
        has_traversed_caution_edge = False

        for i in range(len(path) - 1):
            u_id, v_id = path[i], path[i + 1]
            lat1, lon1 = self.nodes[u_id]
            lat2, lon2 = self.nodes[v_id]
            actual_distance += haversine_distance_km(lat1, lon1, lat2, lon2)

            for edge in self.edges.get(u_id, []):
                if edge["to"] == v_id and edge.get("is_flooded", False):
                    has_traversed_caution_edge = True
                    break

        route_status = "CAUTION_EDGE_FLOOD" if has_traversed_caution_edge else "SAFE_DRY_PATH"
        return path, round(actual_distance, 2), route_status


class GraphRoutingEngine:
    """Executes safe route planning and produces RouteDetails payload."""

    @classmethod
    def compute_route(
        cls,
        graph: RoutingGraph,
        origin_lat: float,
        origin_lon: float,
        dest_lat: float,
        dest_lon: float,
        avoid_flood_zones: bool = True
    ) -> Optional[RouteDetails]:
        """Plans safe evacuation path on graph and constructs RouteDetails."""
        start_node = graph.find_nearest_node(origin_lat, origin_lon)
        end_node = graph.find_nearest_node(dest_lat, dest_lon)

        if not start_node or not end_node:
            return None

        path_result = graph.find_shortest_path(start_node, end_node, avoid_flood=avoid_flood_zones)
        if not path_result:
            return None

        path_nodes, distance_km, route_status = path_result

        # Build coordinate list [ [lon, lat], ... ]
        coordinates: List[List[float]] = []
        # Include origin point
        coordinates.append([round(origin_lon, 5), round(origin_lat, 5)])

        for node_id in path_nodes:
            n_lat, n_lon = graph.nodes[node_id]
            coordinates.append([round(n_lon, 5), round(n_lat, 5)])

        # Include destination point
        coordinates.append([round(dest_lon, 5), round(dest_lat, 5)])

        # Calculate estimated time in minutes (assumed average evacuation speed: 25 km/h urban disaster transit)
        avg_speed_kmh = 25.0
        est_minutes = max(1, int(math.ceil((distance_km / avg_speed_kmh) * 60.0)))

        return RouteDetails(
            distance_km=distance_km,
            estimated_time_minutes=est_minutes,
            route_status=route_status,
            path_geojson=RoutePathGeoJSON(
                type="LineString",
                coordinates=coordinates
            )
        )
