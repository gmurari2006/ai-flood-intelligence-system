"""
Feature Engineering Calculations Module.

Implements deterministic feature formulas matching Document 04 Section 4.1 & 5.
"""

from typing import Sequence, Optional


class FeatureExtractionError(Exception):
    """Raised when required feature inputs fail quality checks or missing data policy."""
    pass


def calculate_antecedent_precipitation_index(
    rain_day1_mm: float,
    rain_day2_mm: float,
    rain_day3_mm: float,
    decay_factor: float = 0.85
) -> float:
    """
    Calculates Antecedent Precipitation Index (API) with exponential decay factor k=0.85.
    API = R1 * (k^1) + R2 * (k^2) + R3 * (k^3)
    """
    api_val = (
        (rain_day1_mm * (decay_factor ** 1)) +
        (rain_day2_mm * (decay_factor ** 2)) +
        (rain_day3_mm * (decay_factor ** 3))
    )
    return max(0.0, float(api_val))


def calculate_runoff_potential_index(
    rainfall_24h_mm: float,
    forecast_rainfall_horizon_mm: float,
    soil_saturation_proxy: float,
    elevation_mean_m: float
) -> float:
    """
    Calculates Runoff Potential Index (RPI):
    RPI = ((rainfall_24h_mm + forecast_rainfall_horizon_mm) * soil_saturation_proxy) / (elevation_mean_m + 1.0)
    """
    denom = max(0.1, elevation_mean_m + 1.0)
    rpi = ((rainfall_24h_mm + forecast_rainfall_horizon_mm) * soil_saturation_proxy) / denom
    return max(0.0, float(rpi))


def calculate_hydro_danger_index_clamped(
    river_water_level_m: float,
    danger_level_m: float
) -> float:
    """
    Calculates Clamped Hydro Danger Index (HDI_clamped):
    HDI_clamped = min(1.0, max(0.0, river_water_level_m / danger_level_m))
    """
    if danger_level_m <= 0.0:
        return 0.0
    ratio = river_water_level_m / danger_level_m
    return min(1.0, max(0.0, float(ratio)))


def calculate_rain_intensity_delta(
    rainfall_1h_mm: float,
    rainfall_6h_mm: float
) -> float:
    """
    Calculates rain intensity delta (mm/hr acceleration rate):
    rain_intensity_delta = rainfall_1h_mm - (rainfall_6h_mm / 6.0)
    """
    avg_6h_rate = rainfall_6h_mm / 6.0
    delta = rainfall_1h_mm - avg_6h_rate
    return float(delta)


def calculate_river_stage_ratio(
    water_level_m: float,
    danger_level_m: float
) -> float:
    """Calculates river stage ratio = water_level_m / danger_level_m."""
    if danger_level_m <= 0.0:
        return 0.0
    return float(water_level_m / danger_level_m)
