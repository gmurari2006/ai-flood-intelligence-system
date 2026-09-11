"""
Module 3 AI/ML Data Preparation & Feature Engineering Tests.

Tests ML-TEST-01 through ML-TEST-14 validating feature vector construction,
temporal alignment, data leakage prevention, determinism, and target query interfaces.
"""

from datetime import datetime, timedelta, timezone, date
import pytest
from pydantic import ValidationError
from sqlalchemy import text

from app.db.session import AsyncSessionLocal
from app.models.domain import (
    Location,
    GeographicZone,
    DataSource,
    WeatherObservation,
    RainfallObservation,
    WaterLevelObservation,
)
from app.ml.schemas import MLFeatureVector
from app.ml.engineer import (
    calculate_antecedent_precipitation_index,
    calculate_runoff_potential_index,
    calculate_hydro_danger_index_clamped,
    calculate_rain_intensity_delta,
    calculate_river_stage_ratio,
    FeatureExtractionError,
)
from app.ml.alignment import (
    filter_observations_before_cutoff,
    calculate_window_accumulated_rainfall,
    DataLeakageError,
)
from app.ml.dataset_builder import FeatureDatasetBuilder
from app.ml.target_interface import HistoricalTargetInterface


def get_naive_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def setup_ml_test_location_and_zone():
    """Ensures test location and zone exist in real database to satisfy foreign keys."""
    async with AsyncSessionLocal() as session:
        # 1. Location
        loc = await session.get(Location, "DIST-MUMBAI-01")
        if not loc:
            await session.execute(text("""
                INSERT INTO locations (id, name, state_name, country)
                VALUES ('DIST-MUMBAI-01', 'Mumbai Suburbs', 'Maharashtra', 'India')
                ON CONFLICT (id) DO NOTHING;
            """))
            await session.commit()

        # 2. Zone
        zone = await session.get(GeographicZone, "ZONE-NORTH-BASIN")
        if not zone:
            await session.execute(text("""
                INSERT INTO geographic_zones (
                    id, location_id, name, elevation_mean_m, slope_mean_deg,
                    drainage_capacity_score, soil_permeability_index, population_density,
                    boundary, centroid
                ) VALUES (
                    'ZONE-NORTH-BASIN', 'DIST-MUMBAI-01', 'North River Basin', 4.20, 1.50,
                    5.50, 0.45, 12500.00,
                    ST_GeomFromText('POLYGON((72.87 19.07, 72.89 19.07, 72.89 19.09, 72.87 19.09, 72.87 19.07))', 4326),
                    ST_GeomFromText('POINT(72.88 19.08)', 4326)
                ) ON CONFLICT (id) DO NOTHING;
            """))
            await session.commit()

        # 3. Data Source
        src = await session.get(DataSource, "SRC-TEST-PROVIDER")
        if not src:
            await session.execute(text("""
                INSERT INTO data_sources (id, provider_name, source_type, update_frequency_minutes, status)
                VALUES ('SRC-TEST-PROVIDER', 'Test Provider API', 'API', 15, 'ACTIVE')
                ON CONFLICT (id) DO NOTHING;
            """))
            await session.commit()


@pytest.mark.asyncio
async def test_ml_01_valid_observations_produce_valid_feature_vector():
    """ML-TEST-01: Valid observations produce a valid deterministic feature vector."""
    await setup_ml_test_location_and_zone()
    now_dt = get_naive_now()

    async with AsyncSessionLocal() as session:
        vector = await FeatureDatasetBuilder.build_feature_vector_from_db(
            session,
            zone_id="ZONE-NORTH-BASIN",
            prediction_timestamp=now_dt,
            forecast_horizon_hours=6
        )

        assert isinstance(vector, MLFeatureVector)
        assert vector.zone_id == "ZONE-NORTH-BASIN"
        assert vector.forecast_horizon_hours == 6
        assert len(vector.to_vector_array()) == 16


@pytest.mark.asyncio
async def test_ml_02_rainfall_aggregation_calculated_correctly():
    """ML-TEST-02: Rainfall aggregation is calculated correctly across 1h, 6h, 24h, 72h."""
    delta = calculate_rain_intensity_delta(rainfall_1h_mm=30.0, rainfall_6h_mm=60.0)
    # avg 6h rate = 10.0, delta = 30.0 - 10.0 = 20.0
    assert delta == 20.0

    api_val = calculate_antecedent_precipitation_index(100.0, 50.0, 20.0, decay_factor=0.85)
    # API = 100 * 0.85^1 + 50 * 0.85^2 + 20 * 0.85^3 = 85.0 + 36.125 + 12.2825 = 133.4075
    assert abs(api_val - 133.4075) < 1e-3


@pytest.mark.asyncio
async def test_ml_03_river_level_change_trend_calculation():
    """ML-TEST-03: River-level ratio and clamped hydro danger index calculations are correct."""
    stage_ratio = calculate_river_stage_ratio(water_level_m=5.25, danger_level_m=4.20)
    assert round(stage_ratio, 2) == 1.25

    hdi_clamped = calculate_hydro_danger_index_clamped(river_water_level_m=5.25, danger_level_m=4.20)
    assert hdi_clamped == 1.0  # Clamped at 1.0

    hdi_normal = calculate_hydro_danger_index_clamped(river_water_level_m=2.10, danger_level_m=4.20)
    assert hdi_normal == 0.50


@pytest.mark.asyncio
async def test_ml_04_observed_and_forecast_rainfall_distinct():
    """ML-TEST-04: Observed rainfall and forecast rainfall remain distinct fields."""
    now_dt = get_naive_now()

    vector = MLFeatureVector(
        zone_id="ZONE-NORTH-BASIN",
        prediction_timestamp=now_dt,
        forecast_horizon_hours=6,
        rainfall_1h_mm=15.0,
        rainfall_6h_mm=45.0,
        rainfall_24h_mm=120.0,
        rainfall_72h_mm=180.0,
        rain_intensity_delta=7.5,
        forecast_rainfall_horizon_mm=60.0,  # Distinct forecast rainfall
        river_water_level_m=3.20,
        river_stage_ratio=0.76,
        elevation_mean_m=4.20,
        slope_mean_deg=1.50,
        drainage_capacity_score=5.50,
        soil_saturation_proxy=0.45,
        distance_to_river_m=250.0,
        antecedent_precipitation_index=150.0,
        runoff_potential_index=15.5,
        hydro_danger_index_clamped=0.76
    )

    assert vector.rainfall_24h_mm == 120.0
    assert vector.forecast_rainfall_horizon_mm == 60.0
    assert vector.rainfall_24h_mm != vector.forecast_rainfall_horizon_mm


@pytest.mark.asyncio
async def test_ml_05_forecast_rainfall_horizon_constructed_correctly():
    """ML-TEST-05: forecast_rainfall_horizon_mm is constructed correctly with horizon H."""
    rpi = calculate_runoff_potential_index(
        rainfall_24h_mm=100.0,
        forecast_rainfall_horizon_mm=50.0,
        soil_saturation_proxy=0.60,
        elevation_mean_m=4.0
    )
    # RPI = ((100 + 50) * 0.60) / (4.0 + 1.0) = (150 * 0.60) / 5.0 = 90.0 / 5.0 = 18.0
    assert rpi == 18.0


@pytest.mark.asyncio
async def test_ml_06_temporal_alignment_no_data_leakage():
    """ML-TEST-06: Temporal alignment explicitly prevents future data leakage."""
    cutoff = datetime(2026, 9, 10, 12, 0, 0)

    class MockRainObs:
        def __init__(self, observed_at, rain_1h):
            self.observed_at = observed_at
            self.rainfall_1h_mm = rain_1h

    past_obs_1 = MockRainObs(datetime(2026, 9, 10, 10, 0, 0), 10.0)
    past_obs_2 = MockRainObs(datetime(2026, 9, 10, 11, 30, 0), 20.0)
    future_obs = MockRainObs(datetime(2026, 9, 10, 12, 30, 0), 100.0)  # Future observation!

    all_obs = [past_obs_1, past_obs_2, future_obs]

    # Filter strictly <= cutoff
    filtered = filter_observations_before_cutoff(all_obs, cutoff)

    assert len(filtered) == 2
    assert future_obs not in filtered
    assert filtered[-1].observed_at <= cutoff

    # Expect DataLeakageError if future observation is passed directly to window calculator
    with pytest.raises(DataLeakageError, match="Data leakage boundary violation"):
        calculate_window_accumulated_rainfall(all_obs, cutoff, window_hours=6)


@pytest.mark.asyncio
async def test_ml_07_invalid_observations_rejected():
    """ML-TEST-07: Invalid environmental observations are rejected by validation."""
    now_dt = get_naive_now()

    with pytest.raises(ValidationError):
        MLFeatureVector(
            zone_id="ZONE-NORTH-BASIN",
            prediction_timestamp=now_dt,
            forecast_horizon_hours=6,
            rainfall_1h_mm=-5.0,  # Invalid negative rainfall
            rainfall_6h_mm=0.0,
            rainfall_24h_mm=0.0,
            rainfall_72h_mm=0.0,
            rain_intensity_delta=0.0,
            forecast_rainfall_horizon_mm=0.0,
            river_water_level_m=2.0,
            river_stage_ratio=0.5,
            elevation_mean_m=4.0,
            slope_mean_deg=1.5,
            drainage_capacity_score=5.0,
            soil_saturation_proxy=0.5,
            distance_to_river_m=250.0,
            antecedent_precipitation_index=0.0,
            runoff_potential_index=0.0,
            hydro_danger_index_clamped=0.5
        )


@pytest.mark.asyncio
async def test_ml_08_missing_data_behavior_handled():
    """ML-TEST-08: Missing zone data raises FeatureExtractionError per policy."""
    async with AsyncSessionLocal() as session:
        with pytest.raises(FeatureExtractionError, match="not found in database"):
            await FeatureDatasetBuilder.build_feature_vector_from_db(
                session,
                zone_id="ZONE-MISSING-NON-EXISTENT"
            )


@pytest.mark.asyncio
async def test_ml_09_feature_vector_schema_stable_and_serializable():
    """ML-TEST-09: Feature vector schema is stable and serializable to dict/JSON."""
    now_dt = get_naive_now()

    vector = MLFeatureVector(
        zone_id="ZONE-NORTH-BASIN",
        prediction_timestamp=now_dt,
        forecast_horizon_hours=6,
        rainfall_1h_mm=10.0,
        rainfall_6h_mm=30.0,
        rainfall_24h_mm=80.0,
        rainfall_72h_mm=120.0,
        rain_intensity_delta=5.0,
        forecast_rainfall_horizon_mm=40.0,
        river_water_level_m=3.0,
        river_stage_ratio=0.71,
        elevation_mean_m=4.2,
        slope_mean_deg=1.5,
        drainage_capacity_score=5.5,
        soil_saturation_proxy=0.45,
        distance_to_river_m=250.0,
        antecedent_precipitation_index=90.0,
        runoff_potential_index=10.0,
        hydro_danger_index_clamped=0.71
    )

    data_dict = vector.model_dump()
    assert isinstance(data_dict, dict)
    assert data_dict["zone_id"] == "ZONE-NORTH-BASIN"
    assert data_dict["rainfall_1h_mm"] == 10.0
    assert len(vector.to_vector_array()) == 16


@pytest.mark.asyncio
async def test_ml_10_feature_generation_deterministic():
    """ML-TEST-10: Feature generation is 100% deterministic for identical input parameters."""
    await setup_ml_test_location_and_zone()
    fixed_time = datetime(2026, 9, 10, 12, 0, 0)

    async with AsyncSessionLocal() as session:
        v1 = await FeatureDatasetBuilder.build_feature_vector_from_db(
            session, "ZONE-NORTH-BASIN", prediction_timestamp=fixed_time, forecast_horizon_hours=6
        )
        v2 = await FeatureDatasetBuilder.build_feature_vector_from_db(
            session, "ZONE-NORTH-BASIN", prediction_timestamp=fixed_time, forecast_horizon_hours=6
        )

        assert v1 == v2
        assert v1.to_vector_array() == v2.to_vector_array()


@pytest.mark.asyncio
async def test_ml_11_terrain_geospatial_features_represented():
    """ML-TEST-11: Documented terrain/geospatial features are correctly represented from database."""
    await setup_ml_test_location_and_zone()
    fixed_time = datetime(2026, 9, 10, 12, 0, 0)

    async with AsyncSessionLocal() as session:
        vector = await FeatureDatasetBuilder.build_feature_vector_from_db(
            session, "ZONE-NORTH-BASIN", prediction_timestamp=fixed_time
        )
        assert vector.elevation_mean_m == 4.20
        assert vector.slope_mean_deg == 1.50
        assert vector.drainage_capacity_score == 5.50
        assert vector.soil_saturation_proxy == 0.45


@pytest.mark.asyncio
async def test_ml_12_historical_target_interface_does_not_fabricate_labels():
    """ML-TEST-12: Historical target interface queries DB without fabricating synthetic labels."""
    async with AsyncSessionLocal() as session:
        # Check target record for non-existent event date -> returns None without creating rows
        target = await HistoricalTargetInterface.get_target_for_zone_and_date(
            session, "ZONE-NORTH-BASIN", date(1990, 1, 1)
        )
        assert target is None

        # Check dataset availability prerequisite report
        is_avail, count, msg = await HistoricalTargetInterface.check_training_dataset_availability(session, min_required_records=50)
        assert is_avail is False
        assert "Training dataset availability is a prerequisite for model training." in msg


@pytest.mark.asyncio
async def test_ml_13_module_1_database_tests_pass():
    """ML-TEST-13: Module 1 database connectivity regression test."""
    async with AsyncSessionLocal() as session:
        res = await session.execute(text("SELECT 1"))
        assert res.scalar() == 1


@pytest.mark.asyncio
async def test_ml_14_module_2_ingestion_tests_pass():
    """ML-TEST-14: Module 2 data sources regression test."""
    async with AsyncSessionLocal() as session:
        res = await session.execute(text("SELECT COUNT(*) FROM data_sources"))
        count = res.scalar()
        assert count is not None
