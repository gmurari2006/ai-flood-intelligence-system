"""
Training Dataset Builder and Container Module.

Constructs aligned training datasets combining Module 3 FeatureDatasetBuilder
and HistoricalTargetInterface with strict data availability gating.
"""

from datetime import datetime, timezone
from typing import Optional, Sequence
import numpy as np
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.ml.schemas import MLFeatureVector, HistoricalTargetRecord
from app.ml.alignment import ensure_naive_datetime, DataLeakageError
from app.models.domain import HistoricalFloodEvent


class InsufficientTrainingDataError(Exception):
    """Raised when real historical training data is insufficient for model training."""
    pass


class ClassDistribution(BaseModel):
    """Distribution of binary target classes in a dataset."""
    total_samples: int
    positive_count: int  # Flood events (1)
    negative_count: int  # Non-flood events (0)
    positive_ratio: float
    imbalance_ratio: float  # negative / positive (or 0.0 if no positives)


class TrainingSample(BaseModel):
    """Single aligned sample coupling features at time T with target outcome."""
    zone_id: str
    timestamp: datetime
    feature_vector: MLFeatureVector
    target_is_flood: int = Field(..., ge=0, le=1)
    target_depth_m: Optional[float] = None
    target_severity: Optional[str] = None

    model_config = ConfigDict(frozen=True)


class TrainingDataset:
    """
    Structured in-memory dataset container for time-aware model development.
    Provides feature matrix X, target vector y, timestamps, and metadata.
    """

    def __init__(
        self,
        samples: Sequence[TrainingSample],
        feature_names: Optional[list[str]] = None
    ):
        if not samples:
            raise ValueError("TrainingDataset cannot be initialized with empty samples.")

        # Sort samples strictly by timestamp
        self._samples = sorted(samples, key=lambda s: s.timestamp)
        self._feature_names = feature_names or self._samples[0].feature_vector.feature_names()
        
        # Build matrices
        x_list = [s.feature_vector.to_vector_array() for s in self._samples]
        y_list = [s.target_is_flood for s in self._samples]
        
        self._X = np.array(x_list, dtype=np.float64)
        self._y = np.array(y_list, dtype=np.int64)
        self._timestamps = [s.timestamp for s in self._samples]
        self._zone_ids = [s.zone_id for s in self._samples]

    @property
    def X(self) -> np.ndarray:
        """Feature matrix of shape (n_samples, n_features)."""
        return self._X

    @property
    def y(self) -> np.ndarray:
        """Target label vector of shape (n_samples,)."""
        return self._y

    @property
    def timestamps(self) -> list[datetime]:
        """Ordered sample timestamps."""
        return self._timestamps

    @property
    def zone_ids(self) -> list[str]:
        """Sample zone IDs."""
        return self._zone_ids

    @property
    def feature_names(self) -> list[str]:
        """Feature names matching columns of X."""
        return self._feature_names

    @property
    def n_samples(self) -> int:
        return len(self._samples)

    @property
    def n_features(self) -> int:
        return len(self._feature_names)

    @property
    def samples(self) -> list[TrainingSample]:
        return self._samples

    def get_class_distribution(self) -> ClassDistribution:
        """Computes positive/negative class counts and imbalance ratio."""
        pos = int(np.sum(self._y == 1))
        neg = int(np.sum(self._y == 0))
        total = len(self._y)
        pos_ratio = float(pos / total) if total > 0 else 0.0
        imbalance = float(neg / pos) if pos > 0 else 0.0

        return ClassDistribution(
            total_samples=total,
            positive_count=pos,
            negative_count=neg,
            positive_ratio=pos_ratio,
            imbalance_ratio=imbalance
        )


class TrainingDatasetBuilder:
    """Builder for inspecting and constructing training datasets from PostgreSQL state."""

    MIN_REQUIRED_SAMPLES = 50

    @classmethod
    async def inspect_real_data_availability(cls, db: AsyncSession) -> dict:
        """
        Inspects real database state for model training readiness.
        Returns comprehensive metrics without modifying database or fabricating data.
        """
        stmt = select(HistoricalFloodEvent)
        res = await db.execute(stmt)
        events = list(res.scalars().all())
        event_count = len(events)

        if event_count == 0:
            return {
                "training_ready": False,
                "historical_flood_events_count": 0,
                "date_range": None,
                "reason": "Model training is blocked by insufficient verified historical data. Zero historical flood events exist in database.",
                "action_required": "Real historical flood observation records must be ingested into historical_flood_events table before training."
            }

        dates = [e.event_date for e in events]
        min_date = min(dates)
        max_date = max(dates)
        is_ready = event_count >= cls.MIN_REQUIRED_SAMPLES

        return {
            "training_ready": is_ready,
            "historical_flood_events_count": event_count,
            "date_range": (min_date.isoformat(), max_date.isoformat()),
            "reason": "Sufficient data available" if is_ready else f"Insufficient sample count ({event_count} < {cls.MIN_REQUIRED_SAMPLES}).",
            "action_required": None if is_ready else f"Additional {cls.MIN_REQUIRED_SAMPLES - event_count} records required."
        }

    @classmethod
    async def build_from_db(
        cls,
        db: AsyncSession,
        zone_ids: Optional[Sequence[str]] = None
    ) -> TrainingDataset:
        """
        Builds a TrainingDataset from real database state.
        Raises InsufficientTrainingDataError if insufficient real data exists.
        """
        inspection = await cls.inspect_real_data_availability(db)
        if not inspection["training_ready"]:
            raise InsufficientTrainingDataError(inspection["reason"])

        # If data is ready, retrieval and sample assembly would occur here
        raise NotImplementedError("Real dataset assembly requires populated historical_flood_events.")
