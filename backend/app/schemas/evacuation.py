"""
Evacuation Centers & Safe Route Planning Schemas.

Matches Document 05 Section 8.1 & 8.2 (FR-08, FR-10).
"""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.zones import CentroidSchema


class EvacuationShelterSummary(BaseModel):
    """Evacuation shelter center details with capacity and spatial coordinates."""
    id: str = Field(..., description="Unique shelter identifier")
    name: str = Field(..., description="Shelter hub name")
    address: str = Field(..., description="Physical address of shelter")
    max_capacity: int = Field(..., description="Total designated shelter capacity")
    current_occupancy: int = Field(0, description="Current registered evacuee occupancy")
    available_capacity: int = Field(..., description="Remaining available capacity")
    has_backup_power: bool = Field(True, description="Backup generator power availability flag")
    location: CentroidSchema = Field(..., description="Spatial coordinates (latitude, longitude)")
    is_active: bool = Field(True, description="Operational status flag")
    distance_meters: Optional[float] = Field(None, description="Calculated distance in meters from origin")


class EvacuationShelterListResponse(BaseModel):
    """List response payload for evacuation shelters."""
    total_shelters: int = Field(..., description="Total count of shelters matching criteria")
    shelters: List[EvacuationShelterSummary] = Field(default_factory=list, description="Array of shelter records")


class EvacuationRoutePlanRequest(BaseModel):
    """Request payload for planning safe evacuation route."""
    origin_latitude: float = Field(..., ge=-90.0, le=90.0, description="Origin latitude (-90 to 90)")
    origin_longitude: float = Field(..., ge=-180.0, le=180.0, description="Origin longitude (-180 to 180)")
    destination_shelter_id: Optional[str] = Field(None, description="Optional target shelter ID. If omitted, nearest available shelter is selected.")
    avoid_flood_zones: bool = Field(True, description="Whether to route around high-risk flooded polygons")


class RoutePathGeoJSON(BaseModel):
    """GeoJSON LineString representation of route pathway."""
    type: Literal["LineString"] = "LineString"
    coordinates: List[List[float]] = Field(..., description="Array of [longitude, latitude] coordinate pairs")


class RouteDetails(BaseModel):
    """Calculated path details and safety classification."""
    distance_km: float = Field(..., description="Total route distance in kilometers")
    estimated_time_minutes: int = Field(..., description="Estimated travel time in minutes")
    route_status: str = Field(..., description="Route classification: SAFE_DRY_PATH, CAUTION_EDGE_FLOOD, etc.")
    path_geojson: RoutePathGeoJSON = Field(..., description="LineString GeoJSON of route")


class EvacuationRoutePlanResponse(BaseModel):
    """Evacuation routing response payload."""
    recommended_shelter: Optional[Dict[str, Any]] = Field(None, description="Recommended evacuation shelter destination")
    route: Optional[RouteDetails] = Field(None, description="Calculated route pathway when routing provider is available")
    routing_status: str = Field(..., description="Status: 'AVAILABLE' or 'ROUTING_UNAVAILABLE'")
    message: Optional[str] = Field(None, description="Operational status explanation or external provider notice")
