"""
API Version 1 Central Router.

Aggregates all v1 endpoint sub-routers.
"""

from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    health,
    auth,
    zones,
    weather,
    water_levels,
    predictions,
    ingestion,
    risk_map,
    infrastructure,
    evacuation,
    alerts,
    analytics,
)

api_router = APIRouter()

# Register endpoint sub-routers
api_router.include_router(health.router, tags=["Diagnostics & System"])
api_router.include_router(auth.router, tags=["Authentication & Access Control"])
api_router.include_router(zones.router, tags=["Geographic Zones"])
api_router.include_router(weather.router, tags=["Environmental & Weather Ingestion"])
api_router.include_router(water_levels.router, tags=["Environmental & Water Levels"])
api_router.include_router(predictions.router, tags=["AI Flood Predictions & Decision Support"])
api_router.include_router(ingestion.router, tags=["Data Ingestion & Management"])
api_router.include_router(risk_map.router, tags=["GIS & Spatial Risk Map"])
api_router.include_router(infrastructure.router, tags=["Infrastructure Vulnerability"])
api_router.include_router(evacuation.router, tags=["Evacuation Centers & Safe Routes"])
api_router.include_router(alerts.router, tags=["Emergency Alerts & Warning Prioritization"])
api_router.include_router(analytics.router, tags=["Historical Analytics & Data Export"])
