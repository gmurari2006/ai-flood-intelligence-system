"""
AI Flood Prediction and Decision Support Schemas.

Matches Document 05 Section 5.1 specifications.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class PredictionRequest(BaseModel):
    """Trigger flood risk prediction request body."""
    zone_id: str = Field(..., max_length=50, description="Target geographic zone ID")
    forecast_horizon_hours: int = Field(6, ge=1, le=24, description="Forecast horizon in hours (1-24)")

    model_config = ConfigDict(extra="forbid")


class PredictionResponse(BaseModel):
    """Flood risk prediction and decision support response payload."""
    prediction_run_id: str = Field(..., description="Unique prediction run execution UUID")
    zone_id: str = Field(..., description="Target geographic zone ID")
    forecast_horizon_hours: int = Field(..., description="Forecast horizon hours evaluated")
    
    flood_probability: float = Field(..., ge=0.0, le=1.0, description="Estimated probability of flooding [0.0 - 1.0]")
    predicted_depth_m: float = Field(..., ge=0.0, description="Estimated inundation water depth in meters")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Prediction confidence score [0.0 - 1.0]")
    
    risk_score_numeric: float = Field(..., ge=0.0, le=100.0, description="Decision risk rating score [0.0 - 100.0]")
    risk_level: str = Field(..., description="Risk tier: LOW, MODERATE, HIGH, CRITICAL")
    recommended_action: str = Field(..., description="Decision support guidance recommendation")
    
    inference_mode: str = Field("heuristic_fallback", description="Inference engine used: 'trained_model' or 'heuristic_fallback'")
    is_demo_data: bool = Field(False, description="Flag indicating if prediction consumed synthetic demo scenario")
    executed_at: datetime = Field(..., description="Timestamp of prediction execution")
