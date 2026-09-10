"""
Multi-Criteria Decision Analysis (MCDA) Alert Prioritization Schemas.

Matches AI-10 Specification (Document 04 Table 2, Document 06 TC-AI-10, Document 08 Traceability Matrix).
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, model_validator


class MCDAWeightsConfig(BaseModel):
    """Configurable weights and normalization boundaries for MCDA ranking.
    
    Documented criteria per Doc 04 Table 2 (AI-10) and Doc 03 line 92:
    - Risk Score
    - Population Density
    - Infrastructure Impact (Critical assets)
    - River Gauge Stage Ratio
    """
    weight_risk_score: float = Field(0.50, ge=0.0, le=1.0, description="Weight assigned to flood risk score [0.0 - 1.0]")
    weight_population_density: float = Field(0.30, ge=0.0, le=1.0, description="Weight assigned to population density [0.0 - 1.0]")
    weight_infrastructure_impact: float = Field(0.10, ge=0.0, le=1.0, description="Weight assigned to vulnerable infrastructure [0.0 - 1.0]")
    weight_river_stage: float = Field(0.10, ge=0.0, le=1.0, description="Weight assigned to river stage severity ratio [0.0 - 1.0]")

    max_population_density: float = Field(25000.0, gt=0.0, description="Upper bound for population density normalization")
    max_vulnerable_assets: float = Field(5.0, gt=0.0, description="Upper bound for infrastructure asset count normalization")

    @model_validator(mode="after")
    def validate_weights_sum(self) -> "MCDAWeightsConfig":
        total_weight = (
            self.weight_risk_score +
            self.weight_population_density +
            self.weight_infrastructure_impact +
            self.weight_river_stage
        )
        if abs(total_weight - 1.0) > 1e-4:
            raise ValueError(f"MCDA criteria weights must sum to 1.0 (current sum: {total_weight:.4f})")
        return self


class MCDAFactorBreakdown(BaseModel):
    """Contribution details for a single decision criterion."""
    factor_name: str = Field(..., description="Name of criterion (e.g., flood_risk_score, population_density)")
    raw_value: float = Field(..., description="Observed or calculated raw input value")
    normalized_score: float = Field(..., ge=0.0, le=1.0, description="Normalized score on scale [0.0, 1.0]")
    weight: float = Field(..., ge=0.0, le=1.0, description="Weight assigned to criterion")
    weighted_score: float = Field(..., description="Contribution to composite score: normalized_score * weight * 100")


class ZonePriorityRank(BaseModel):
    """Ranked zone item with composite decision score and priority tier."""
    rank: int = Field(..., ge=1, description="Deterministic priority ranking position (1 = highest urgency)")
    zone_id: str = Field(..., description="Target geographic zone ID")
    zone_name: str = Field(..., description="Geographic zone name")
    composite_priority_score: float = Field(..., ge=0.0, le=100.0, description="Composite MCDA priority score [0.00 - 100.00]")
    priority_tier: str = Field(..., description="Priority classification: CRITICAL_TIER_1, HIGH_TIER_2, MEDIUM_TIER_3, LOW_TIER_4")
    recommended_alert_action: str = Field(..., description="Recommended operational action")
    factors: List[MCDAFactorBreakdown] = Field(default_factory=list, description="Breakdown of criteria contributions")


class AlertPrioritizationResponse(BaseModel):
    """Complete MCDA alert prioritization queue payload."""
    evaluated_at: datetime = Field(..., description="Timestamp of MCDA evaluation execution")
    total_zones_evaluated: int = Field(..., description="Total count of monitored zones ranked")
    weights_applied: MCDAWeightsConfig = Field(..., description="MCDA criteria weights used for ranking")
    ranking: List[ZonePriorityRank] = Field(default_factory=list, description="Sorted priority ranking queue (highest to lowest)")
