"""
Pydantic Schemas Package.
"""

from backend.app.schemas.health import SystemHealthResponse, ComponentStatus
from backend.app.schemas.ingestion import (
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
from backend.app.schemas.auth import (
    LoginRequest,
    UserOut,
    TokenResponse,
)
from backend.app.schemas.zones import (
    CentroidSchema,
    ZoneSummarySchema,
    ZoneListResponse,
)
from backend.app.schemas.predictions import (
    PredictionRequest,
    PredictionResponse,
)
from backend.app.schemas.xai import (
    RiskFactorSchema,
    PredictionExplainResponse,
)
from backend.app.schemas.gis import (
    GeoJSONGeometry,
    GeoJSONFeature,
    GeoJSONFeatureCollection,
)
from backend.app.schemas.infrastructure import (
    InfrastructureAssetResponse,
    VulnerableInfrastructureListResponse,
)
from backend.app.schemas.evacuation import (
    EvacuationShelterSummary,
    EvacuationShelterListResponse,
    EvacuationRoutePlanRequest,
    EvacuationRoutePlanResponse,
    RouteDetails,
    RoutePathGeoJSON,
)
from backend.app.schemas.alerts import (
    AlertCreateRequest,
    AlertCreateResponse,
    AlertSummaryResponse,
    AlertListResponse,
    AlertOverrideRequest,
    AlertOverrideResponse,
    PublicWarningItem,
    PublicWarningsResponse,
)
from backend.app.schemas.mcda import (
    MCDAWeightsConfig,
    MCDAFactorBreakdown,
    ZonePriorityRank,
    AlertPrioritizationResponse,
)
from backend.app.schemas.analytics import (
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
