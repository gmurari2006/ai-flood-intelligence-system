"""
Geographic Zones API Endpoint Handlers.

Implements GET /api/v1/zones matching Document 05 Section 3.1 (FR-02, FR-05).
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.zones import ZoneListResponse
from app.services.zone_service import ZoneService

router = APIRouter()


@router.get(
    "/zones",
    response_model=ZoneListResponse,
    summary="Get All Monitored Zones",
    description="Returns all active monitored hydrological zones and spatial centroids."
)
async def get_zones(
    db: AsyncSession = Depends(get_db)
) -> ZoneListResponse:
    """Retrieve all geographic zones."""
    return await ZoneService.get_all_zones(db)
