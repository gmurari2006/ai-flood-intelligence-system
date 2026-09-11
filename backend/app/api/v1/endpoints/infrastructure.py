"""
Infrastructure Vulnerability & Impact Endpoint.

Implements GET /api/v1/infrastructure/vulnerable matching Document 05 Section 7.1 (FR-07, AI-09).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.domain import User
from app.schemas.infrastructure import VulnerableInfrastructureListResponse
from app.services.infrastructure_service import InfrastructureService

router = APIRouter()


@router.get(
    "/infrastructure/vulnerable",
    response_model=VulnerableInfrastructureListResponse,
    summary="Get Impacted Infrastructure Assets",
    description="Returns critical infrastructure assets (hospitals, power stations, schools) evaluated against flood inundation."
)
async def get_vulnerable_infrastructure(
    zone_id: Optional[str] = Query(None, description="Optional geographic zone filter"),
    min_risk_level: Optional[str] = Query(None, description="Optional minimum vulnerability tier (SAFE, AT_RISK, CRITICAL)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> VulnerableInfrastructureListResponse:
    """Retrieve vulnerable infrastructure assets."""
    return await InfrastructureService.get_vulnerable_assets(
        db, zone_id=zone_id, min_risk_level=min_risk_level
    )
