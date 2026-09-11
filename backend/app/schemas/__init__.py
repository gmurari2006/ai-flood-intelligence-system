"""
Pydantic Schemas Package.
"""

from app.schemas.health import SystemHealthResponse, ComponentStatus
from app.schemas.ingestion import (
    DataSourceCreate,
    DataSourceResponse,
    WeatherObservationCreate,
    WeatherObservationResponse,
    RainfallObservationCreate,
    RainfallObservationResponse,
    WaterLevelObservationCreate,
    WaterLevelObservationResponse,
    ZoneWeatherViewResponse,
    ZoneWaterLevelViewResponse,
    IngestionResult,
)
from app.schemas.auth import (
    LoginRequest,
    UserOut,
    TokenResponse,
)
from app.schemas.zones import (
    CentroidSchema,
    ZoneSummarySchema,
    ZoneListResponse,
)
from app.schemas.predictions import (
    PredictionRequest,
    PredictionResponse,
)
from app.schemas.xai import (
    RiskFactorSchema,
    PredictionExplainResponse,
)
from app.schemas.gis import (
    GeoJSONGeometry,
    GeoJSONFeature,
    GeoJSONFeatureCollection,
)
from app.schemas.infrastructure import (
    InfrastructureAssetResponse,
    VulnerableInfrastructureListResponse,
)
from app.schemas.evacuation import (
    EvacuationShelterSummary,
    EvacuationShelterListResponse,
    EvacuationRoutePlanRequest,
    EvacuationRoutePlanResponse,
    RouteDetails,
    RoutePathGeoJSON,
)
from app.schemas.alerts import (
    AlertCreateRequest,
    AlertCreateResponse,
    AlertSummaryResponse,
    AlertListResponse,
    AlertOverrideRequest,
    AlertOverrideResponse,
    PublicWarningItem,
    PublicWarningsResponse,
)
from app.schemas.mcda import (
    MCDAWeightsConfig,
    MCDAFactorBreakdown,
    ZonePriorityRank,
    AlertPrioritizationResponse,
)
from app.schemas.analytics import (
    HistoricalFloodEventItem,
    HistoricalAnalyticsResponse,
    DataExportResponse,
)

__all__ = [
    "SystemHealthResponse",
    "ComponentStatus",
    "DataSourceCreate",
    "DataSourceResponse",
    "WeatherObservationCreate",
    "WeatherObservationResponse",
    "RainfallObservationCreate",
    "RainfallObservationResponse",
    "WaterLevelObservationCreate",
    "WaterLevelObservationResponse",
    "ZoneWeatherViewResponse",
    "ZoneWaterLevelViewResponse",
    "IngestionResult",
    "LoginRequest",
    "UserOut",
    "TokenResponse",
    "CentroidSchema",
    "ZoneSummarySchema",
    "ZoneListResponse",
    "PredictionRequest",
    "PredictionResponse",
    "RiskFactorSchema",
    "PredictionExplainResponse",
    "GeoJSONGeometry",
    "GeoJSONFeature",
    "GeoJSONFeatureCollection",
    "InfrastructureAssetResponse",
    "VulnerableInfrastructureListResponse",
    "EvacuationShelterSummary",
    "EvacuationShelterListResponse",
    "EvacuationRoutePlanRequest",
    "EvacuationRoutePlanResponse",
    "RouteDetails",
    "RoutePathGeoJSON",
    "AlertCreateRequest",
    "AlertCreateResponse",
    "AlertSummaryResponse",
    "AlertListResponse",
    "AlertOverrideRequest",
    "AlertOverrideResponse",
    "PublicWarningItem",
    "PublicWarningsResponse",
    "MCDAWeightsConfig",
    "MCDAFactorBreakdown",
    "ZonePriorityRank",
    "AlertPrioritizationResponse",
    "HistoricalFloodEventItem",
    "HistoricalAnalyticsResponse",
    "DataExportResponse",
]
