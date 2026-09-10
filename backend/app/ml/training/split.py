"""
Time-Aware Chronological Dataset Splitting Module.

Enforces strict temporal separation (Train -> Validation -> Test)
with zero future-to-past data leakage.
"""

from datetime import datetime
from typing import NamedTuple, Optional
import numpy as np
from pydantic import BaseModel, Field

from backend.app.ml.training.dataset import TrainingDataset, ClassDistribution


class TemporalLeakageError(Exception):
    """Raised when temporal boundary conditions or chronological ordering are violated."""
    pass


class SplitPartition(BaseModel):
    """Metadata and indices for a single temporal partition."""
    name: str
    indices: list[int]
    start_time: datetime
    end_time: datetime
    n_samples: int
    positive_count: int
    negative_count: int
    positive_ratio: float


class SplitResult:
    """Container holding chronological split partitions and sliced arrays."""

    def __init__(
        self,
        dataset: TrainingDataset,
        train_indices: list[int],
        val_indices: list[int],
        test_indices: list[int]
    ):
        self._dataset = dataset
        self._train_idx = train_indices
        self._val_idx = val_indices
        self._test_idx = test_indices

        # Extract timestamps
        all_ts = dataset.timestamps
        all_y = dataset.y

        train_ts = [all_ts[i] for i in train_indices]
        val_ts = [all_ts[i] for i in val_indices]
        test_ts = [all_ts[i] for i in test_indices]

        # Verify strict temporal non-overlap
        if max(train_ts) > min(val_ts):
            raise TemporalLeakageError(
                f"Data leakage detected: Max train time ({max(train_ts)}) > Min val time ({min(val_ts)})."
            )
        if max(val_ts) > min(test_ts):
            raise TemporalLeakageError(
                f"Data leakage detected: Max val time ({max(val_ts)}) > Min test time ({min(test_ts)})."
            )

        # Build partition metadata
        self.train_partition = self._build_partition("train", train_indices, train_ts, all_y)
        self.val_partition = self._build_partition("validation", val_indices, val_ts, all_y)
        self.test_partition = self._build_partition("test", test_indices, test_ts, all_y)

    @staticmethod
    def _build_partition(name: str, indices: list[int], ts: list[datetime], all_y: np.ndarray) -> SplitPartition:
        y_part = all_y[indices]
        pos = int(np.sum(y_part == 1))
        neg = int(np.sum(y_part == 0))
        total = len(indices)
        return SplitPartition(
            name=name,
            indices=indices,
            start_time=min(ts),
            end_time=max(ts),
            n_samples=total,
            positive_count=pos,
            negative_count=neg,
            positive_ratio=float(pos / total) if total > 0 else 0.0
        )

    @property
    def X_train(self) -> np.ndarray:
        return self._dataset.X[self._train_idx]

    @property
    def y_train(self) -> np.ndarray:
        return self._dataset.y[self._train_idx]

    @property
    def X_val(self) -> np.ndarray:
        return self._dataset.X[self._val_idx]

    @property
    def y_val(self) -> np.ndarray:
        return self._dataset.y[self._val_idx]

    @property
    def X_test(self) -> np.ndarray:
        return self._dataset.X[self._test_idx]

    @property
    def y_test(self) -> np.ndarray:
        return self._dataset.y[self._test_idx]

    @property
    def feature_names(self) -> list[str]:
        return self._dataset.feature_names


class ChronologicalSplitter:
    """Performs deterministic, time-aware dataset splitting without future leakage."""

    @staticmethod
    def split(
        dataset: TrainingDataset,
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15
    ) -> SplitResult:
        """
        Splits dataset chronologically into Train, Validation, and Test sets.
        Ensures Earliest Samples -> Train, Middle Samples -> Validation, Latest Samples -> Test.
        """
        if not np.isclose(train_ratio + val_ratio + test_ratio, 1.0):
            raise ValueError("Split ratios (train + val + test) must sum to 1.0.")

        n_total = dataset.n_samples
        if n_total < 3:
            raise ValueError(f"Dataset too small ({n_total} samples) for 3-way chronological split.")

        n_train = max(1, int(np.floor(n_total * train_ratio)))
        n_val = max(1, int(np.floor(n_total * val_ratio)))
        n_test = n_total - (n_train + n_val)

        if n_test < 1:
            n_train -= 1
            n_test = 1

        train_indices = list(range(0, n_train))
        val_indices = list(range(n_train, n_train + n_val))
        test_indices = list(range(n_train + n_val, n_total))

        return SplitResult(
            dataset=dataset,
            train_indices=train_indices,
            val_indices=val_indices,
            test_indices=test_indices
        )
