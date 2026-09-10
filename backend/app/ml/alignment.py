"""
Temporal Data Alignment & Future Data Leakage Prevention Engine.

Enforces strict boundary checks to ensure feature computations at time T
only consume historical observations where observed_at <= T.
"""

from datetime import datetime, timedelta, timezone
from typing import Sequence, TypeVar, Any


class DataLeakageError(Exception):
    """Raised when an observation with timestamp > prediction_timestamp is detected in historical pipeline."""
    pass


def ensure_naive_datetime(dt: datetime) -> datetime:
    """Converts timezone-aware datetimes to UTC-naive datetimes for consistent comparison."""
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def filter_observations_before_cutoff(
    records: Sequence[Any],
    prediction_timestamp: datetime,
    timestamp_attr: str = "observed_at"
) -> list[Any]:
    """
    Filters a sequence of observation records, returning ONLY those where record.timestamp <= prediction_timestamp.
    Enforces strict temporal alignment to prevent future data leakage.
    """
    cutoff = ensure_naive_datetime(prediction_timestamp)
    valid_records: list[Any] = []

    for rec in records:
        rec_time = ensure_naive_datetime(getattr(rec, timestamp_attr))
        if rec_time > cutoff:
            # Future observation detected! Filter out from historical feature window.
            continue
        valid_records.append(rec)

    # Sort valid records chronologically
    valid_records.sort(key=lambda r: ensure_naive_datetime(getattr(r, timestamp_attr)))
    return valid_records


def calculate_window_accumulated_rainfall(
    rainfall_records: Sequence[Any],
    prediction_timestamp: datetime,
    window_hours: int
) -> float:
    """
    Calculates accumulated rainfall (mm) within the time window [T - window_hours, T].
    Strictly excludes observations after T.
    """
    cutoff = ensure_naive_datetime(prediction_timestamp)
    window_start = cutoff - timedelta(hours=window_hours)

    total_rain = 0.0
    for rec in rainfall_records:
        rec_time = ensure_naive_datetime(rec.observed_at)
        if rec_time > cutoff:
            # Explicit data leakage guard check
            raise DataLeakageError(
                f"Data leakage boundary violation: Observation timestamp {rec_time} exceeds prediction cutoff {cutoff}"
            )
        if rec_time >= window_start:
            # Use 1h accumulation or relevant attribute
            total_rain += float(getattr(rec, "rainfall_1h_mm", 0.0))

    return max(0.0, total_rain)
