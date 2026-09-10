"""
Historical Analytics & Data Export Schemas.

Matches Document 05 Section 11 (FR-11, FR-15).
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class HistoricalFloodEventItem(BaseModel):
    """Historical flood record entry."""
    event_id: str = Field(..., description="Unique historical flood event UUID")
    event_date: str = Field(..., description="Date of flood event (YYYY-MM-DD)")
    peak_water_depth_m: Optional[float] = Field(None, description="Peak recorded inundation depth in meters")
    total_rainfall_mm: Optional[float] = Field(None, description="Total recorded storm accumulation in mm")
    severity_level: Optional[str] = Field(None, description="Historical severity categorization")
    notes: Optional[str] = Field(None, description="Archival event summary notes")


class HistoricalAnalyticsResponse(BaseModel):
    """Historical flood events response payload."""
    zone_id: Optional[str] = Field(None, description="Target zone filter if applied")
    total_recorded_events: int = Field(..., description="Total count of historical flood events returned")
    historical_events: List[HistoricalFloodEventItem] = Field(default_factory=list, description="Array of historical event records")


class DataExportResponse(BaseModel):
    """JSON formatted export payload."""
    exported_at: datetime = Field(..., description="Timestamp of data export execution")
    record_count: int = Field(..., description="Total count of records in export")
    data_type: str = Field(..., description="Exported dataset type: predictions, alerts, infrastructure, zones, historical")
    records: List[Dict[str, Any]] = Field(default_factory=list, description="Exported data records")
