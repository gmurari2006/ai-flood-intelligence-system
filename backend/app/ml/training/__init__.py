"""
AI/ML Training and Evaluation Pipeline Package.

Exports time-aware training dataset builders, chronological splitters,
preprocessing pipelines, model interfaces, evaluators, and artifact managers.
"""

from app.ml.training.dataset import (
    TrainingSample,
    TrainingDataset,
    TrainingDatasetBuilder,
    ClassDistribution,
    InsufficientTrainingDataError,
)
from app.ml.training.split import (
    ChronologicalSplitter,
    SplitResult,
    SplitPartition,
    TemporalLeakageError,
)
from app.ml.training.preprocessing import (
    PreprocessingPipeline,
)
from app.ml.training.model_interface import (
    ModelArchitectureEnum,
    ModelConfig,
    IFloodPredictionModel,
    ThresholdTuner,
)
from app.ml.training.evaluator import (
    EvaluationMetrics,
    ConfusionMatrixDetails,
    ModelEvaluationInterface,
)
from app.ml.training.artifacts import (
    ModelMetadata,
    ModelArtifactBundle,
    ModelArtifactManager,
)

__all__ = [
    "TrainingSample",
    "TrainingDataset",
    "TrainingDatasetBuilder",
    "ClassDistribution",
    "InsufficientTrainingDataError",
    "ChronologicalSplitter",
    "SplitResult",
    "SplitPartition",
    "TemporalLeakageError",
    "PreprocessingPipeline",
    "ModelArchitectureEnum",
    "ModelConfig",
    "IFloodPredictionModel",
    "ThresholdTuner",
    "EvaluationMetrics",
    "ConfusionMatrixDetails",
    "ModelEvaluationInterface",
    "ModelMetadata",
    "ModelArtifactBundle",
    "ModelArtifactManager",
]
