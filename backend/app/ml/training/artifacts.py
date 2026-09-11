"""
Model Artifact and Version Management Module.

Manages serialization, deserialization, and comprehensive metadata tracking
for trained ML model artifacts and preprocessing pipelines.
"""

import os
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
import joblib
from pydantic import BaseModel, Field, ConfigDict

from app.ml.training.preprocessing import PreprocessingPipeline
from app.ml.training.evaluator import EvaluationMetrics


class ModelMetadata(BaseModel):
    """Structured versioning metadata for ML model artifacts."""
    model_name: str = Field(..., description="Unique model name")
    model_version: str = Field(..., description="Semantic version string (e.g. 1.0.0)")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    architecture: str = Field(..., description="Model architecture / algorithm")
    hyperparameters: dict[str, Any] = Field(default_factory=dict)
    random_seed: int = Field(42, description="Reproducibility random seed")
    
    feature_version: str = Field("1.0.0", description="Module 3 Feature Vector version")
    target_definition: str = Field("is_flood (binary: depth > 0.15m)", description="Target definition")
    
    train_date_range: Optional[tuple[str, str]] = None
    val_date_range: Optional[tuple[str, str]] = None
    test_date_range: Optional[tuple[str, str]] = None
    
    n_total_samples: int = 0
    class_distribution: dict[str, Any] = Field(default_factory=dict)
    
    validation_metrics: Optional[dict[str, Any]] = None
    test_metrics: Optional[dict[str, Any]] = None
    decision_threshold: float = 0.50
    is_production_ready: bool = False

    model_config = ConfigDict(frozen=True)


class ModelArtifactBundle:
    """Complete bundle containing model artifact, fitted preprocessing, and metadata."""

    def __init__(
        self,
        metadata: ModelMetadata,
        preprocessing_pipeline: PreprocessingPipeline,
        model_object: Optional[Any] = None,
        feature_names: Optional[list[str]] = None
    ):
        self.metadata = metadata
        self.preprocessing_pipeline = preprocessing_pipeline
        self.model_object = model_object
        self.feature_names = feature_names or []


class ModelArtifactManager:
    """Manages storage, serialization, and retrieval of versioned model artifacts."""

    DEFAULT_ARTIFACT_DIR = Path("backend/app/ml/artifacts")

    @classmethod
    def get_artifact_dir(cls, custom_dir: Optional[str] = None) -> Path:
        target = Path(custom_dir) if custom_dir else cls.DEFAULT_ARTIFACT_DIR
        target.mkdir(parents=True, exist_ok=True)
        return target

    @classmethod
    def save_bundle(
        cls,
        bundle: ModelArtifactBundle,
        artifact_dir: Optional[str] = None
    ) -> Path:
        """
        Saves model bundle files to disk:
        - metadata.json (JSON format)
        - model_bundle.joblib (joblib serialized bundle)
        """
        base_dir = cls.get_artifact_dir(artifact_dir)
        version_dir = base_dir / f"{bundle.metadata.model_name}_v{bundle.metadata.model_version}"
        version_dir.mkdir(parents=True, exist_ok=True)

        # 1. Save metadata JSON
        meta_path = version_dir / "metadata.json"
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(bundle.metadata.model_dump(mode="json"), f, indent=2)

        # 2. Save complete artifact bundle via joblib
        bundle_payload = {
            "metadata": bundle.metadata.model_dump(mode="json"),
            "preprocessing_state": bundle.preprocessing_pipeline.to_dict() if bundle.preprocessing_pipeline.is_fitted else None,
            "model_object": bundle.model_object,
            "feature_names": bundle.feature_names
        }
        bundle_path = version_dir / "model_bundle.joblib"
        joblib.dump(bundle_payload, bundle_path)

        return version_dir

    @classmethod
    def load_bundle(cls, version_dir: Path) -> ModelArtifactBundle:
        """Loads and reconstructs a ModelArtifactBundle from a version directory."""
        meta_path = version_dir / "metadata.json"
        bundle_path = version_dir / "model_bundle.joblib"

        if not bundle_path.exists():
            raise FileNotFoundError(f"Model bundle file not found at '{bundle_path}'.")

        payload = joblib.load(bundle_path)
        meta_data = payload["metadata"]
        metadata = ModelMetadata(**meta_data)

        prep_state = payload.get("preprocessing_state")
        if prep_state:
            preprocessing = PreprocessingPipeline.from_dict(prep_state)
        else:
            preprocessing = PreprocessingPipeline(method="none")

        return ModelArtifactBundle(
            metadata=metadata,
            preprocessing_pipeline=preprocessing,
            model_object=payload.get("model_object"),
            feature_names=payload.get("feature_names")
        )
