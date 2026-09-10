"""
Emergency Alerts & Warning Schemas.

Matches Document 05 Section 9 & 10 (FR-09, FR-10, FR-14).
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class AlertCreateRequest(BaseModel):
    """Regional flood alert creation payload by emergency authority."""
    zone_id: str = Field(..., max_length=50, description="Target geographic zone ID")
    severity: str = Field(..., description="Severity tier: LOW, MODERATE, HIGH, RED_EMERGENCY, CRITICAL")
    title: str = Field(..., max_length=200, description="Headline warning title")
    message: str = Field(..., description="Actionable alert instruction details")
    duration_hours: int = Field(12, ge=1, le=168, description="Alert validity period in hours (1-168)")
    recipient_groups: Optional[List[str]] = Field(None, description="Optional target dispatch groups")

    model_config = ConfigDict(extra="forbid")


class AlertCreateResponse(BaseModel):
    """Response payload following successful alert publication."""
    alert_id: str = Field(..., description="Unique alert UUID")
    status: str = Field("ACTIVE", description="Alert status (ACTIVE)")
    issued_at: datetime = Field(..., description="Timestamp alert was published")
    expires_at: datetime = Field(..., description="Timestamp alert expires")


class AlertSummaryResponse(BaseModel):
    """Detailed alert record for emergency command center view."""
    id: str = Field(..., description="Unique alert UUID")
    zone_id: str = Field(..., description="Target geographic zone ID")
    severity: str = Field(..., description="Alert severity level")
    title: str = Field(..., description="Alert headline title")
    message: str = Field(..., description="Alert narrative message")
    status: str = Field(..., description="Lifecycle status: ACTIVE, DRAFT, EXPIRED, CANCELLED")
    issued_at: datetime = Field(..., description="Issuance timestamp")
    expires_at: datetime = Field(..., description="Expiration timestamp")


class AlertListResponse(BaseModel):
    """List response payload for disaster management authorities."""
    total_alerts: int = Field(..., description="Total count of matching alert records")
    alerts: List[AlertSummaryResponse] = Field(default_factory=list, description="Array of alert records")


class AlertOverrideRequest(BaseModel):
    """Emergency officer operational risk & severity override request."""
    zone_id: str = Field(..., max_length=50, description="Target geographic zone ID")
    override_severity: str = Field(..., description="Overridden severity tier: LOW, MODERATE, HIGH, RED_EMERGENCY, CRITICAL")
    justification: str = Field(..., min_length=5, description="Mandatory operational rationale and field justification")
    duration_hours: int = Field(6, ge=1, le=168, description="Override validity duration in hours")

    model_config = ConfigDict(extra="forbid")


class AlertOverrideResponse(BaseModel):
    """Response payload confirming officer override applied and audited."""
    status: str = Field("OVERRIDE_APPLIED", description="Override operation status")
    zone_id: str = Field(..., description="Target geographic zone ID")
    effective_severity: str = Field(..., description="New effective severity tier")
    audit_event_id: int = Field(..., description="Audit system event log ID")
    updated_at: datetime = Field(..., description="Timestamp override was committed")


class PublicWarningItem(BaseModel):
    """Sanitized public warning item for citizen consumption."""
    zone_name: str = Field(..., description="Affected geographic zone name")
    severity: str = Field(..., description="Warning severity classification")
    title: str = Field(..., description="Warning headline")
    message: str = Field(..., description="Public advisory message")
    safety_instructions: List[str] = Field(default_factory=list, description="Dynamic actionable protective instructions")
    issued_at: datetime = Field(..., description="Issuance timestamp")
    expires_at: datetime = Field(..., description="Expiration timestamp")


class PublicWarningsResponse(BaseModel):
    """Public warning response payload (unauthenticated citizen portal)."""
    active_warnings_count: int = Field(..., description="Number of active emergency warnings")
    warnings: List[PublicWarningItem] = Field(default_factory=list, description="Array of public warnings")
