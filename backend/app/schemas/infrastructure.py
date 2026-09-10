"""
Infrastructure Vulnerability & Impact Schemas.

Matches Document 05 Section 7.1 (FR-07, AI-09).
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.zones import CentroidSchema


class InfrastructureAssetResponse(BaseModel):
    """Infrastructure asset with vulnerability status and impact estimation."""
    asset_id: str = Field(..., description="Unique infrastructure asset identifier")
    name: str = Field(..., description="Name of the infrastructure facility")
    asset_type: str = Field(..., description="Category: HOSPITAL, POWER_STATION, SCHOOL, WATER_TREATMENT, etc.")
    zone_id: str = Field(..., description="Geographic zone ID containing the asset")
    elevation_m: float = Field(..., description="Asset elevation in meters above sea level")
    capacity: Optional[int] = Field(None, description="Asset capacity metric (beds, households, students)")
    location: Optional[CentroidSchema] = Field(None, description="Spatial coordinates (latitude, longitude)")
    vulnerability_status: str = Field(..., description="Vulnerability classification: SAFE, AT_RISK, CRITICAL")
    estimated_water_depth_m: float = Field(0.0, description="Estimated flood inundation depth at asset in meters")
    recommended_protection: Optional[str] = Field(None, description="Actionable protective engineering guidance")


class VulnerableInfrastructureListResponse(BaseModel):
    """List response payload for impacted infrastructure assets."""
    total_affected_assets: int = Field(..., description="Total count of assets affected or queried")
    assets: List[InfrastructureAssetResponse] = Field(default_factory=list, description="Array of infrastructure assets")
