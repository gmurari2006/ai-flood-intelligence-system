"""
Environmental Data Ingestion Trigger & Catalog Endpoint Handler.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.session import get_db
from backend.app.schemas.ingestion import DataSourceResponse, IngestionResult
from backend.app.services.ingestion_service import IngestionService
from backend.app.ingestion.clients import OpenMeteoClient, RiverGaugeClient
from backend.app.core.logging import logger

router = APIRouter()


@router.get(
    "/ingestion/sources",
    response_model=list[DataSourceResponse],
    summary="List Registered Data Sources",
    description="Returns list of active environmental data providers registered in the system."
)
async def list_data_sources(
    db: AsyncSession = Depends(get_db)
) -> list[DataSourceResponse]:
    """Returns catalog of data sources."""
    return await IngestionService.get_all_data_sources(db)


@router.post(
    "/ingestion/trigger",
    response_model=IngestionResult,
    summary="Trigger Provider Data Ingestion",
    description="Fetches, validates, and persists environmental observations from external data provider."
)
async def trigger_ingestion(
    zone_id: str = Query("ZONE-NORTH-BASIN", description="Geographic zone ID to ingest data for"),
    provider_id: str = Query("SRC-OPEN-METEO", description="Provider ID (SRC-OPEN-METEO or SRC-RIVER-GAUGE)"),
    db: AsyncSession = Depends(get_db)
) -> IngestionResult:
    """Executes data ingestion from requested external provider for target zone."""
    if provider_id == "SRC-OPEN-METEO":
        provider = OpenMeteoClient()
    elif provider_id == "SRC-RIVER-GAUGE":
        provider = RiverGaugeClient()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown data source provider_id '{provider_id}'"
        )

    result = await IngestionService.ingest_from_provider(db, provider, zone_id)
    return result
