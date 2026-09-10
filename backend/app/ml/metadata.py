"""
AI/ML Feature Metadata Registry.

Defines feature definitions, units, ranges, and flags matching Document 04 Section 4.1.
"""

from typing import NamedTuple


class FeatureMetadata(NamedTuple):
    key: str
    name: str
    unit: str
    is_forecast: bool
    description: str
    min_value: float
    max_value: float


FEATURE_REGISTRY: dict[str, FeatureMetadata] = {
    "rainfall_1h_mm": FeatureMetadata(
        key="rainfall_1h_mm",
        name="1-Hour Observed Rainfall",
        unit="mm",
        is_forecast=False,
        description="Immediate 1-hour accumulated observed rainfall",
        min_value=0.0,
        max_value=500.0
    ),
    "rainfall_6h_mm": FeatureMetadata(
        key="rainfall_6h_mm",
        name="6-Hour Observed Rainfall",
        unit="mm",
        is_forecast=False,
        description="Accumulated 6-hour observed rainfall",
        min_value=0.0,
        max_value=1000.0
    ),
    "rainfall_24h_mm": FeatureMetadata(
        key="rainfall_24h_mm",
        name="24-Hour Observed Rainfall",
        unit="mm",
        is_forecast=False,
        description="Accumulated 24-hour observed rainfall",
        min_value=0.0,
        max_value=2000.0
    ),
    "rainfall_72h_mm": FeatureMetadata(
        key="rainfall_72h_mm",
        name="72-Hour Observed Rainfall",
        unit="mm",
        is_forecast=False,
        description="Antecedent 3-day observed rainfall",
        min_value=0.0,
        max_value=3000.0
    ),
    "rain_intensity_delta": FeatureMetadata(
        key="rain_intensity_delta",
        name="Rainfall Intensity Acceleration",
        unit="mm/hr",
        is_forecast=False,
        description="Rate-of-change / acceleration rate of observed rainfall",
        min_value=-500.0,
        max_value=500.0
    ),
    "forecast_rainfall_horizon_mm": FeatureMetadata(
        key="forecast_rainfall_horizon_mm",
        name="Forecast Rainfall Horizon",
        unit="mm",
        is_forecast=True,
        description="Forecasted cumulative rainfall over next H hours",
        min_value=0.0,
        max_value=1500.0
    ),
    "river_water_level_m": FeatureMetadata(
        key="river_water_level_m",
        name="River Water Level",
        unit="m",
        is_forecast=False,
        description="Current river stage height",
        min_value=0.0,
        max_value=50.0
    ),
    "river_stage_ratio": FeatureMetadata(
        key="river_stage_ratio",
        name="River Stage Ratio",
        unit="ratio",
        is_forecast=False,
        description="Ratio of current water level to danger level (level / danger_level)",
        min_value=0.0,
        max_value=10.0
    ),
    "elevation_mean_m": FeatureMetadata(
        key="elevation_mean_m",
        name="Mean Zone Elevation",
        unit="m",
        is_forecast=False,
        description="Mean elevation of geographic zone above sea level",
        min_value=-10.0,
        max_value=8848.0
    ),
    "slope_mean_deg": FeatureMetadata(
        key="slope_mean_deg",
        name="Mean Terrain Slope",
        unit="deg",
        is_forecast=False,
        description="Mean terrain incline steepness in degrees",
        min_value=0.0,
        max_value=90.0
    ),
    "drainage_capacity_score": FeatureMetadata(
        key="drainage_capacity_score",
        name="Drainage Capacity Score",
        unit="score",
        is_forecast=False,
        description="Municipal drainage effectiveness metric in range [0, 10]",
        min_value=0.0,
        max_value=10.0
    ),
    "soil_saturation_proxy": FeatureMetadata(
        key="soil_saturation_proxy",
        name="Soil Saturation Proxy",
        unit="ratio",
        is_forecast=False,
        description="Estimated soil moisture saturation ratio in range [0, 1]",
        min_value=0.0,
        max_value=1.0
    ),
    "distance_to_river_m": FeatureMetadata(
        key="distance_to_river_m",
        name="Distance to River Centroid",
        unit="m",
        is_forecast=False,
        description="Proximity of zone centroid to nearest river line",
        min_value=0.0,
        max_value=100000.0
    ),
    "antecedent_precipitation_index": FeatureMetadata(
        key="antecedent_precipitation_index",
        name="Antecedent Precipitation Index (API)",
        unit="mm",
        is_forecast=False,
        description="Derived API decay index with k=0.85",
        min_value=0.0,
        max_value=3000.0
    ),
    "runoff_potential_index": FeatureMetadata(
        key="runoff_potential_index",
        name="Runoff Potential Index (RPI)",
        unit="ratio",
        is_forecast=False,
        description="Derived runoff potential ratio combining rain, soil, and elevation",
        min_value=0.0,
        max_value=1000.0
    ),
    "hydro_danger_index_clamped": FeatureMetadata(
        key="hydro_danger_index_clamped",
        name="Clamped Hydro Danger Index (HDI)",
        unit="ratio",
        is_forecast=False,
        description="Derived clamped ratio min(1.0, river_water_level_m / danger_level_m)",
        min_value=0.0,
        max_value=1.0
    )
}
