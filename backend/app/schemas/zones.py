"""
Geographic Zones API Schemas.

Matches Document 05 Section 3.1 specifications.
"""

from typing import Optional
from pydantic import BaseModel, Field


class CentroidSchema(BaseModel):
    """Geographic point coordinates."""
    latitude: float
    longitude: float


class ZoneSummarySchema(BaseModel):
    """Summary representation of a monitored geographic basin/zone."""
    id: str
    name: str
    location_id: str
    elevation_mean_m: float
    drainage_capacity_score: Optional[float] = None
    centroid: CentroidSchema


class ZoneListResponse(BaseModel):
    """List response payload for all monitored zones."""
    total_count: int
    zones: list[ZoneSummarySchema]
