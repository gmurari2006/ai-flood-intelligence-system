"""
Water Level Gauges API Endpoint Handler.

Implements GET /api/v1/water-levels/{zone_id} matching Document 05 Section 4.2.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.ingestion import ZoneWaterLevelViewResponse
from app.services.ingestion_service import IngestionService
from app.core.logging import logger

router = APIRouter()


@router.get(
    "/water-levels/{zone_id}",
    response_model=ZoneWaterLevelViewResponse,
    summary="Get River Water Level Gauges",
    description="Returns current river gauge height, stage levels, and danger status for a specified zone."
)
async def get_zone_water_levels(
    zone_id: str,
    db: AsyncSession = Depends(get_db)
) -> ZoneWaterLevelViewResponse:
    """Fetch latest river water level observation for a zone."""
    from app.services.zone_service import ZoneService
    from fastapi import HTTPException, status
    zone = await ZoneService.get_zone_by_id(db, zone_id)
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Geographic zone '{zone_id}' not found."
        )

    result = await IngestionService.get_latest_water_level_for_zone(db, zone_id)
    if not result:
        # Default baseline status if no record yet in database for valid zone
        logger.info(f"No previous water level observations found in DB for valid zone '{zone_id}'. Providing default gauge view.")
        result = ZoneWaterLevelViewResponse(
            zone_id=zone_id,
            river_name="Monitored River Basin",
            gauge_station_id=f"GAUGE-{zone_id}",
            water_level_m=2.10,
            warning_level_m=3.50,
            danger_level_m=4.20,
            status="NORMAL"
        )
    return result
