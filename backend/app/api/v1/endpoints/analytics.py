"""
Historical Analytics & Data Export Endpoints.

Implements GET /api/v1/analytics/historical and GET /api/v1/analytics/export
matching Document 05 Section 11 (FR-11, FR-15).
"""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_db, get_current_user
from backend.app.models.domain import User
from backend.app.schemas.analytics import HistoricalAnalyticsResponse, DataExportResponse
from backend.app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get(
    "/analytics/historical",
    response_model=HistoricalAnalyticsResponse,
    summary="Get Historical Flood Analytics",
    description="Returns recorded historical flood events, peak water depths, rainfall totals, and impact summaries."
)
async def get_historical_flood_analytics(
    zone_id: Optional[str] = Query(None, description="Optional geographic zone filter"),
    start_date: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> HistoricalAnalyticsResponse:
    """Retrieve historical flood events."""
    return await AnalyticsService.get_historical_events(
        db=db,
        zone_id=zone_id,
        start_date=start_date,
        end_date=end_date
    )


@router.get(
    "/analytics/export",
    summary="Export Risk and Alert Data",
    description="Exports predictions, alerts, infrastructure, or historical flood records in JSON or RFC 4180 CSV format."
)
async def export_data(
    format: str = Query("json", description="Export format: 'json' or 'csv'"),
    data_type: str = Query("predictions", description="Target dataset: 'predictions', 'alerts', 'infrastructure', 'zones', 'historical'"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Export operational data records."""
    payload, media_type = await AnalyticsService.export_data(
        db=db,
        data_type=data_type,
        export_format=format
    )

    if media_type == "text/csv":
        return Response(
            content=payload,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=flood_intelligence_{data_type}.csv"
            }
        )

    return payload
