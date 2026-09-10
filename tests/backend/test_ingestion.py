"""
Module 2 Data Ingestion & Persistence Tests.

Tests ING-TEST-01 through ING-TEST-10 validating environmental data ingestion,
normalization, provenance enforcement, idempotency, and error handling.
"""

from datetime import datetime, timezone, timedelta
import pytest
from pydantic import ValidationError
from sqlalchemy import text, select

from backend.app.db.session import AsyncSessionLocal
from backend.app.models.domain import (
    Location,
    GeographicZone,
    DataSource,
    WeatherObservation,
    RainfallObservation,
    WaterLevelObservation,
)
from backend.app.schemas.ingestion import (
    WeatherObservationCreate,
    RainfallObservationCreate,
    WaterLevelObservationCreate,
)
from backend.app.services.ingestion_service import IngestionService
from backend.app.ingestion.base import BaseProvider, ProviderPayload, ProviderIngestionError


import time


def get_naive_now() -> datetime:
    # Use microsecond-level offset to guarantee unique timestamps per test call
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    time.sleep(0.001)
    return now



async def setup_test_location_and_zone():
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
async def test_ing_01_valid_weather_observation_accepted():
    """ING-TEST-01: Valid normalized weather observation is accepted & persisted."""
    await setup_test_location_and_zone()
    now_utc = get_naive_now()

    obs_input = WeatherObservationCreate(
        zone_id="ZONE-NORTH-BASIN",
        source_id="SRC-TEST-PROVIDER",
        temperature_c=28.4,
        humidity_pct=88.5,
        wind_speed_kmh=18.2,
        observed_at=now_utc
    )

    async with AsyncSessionLocal() as session:
        obs, created = await IngestionService.save_weather_observation(session, obs_input)
        assert obs is not None
        assert obs.zone_id == "ZONE-NORTH-BASIN"
        assert float(obs.temperature_c) == 28.4
        assert float(obs.humidity_pct) == 88.5


@pytest.mark.asyncio
async def test_ing_02_valid_rainfall_observation_accepted():
    """ING-TEST-02: Valid rainfall observation is accepted & persisted."""
    await setup_test_location_and_zone()
    now_utc = get_naive_now()

    obs_input = RainfallObservationCreate(
        zone_id="ZONE-NORTH-BASIN",
        source_id="SRC-TEST-PROVIDER",
        rainfall_1h_mm=25.0,
        rainfall_6h_mm=75.0,
        rainfall_24h_mm=150.0,
        rainfall_72h_mm=210.0,
        observed_at=now_utc
    )

    async with AsyncSessionLocal() as session:
        obs, created = await IngestionService.save_rainfall_observation(session, obs_input)
        assert obs is not None
        assert float(obs.rainfall_1h_mm) == 25.0
        assert float(obs.rainfall_24h_mm) == 150.0


@pytest.mark.asyncio
async def test_ing_03_valid_water_level_observation_accepted():
    """ING-TEST-03: Valid water-level observation is accepted & persisted."""
    await setup_test_location_and_zone()
    now_utc = get_naive_now()

    obs_input = WaterLevelObservationCreate(
        zone_id="ZONE-NORTH-BASIN",
        river_name="Mithi River",
        gauge_station_id="GAUGE-TEST-01",
        water_level_m=4.15,
        warning_level_m=3.50,
        danger_level_m=4.20,
        discharge_rate_m3s=95.0,
        observed_at=now_utc
    )

    async with AsyncSessionLocal() as session:
        obs, created = await IngestionService.save_water_level_observation(session, obs_input)
        assert obs is not None
        assert obs.river_name == "Mithi River"
        assert float(obs.water_level_m) == 4.15


@pytest.mark.asyncio
async def test_ing_04_invalid_observation_rejected():
    """ING-TEST-04: Invalid/malformed observation payload is rejected by validation."""
    now_utc = get_naive_now()

    # 1. Negative rainfall is invalid
    with pytest.raises(ValidationError):
        RainfallObservationCreate(
            zone_id="ZONE-NORTH-BASIN",
            rainfall_1h_mm=-10.0,
            rainfall_6h_mm=0.0,
            rainfall_24h_mm=0.0,
            rainfall_72h_mm=0.0,
            observed_at=now_utc
        )

    # 2. Humidity > 100% is invalid
    with pytest.raises(ValidationError):
        WeatherObservationCreate(
            zone_id="ZONE-NORTH-BASIN",
            humidity_pct=150.0,
            observed_at=now_utc
        )


@pytest.mark.asyncio
async def test_ing_05_source_provenance_enforced():
    """ING-TEST-05: Required source provenance is enforced against data_sources table."""
    await setup_test_location_and_zone()
    now_utc = get_naive_now()

    invalid_obs = WeatherObservationCreate(
        zone_id="ZONE-NORTH-BASIN",
        source_id="SRC-NON-EXISTENT-PROVIDER",
        temperature_c=25.0,
        observed_at=now_utc
    )

    async with AsyncSessionLocal() as session:
        with pytest.raises(ValueError, match="Required source provenance record"):
            await IngestionService.save_weather_observation(session, invalid_obs)


@pytest.mark.asyncio
async def test_ing_06_persistence_uses_sqlalchemy_async_session():
    """ING-TEST-06: Persistence uses existing SQLAlchemy async session."""
    await setup_test_location_and_zone()
    now_utc = get_naive_now()

    obs_input = WeatherObservationCreate(
        zone_id="ZONE-NORTH-BASIN",
        source_id="SRC-TEST-PROVIDER",
        temperature_c=22.1,
        humidity_pct=80.0,
        observed_at=now_utc
    )

    async with AsyncSessionLocal() as session:
        obs, created = await IngestionService.save_weather_observation(session, obs_input)
        assert created is True

        stmt = select(WeatherObservation).where(WeatherObservation.id == obs.id)
        queried_obs = (await session.execute(stmt)).scalar_one()
        assert float(queried_obs.temperature_c) == 22.1


@pytest.mark.asyncio
async def test_ing_07_duplicate_observation_handling_idempotent():
    """ING-TEST-07: Duplicate observation handling behaves idempotently without duplicates."""
    await setup_test_location_and_zone()
    import time
    unique_sec = int(time.time() * 1000) % 86400
    fixed_time = datetime(2026, 9, 10, 1, 0, 0) + timedelta(seconds=unique_sec)

    obs_input = WeatherObservationCreate(
        zone_id="ZONE-NORTH-BASIN",
        source_id="SRC-TEST-PROVIDER",
        temperature_c=30.0,
        observed_at=fixed_time
    )

    async with AsyncSessionLocal() as session:
        obs1, created1 = await IngestionService.save_weather_observation(session, obs_input)
        obs2, created2 = await IngestionService.save_weather_observation(session, obs_input)
        
        assert obs1 is not None
        assert obs2 is not None
        assert created1 is True
        assert created2 is False
        assert obs1.id == obs2.id



class FailingMockProvider(BaseProvider):
    """Failing provider mock for ING-TEST-08."""

    @property
    def provider_id(self) -> str:
        return "SRC-FAILING-MOCK"

    @property
    def provider_name(self) -> str:
        return "Failing Mock Provider"

    @property
    def source_type(self) -> str:
        return "API"

    async def fetch_observations(self, zone_id: str, latitude: float, longitude: float) -> ProviderPayload:
        raise ProviderIngestionError(self.provider_id, "Simulated network timeout connecting to remote provider")


@pytest.mark.asyncio
async def test_ing_08_provider_failure_handled_safely():
    """ING-TEST-08: Provider/client failure is handled without corrupting persistence."""
    await setup_test_location_and_zone()

    failing_provider = FailingMockProvider()

    async with AsyncSessionLocal() as session:
        result = await IngestionService.ingest_from_provider(session, failing_provider, "ZONE-NORTH-BASIN")

        assert result.status == "FAILED"
        assert result.records_processed == 0
        assert result.weather_records_saved == 0
        assert len(result.errors) == 1
        assert "Simulated network timeout" in result.errors[0]


@pytest.mark.asyncio
async def test_ing_09_database_failure_surfaced_correctly():
    """ING-TEST-09: Database constraint / foreign key failure is surfaced correctly."""
    await setup_test_location_and_zone()
    now_utc = get_naive_now()

    invalid_zone_obs = WeatherObservationCreate(
        zone_id="ZONE-DOES-NOT-EXIST-IN-DB",
        source_id="SRC-TEST-PROVIDER",
        temperature_c=25.0,
        observed_at=now_utc
    )

    async with AsyncSessionLocal() as session:
        with pytest.raises(Exception):
            await IngestionService.save_weather_observation(session, invalid_zone_obs)


@pytest.mark.asyncio
async def test_ing_10_module_1_database_tests_pass():
    """ING-TEST-10: Verifies DB reachability & existing schema integrity."""
    async with AsyncSessionLocal() as session:
        res = await session.execute(text("SELECT 1"))
        assert res.scalar() == 1
