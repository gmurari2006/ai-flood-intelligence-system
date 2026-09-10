"""
GIS & Spatial Risk Map Vector Layers Endpoint.

Implements GET /api/v1/risk-map/layers matching Document 05 Section 6.1 (FR-05, FR-06).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_db
from backend.app.schemas.gis import GeoJSONFeatureCollection
from backend.app.services.gis_service import GISService

router = APIRouter()


@router.get(
    "/risk-map/layers",
    response_model=GeoJSONFeatureCollection,
    summary="Get GIS Map GeoJSON Vector Layers",
    description="Returns PostGIS vector geometry layers (risk_zones, infrastructure, river_lines, rainfall_heatmap) in SRID 4326."
)
async def get_risk_map_layers(
    layer_type: Optional[str] = Query(None, description="Layer filter: risk_zones, infrastructure, river_lines, rainfall_heatmap"),
    db: AsyncSession = Depends(get_db)
) -> GeoJSONFeatureCollection:
    """Retrieve GeoJSON vector layers."""
    return await GISService.get_map_layers(db, layer_type=layer_type)
