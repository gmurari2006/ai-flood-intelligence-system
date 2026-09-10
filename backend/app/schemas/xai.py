"""
Explainable AI (XAI) Feature Attribution Schemas.

Matches Document 05 Section 5.2 specifications.
"""

from typing import Optional
from pydantic import BaseModel, Field


class RiskFactorSchema(BaseModel):
    """Individual feature contribution attribution."""
    feature_name: str
    observed_value: float
    shap_contribution: float
    impact_direction: str  # INCREASES_RISK or DECREASES_RISK
    description: str


class PredictionExplainResponse(BaseModel):
    """Explainable AI attribution response payload."""
    prediction_run_id: str
    base_expected_value: float
    final_probability: float
    explanation_method: str = Field(
        "heuristic_factor_attribution",
        description="Attribution engine: 'model_shap' or 'heuristic_factor_attribution'"
    )
    factors: list[RiskFactorSchema]
