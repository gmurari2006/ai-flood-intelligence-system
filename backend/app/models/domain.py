"""
SQLAlchemy 2.0 Domain ORM Models.

Maps database tables defined in database/init.sql.
"""

import uuid
from datetime import datetime, date
from typing import Optional
from sqlalchemy import (
    String, Integer, BigInteger, Numeric, Boolean, Text, DateTime, Date, ForeignKey, func
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry
from backend.app.db.base import Base


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    state_name: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), server_default="India")
    bounding_box = mapped_column(Geometry("POLYGON", srid=4326), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    zones: Mapped[list["GeographicZone"]] = relationship("GeographicZone", back_populates="location")


class GeographicZone(Base):
    __tablename__ = "geographic_zones"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    location_id: Mapped[str] = mapped_column(String(50), ForeignKey("locations.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    elevation_mean_m: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    slope_mean_deg: Mapped[Optional[float]] = mapped_column(Numeric(4, 2), nullable=True)
    drainage_capacity_score: Mapped[Optional[float]] = mapped_column(Numeric(4, 2), nullable=True)
    soil_permeability_index: Mapped[Optional[float]] = mapped_column(Numeric(4, 2), nullable=True)
    population_density: Mapped[Optional[float]] = mapped_column(Numeric(8, 2), nullable=True)
    boundary = mapped_column(Geometry("POLYGON", srid=4326), nullable=False)
    centroid = mapped_column(Geometry("POINT", srid=4326), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    location: Mapped["Location"] = relationship("Location", back_populates="zones")
    weather_observations: Mapped[list["WeatherObservation"]] = relationship("WeatherObservation", back_populates="zone")
    rainfall_observations: Mapped[list["RainfallObservation"]] = relationship("RainfallObservation", back_populates="zone")
    water_level_observations: Mapped[list["WaterLevelObservation"]] = relationship("WaterLevelObservation", back_populates="zone")
    infrastructure_assets: Mapped[list["InfrastructureAsset"]] = relationship("InfrastructureAsset", back_populates="zone")
    alerts: Mapped[list["Alert"]] = relationship("Alert", back_populates="zone")


class DataSource(Base):
    __tablename__ = "data_sources"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    provider_name: Mapped[str] = mapped_column(String(100), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    update_frequency_minutes: Mapped[int] = mapped_column(Integer, server_default="15")
    status: Mapped[str] = mapped_column(String(20), server_default="ACTIVE")


class WeatherObservation(Base):
    __tablename__ = "weather_observations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    zone_id: Mapped[str] = mapped_column(String(50), ForeignKey("geographic_zones.id"), nullable=False)
    source_id: Mapped[Optional[str]] = mapped_column(String(50), ForeignKey("data_sources.id"), nullable=True)
    temperature_c: Mapped[Optional[float]] = mapped_column(Numeric(4, 1), nullable=True)
    humidity_pct: Mapped[Optional[float]] = mapped_column(Numeric(4, 1), nullable=True)
    wind_speed_kmh: Mapped[Optional[float]] = mapped_column(Numeric(5, 1), nullable=True)
    observed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    zone: Mapped["GeographicZone"] = relationship("GeographicZone", back_populates="weather_observations")
    source: Mapped[Optional["DataSource"]] = relationship("DataSource")


class RainfallObservation(Base):
    __tablename__ = "rainfall_observations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    zone_id: Mapped[str] = mapped_column(String(50), ForeignKey("geographic_zones.id"), nullable=False)
    source_id: Mapped[Optional[str]] = mapped_column(String(50), ForeignKey("data_sources.id"), nullable=True)
    rainfall_1h_mm: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    rainfall_6h_mm: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    rainfall_24h_mm: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    rainfall_72h_mm: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    observed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    zone: Mapped["GeographicZone"] = relationship("GeographicZone", back_populates="rainfall_observations")
    source: Mapped[Optional["DataSource"]] = relationship("DataSource")


class WaterLevelObservation(Base):
    __tablename__ = "water_level_observations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    zone_id: Mapped[str] = mapped_column(String(50), ForeignKey("geographic_zones.id"), nullable=False)
    river_name: Mapped[str] = mapped_column(String(100), nullable=False)
    gauge_station_id: Mapped[str] = mapped_column(String(50), nullable=False)
    water_level_m: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    warning_level_m: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    danger_level_m: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    discharge_rate_m3s: Mapped[Optional[float]] = mapped_column(Numeric(8, 2), nullable=True)
    observed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    zone: Mapped["GeographicZone"] = relationship("GeographicZone", back_populates="water_level_observations")


class HistoricalFloodEvent(Base):
    __tablename__ = "historical_flood_events"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    zone_id: Mapped[str] = mapped_column(String(50), ForeignKey("geographic_zones.id"), nullable=False)
    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    peak_water_depth_m: Mapped[Optional[float]] = mapped_column(Numeric(4, 2), nullable=True)
    total_rainfall_mm: Mapped[Optional[float]] = mapped_column(Numeric(6, 2), nullable=True)
    severity_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    zone: Mapped["GeographicZone"] = relationship("GeographicZone")


class UserRole(Base):
    __tablename__ = "user_roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    role_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    users: Mapped[list["User"]] = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey("user_roles.id"), nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    organization: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    role: Mapped["UserRole"] = relationship("UserRole", back_populates="users")
    alerts: Mapped[list["Alert"]] = relationship("Alert", back_populates="issued_by")
    system_events: Mapped[list["SystemEvent"]] = relationship("SystemEvent", back_populates="user")


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    algorithm: Mapped[str] = mapped_column(String(50), nullable=False)
    accuracy_roc_auc: Mapped[Optional[float]] = mapped_column(Numeric(4, 3), nullable=True)
    artifact_path: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
    trained_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class PredictionRun(Base):
    __tablename__ = "prediction_runs"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    zone_id: Mapped[str] = mapped_column(String(50), ForeignKey("geographic_zones.id"), nullable=False)
    model_version_id: Mapped[str] = mapped_column(String(50), ForeignKey("model_versions.id"), nullable=False)
    forecast_horizon_hours: Mapped[int] = mapped_column(Integer, nullable=False)
    run_timestamp: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    zone: Mapped["GeographicZone"] = relationship("GeographicZone")
    model_version: Mapped["ModelVersion"] = relationship("ModelVersion")
    prediction: Mapped[Optional["FloodPrediction"]] = relationship("FloodPrediction", back_populates="prediction_run", uselist=False, cascade="all, delete-orphan")
    risk_score: Mapped[Optional["RiskScore"]] = relationship("RiskScore", back_populates="prediction_run", uselist=False, cascade="all, delete-orphan")
    risk_factors: Mapped[list["RiskFactor"]] = relationship("RiskFactor", back_populates="prediction_run", cascade="all, delete-orphan")
    infrastructure_risks: Mapped[list["InfrastructureRisk"]] = relationship("InfrastructureRisk", back_populates="prediction_run", cascade="all, delete-orphan")


class FloodPrediction(Base):
    __tablename__ = "flood_predictions"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    prediction_run_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("prediction_runs.id", ondelete="CASCADE"), unique=True, nullable=False)
    flood_probability: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False)
    predicted_depth_m: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False)
    is_demo_data: Mapped[bool] = mapped_column(Boolean, server_default="false")

    prediction_run: Mapped["PredictionRun"] = relationship("PredictionRun", back_populates="prediction")


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    prediction_run_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("prediction_runs.id", ondelete="CASCADE"), unique=True, nullable=False)
    risk_score_numeric: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    recommended_action: Mapped[str] = mapped_column(Text, nullable=False)

    prediction_run: Mapped["PredictionRun"] = relationship("PredictionRun", back_populates="risk_score")


class RiskFactor(Base):
    __tablename__ = "risk_factors"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    prediction_run_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("prediction_runs.id", ondelete="CASCADE"), nullable=False)
    feature_name: Mapped[str] = mapped_column(String(100), nullable=False)
    feature_value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    shap_contribution: Mapped[float] = mapped_column(Numeric(6, 3), nullable=False)
    impact_direction: Mapped[str] = mapped_column(String(20), nullable=False)

    prediction_run: Mapped["PredictionRun"] = relationship("PredictionRun", back_populates="risk_factors")


class InfrastructureAsset(Base):
    __tablename__ = "infrastructure_assets"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    zone_id: Mapped[str] = mapped_column(String(50), ForeignKey("geographic_zones.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    asset_type: Mapped[str] = mapped_column(String(50), nullable=False)
    elevation_m: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    location = mapped_column(Geometry("POINT", srid=4326), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    zone: Mapped["GeographicZone"] = relationship("GeographicZone", back_populates="infrastructure_assets")
    risk_assessments: Mapped[list["InfrastructureRisk"]] = relationship("InfrastructureRisk", back_populates="asset", cascade="all, delete-orphan")


class InfrastructureRisk(Base):
    __tablename__ = "infrastructure_risk"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    prediction_run_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("prediction_runs.id", ondelete="CASCADE"), nullable=False)
    asset_id: Mapped[str] = mapped_column(String(50), ForeignKey("infrastructure_assets.id"), nullable=False)
    vulnerability_status: Mapped[str] = mapped_column(String(20), nullable=False)
    estimated_water_depth_m: Mapped[float] = mapped_column(Numeric(4, 2), server_default="0.00")
    recommended_protection: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    prediction_run: Mapped["PredictionRun"] = relationship("PredictionRun", back_populates="infrastructure_risks")
    asset: Mapped["InfrastructureAsset"] = relationship("InfrastructureAsset", back_populates="risk_assessments")


class EvacuationCenter(Base):
    __tablename__ = "evacuation_centers"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    max_capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    current_occupancy: Mapped[int] = mapped_column(Integer, server_default="0")
    has_backup_power: Mapped[bool] = mapped_column(Boolean, server_default="true")
    location = mapped_column(Geometry("POINT", srid=4326), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())
    zone_id: Mapped[str] = mapped_column(String(50), ForeignKey("geographic_zones.id"), nullable=False)
    issued_by_user_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), server_default="ACTIVE")
    issued_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    zone: Mapped["GeographicZone"] = relationship("GeographicZone", back_populates="alerts")
    issued_by: Mapped["User"] = relationship("User", back_populates="alerts")
    recipients: Mapped[list["AlertRecipient"]] = relationship("AlertRecipient", back_populates="alert", cascade="all, delete-orphan")


class AlertRecipient(Base):
    __tablename__ = "alert_recipients"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    alert_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False)
    recipient_group: Mapped[str] = mapped_column(String(50), nullable=False)
    delivery_status: Mapped[str] = mapped_column(String(20), server_default="DELIVERED")
    sent_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    alert: Mapped["Alert"] = relationship("Alert", back_populates="recipients")


class SystemEvent(Base):
    __tablename__ = "system_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    event_timestamp: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped[Optional["User"]] = relationship("User", back_populates="system_events")

