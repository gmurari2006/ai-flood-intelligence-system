"""
Preprocessing Pipeline Module.

Enforces strict isolation of feature scaling and transformations to prevent data leakage.
Scalers are fitted EXCLUSIVELY on the training partition.
"""

from typing import Optional
import numpy as np
from sklearn.preprocessing import StandardScaler, RobustScaler


class PreprocessingPipeline:
    """
    Feature preprocessing pipeline supporting StandardScaler and RobustScaler.
    Guarantees zero leakage across validation and test partitions.
    """

    def __init__(self, method: str = "standard"):
        if method not in ("standard", "robust", "none"):
            raise ValueError(f"Unsupported scaling method '{method}'. Choose 'standard', 'robust', or 'none'.")
        
        self._method = method
        self._scaler = StandardScaler() if method == "standard" else (RobustScaler() if method == "robust" else None)
        self._is_fitted = False
        self._feature_names: Optional[list[str]] = None
        self._n_features_in: Optional[int] = None

    @property
    def is_fitted(self) -> bool:
        return self._is_fitted

    @property
    def method(self) -> str:
        return self._method

    @property
    def feature_names(self) -> Optional[list[str]]:
        return self._feature_names

    def fit(self, X_train: np.ndarray, feature_names: Optional[list[str]] = None) -> "PreprocessingPipeline":
        """
        Fits the scaler strictly on the training partition.
        Must NEVER be called on validation or test sets.
        """
        if X_train is None or len(X_train) == 0:
            raise ValueError("Cannot fit PreprocessingPipeline on empty training data.")

        if self._scaler is not None:
            self._scaler.fit(X_train)

        self._is_fitted = True
        self._n_features_in = X_train.shape[1]
        self._feature_names = feature_names
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        """
        Applies fitted scaling transformation to input matrix.
        Raises RuntimeError if pipeline has not been fitted on training data.
        """
        if not self._is_fitted:
            raise RuntimeError("PreprocessingPipeline must be fitted on training partition before transform().")

        if X.shape[1] != self._n_features_in:
            raise ValueError(
                f"Feature dimension mismatch: Expected {self._n_features_in} features, got {X.shape[1]}."
            )

        if self._scaler is None:
            return np.array(X, copy=True)

        return self._scaler.transform(X)

    def fit_transform(self, X_train: np.ndarray, feature_names: Optional[list[str]] = None) -> np.ndarray:
        """Convenience method for training fold only."""
        return self.fit(X_train, feature_names).transform(X_train)

    def to_dict(self) -> dict:
        """Serializes preprocessing parameters for versioned artifact bundling."""
        if not self._is_fitted:
            raise RuntimeError("Cannot serialize unfitted PreprocessingPipeline.")

        state = {
            "method": self._method,
            "is_fitted": self._is_fitted,
            "n_features_in": self._n_features_in,
            "feature_names": self._feature_names
        }

        if isinstance(self._scaler, StandardScaler):
            state["mean_"] = self._scaler.mean_.tolist()
            state["scale_"] = self._scaler.scale_.tolist()
            state["var_"] = self._scaler.var_.tolist()
        elif isinstance(self._scaler, RobustScaler):
            state["center_"] = self._scaler.center_.tolist()
            state["scale_"] = self._scaler.scale_.tolist()

        return state

    @classmethod
    def from_dict(cls, data: dict) -> "PreprocessingPipeline":
        """Reconstructs fitted PreprocessingPipeline from serialized parameter dictionary."""
        pipeline = cls(method=data["method"])
        pipeline._is_fitted = data["is_fitted"]
        pipeline._n_features_in = data["n_features_in"]
        pipeline._feature_names = data.get("feature_names")

        if data["method"] == "standard" and pipeline._scaler is not None:
            pipeline._scaler.mean_ = np.array(data["mean_"])
            pipeline._scaler.scale_ = np.array(data["scale_"])
            pipeline._scaler.var_ = np.array(data["var_"])
            pipeline._scaler.n_features_in_ = data["n_features_in"]
        elif data["method"] == "robust" and pipeline._scaler is not None:
            pipeline._scaler.center_ = np.array(data["center_"])
            pipeline._scaler.scale_ = np.array(data["scale_"])
            pipeline._scaler.n_features_in_ = data["n_features_in"]

        return pipeline
