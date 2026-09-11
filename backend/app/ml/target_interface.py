"""
Historical Flood Target Retrieval Interface.

Provides interface methods to query real historical flood events from historical_flood_events table.
Does NOT fabricate synthetic labels or seed dummy event rows.
"""

from datetime import date, datetime, timezone
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.domain import HistoricalFloodEvent
from app.ml.schemas import HistoricalTargetRecord


class TargetDatasetError(Exception):
    """Raised when target availability criteria or historical labels are insufficient for model training."""
    pass


class HistoricalTargetInterface:
    """Retrieves real historical flood ground truth labels without generating synthetic data."""

    @staticmethod
    async def get_target_for_zone_and_date(
        db: AsyncSession,
        zone_id: str,
        target_date: date
    ) -> Optional[HistoricalTargetRecord]:
        """
        Retrieves real historical flood event for a zone and date.
        Returns HistoricalTargetRecord or None if no real record exists.
        """
        stmt = (
            select(HistoricalFloodEvent)
            .where(
                HistoricalFloodEvent.zone_id == zone_id,
                HistoricalFloodEvent.event_date == target_date
            )
        )
        result = await db.execute(stmt)
        event = result.scalar_one_or_none()

        if not event:
            return None

        peak_depth = float(event.peak_water_depth_m) if event.peak_water_depth_m is not None else 0.0
        is_flood_val = 1 if peak_depth > 0.15 else 0

        event_dt = datetime.combine(event.event_date, datetime.min.time()).replace(tzinfo=timezone.utc)

        return HistoricalTargetRecord(
            zone_id=zone_id,
            event_date=event_dt,
            is_flood=is_flood_val,
            peak_water_depth_m=peak_depth,
            total_rainfall_mm=float(event.total_rainfall_mm) if event.total_rainfall_mm is not None else None,
            severity_level=event.severity_level,
            notes=event.notes
        )

    @staticmethod
    async def check_training_dataset_availability(
        db: AsyncSession,
        min_required_records: int = 50
    ) -> tuple[bool, int, str]:
        """
        Checks real historical flood label count in database.
        If count < min_required_records, reports prerequisite status message.
        """
        stmt = select(HistoricalFloodEvent)
        result = await db.execute(stmt)
        events = result.scalars().all()
        count = len(events)

        if count < min_required_records:
            msg = "Training dataset availability is a prerequisite for model training."
            logger.info(f"Historical target query: {count} real records available. {msg}")
            return False, count, msg

        return True, count, f"Found {count} real historical flood records for training."
