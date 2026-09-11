"""
Evacuation Centers & Safe Route Planning Endpoints.

Implements GET /api/v1/evacuation/shelters and POST /api/v1/evacuation/plan-route
matching Document 05 Section 8.1 & 8.2 (FR-08, FR-10).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.evacuation import (
    EvacuationShelterListResponse,
    EvacuationRoutePlanRequest,
    EvacuationRoutePlanResponse,
)
from app.services.evacuation_service import EvacuationService

router = APIRouter()


@router.get(
    "/evacuation/shelters",
    response_model=EvacuationShelterListResponse,
    summary="Get All Evacuation Shelters",
    description="Returns all registered evacuation shelters, occupancy status, available capacity, and calculated distances via PostGIS geography."
)
async def get_evacuation_shelters(
    zone_id: Optional[str] = Query(None, description="Optional geographic zone filter"),
    is_active: Optional[bool] = Query(True, description="Filter by operational status"),
    latitude: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Origin latitude for distance calculation"),
    longitude: Optional[float] = Query(None, ge=-180.0, le=180.0, description="Origin longitude for distance calculation"),
    max_distance_meters: Optional[float] = Query(None, gt=0, description="Optional maximum search radius in meters"),
    db: AsyncSession = Depends(get_db)
) -> EvacuationShelterListResponse:
    """Retrieve evacuation shelter hubs."""
    return await EvacuationService.get_shelters(
        db=db,
        zone_id=zone_id,
        is_active=is_active,
        origin_lat=latitude,
        origin_lon=longitude,
        max_distance_meters=max_distance_meters
    )


@router.post(
    "/evacuation/plan-route",
    response_model=EvacuationRoutePlanResponse,
    summary="Plan Evacuation Route to Shelter",
    description="Computes safe dry pathway to nearest available shelter using graph pathfinding with flood exclusion."
)
async def plan_evacuation_route(
    req: EvacuationRoutePlanRequest,
    db: AsyncSession = Depends(get_db)
) -> EvacuationRoutePlanResponse:
    """Plan safe evacuation route."""
    return await EvacuationService.plan_evacuation_route(
        db=db,
        origin_lat=req.origin_latitude,
        origin_lon=req.origin_longitude,
        destination_shelter_id=req.destination_shelter_id,
        avoid_flood_zones=req.avoid_flood_zones
    )
