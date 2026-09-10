"""
Environmental Data Ingestion & Persistence Service.

Provides persistence, source provenance enforcement, idempotency, and query methods
using SQLAlchemy 2.0 AsyncSession.
"""

from datetime import datetime
from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.logging import logger
from backend.app.models.domain import (
    DataSource,
    WeatherObservation,
    RainfallObservation,
    WaterLevelObservation,
    GeographicZone,
)
from backend.app.schemas.ingestion import (
    WeatherObservationCreate,
    RainfallObservationCreate,
    WaterLevelObservationCreate,
    DataSourceCreate,
    DataSourceResponse,
    ZoneWeatherViewResponse,
    RainfallMetricsSchema,
    ZoneWaterLevelViewResponse,
    IngestionResult,
)
from backend.app.ingestion.base import BaseProvider, ProviderIngestionError


class IngestionService:
    """Service handling database persistence, provenance validation, and query operations."""

    @staticmethod
    async def ensure_data_source_exists(
        db: AsyncSession,
        source: DataSourceCreate
    ) -> DataSource:
        """Ensures that a data source record exists in data_sources table (Source Provenance)."""
        stmt = select(DataSource).where(DataSource.id == source.id)
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            return existing

        new_source = DataSource(
            id=source.id,
            provider_name=source.provider_name,
            source_type=source.source_type,
            update_frequency_minutes=source.update_frequency_minutes,
            status=source.status,
        )
        db.add(new_source)
        await db.commit()
        await db.refresh(new_source)
        logger.info(f"Registered new data source provenance record: '{new_source.id}' ({new_source.provider_name})")
        return new_source

    @staticmethod
    async def get_all_data_sources(db: AsyncSession) -> list[DataSourceResponse]:
        """Fetches all registered data sources from data_sources table."""
        stmt = select(DataSource)
        result = await db.execute(stmt)
        sources = result.scalars().all()
        return [DataSourceResponse.model_validate(s) for s in sources]

    @staticmethod
    async def save_weather_observation(
        db: AsyncSession,
        data: WeatherObservationCreate
    ) -> tuple[Optional[WeatherObservation], bool]:
        """
        Saves a weather observation idempotently.
        Returns tuple: (observation_orm, is_created).
        """
        # Enforce source provenance if source_id is provided
        if data.source_id:
            source_stmt = select(DataSource).where(DataSource.id == data.source_id)
            source_res = await db.execute(source_stmt)
            if not source_res.scalar_one_or_none():
                raise ValueError(f"Required source provenance record '{data.source_id}' does not exist in data_sources")

        # Idempotency Check: check for duplicate (zone_id, observed_at)
        dup_stmt = select(WeatherObservation).where(
            WeatherObservation.zone_id == data.zone_id,
            WeatherObservation.observed_at == data.observed_at
        )
        dup_res = await db.execute(dup_stmt)
        existing = dup_res.scalar_one_or_none()

        if existing:
            logger.debug(f"Duplicate weather observation for zone '{data.zone_id}' at {data.observed_at} skipped.")
            return existing, False

        obs = WeatherObservation(
            zone_id=data.zone_id,
            source_id=data.source_id,
            temperature_c=data.temperature_c,
            humidity_pct=data.humidity_pct,
            wind_speed_kmh=data.wind_speed_kmh,
            observed_at=data.observed_at
        )
        db.add(obs)
        await db.commit()
        await db.refresh(obs)
        return obs, True

    @staticmethod
    async def save_rainfall_observation(
        db: AsyncSession,
        data: RainfallObservationCreate
    ) -> tuple[Optional[RainfallObservation], bool]:
        """
        Saves a rainfall observation idempotently.
        Returns tuple: (observation_orm, is_created).
        """
        # Enforce source provenance
        if data.source_id:
            source_stmt = select(DataSource).where(DataSource.id == data.source_id)
            source_res = await db.execute(source_stmt)
            if not source_res.scalar_one_or_none():
                raise ValueError(f"Required source provenance record '{data.source_id}' does not exist in data_sources")

        # Idempotency Check
        dup_stmt = select(RainfallObservation).where(
            RainfallObservation.zone_id == data.zone_id,
            RainfallObservation.observed_at == data.observed_at
        )
        dup_res = await db.execute(dup_stmt)
        existing = dup_res.scalar_one_or_none()

        if existing:
            logger.debug(f"Duplicate rainfall observation for zone '{data.zone_id}' at {data.observed_at} skipped.")
            return existing, False

        obs = RainfallObservation(
            zone_id=data.zone_id,
            source_id=data.source_id,
            rainfall_1h_mm=data.rainfall_1h_mm,
            rainfall_6h_mm=data.rainfall_6h_mm,
            rainfall_24h_mm=data.rainfall_24h_mm,
            rainfall_72h_mm=data.rainfall_72h_mm,
            observed_at=data.observed_at
        )
        db.add(obs)
        await db.commit()
        await db.refresh(obs)
        return obs, True

    @staticmethod
    async def save_water_level_observation(
        db: AsyncSession,
        data: WaterLevelObservationCreate
    ) -> tuple[Optional[WaterLevelObservation], bool]:
        """
        Saves a water level gauge observation idempotently.
        Returns tuple: (observation_orm, is_created).
        """
        # Idempotency Check
        dup_stmt = select(WaterLevelObservation).where(
            WaterLevelObservation.zone_id == data.zone_id,
            WaterLevelObservation.gauge_station_id == data.gauge_station_id,
            WaterLevelObservation.observed_at == data.observed_at
        )
        dup_res = await db.execute(dup_stmt)
        existing = dup_res.scalar_one_or_none()

        if existing:
            logger.debug(f"Duplicate water level observation for station '{data.gauge_station_id}' at {data.observed_at} skipped.")
            return existing, False

        obs = WaterLevelObservation(
            zone_id=data.zone_id,
            river_name=data.river_name,
            gauge_station_id=data.gauge_station_id,
            water_level_m=data.water_level_m,
            warning_level_m=data.warning_level_m,
            danger_level_m=data.danger_level_m,
            discharge_rate_m3s=data.discharge_rate_m3s,
            observed_at=data.observed_at
        )
        db.add(obs)
        await db.commit()
        await db.refresh(obs)
        return obs, True

    @classmethod
    async def ingest_from_provider(
        cls,
        db: AsyncSession,
        provider: BaseProvider,
        zone_id: str,
        latitude: float = 19.0760,
        longitude: float = 72.8777
    ) -> IngestionResult:
        """
        Executes end-to-end ingestion flow for a given provider and geographic zone:
        Provider -> Payload -> Validation -> Provenance Check -> Persistence.
        """
        # Step 1: Ensure provider registration in data_sources table
        await cls.ensure_data_source_exists(
            db,
            DataSourceCreate(
                id=provider.provider_id,
                provider_name=provider.provider_name,
                source_type=provider.source_type,
                update_frequency_minutes=15,
                status="ACTIVE"
            )
        )

        weather_saved = 0
        rainfall_saved = 0
        water_level_saved = 0
        skipped_duplicates = 0
        errors: list[str] = []

        # Step 2: Fetch data from provider
        try:
            payload = await provider.fetch_observations(zone_id, latitude, longitude)
        except ProviderIngestionError as pie:
            logger.error(f"Provider ingestion error: {pie}")
            errors.append(str(pie))
            return IngestionResult(
                provider_id=provider.provider_id,
                zone_id=zone_id,
                status="FAILED",
                records_processed=0,
                weather_records_saved=0,
                rainfall_records_saved=0,
                water_level_records_saved=0,
                skipped_duplicates=0,
                errors=errors
            )

        # Step 3: Persist payload components with idempotency
        if payload.weather:
            try:
                _, created = await cls.save_weather_observation(db, payload.weather)
                if created:
                    weather_saved += 1
                else:
                    skipped_duplicates += 1
            except Exception as e:
                err_msg = f"Failed to save weather observation: {e}"
                logger.error(err_msg)
                errors.append(err_msg)

        if payload.rainfall:
            try:
                _, created = await cls.save_rainfall_observation(db, payload.rainfall)
                if created:
                    rainfall_saved += 1
                else:
                    skipped_duplicates += 1
            except Exception as e:
                err_msg = f"Failed to save rainfall observation: {e}"
                logger.error(err_msg)
                errors.append(err_msg)

        if payload.water_level:
            try:
                _, created = await cls.save_water_level_observation(db, payload.water_level)
                if created:
                    water_level_saved += 1
                else:
                    skipped_duplicates += 1
            except Exception as e:
                err_msg = f"Failed to save water level observation: {e}"
                logger.error(err_msg)
                errors.append(err_msg)

        total_processed = (1 if payload.weather else 0) + (1 if payload.rainfall else 0) + (1 if payload.water_level else 0)
        status_str = "SUCCESS" if not errors else "PARTIAL_SUCCESS"

        logger.info(
            f"Ingestion completed for provider '{provider.provider_id}', zone '{zone_id}': "
            f"processed={total_processed}, weather_saved={weather_saved}, rainfall_saved={rainfall_saved}, "
            f"water_level_saved={water_level_saved}, skipped={skipped_duplicates}"
        )

        return IngestionResult(
            provider_id=provider.provider_id,
            zone_id=zone_id,
            status=status_str,
            records_processed=total_processed,
            weather_records_saved=weather_saved,
            rainfall_records_saved=rainfall_saved,
            water_level_records_saved=water_level_saved,
            skipped_duplicates=skipped_duplicates,
            errors=errors
        )

    @staticmethod
    async def get_latest_weather_for_zone(
        db: AsyncSession,
        zone_id: str
    ) -> Optional[ZoneWeatherViewResponse]:
        """Fetches the latest weather & rainfall observations for a zone per Doc 05 Section 4.1."""
        weather_stmt = (
            select(WeatherObservation)
            .where(WeatherObservation.zone_id == zone_id)
            .order_by(WeatherObservation.observed_at.desc())
            .limit(1)
        )
        weather_res = await db.execute(weather_stmt)
        weather_obs = weather_res.scalar_one_or_none()

        rainfall_stmt = (
            select(RainfallObservation)
            .where(RainfallObservation.zone_id == zone_id)
            .order_by(RainfallObservation.observed_at.desc())
            .limit(1)
        )
        rainfall_res = await db.execute(rainfall_stmt)
        rainfall_obs = rainfall_res.scalar_one_or_none()

        if not weather_obs and not rainfall_obs:
            return None

        obs_time = weather_obs.observed_at if weather_obs else rainfall_obs.observed_at  # type: ignore

        return ZoneWeatherViewResponse(
            zone_id=zone_id,
            observed_at=obs_time,
            temperature_c=float(weather_obs.temperature_c) if weather_obs and weather_obs.temperature_c is not None else 27.5,
            humidity_pct=float(weather_obs.humidity_pct) if weather_obs and weather_obs.humidity_pct is not None else 90.0,
            rainfall=RainfallMetricsSchema(
                **{
                    "1h_mm": float(rainfall_obs.rainfall_1h_mm) if rainfall_obs else 0.0,
                    "6h_mm": float(rainfall_obs.rainfall_6h_mm) if rainfall_obs else 0.0,
                    "24h_mm": float(rainfall_obs.rainfall_24h_mm) if rainfall_obs else 0.0,
                    "72h_mm": float(rainfall_obs.rainfall_72h_mm) if rainfall_obs else 0.0,
                }
            )
        )

    @staticmethod
    async def get_latest_water_level_for_zone(
        db: AsyncSession,
        zone_id: str
    ) -> Optional[ZoneWaterLevelViewResponse]:
        """Fetches the latest water level gauge reading for a zone per Doc 05 Section 4.2."""
        stmt = (
            select(WaterLevelObservation)
            .where(WaterLevelObservation.zone_id == zone_id)
            .order_by(WaterLevelObservation.observed_at.desc())
            .limit(1)
        )
        result = await db.execute(stmt)
        obs = result.scalar_one_or_none()

        if not obs:
            return None

        water_lvl = float(obs.water_level_m)
        warn_lvl = float(obs.warning_level_m)
        danger_lvl = float(obs.danger_level_m)

        if water_lvl >= danger_lvl:
            status_str = "DANGER_EXCEEDED"
        elif water_lvl >= warn_lvl:
            status_str = "WARNING_EXCEEDED"
        else:
            status_str = "NORMAL"

        return ZoneWaterLevelViewResponse(
            zone_id=zone_id,
            river_name=obs.river_name,
            gauge_station_id=obs.gauge_station_id,
            water_level_m=water_lvl,
            warning_level_m=warn_lvl,
            danger_level_m=danger_lvl,
            status=status_str
        )
