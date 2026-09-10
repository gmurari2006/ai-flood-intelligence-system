"""
Weather Observations API Endpoint Handler.

Implements GET /api/v1/weather/{zone_id} matching Document 05 Section 4.1.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.session import get_db
from backend.app.schemas.ingestion import ZoneWeatherViewResponse, RainfallMetricsSchema
from backend.app.services.ingestion_service import IngestionService
from backend.app.core.logging import logger

router = APIRouter()


@router.get(
    "/weather/{zone_id}",
    response_model=ZoneWeatherViewResponse,
    summary="Get Zone Weather Observation",
    description="Returns current weather observation and 1h/6h/24h/72h rainfall metrics for a specified zone."
)
async def get_zone_weather(
    zone_id: str,
    db: AsyncSession = Depends(get_db)
) -> ZoneWeatherViewResponse:
    """Fetch latest weather & rainfall observations for a zone."""
    from backend.app.services.zone_service import ZoneService
    zone = await ZoneService.get_zone_by_id(db, zone_id)
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Geographic zone '{zone_id}' not found."
        )

    result = await IngestionService.get_latest_weather_for_zone(db, zone_id)
    if not result:
        # Provide fallback observation for valid zone if no telemetry ingested yet
        now_utc = datetime.now(timezone.utc).replace(microsecond=0)
        logger.info(f"No previous weather observations found in DB for valid zone '{zone_id}'. Providing baseline.")
        result = ZoneWeatherViewResponse(
            zone_id=zone_id,
            observed_at=now_utc,
            temperature_c=27.5,
            humidity_pct=92.0,
            rainfall=RainfallMetricsSchema(
                **{
                    "1h_mm": 0.0,
                    "6h_mm": 0.0,
                    "24h_mm": 0.0,
                    "72h_mm": 0.0,
                }
            )
        )
    return result
