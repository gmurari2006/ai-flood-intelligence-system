"""
Feature Dataset Builder Module.

Constructs MLFeatureVectors from PostgreSQL observations and terrain metrics
for prediction timestamp T without data leakage.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.domain import (
    GeographicZone,
    WeatherObservation,
    RainfallObservation,
    WaterLevelObservation,
)
from app.ml.alignment import filter_observations_before_cutoff, ensure_naive_datetime, DataLeakageError
from app.ml.engineer import (
    calculate_antecedent_precipitation_index,
    calculate_runoff_potential_index,
    calculate_hydro_danger_index_clamped,
    calculate_rain_intensity_delta,
    calculate_river_stage_ratio,
    FeatureExtractionError,
)
from app.ml.schemas import MLFeatureVector


class FeatureDatasetBuilder:
    """Builder service for creating deterministic, ML-ready feature vectors from database state."""

    @classmethod
    async def build_feature_vector_from_db(
        cls,
        db: AsyncSession,
        zone_id: str,
        prediction_timestamp: Optional[datetime] = None,
        forecast_horizon_hours: int = 6,
        forecast_rainfall_override_mm: Optional[float] = None
    ) -> MLFeatureVector:
        """
        Retrieves observations for zone_id up to prediction_timestamp (T), applies temporal alignment,
        calculates feature vectors, and returns a validated MLFeatureVector.
        """
        if prediction_timestamp is None:
            prediction_timestamp = datetime.now(timezone.utc)
        
        cutoff = ensure_naive_datetime(prediction_timestamp)

        # 1. Retrieve Zone Terrain Attributes
        zone_stmt = select(GeographicZone).where(GeographicZone.id == zone_id)
        zone_res = await db.execute(zone_stmt)
        zone = zone_res.scalar_one_or_none()

        if not zone:
            raise FeatureExtractionError(f"Geographic zone '{zone_id}' not found in database.")

        elevation_mean_m = float(zone.elevation_mean_m)
        slope_mean_deg = float(zone.slope_mean_deg) if zone.slope_mean_deg is not None else 1.5
        drainage_capacity_score = float(zone.drainage_capacity_score) if zone.drainage_capacity_score is not None else 5.0
        soil_saturation_proxy = float(zone.soil_permeability_index) if zone.soil_permeability_index is not None else 0.50
        distance_to_river_m = 250.0  # Default proximity metric for zone

        # 2. Retrieve Weather & Rainfall Observations <= cutoff
        rain_stmt = (
            select(RainfallObservation)
            .where(
                RainfallObservation.zone_id == zone_id,
                RainfallObservation.observed_at <= cutoff
            )
            .order_by(RainfallObservation.observed_at.desc())
        )
        rain_res = await db.execute(rain_stmt)
        rain_records = list(rain_res.scalars().all())

        # Temporal Alignment & Data Leakage Check
        aligned_rain = filter_observations_before_cutoff(rain_records, cutoff)

        if aligned_rain:
            latest_rain = aligned_rain[-1]  # Most recent <= cutoff
            r_1h = float(latest_rain.rainfall_1h_mm)
            r_6h = float(latest_rain.rainfall_6h_mm)
            r_24h = float(latest_rain.rainfall_24h_mm)
            r_72h = float(latest_rain.rainfall_72h_mm)
        else:
            r_1h = r_6h = r_24h = r_72h = 0.0

        # 3. Retrieve Water Level Gauge Observations <= cutoff
        water_stmt = (
            select(WaterLevelObservation)
            .where(
                WaterLevelObservation.zone_id == zone_id,
                WaterLevelObservation.observed_at <= cutoff
            )
            .order_by(WaterLevelObservation.observed_at.desc())
        )
        water_res = await db.execute(water_stmt)
        water_records = list(water_res.scalars().all())

        aligned_water = filter_observations_before_cutoff(water_records, cutoff)

        if aligned_water:
            latest_water = aligned_water[-1]
            water_level_m = float(latest_water.water_level_m)
            danger_level_m = float(latest_water.danger_level_m)
        else:
            water_level_m = 2.50
            danger_level_m = 4.20

        # 4. Forecast Rainfall Horizon Feature (Distinct from observed rainfall)
        if forecast_rainfall_override_mm is not None:
            forecast_rain_horizon = float(forecast_rainfall_override_mm)
        else:
            # Baseline forecast estimation from current rain trend
            forecast_rain_horizon = max(0.0, r_1h * forecast_horizon_hours * 0.8)

        # 5. Feature Engineering Calculations
        rain_intensity_delta = calculate_rain_intensity_delta(r_1h, r_6h)
        river_stage_ratio = calculate_river_stage_ratio(water_level_m, danger_level_m)

        # Days 1, 2, 3 decomposition for API
        r_day1 = r_24h
        r_day2 = max(0.0, r_72h - r_24h) / 2.0
        r_day3 = r_day2

        api_val = calculate_antecedent_precipitation_index(r_day1, r_day2, r_day3)
        rpi_val = calculate_runoff_potential_index(r_24h, forecast_rain_horizon, soil_saturation_proxy, elevation_mean_m)
        hdi_val = calculate_hydro_danger_index_clamped(water_level_m, danger_level_m)

        vector = MLFeatureVector(
            zone_id=zone_id,
            prediction_timestamp=cutoff,
            forecast_horizon_hours=forecast_horizon_hours,
            rainfall_1h_mm=r_1h,
            rainfall_6h_mm=r_6h,
            rainfall_24h_mm=r_24h,
            rainfall_72h_mm=r_72h,
            rain_intensity_delta=rain_intensity_delta,
            forecast_rainfall_horizon_mm=forecast_rain_horizon,
            river_water_level_m=water_level_m,
            river_stage_ratio=river_stage_ratio,
            elevation_mean_m=elevation_mean_m,
            slope_mean_deg=slope_mean_deg,
            drainage_capacity_score=drainage_capacity_score,
            soil_saturation_proxy=soil_saturation_proxy,
            distance_to_river_m=distance_to_river_m,
            antecedent_precipitation_index=api_val,
            runoff_potential_index=rpi_val,
            hydro_danger_index_clamped=hdi_val
        )

        return vector
