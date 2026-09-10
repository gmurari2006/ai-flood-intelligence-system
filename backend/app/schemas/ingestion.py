"""
Pydantic Validation Schemas for Environmental Ingestion Data.

Defines ingestion request/response validation schemas matching Document 03 & 05 specifications.
"""

from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


def _strip_tz(v: datetime) -> datetime:
    if isinstance(v, datetime) and v.tzinfo is not None:
        return v.astimezone(timezone.utc).replace(tzinfo=None)
    return v


class DataSourceCreate(BaseModel):
    id: str = Field(..., max_length=50, description="Data source identifier")
    provider_name: str = Field(..., max_length=100, description="Provider name")
    source_type: str = Field(..., max_length=50, description="API, RIVER_GAUGE_SENSOR, DEM_SATELLITE")
    update_frequency_minutes: int = Field(15, ge=1)
    status: str = Field("ACTIVE", max_length=20)


class DataSourceResponse(DataSourceCreate):
    model_config = ConfigDict(from_attributes=True)


class WeatherObservationCreate(BaseModel):
    zone_id: str = Field(..., max_length=50, description="Target geographic zone ID")
    source_id: Optional[str] = Field(None, max_length=50, description="Data source provider ID")
    temperature_c: Optional[float] = Field(None, ge=-50.0, le=70.0, description="Temperature in Celsius")
    humidity_pct: Optional[float] = Field(None, ge=0.0, le=100.0, description="Relative humidity percentage")
    wind_speed_kmh: Optional[float] = Field(None, ge=0.0, le=300.0, description="Wind speed in km/h")
    observed_at: datetime = Field(..., description="Timestamp of observation")

    @field_validator("observed_at", mode="after")
    @classmethod
    def convert_tz_to_naive(cls, v: datetime) -> datetime:
        return _strip_tz(v)


class WeatherObservationResponse(WeatherObservationCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class RainfallObservationCreate(BaseModel):
    zone_id: str = Field(..., max_length=50, description="Target geographic zone ID")
    source_id: Optional[str] = Field(None, max_length=50, description="Data source provider ID")
    rainfall_1h_mm: float = Field(..., ge=0.0, description="1-hour accumulated rainfall in mm")
    rainfall_6h_mm: float = Field(..., ge=0.0, description="6-hour accumulated rainfall in mm")
    rainfall_24h_mm: float = Field(..., ge=0.0, description="24-hour accumulated rainfall in mm")
    rainfall_72h_mm: float = Field(..., ge=0.0, description="72-hour accumulated rainfall in mm")
    observed_at: datetime = Field(..., description="Timestamp of observation")

    @field_validator("observed_at", mode="after")
    @classmethod
    def convert_tz_to_naive(cls, v: datetime) -> datetime:
        return _strip_tz(v)


class RainfallObservationResponse(RainfallObservationCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class WaterLevelObservationCreate(BaseModel):
    zone_id: str = Field(..., max_length=50, description="Target geographic zone ID")
    river_name: str = Field(..., max_length=100, description="River name")
    gauge_station_id: str = Field(..., max_length=50, description="Physical gauge station ID")
    water_level_m: float = Field(..., ge=0.0, description="Current water level height in meters")
    warning_level_m: float = Field(..., ge=0.0, description="River warning threshold stage height")
    danger_level_m: float = Field(..., ge=0.0, description="River danger threshold stage height")
    discharge_rate_m3s: Optional[float] = Field(None, ge=0.0, description="Water discharge rate m3/s")
    observed_at: datetime = Field(..., description="Timestamp of observation")

    @field_validator("observed_at", mode="after")
    @classmethod
    def convert_tz_to_naive(cls, v: datetime) -> datetime:
        return _strip_tz(v)


class WaterLevelObservationResponse(WaterLevelObservationCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class RainfallMetricsSchema(BaseModel):

    field_1h_mm: float = Field(..., alias="1h_mm")
    field_6h_mm: float = Field(..., alias="6h_mm")
    field_24h_mm: float = Field(..., alias="24h_mm")
    field_72h_mm: float = Field(..., alias="72h_mm")

    model_config = ConfigDict(populate_by_name=True)


class ZoneWeatherViewResponse(BaseModel):
    zone_id: str
    observed_at: datetime
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    rainfall: RainfallMetricsSchema


class ZoneWaterLevelViewResponse(BaseModel):
    zone_id: str
    river_name: str
    gauge_station_id: str
    water_level_m: float
    warning_level_m: float
    danger_level_m: float
    status: str


class IngestionResult(BaseModel):
    provider_id: str
    zone_id: str
    status: str
    records_processed: int
    weather_records_saved: int
    rainfall_records_saved: int
    water_level_records_saved: int
    skipped_duplicates: int
    errors: list[str] = []
