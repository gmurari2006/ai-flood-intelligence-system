"""
Pydantic Schemas for AI/ML Feature Vectors and Datasets.

Defines MLFeatureVector matching Document 04 Section 4.1 & 5.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


class MLFeatureVector(BaseModel):
    """
    Deterministic ML Feature Vector containing 13 core environmental vectors + 3 derived features.
    Independent from specific ML algorithms.
    """
    zone_id: str = Field(..., max_length=50, description="Target geographic zone ID")
    prediction_timestamp: datetime = Field(..., description="Target prediction time T (Cutoff for data leakage prevention)")
    forecast_horizon_hours: int = Field(6, ge=1, le=72, description="Forecast lead time horizon H in hours")

    # 13 Core Feature Vectors
    rainfall_1h_mm: float = Field(..., ge=0.0, description="Immediate 1-hour observed rainfall (mm)")
    rainfall_6h_mm: float = Field(..., ge=0.0, description="Accumulated 6-hour observed rainfall (mm)")
    rainfall_24h_mm: float = Field(..., ge=0.0, description="Accumulated 24-hour observed rainfall (mm)")
    rainfall_72h_mm: float = Field(..., ge=0.0, description="Antecedent 3-day observed rainfall (mm)")
    rain_intensity_delta: float = Field(..., description="Acceleration rate of observed rainfall (mm/hr)")
    forecast_rainfall_horizon_mm: float = Field(..., ge=0.0, description="Forecasted cumulative rainfall for horizon H (mm)")

    river_water_level_m: float = Field(..., ge=0.0, description="Current river stage height (m)")
    river_stage_ratio: float = Field(..., ge=0.0, description="Current Level / Danger Level ratio")

    elevation_mean_m: float = Field(..., description="Mean elevation of zone (m)")
    slope_mean_deg: float = Field(..., ge=0.0, le=90.0, description="Mean terrain slope (deg)")
    drainage_capacity_score: float = Field(..., ge=0.0, le=10.0, description="Municipal drainage capacity score [0-10]")
    soil_saturation_proxy: float = Field(..., ge=0.0, le=1.0, description="Estimated soil moisture saturation ratio [0-1]")
    distance_to_river_m: float = Field(..., ge=0.0, description="Proximity of zone centroid to nearest river (m)")

    # Derived Features (Document 04 Section 5)
    antecedent_precipitation_index: float = Field(..., ge=0.0, description="API decay index with k=0.85")
    runoff_potential_index: float = Field(..., ge=0.0, description="Runoff Potential Index (RPI)")
    hydro_danger_index_clamped: float = Field(..., ge=0.0, le=1.0, description="Clamped Hydro Danger Index (HDI)")

    model_config = ConfigDict(frozen=True)

    def to_vector_array(self) -> list[float]:
        """Returns ordered float vector array for downstream ML consumption."""
        return [
            self.rainfall_1h_mm,
            self.rainfall_6h_mm,
            self.rainfall_24h_mm,
            self.rainfall_72h_mm,
            self.rain_intensity_delta,
            self.forecast_rainfall_horizon_mm,
            self.river_water_level_m,
            self.river_stage_ratio,
            self.elevation_mean_m,
            self.slope_mean_deg,
            self.drainage_capacity_score,
            self.soil_saturation_proxy,
            self.distance_to_river_m,
            self.antecedent_precipitation_index,
            self.runoff_potential_index,
            self.hydro_danger_index_clamped,
        ]

    def feature_names(self) -> list[str]:
        """Returns ordered feature name labels."""
        return [
            "rainfall_1h_mm",
            "rainfall_6h_mm",
            "rainfall_24h_mm",
            "rainfall_72h_mm",
            "rain_intensity_delta",
            "forecast_rainfall_horizon_mm",
            "river_water_level_m",
            "river_stage_ratio",
            "elevation_mean_m",
            "slope_mean_deg",
            "drainage_capacity_score",
            "soil_saturation_proxy",
            "distance_to_river_m",
            "antecedent_precipitation_index",
            "runoff_potential_index",
            "hydro_danger_index_clamped",
        ]


class HistoricalTargetRecord(BaseModel):
    """Interface schema representing historical flood ground truth targets."""
    zone_id: str
    event_date: datetime
    is_flood: int = Field(..., ge=0, le=1, description="Binary target (1 if depth > 0.15m)")
    peak_water_depth_m: Optional[float] = Field(None, ge=0.0)
    total_rainfall_mm: Optional[float] = Field(None, ge=0.0)
    severity_level: Optional[str] = None
    notes: Optional[str] = None


class FeatureDatasetRecord(BaseModel):
    """Complete dataset row coupling an MLFeatureVector with an optional ground-truth target."""
    feature_vector: MLFeatureVector
    target: Optional[HistoricalTargetRecord] = None
