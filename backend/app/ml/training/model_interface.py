"""
Model Configuration and Prediction Interface Module.

Defines the configuration schemas, prediction contracts, and validation-only threshold tuning.
Does NOT train or fit production models.
"""

from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Optional
import numpy as np
from pydantic import BaseModel, Field, ConfigDict


class ModelArchitectureEnum(str, Enum):
    LOGISTIC_REGRESSION = "LogisticRegression"
    RANDOM_FOREST = "RandomForestClassifier"
    XGBOOST = "XGBClassifier"


class ModelConfig(BaseModel):
    """Configuration definition for flood prediction models."""
    model_name: str = Field("flood_baseline_classifier", description="Identifier name of model")
    architecture: ModelArchitectureEnum = Field(ModelArchitectureEnum.RANDOM_FOREST, description="Algorithm architecture")
    hyperparameters: dict[str, Any] = Field(
        default_factory=lambda: {
            "n_estimators": 100,
            "max_depth": 6,
            "min_samples_split": 5,
            "min_samples_leaf": 2
        },
        description="Model hyperparameters"
    )
    random_seed: int = Field(42, description="Fixed random seed for reproducibility")
    class_weight: Optional[str] = Field("balanced", description="Class weighting strategy ('balanced' or None)")
    decision_threshold: float = Field(0.50, ge=0.01, le=0.99, description="Binary classification decision threshold")
    feature_scaling: str = Field("standard", description="Scaling method ('standard', 'robust', 'none')")

    model_config = ConfigDict(frozen=True)


class IFloodPredictionModel(ABC):
    """Abstract interface defining standard flood prediction model operations."""

    @property
    @abstractmethod
    def config(self) -> ModelConfig:
        """Returns model configuration."""
        pass

    @property
    @abstractmethod
    def is_trained(self) -> bool:
        """Returns whether the model has been fitted."""
        pass

    @abstractmethod
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Outputs estimated flood probabilities of shape (n_samples, 2).
        Column 1 represents flood probability in range [0.0, 1.0].
        """
        pass

    @abstractmethod
    def predict(self, X: np.ndarray, threshold: Optional[float] = None) -> np.ndarray:
        """
        Outputs discrete binary flood classifications (0 or 1) based on decision threshold.
        """
        pass


class ThresholdTuner:
    """
    Tunes binary classification threshold using validation partition ONLY.
    Guarantees test partition remains completely isolated and untouched.
    """

    @staticmethod
    def tune_threshold_on_validation(
        y_val_true: np.ndarray,
        y_val_prob: np.ndarray,
        metric: str = "f1",
        min_precision: float = 0.50,
        threshold_steps: int = 100
    ) -> tuple[float, float]:
        """
        Searches thresholds in range [0.05, 0.95] on validation data to optimize target metric.
        Returns: (best_threshold, best_metric_score)
        """
        if len(y_val_true) == 0 or len(y_val_prob) == 0:
            raise ValueError("Validation arrays cannot be empty for threshold tuning.")

        thresholds = np.linspace(0.05, 0.95, threshold_steps)
        best_thresh = 0.50
        best_score = -1.0

        for t in thresholds:
            y_pred = (y_val_prob >= t).astype(int)
            tp = int(np.sum((y_pred == 1) & (y_val_true == 1)))
            fp = int(np.sum((y_pred == 1) & (y_val_true == 0)))
            fn = int(np.sum((y_pred == 0) & (y_val_true == 1)))

            precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0

            if metric == "f1":
                score = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
            elif metric == "recall":
                score = recall if precision >= min_precision else 0.0
            else:
                raise ValueError(f"Unsupported tuning metric '{metric}'. Choose 'f1' or 'recall'.")

            if score > best_score:
                best_score = score
                best_thresh = float(t)

        return best_thresh, best_score
