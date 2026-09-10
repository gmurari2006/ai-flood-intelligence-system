"""
Emergency Alerts, Public Warnings & MCDA Prioritization Endpoints.

Implements Document 05 Section 9 & 10 (FR-09, FR-10, FR-14, AI-10).
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_db, get_current_user, require_role
from backend.app.models.domain import User
from backend.app.schemas.alerts import (
    AlertCreateRequest,
    AlertCreateResponse,
    AlertListResponse,
    AlertOverrideRequest,
    AlertOverrideResponse,
    PublicWarningsResponse,
)
from backend.app.schemas.mcda import (
    AlertPrioritizationResponse,
    MCDAWeightsConfig,
)
from backend.app.services.alert_service import AlertService
from backend.app.services.mcda_service import MCDAPrioritizationService

router = APIRouter()


@router.get(
    "/alerts/public",
    response_model=PublicWarningsResponse,
    summary="Get Active Public Warnings (Unauthenticated)",
    description="Returns active regional flood warnings and dynamic safety instructions for public citizen broadcast."
)
async def get_public_warnings(
    db: AsyncSession = Depends(get_db)
) -> PublicWarningsResponse:
    """Retrieve active public warnings (citizen portal view)."""
    return await AlertService.get_public_warnings(db)


@router.post(
    "/alerts",
    response_model=AlertCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Publish Regional Flood Alert",
    description="Publishes an emergency alert for a monitored zone, creating recipient dispatch items and system audit events."
)
async def publish_alert(
    req: AlertCreateRequest,
    current_user: User = Depends(require_role(["DISASTER_OFFICER", "SUPER_ADMIN"])),
    db: AsyncSession = Depends(get_db)
) -> AlertCreateResponse:
    """Publish emergency alert."""
    return await AlertService.create_alert(db, current_user, req)


@router.get(
    "/alerts",
    response_model=AlertListResponse,
    summary="Get All Alerts (Authority View)",
    description="Lists all operational flood alerts with status filtering and automatic lifecycle expiration."
)
async def get_authority_alerts(
    status: Optional[str] = Query(None, description="Filter by status: ACTIVE, DRAFT, EXPIRED, CANCELLED"),
    zone_id: Optional[str] = Query(None, description="Optional geographic zone filter"),
    current_user: User = Depends(require_role(["DISASTER_OFFICER", "SUPER_ADMIN"])),
    db: AsyncSession = Depends(get_db)
) -> AlertListResponse:
    """Retrieve all alerts for disaster management authorities."""
    return await AlertService.get_alerts(db, status_filter=status, zone_id=zone_id)


@router.post(
    "/alerts/override",
    response_model=AlertOverrideResponse,
    summary="Manual Alert / Risk Override",
    description="Applies operational risk severity override by disaster officer with mandatory justification and audit logging."
)
async def override_alert(
    req: AlertOverrideRequest,
    current_user: User = Depends(require_role(["DISASTER_OFFICER", "SUPER_ADMIN"])),
    db: AsyncSession = Depends(get_db)
) -> AlertOverrideResponse:
    """Apply manual officer risk override."""
    return await AlertService.override_alert(db, current_user, req)


@router.get(
    "/alerts/prioritization",
    response_model=AlertPrioritizationResponse,
    summary="AI-10 MCDA Alert Prioritization Queue",
    description="Computes 100% deterministic Multi-Criteria Decision Analysis ranking across monitored zones."
)
async def get_alert_prioritization(
    weight_risk: float = Query(0.50, ge=0.0, le=1.0, description="MCDA weight for flood risk score"),
    weight_pop: float = Query(0.30, ge=0.0, le=1.0, description="MCDA weight for population density"),
    weight_infra: float = Query(0.10, ge=0.0, le=1.0, description="MCDA weight for infrastructure impact"),
    weight_river: float = Query(0.10, ge=0.0, le=1.0, description="MCDA weight for river stage ratio"),
    current_user: User = Depends(require_role(["DISASTER_OFFICER", "SUPER_ADMIN"])),
    db: AsyncSession = Depends(get_db)
) -> AlertPrioritizationResponse:
    """Calculate deterministic MCDA priority ranking queue."""
    config = MCDAWeightsConfig(
        weight_risk_score=weight_risk,
        weight_population_density=weight_pop,
        weight_infrastructure_impact=weight_infra,
        weight_river_stage=weight_river
    )
    return await MCDAPrioritizationService.rank_zones(db, config=config)
