"""
Infrastructure Vulnerability & Flood Impact Analysis Service.

Evaluates critical municipal and utility assets against predicted inundation depths.
Matches Document 05 Section 7.1 (FR-07, AI-09).
"""

from typing import Optional
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.domain import (
    InfrastructureAsset,
    InfrastructureRisk,
    GeographicZone,
    PredictionRun,
    FloodPrediction,
    RiskScore,
)
from backend.app.schemas.infrastructure import (
    InfrastructureAssetResponse,
    VulnerableInfrastructureListResponse,
)
from backend.app.schemas.zones import CentroidSchema


class InfrastructureService:
    """Service for querying critical infrastructure vulnerability and flood protection guidance."""

    PROTECTION_GUIDANCE_MAP = {
        "HOSPITAL": "Deploy mobile sandbag barrier around basement generators. Prepare patient evacuation triage.",
        "POWER_STATION": "Elevate sensitive switchgear and activate perimeter sump pumps.",
        "SCHOOL": "Prepare emergency shelter conversion and clear ground-floor classrooms.",
        "WATER_TREATMENT": "Seal intake valves and monitor contamination backflow.",
        "TELECOM": "Switch to elevated backup battery arrays and verify emergency antenna relays.",
    }

    DEFAULT_GUIDANCE = "Deploy localized flood barriers and secure ground-level utility connections."

    @classmethod
    async def get_vulnerable_assets(
        cls,
        db: AsyncSession,
        zone_id: Optional[str] = None,
        min_risk_level: Optional[str] = None
    ) -> VulnerableInfrastructureListResponse:
        """Queries impacted infrastructure assets across zones with deterministic vulnerability assessment."""
        stmt = select(
            InfrastructureAsset,
            func.ST_Y(InfrastructureAsset.location).label("lat"),
            func.ST_X(InfrastructureAsset.location).label("lon")
        )

        if zone_id:
            stmt = stmt.where(InfrastructureAsset.zone_id == zone_id)

        res = await db.execute(stmt)
        asset_rows = res.all()

        asset_responses = []

        for asset, lat, lon in asset_rows:
            # Check latest stored infrastructure_risk
            risk_stmt = (
                select(InfrastructureRisk)
                .where(InfrastructureRisk.asset_id == asset.id)
                .order_by(desc(InfrastructureRisk.id))
                .limit(1)
            )
            risk_res = await db.execute(risk_stmt)
            risk_record = risk_res.scalar_one_or_none()

            if risk_record:
                status = risk_record.vulnerability_status
                water_depth = float(risk_record.estimated_water_depth_m)
                protection = risk_record.recommended_protection or cls.PROTECTION_GUIDANCE_MAP.get(
                    asset.asset_type.upper(), cls.DEFAULT_GUIDANCE
                )
            else:
                # Deterministically evaluate against latest zone prediction
                pred_stmt = (
                    select(PredictionRun, FloodPrediction, RiskScore)
                    .outerjoin(FloodPrediction, FloodPrediction.prediction_run_id == PredictionRun.id)
                    .outerjoin(RiskScore, RiskScore.prediction_run_id == PredictionRun.id)
                    .where(PredictionRun.zone_id == asset.zone_id)
                    .order_by(desc(PredictionRun.run_timestamp))
                    .limit(1)
                )
                pred_res = await db.execute(pred_stmt)
                pred_row = pred_res.first()

                if pred_row and pred_row[1] and pred_row[2]:
                    _, flood_pred, risk_score = pred_row
                    pred_depth = float(flood_pred.predicted_depth_m)
                    pred_prob = float(flood_pred.flood_probability)
                    zone_risk_level = risk_score.risk_level.upper()

                    if pred_depth > 0.3 or pred_prob > 0.6 or zone_risk_level in ["HIGH", "CRITICAL"]:
                        status = "AT_RISK" if zone_risk_level == "HIGH" else "CRITICAL"
                        water_depth = pred_depth
                        protection = cls.PROTECTION_GUIDANCE_MAP.get(
                            asset.asset_type.upper(), cls.DEFAULT_GUIDANCE
                        )
                    else:
                        status = "SAFE"
                        water_depth = 0.0
                        protection = "No immediate protective action required under baseline hydrological conditions."
                else:
                    status = "SAFE"
                    water_depth = 0.0
                    protection = "No active flood prediction on record for asset zone."

            if min_risk_level:
                level_order = {"SAFE": 0, "AT_RISK": 1, "CRITICAL": 2}
                target_level = level_order.get(min_risk_level.upper(), 0)
                current_level = level_order.get(status.upper(), 0)
                if current_level < target_level:
                    continue

            asset_responses.append(
                InfrastructureAssetResponse(
                    asset_id=asset.id,
                    name=asset.name,
                    asset_type=asset.asset_type,
                    zone_id=asset.zone_id,
                    elevation_m=float(asset.elevation_m),
                    capacity=asset.capacity,
                    location=CentroidSchema(
                        latitude=float(lat) if lat is not None else 19.0760,
                        longitude=float(lon) if lon is not None else 72.8777
                    ),
                    vulnerability_status=status,
                    estimated_water_depth_m=water_depth,
                    recommended_protection=protection
                )
            )

        return VulnerableInfrastructureListResponse(
            total_affected_assets=len(asset_responses),
            assets=asset_responses
        )
