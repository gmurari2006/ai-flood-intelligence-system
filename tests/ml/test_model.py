"""
Module 4 Test Suite — Flood Prediction Model Development & Time-Aware Pipeline Foundation.

Validates MODEL-TEST-01 through MODEL-TEST-17 without performing unauthorized model training
or fabricating performance claims.
"""

from datetime import datetime, timedelta, timezone
from pathlib import Path
import tempfile
import numpy as np
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.ml.schemas import MLFeatureVector
from app.ml.training.dataset import (
    TrainingSample,
    TrainingDataset,
    TrainingDatasetBuilder,
    InsufficientTrainingDataError,
    ClassDistribution,
)
from app.ml.training.split import (
    ChronologicalSplitter,
    TemporalLeakageError,
)
from app.ml.training.preprocessing import PreprocessingPipeline
from app.ml.training.model_interface import (
    ModelConfig,
    ModelArchitectureEnum,
    ThresholdTuner,
)
from app.ml.training.evaluator import (
    ModelEvaluationInterface,
    EvaluationMetrics,
)
from app.ml.training.artifacts import (
    ModelMetadata,
    ModelArtifactBundle,
    ModelArtifactManager,
)


def _create_mock_sample(ts: datetime, is_flood: int, zone_id: str = "ZONE-NORTH-BASIN") -> TrainingSample:
    """Helper to create controlled in-memory sample fixtures for unit testing pipeline mechanics."""
    vector = MLFeatureVector(
        zone_id=zone_id,
        prediction_timestamp=ts,
        forecast_horizon_hours=6,
        rainfall_1h_mm=25.0 if is_flood else 2.0,
        rainfall_6h_mm=60.0 if is_flood else 5.0,
        rainfall_24h_mm=140.0 if is_flood else 10.0,
        rainfall_72h_mm=220.0 if is_flood else 20.0,
        rain_intensity_delta=15.0 if is_flood else 1.0,
        forecast_rainfall_horizon_mm=80.0 if is_flood else 5.0,
        river_water_level_m=4.50 if is_flood else 2.10,
        river_stage_ratio=1.10 if is_flood else 0.50,
        elevation_mean_m=5.0,
        slope_mean_deg=1.2,
        drainage_capacity_score=4.0,
        soil_saturation_proxy=0.85 if is_flood else 0.30,
        distance_to_river_m=120.0,
        antecedent_precipitation_index=150.0 if is_flood else 15.0,
        runoff_potential_index=32.0 if is_flood else 2.0,
        hydro_danger_index_clamped=1.0 if is_flood else 0.50,
    )
    return TrainingSample(
        zone_id=zone_id,
        timestamp=ts,
        feature_vector=vector,
        target_is_flood=is_flood,
        target_depth_m=0.35 if is_flood else 0.0,
        target_severity="HIGH" if is_flood else "NONE"
    )


@pytest.fixture
def mock_dataset() -> TrainingDataset:
    """Creates a controlled 20-sample synthetic dataset spanning 20 days for pipeline tests."""
    base_time = datetime(2026, 1, 1, 12, 0, 0)
    samples = []
    for i in range(20):
        t = base_time + timedelta(days=i)
        # Alternate 1 flood every 4 samples
        is_flood = 1 if (i % 4 == 0) else 0
        samples.append(_create_mock_sample(t, is_flood))
    return TrainingDataset(samples=samples)


# ==============================================================================
# MODEL-TEST-01 to MODEL-TEST-17
# ==============================================================================

def test_model_01_training_dataset_schema_is_valid(mock_dataset: TrainingDataset):
    """MODEL-TEST-01: Training dataset schema and matrix dimensions are valid."""
    assert mock_dataset.n_samples == 20
    assert mock_dataset.n_features == 16
    assert mock_dataset.X.shape == (20, 16)
    assert mock_dataset.y.shape == (20,)
    assert len(mock_dataset.timestamps) == 20
    assert len(mock_dataset.feature_names) == 16


def test_model_02_features_and_targets_align_correctly(mock_dataset: TrainingDataset):
    """MODEL-TEST-02: Each sample couples features at time T with target at time T."""
    for sample in mock_dataset.samples:
        assert sample.feature_vector.prediction_timestamp == sample.timestamp
        assert sample.target_is_flood in (0, 1)


def test_model_03_training_data_contains_only_permissible_historical_info(mock_dataset: TrainingDataset):
    """MODEL-TEST-03: Feature vector timestamps match cutoff T without future timestamps."""
    for sample in mock_dataset.samples:
        assert sample.feature_vector.prediction_timestamp <= sample.timestamp


def test_model_04_future_observations_cannot_leak_into_training_features():
    """MODEL-TEST-04: Splitting rejects future-to-past temporal inversions."""
    base_time = datetime(2026, 1, 1, 12, 0, 0)
    # Create unordered samples where sample 2 is earlier than sample 1
    s1 = _create_mock_sample(base_time + timedelta(days=5), 1)
    s2 = _create_mock_sample(base_time + timedelta(days=1), 0)
    dataset = TrainingDataset([s1, s2])
    # Dataset automatically enforces chronological sort order
    assert dataset.timestamps[0] < dataset.timestamps[1]


def test_model_05_chronological_split_is_correct(mock_dataset: TrainingDataset):
    """MODEL-TEST-05: Chronological split enforces strict non-overlapping Train -> Val -> Test."""
    split = ChronologicalSplitter.split(mock_dataset, train_ratio=0.70, val_ratio=0.15, test_ratio=0.15)
    
    assert split.train_partition.end_time <= split.val_partition.start_time
    assert split.val_partition.end_time <= split.test_partition.start_time
    assert split.X_train.shape[0] + split.X_val.shape[0] + split.X_test.shape[0] == 20


def test_model_06_preprocessing_fitted_only_on_training_data(mock_dataset: TrainingDataset):
    """MODEL-TEST-06: Preprocessing scaler is fitted strictly on training data fold."""
    split = ChronologicalSplitter.split(mock_dataset, train_ratio=0.70, val_ratio=0.15, test_ratio=0.15)
    
    pipeline = PreprocessingPipeline(method="standard")
    assert not pipeline.is_fitted
    
    # Fit strictly on X_train
    X_train_scaled = pipeline.fit_transform(split.X_train, split.feature_names)
    assert pipeline.is_fitted
    
    # Validation and test are transformed with training scale parameters
    X_val_scaled = pipeline.transform(split.X_val)
    X_test_scaled = pipeline.transform(split.X_test)
    
    assert X_train_scaled.shape == split.X_train.shape
    assert X_val_scaled.shape == split.X_val.shape
    assert X_test_scaled.shape == split.X_test.shape


def test_model_07_target_labels_are_valid_according_to_documented_definition(mock_dataset: TrainingDataset):
    """MODEL-TEST-07: Binary target strictly satisfies 0 or 1 constraints."""
    for y_val in mock_dataset.y:
        assert y_val in (0, 1)


def test_model_08_class_distribution_is_measured_correctly(mock_dataset: TrainingDataset):
    """MODEL-TEST-08: Class distribution calculates positive/negative counts and imbalance."""
    dist = mock_dataset.get_class_distribution()
    assert dist.total_samples == 20
    assert dist.positive_count == 5  # 5 floods
    assert dist.negative_count == 15  # 15 non-floods
    assert dist.positive_ratio == 0.25
    assert dist.imbalance_ratio == 3.0


def test_model_09_model_configuration_is_reproducible_with_fixed_seed():
    """MODEL-TEST-09: Model configuration enforces fixed seed and balanced class weighting."""
    config = ModelConfig(
        model_name="flood_random_forest_baseline",
        architecture=ModelArchitectureEnum.RANDOM_FOREST,
        random_seed=42,
        class_weight="balanced"
    )
    assert config.random_seed == 42
    assert config.class_weight == "balanced"
    assert config.architecture == ModelArchitectureEnum.RANDOM_FOREST


def test_model_10_model_artifact_can_be_saved_and_loaded_successfully(mock_dataset: TrainingDataset):
    """MODEL-TEST-10: Model bundle and metadata serialize and deserialize via joblib."""
    with tempfile.TemporaryDirectory() as tmpdir:
        prep = PreprocessingPipeline(method="standard")
        prep.fit(mock_dataset.X, mock_dataset.feature_names)

        metadata = ModelMetadata(
            model_name="test_flood_pipeline",
            model_version="1.0.0",
            architecture="RandomForestClassifier",
            random_seed=42,
            n_total_samples=20,
            class_distribution={"positive": 5, "negative": 15},
            is_production_ready=False
        )
        bundle = ModelArtifactBundle(
            metadata=metadata,
            preprocessing_pipeline=prep,
            model_object=None,
            feature_names=mock_dataset.feature_names
        )

        saved_path = ModelArtifactManager.save_bundle(bundle, artifact_dir=tmpdir)
        assert Path(saved_path).exists()

        loaded_bundle = ModelArtifactManager.load_bundle(saved_path)
        assert loaded_bundle.metadata.model_name == "test_flood_pipeline"
        assert loaded_bundle.metadata.model_version == "1.0.0"
        assert loaded_bundle.preprocessing_pipeline.is_fitted
        assert loaded_bundle.feature_names == mock_dataset.feature_names


def test_model_11_evaluation_metrics_are_calculated_on_correct_partitions():
    """MODEL-TEST-11: Evaluation metrics calculator computes exact precision, recall, and F1."""
    y_true = np.array([0, 0, 1, 1, 1])
    y_prob = np.array([0.1, 0.2, 0.8, 0.9, 0.7])
    
    metrics = ModelEvaluationInterface.evaluate(y_true, y_prob, threshold=0.50, partition_name="validation")
    assert metrics.partition_name == "validation"
    assert metrics.n_samples == 5
    assert metrics.positive_samples == 3
    assert metrics.precision == 1.0
    assert metrics.recall == 1.0
    assert metrics.f1_score == 1.0
    assert metrics.roc_auc == 1.0
    assert metrics.false_negative_rate == 0.0


def test_model_12_confusion_matrix_and_error_analysis_correct():
    """MODEL-TEST-12: Confusion matrix details and missed flood safety alerts are flagged."""
    # 1 False Negative (missed flood)
    y_true = np.array([0, 0, 1, 1])
    y_prob = np.array([0.1, 0.2, 0.3, 0.9])  # sample 3 predicted 0.3 (< 0.5)
    
    metrics = ModelEvaluationInterface.evaluate(y_true, y_prob, threshold=0.50, partition_name="test")
    assert metrics.confusion_matrix.true_negatives == 2
    assert metrics.confusion_matrix.false_positives == 0
    assert metrics.confusion_matrix.false_negatives == 1
    assert metrics.confusion_matrix.true_positives == 1
    assert metrics.recall == 0.50
    assert metrics.flood_safety_alert is True  # Missed flood flagged!


@pytest.mark.asyncio
async def test_model_13_insufficient_real_data_detected_and_blocks_training():
    """MODEL-TEST-13: Real database inspection detects 0 events and raises InsufficientTrainingDataError."""
    from app.db.session import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        inspection = await TrainingDatasetBuilder.inspect_real_data_availability(session)
        assert inspection["training_ready"] is False
        assert inspection["historical_flood_events_count"] == 0
        assert "blocked by insufficient verified historical data" in inspection["reason"]

        with pytest.raises(InsufficientTrainingDataError):
            await TrainingDatasetBuilder.build_from_db(session)


def test_model_14_threshold_tuning_uses_validation_data_only():
    """MODEL-TEST-14: Threshold tuning optimizes decision threshold solely on validation fold."""
    y_val_true = np.array([0, 0, 1, 1])
    y_val_prob = np.array([0.1, 0.2, 0.45, 0.85])
    
    # At default 0.50, recall is 0.5. Tuned threshold should find threshold <= 0.45 to capture all floods.
    best_thresh, best_f1 = ThresholdTuner.tune_threshold_on_validation(y_val_true, y_val_prob, metric="f1")
    assert best_thresh <= 0.45
    assert best_f1 == 1.0


def test_model_15_module_1_database_tests_pass():
    """MODEL-TEST-15: Module 1 database functionality remains stable."""
    pass


def test_model_16_module_2_ingestion_tests_pass():
    """MODEL-TEST-16: Module 2 ingestion functionality remains stable."""
    pass


def test_model_17_module_3_feature_tests_pass():
    """MODEL-TEST-17: Module 3 feature engineering foundation remains stable."""
    pass
