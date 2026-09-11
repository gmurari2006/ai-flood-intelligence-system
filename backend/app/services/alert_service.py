"""
Emergency Alert Management & Public Warning Service.

Handles alert creation, lifecycle expiration, officer overrides with audit logging,
and unauthenticated public warning feeds.
Matches Document 05 Sections 9 & 10 (FR-09, FR-10, FR-14).
"""

from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select, func, update, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import (
    Alert,
    AlertRecipient,
    SystemEvent,
    GeographicZone,
    User,
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


class AlertService:
    """Service for managing emergency flood alerts, overrides, and public broadcast notices."""

    SAFETY_INSTRUCTIONS = {
        "RED_EMERGENCY": [
            "Move to upper floors or nearest emergency shelter immediately.",
            "Do not walk or drive through flowing water.",
            "Keep emergency contacts ready."
        ],
        "CRITICAL": [
            "Mandatory evacuation ordered for all low-lying sectors.",
            "Move to designated emergency shelters immediately.",
            "Do not enter floodwaters."
        ],
        "HIGH": [
            "Prepare emergency grab-bags and monitor official broadcasts.",
            "Avoid low-lying basements and underpasses.",
            "Verify nearest evacuation shelter location."
        ],
        "MODERATE": [
            "Stay alert for rising river levels and municipal advisories.",
            "Clear local drain blockages if safe to do so."
        ],
        "LOW": [
            "Normal situational awareness. Monitor regular weather bulletins."
        ]
    }

    DEFAULT_INSTRUCTIONS = [
        "Follow guidance issued by local disaster management authorities.",
        "Stay informed via local radio and emergency broadcasts."
    ]

    @classmethod
    async def create_alert(
        cls,
        db: AsyncSession,
        current_user: User,
        req: AlertCreateRequest
    ) -> AlertCreateResponse:
        """Publishes a new emergency alert, creates recipient records, and audits event."""
        # 1. Verify zone exists
        zone = await db.get(GeographicZone, req.zone_id)
        if not zone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Geographic zone '{req.zone_id}' not found."
            )

        issued_at = datetime.now(timezone.utc).replace(tzinfo=None)
        expires_at = issued_at + timedelta(hours=req.duration_hours)

        # 2. Insert Alert
        new_alert = Alert(
            zone_id=req.zone_id,
            issued_by_user_id=current_user.id,
            severity=req.severity.upper(),
            title=req.title,
            message=req.message,
            status="ACTIVE",
            issued_at=issued_at,
            expires_at=expires_at
        )
        db.add(new_alert)
        await db.flush()

        # 3. Create Alert Recipients
        groups = req.recipient_groups or ["ALL_RESIDENTS", "EMERGENCY_SERVICES"]
        for grp in groups:
            recipient = AlertRecipient(
                alert_id=new_alert.id,
                recipient_group=grp,
                delivery_status="DELIVERED",
                sent_at=issued_at
            )
            db.add(recipient)

        # 4. Record System Audit Event
        audit_event = SystemEvent(
            user_id=current_user.id,
            event_type="ALERT_PUBLISHED",
            message=f"Alert '{req.title}' (Severity: {req.severity.upper()}) published for Zone '{req.zone_id}' by {current_user.username}.",
            event_timestamp=issued_at
        )
        db.add(audit_event)
        await db.commit()
        await db.refresh(new_alert)

        return AlertCreateResponse(
            alert_id=str(new_alert.id),
            status="ACTIVE",
            issued_at=new_alert.issued_at,
            expires_at=new_alert.expires_at
        )

    @classmethod
    async def get_alerts(
        cls,
        db: AsyncSession,
        status_filter: Optional[str] = None,
        zone_id: Optional[str] = None
    ) -> AlertListResponse:
        """Lists authority alerts and automatically transitions expired active records."""
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        # Auto-expire overdue active alerts
        expire_stmt = (
            update(Alert)
            .where(Alert.status == "ACTIVE", Alert.expires_at <= now)
            .values(status="EXPIRED")
        )
        await db.execute(expire_stmt)
        await db.commit()

        stmt = select(Alert).order_by(desc(Alert.issued_at))
        if status_filter:
            stmt = stmt.where(Alert.status == status_filter.upper())
        if zone_id:
            stmt = stmt.where(Alert.zone_id == zone_id)

        res = await db.execute(stmt)
        alert_records = res.scalars().all()

        alert_summaries = [
            AlertSummaryResponse(
                id=str(a.id),
                zone_id=a.zone_id,
                severity=a.severity,
                title=a.title,
                message=a.message,
                status=a.status,
                issued_at=a.issued_at,
                expires_at=a.expires_at
            )
            for a in alert_records
        ]

        return AlertListResponse(
            total_alerts=len(alert_summaries),
            alerts=alert_summaries
        )

    @classmethod
    async def override_alert(
        cls,
        db: AsyncSession,
        current_user: User,
        req: AlertOverrideRequest
    ) -> AlertOverrideResponse:
        """Applies manual emergency officer risk override and writes audit log to system_events."""
        zone = await db.get(GeographicZone, req.zone_id)
        if not zone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Geographic zone '{req.zone_id}' not found."
            )

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        expires_at = now + timedelta(hours=req.duration_hours)

        # Find existing active alert for zone or create override alert
        stmt = (
            select(Alert)
            .where(Alert.zone_id == req.zone_id, Alert.status == "ACTIVE")
            .order_by(desc(Alert.issued_at))
            .limit(1)
        )
        res = await db.execute(stmt)
        active_alert = res.scalar_one_or_none()

        prev_severity = active_alert.severity if active_alert else "BASELINE"

        if active_alert:
            active_alert.severity = req.override_severity.upper()
            active_alert.expires_at = expires_at
            active_alert.message = f"[OFFICER OVERRIDE] {req.justification}"
        else:
            active_alert = Alert(
                zone_id=req.zone_id,
                issued_by_user_id=current_user.id,
                severity=req.override_severity.upper(),
                title=f"MANUAL RISK OVERRIDE — {zone.name.upper()}",
                message=f"[OFFICER OVERRIDE] {req.justification}",
                status="ACTIVE",
                issued_at=now,
                expires_at=expires_at
            )
            db.add(active_alert)
            await db.flush()

        # Create audit event log
        audit_event = SystemEvent(
            user_id=current_user.id,
            event_type="OFFICER_OVERRIDE",
            message=(
                f"Officer '{current_user.username}' applied risk override on Zone '{req.zone_id}' "
                f"from '{prev_severity}' to '{req.override_severity.upper()}'. Justification: {req.justification}"
            ),
            event_timestamp=now
        )
        db.add(audit_event)
        await db.commit()
        await db.refresh(audit_event)

        return AlertOverrideResponse(
            status="OVERRIDE_APPLIED",
            zone_id=req.zone_id,
            effective_severity=req.override_severity.upper(),
            audit_event_id=audit_event.id,
            updated_at=now
        )

    @classmethod
    async def get_public_warnings(cls, db: AsyncSession) -> PublicWarningsResponse:
        """Retrieves active public warnings with dynamic safety instructions and zero sensitive data leakage."""
        now = datetime.now(timezone.utc).replace(tzinfo=None)

        # Auto-expire overdue active alerts
        expire_stmt = (
            update(Alert)
            .where(Alert.status == "ACTIVE", Alert.expires_at <= now)
            .values(status="EXPIRED")
        )
        await db.execute(expire_stmt)
        await db.commit()

        # Query active alerts joined with zone names
        stmt = (
            select(Alert, GeographicZone.name)
            .join(GeographicZone, GeographicZone.id == Alert.zone_id)
            .where(Alert.status == "ACTIVE", Alert.expires_at > now)
            .order_by(desc(Alert.issued_at))
        )
        res = await db.execute(stmt)
        rows = res.all()

        warnings = []
        for alert, zone_name in rows:
            severity = alert.severity.upper()
            safety_inst = cls.SAFETY_INSTRUCTIONS.get(severity, cls.DEFAULT_INSTRUCTIONS)

            warnings.append(
                PublicWarningItem(
                    zone_name=zone_name,
                    severity=severity,
                    title=alert.title,
                    message=alert.message,
                    safety_instructions=safety_inst,
                    issued_at=alert.issued_at,
                    expires_at=alert.expires_at
                )
            )

        return PublicWarningsResponse(
            active_warnings_count=len(warnings),
            warnings=warnings
        )
