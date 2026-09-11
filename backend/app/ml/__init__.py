"""
AI/ML Data Preparation and Feature Engineering Package.
"""

from app.ml.metadata import FEATURE_REGISTRY, FeatureMetadata
from app.ml.schemas import MLFeatureVector, HistoricalTargetRecord, FeatureDatasetRecord
from app.ml.alignment import filter_observations_before_cutoff, DataLeakageError
from app.ml.engineer import (
    calculate_antecedent_precipitation_index,
    calculate_runoff_potential_index,
    calculate_hydro_danger_index_clamped,
    calculate_rain_intensity_delta,
    calculate_river_stage_ratio,
    FeatureExtractionError,
)
from app.ml.dataset_builder import FeatureDatasetBuilder
from app.ml.target_interface import HistoricalTargetInterface, TargetDatasetError

__all__ = [
    "FEATURE_REGISTRY",
    "FeatureMetadata",
    "MLFeatureVector",
    "HistoricalTargetRecord",
    "FeatureDatasetRecord",
    "filter_observations_before_cutoff",
    "DataLeakageError",
    "calculate_antecedent_precipitation_index",
    "calculate_runoff_potential_index",
    "calculate_hydro_danger_index_clamped",
    "calculate_rain_intensity_delta",
    "calculate_river_stage_ratio",
    "FeatureExtractionError",
    "FeatureDatasetBuilder",
    "HistoricalTargetInterface",
    "TargetDatasetError",
]
