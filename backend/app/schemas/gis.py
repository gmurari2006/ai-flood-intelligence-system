"""
GIS & Spatial Risk Map GeoJSON Schemas.

Matches Document 05 Section 6.1 (FR-05, FR-06).
"""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class GeoJSONGeometry(BaseModel):
    """GeoJSON geometry object."""
    type: str = Field(..., description="Geometry type (e.g. Polygon, Point, LineString)")
    coordinates: Any = Field(..., description="Coordinates array matching GeoJSON specification")


class GeoJSONFeature(BaseModel):
    """GeoJSON Feature object."""
    type: Literal["Feature"] = "Feature"
    geometry: GeoJSONGeometry
    properties: Dict[str, Any] = Field(default_factory=dict, description="Feature attributes and properties")


class GeoJSONFeatureCollection(BaseModel):
    """GeoJSON FeatureCollection root payload."""
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: List[GeoJSONFeature] = Field(default_factory=list, description="List of spatial features")
