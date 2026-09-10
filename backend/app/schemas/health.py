"""
Health and System Diagnostics Schemas.

Complies with Document 05 Section 12.1.
"""

from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class ComponentStatus(BaseModel):
    status: str = Field(..., description="Component status (e.g. CONNECTED, READY, ACTIVE, DEGRADED, OFFLINE)")
    latency_ms: Optional[float] = Field(None, description="Latency in milliseconds if measured")
    active_model: Optional[str] = Field(None, description="Active ML model version ID if applicable")
    last_ingest: Optional[str] = Field(None, description="Last successful ingestion timestamp")


class SystemHealthResponse(BaseModel):
    status: str = Field(..., description="Overall system health status (e.g. HEALTHY, DEGRADED)")
    timestamp: datetime = Field(..., description="Diagnostics check timestamp")
    database: ComponentStatus = Field(..., description="Database connectivity status")
    ai_engine: ComponentStatus = Field(..., description="AI/ML runtime engine status")
    weather_stream: ComponentStatus = Field(..., description="Weather ingestion stream status")
