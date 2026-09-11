"""
AI-10 Multi-Criteria Decision Analysis (MCDA) Alert Prioritization Service.

Calculates 100% deterministic alert prioritization queues across monitored hydrological zones.
Matches Document 04 Table 2 (AI-10), Document 03 line 92, and Document 06 (TC-AI-10).
"""

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import (
    GeographicZone,
    PredictionRun,
    RiskScore,
    FloodPrediction,
    InfrastructureAsset,
    WaterLevelObservation,
)
from app.schemas.mcda import (
    MCDAWeightsConfig,
    MCDAFactorBreakdown,
    ZonePriorityRank,
    AlertPrioritizationResponse,
)


class MCDAPrioritizationService:
    """Service for deterministic Multi-Criteria Decision Analysis (MCDA) ranking."""

    DEFAULT_CONFIG = MCDAWeightsConfig(
        weight_risk_score=0.50,
        weight_population_density=0.30,
        weight_infrastructure_impact=0.10,
        weight_river_stage=0.10,
        max_population_density=25000.0,
        max_vulnerable_assets=5.0
    )

    ACTION_MAP = {
        "CRITICAL_TIER_1": "Immediate priority alert dispatch, mandatory evacuation orders, and state disaster deployment.",
        "HIGH_TIER_2": "Issue regional warning broadcast, activate shelter hubs, and pre-position emergency response units.",
        "MEDIUM_TIER_3": "Issue internal disaster agency advisory, inspect drainage bottlenecks, and monitor sensor telemetry.",
        "LOW_TIER_4": "Maintain standard hydrological surveillance and baseline sensor monitoring.",
    }

    @classmethod
    async def rank_zones(
        cls,
        db: AsyncSession,
        config: Optional[MCDAWeightsConfig] = None
    ) -> AlertPrioritizationResponse:
        """Executes deterministic MCDA ranking across all monitored geographic zones."""
        weights = config or cls.DEFAULT_CONFIG
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        # 1. Fetch all monitored zones
        zones_stmt = select(GeographicZone)
        zones_res = await db.execute(zones_stmt)
        zones = zones_res.scalars().all()

        scored_zones = []

        for zone in zones:
            # Factor 1: Flood Risk Score [0.0 - 100.0] -> [0.0 - 1.0]
            pred_stmt = (
                select(RiskScore, FloodPrediction)
                .join(PredictionRun, PredictionRun.id == RiskScore.prediction_run_id)
                .outerjoin(FloodPrediction, FloodPrediction.prediction_run_id == PredictionRun.id)
                .where(PredictionRun.zone_id == zone.id)
                .order_by(desc(PredictionRun.run_timestamp))
                .limit(1)
            )
            pred_res = await db.execute(pred_stmt)
            pred_row = pred_res.first()

            if pred_row and pred_row[0]:
                risk_score_val = float(pred_row[0].risk_score_numeric)
                norm_risk = min(1.0, max(0.0, risk_score_val / 100.0))
            else:
                risk_score_val = 0.0
                norm_risk = 0.0

            # Factor 2: Population Density [0 - max_pop] -> [0.0 - 1.0]
            raw_pop_density = float(zone.population_density) if zone.population_density is not None else 0.0
            norm_pop = min(1.0, max(0.0, raw_pop_density / weights.max_population_density))

            # Factor 3: Infrastructure Asset Exposure -> [0.0 - 1.0]
            infra_count_stmt = (
                select(func.count(InfrastructureAsset.id))
                .where(InfrastructureAsset.zone_id == zone.id)
            )
            infra_res = await db.execute(infra_count_stmt)
            raw_infra_count = float(infra_res.scalar() or 0)
            norm_infra = min(1.0, max(0.0, raw_infra_count / weights.max_vulnerable_assets))

            # Factor 4: River Stage Severity Ratio -> [0.0 - 1.0]
            river_stmt = (
                select(WaterLevelObservation)
                .where(WaterLevelObservation.zone_id == zone.id)
                .order_by(desc(WaterLevelObservation.observed_at))
                .limit(1)
            )
            river_res = await db.execute(river_stmt)
            river_obs = river_res.scalar_one_or_none()

            if river_obs and river_obs.danger_level_m > river_obs.warning_level_m:
                wl = float(river_obs.water_level_m)
                warn = float(river_obs.warning_level_m)
                dang = float(river_obs.danger_level_m)
                raw_river_stage = wl
                norm_river = min(1.0, max(0.0, (wl - warn) / (dang - warn + 1e-5)))
            else:
                raw_river_stage = 0.0
                norm_river = 0.0

            # Compute weighted composite score [0.00 - 100.00]
            w_risk_contrib = norm_risk * weights.weight_risk_score * 100.0
            w_pop_contrib = norm_pop * weights.weight_population_density * 100.0
            w_infra_contrib = norm_infra * weights.weight_infrastructure_impact * 100.0
            w_river_contrib = norm_river * weights.weight_river_stage * 100.0

            composite_score = round(
                w_risk_contrib + w_pop_contrib + w_infra_contrib + w_river_contrib,
                2
            )
            # Clamp composite score to [0.00, 100.00]
            composite_score = min(100.00, max(0.00, composite_score))

            # Classify Priority Tier
            if composite_score >= 75.0:
                priority_tier = "CRITICAL_TIER_1"
            elif composite_score >= 55.0:
                priority_tier = "HIGH_TIER_2"
            elif composite_score >= 30.0:
                priority_tier = "MEDIUM_TIER_3"
            else:
                priority_tier = "LOW_TIER_4"

            factors = [
                MCDAFactorBreakdown(
                    factor_name="flood_risk_score",
                    raw_value=risk_score_val,
                    normalized_score=round(norm_risk, 4),
                    weight=weights.weight_risk_score,
                    weighted_score=round(w_risk_contrib, 2)
                ),
                MCDAFactorBreakdown(
                    factor_name="population_density",
                    raw_value=raw_pop_density,
                    normalized_score=round(norm_pop, 4),
                    weight=weights.weight_population_density,
                    weighted_score=round(w_pop_contrib, 2)
                ),
                MCDAFactorBreakdown(
                    factor_name="vulnerable_infrastructure_count",
                    raw_value=raw_infra_count,
                    normalized_score=round(norm_infra, 4),
                    weight=weights.weight_infrastructure_impact,
                    weighted_score=round(w_infra_contrib, 2)
                ),
                MCDAFactorBreakdown(
                    factor_name="river_stage_ratio",
                    raw_value=raw_river_stage,
                    normalized_score=round(norm_river, 4),
                    weight=weights.weight_river_stage,
                    weighted_score=round(w_river_contrib, 2)
                ),
            ]

            scored_zones.append({
                "zone_id": zone.id,
                "zone_name": zone.name,
                "composite_score": composite_score,
                "priority_tier": priority_tier,
                "recommended_action": cls.ACTION_MAP[priority_tier],
                "factors": factors
            })

        # 2. Deterministic sorting: Descending by score, ascending by zone_id tie-breaker
        scored_zones.sort(key=lambda item: (-item["composite_score"], item["zone_id"]))

        ranking_items = []
        for rank_idx, item in enumerate(scored_zones, start=1):
            ranking_items.append(
                ZonePriorityRank(
                    rank=rank_idx,
                    zone_id=item["zone_id"],
                    zone_name=item["zone_name"],
                    composite_priority_score=item["composite_score"],
                    priority_tier=item["priority_tier"],
                    recommended_alert_action=item["recommended_action"],
                    factors=item["factors"]
                )
            )

        return AlertPrioritizationResponse(
            evaluated_at=now,
            total_zones_evaluated=len(ranking_items),
            weights_applied=weights,
            ranking=ranking_items
        )
