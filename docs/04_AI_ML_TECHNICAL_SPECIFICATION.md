# Document 04 — AI/ML Technical Specification

**Project Title:** AI-Powered Flood Prediction & Early Warning System  
**Document Version:** 1.0.0  
**Date:** September 9, 2026  
**Status:** Final Draft  

---

## 1. AI/ML Overview

The Machine Learning architecture of the Flood Early Warning System is designed around two core tenets: **predictive accuracy** and **decision transparency**. Rather than deploying a "black-box" model, the system uses an ensemble of gradient-boosted decision trees (XGBoost) and Random Forests integrated with SHAP (SHapley Additive exPlanations) tree-explainers. This architecture allows the platform to forecast flood probabilities (0–100%) and estimated inundation depths (meters) while providing human-understandable factor contributions.

---

## 2. AI Feature Map Matrix

| AI Feature ID | Feature Name | Algorithm / Model | Input Parameters | Output Parameters | Evaluation Metric | Target Threshold | Failure Condition |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AI-01** | Data Preprocessing | RobustScaler / KNNImputer | Raw weather & river observations | Clean, scaled feature array | Missingness % | `< 1.0% nulls` | Drop feature if nulls > 30% |
| **AI-02** | Feature Engineering | Rolling Window Aggregator | 1h/6h/24h/72h rainfall | Cumulative & Rate-of-Change vectors | Correlation with Target | Spearman `r > 0.3` | Zero variance across window |
| **AI-03** | Flood Probability Prediction | XGBoost Classifier | Environmental feature vector | Flood Probability `[0.00 - 1.00]` | ROC-AUC / F1 | `ROC-AUC > 0.85` | ROC-AUC < 0.70 |
| **AI-04** | Flood Severity Prediction | Random Forest Regressor | High-risk environmental vector | Estimated Inundation Depth (m) | MAE / RMSE | `MAE < 0.25 m` | MAE > 0.60 m |
| **AI-05** | Spatial Risk Mapping | PostGIS Spatial Polygon Intersector | Zone boundary + Prediction Run | Zone Risk Category (`LOW` to `CRITICAL`) | Spatial Overlap (IoU) | `IoU > 0.80` | Polygons unclosed / self-intersecting |
| **AI-06** | Risk Factor Explanation | SHAP (TreeExplainer) | Trained XGBoost Model + Instance Vector | Sorted SHAP feature values (+/-) | Explanatory Coverage | `100% features explained` | Explainer execution timeout > 2s |
| **AI-07** | Time-Series Forecasting | Exponential Smoothing / Prophet Proxy | Past 7-day rainfall time-series | Forecasted 24h rainfall trajectory | MAPE | `MAPE < 15%` | Non-stationary diverge |
| **AI-08** | Anomaly Detection | Isolation Forest | River stage & discharge stream | Anomaly Flag (`NORMAL` vs `ANOMALOUS`) | Precision / Recall | `Precision > 0.90` | False anomaly rate > 10% |
| **AI-09** | Infrastructure Risk Analysis | Point-in-Polygon Distance Matrix | Asset location + Risk contour | Vulnerability Status (`SAFE` / `AT_RISK`) | Classification Accuracy | `Accuracy > 0.95` | Asset elevation missing |
| **AI-10** | Alert Prioritization | Multi-Criteria Decision Analysis (MCDA) | Risk Score + Population Density | Prioritized Alert Tier | Rank Consistency | `100% deterministic ranking` | Conflict between zone ranks |

--## 3. Dataset Strategy & Data Sources

To maintain absolute scientific credibility during demonstration, data feeds are strictly categorized into three tiers:

### 3.1 REAL DATA (Live & Static Sources)
- **Open-Meteo REST API:** Real-time observations and 7-day hourly weather forecasts (Rainfall, Temperature, Soil Moisture).
- **Copernicus DEM (Digital Elevation Model):** 30-meter spatial resolution global topographic elevation raster data.
- **HydroSHEDS / HydroRIVERS:** Global river network vector shapefiles.

### 3.2 DEMO DATA (Pre-Seeded Scenarios)
- Historical extreme rainfall events (e.g., Mumbai 2005 944mm storm profile, Kerala 2018 deluge) structured into local JSON datasets for offline demonstration reliability.

### 3.3 SIMULATED DATA (Synthetic Stress Test Inputs)
- Synthetic high-intensity cloudburst scenarios generated to evaluate system alerts under extreme out-of-distribution environmental conditions.

### 3.4 Offline GIS & DEM Preprocessing Pipeline
Terrain-derived static topographical features—specifically mean elevation (`elevation_mean_m`) and mean terrain slope (`slope_mean_deg`)—are pre-computed through an offline GIS preprocessing pipeline during database seeding rather than calculated dynamically per prediction request. The preprocessing script uses `rasterio` and `rasterstats` to extract zonal statistics from the Copernicus 30m DEM raster against defined `geographic_zones` polygon boundaries, persisting the results directly into the database.

---

## 4. Input Features & Target Variables

### 4.1 Input Feature Space (13 Core Vectors)

```
+----------------------------------------------------------------------------------------------------+
|                                INPUT FEATURE SPACE SPECIFICATION                                   |
+------------------------------+-----------+--------+------------------------------------------------+
| Feature Key                  | Data Type | Unit   | Description                                    |
+------------------------------+-----------+--------+------------------------------------------------+
| rainfall_1h_mm               | Float     | mm     | Immediate 1-hour observed rainfall             |
| rainfall_6h_mm               | Float     | mm     | Accumulated 6-hour observed rainfall           |
| rainfall_24h_mm              | Float     | mm     | Accumulated 24-hour observed rainfall          |
| rainfall_72h_mm              | Float     | mm     | Antecedent 3-day observed rainfall             |
| rain_intensity_delta         | Float     | mm/hr  | Acceleration rate of observed rainfall         |
| forecast_rainfall_horizon_mm | Float     | mm     | Forecasted cumulative rainfall for horizon H   |
| river_water_level_m          | Float     | meters | Current river stage height                     |
| river_stage_ratio            | Float     | ratio  | Current Level / Danger Level                   |
| elevation_mean_m             | Float     | meters | Mean elevation of geographic zone              |
| slope_mean_deg               | Float     | deg    | Terrain incline steepness                      |
| drainage_capacity_score      | Float     | [0-10] | Municipal drainage effectiveness metric        |
| soil_saturation_proxy        | Float     | [0-1]  | Estimated soil moisture saturation ratio       |
| distance_to_river_m          | Float     | meters | Proximity of zone centroid to nearest river    |
+------------------------------+-----------+--------+------------------------------------------------+
```

#### Forecast Rainfall Horizon Definition:
When an AI prediction is invoked for a forecast window $H \in \{3, 6, 12, 24\}$ hours, `forecast_rainfall_horizon_mm` represents the cumulative projected precipitation over the next $H$ hours extracted from the Open-Meteo hourly meteorological forecast stream:

$$\text{forecast\_rainfall\_horizon\_mm} = \sum_{t=1}^{H} \hat{R}_{t}$$

Where $\hat{R}_t$ is the forecasted precipitation at hour $t$. This allows the model to differentiate future flood risk based on incoming storms before ground precipitation occurs.

### 4.2 Target Variables
1. **Primary Binary Target (`is_flood`):** `1` if flood inundation depth exceeds `0.15 meters`; `0` otherwise.
2. **Secondary Continuous Target (`flood_depth_m`):** Inundation water level in meters `[0.00 - 5.00m]`.

---

## 5. Feature Engineering & Preprocessing Pipeline

```
Raw Feeds ---> Imputation (KNN) ---> Scaling (RobustScaler) ---> Feature Interactions ---> Vector Array
```

### Key Derived Features:
- **Antecedent Precipitation Index (API):** $API = \sum_{t=1}^{3} R_t \cdot k^t$ (where $k = 0.85$ decay factor).
- **Runoff Potential Index (RPI):** $RPI = \frac{(\text{rainfall\_24h\_mm} + \text{forecast\_rainfall\_horizon\_mm}) \times \text{soil\_saturation\_proxy}}{\text{elevation\_mean\_m} + 1.0}$.
- **Clamped Hydro Danger Index (HDI):** $\text{HDI}_{\text{clamped}} = \min\left(1.0, \frac{\text{river\_water\_level\_m}}{\text{danger\_level\_m}}\right)$.

---

## 6. Model Evaluation & Selection Analysis

Candidate model architectures evaluated against system criteria:

```
+-----------------------------------------------------------------------------------+
|                     MODEL ARCHITECTURE CANDIDATE TRADE-OFFS                       |
+--------------------+---------------+-------------------+-------------+-----------+
| Architecture       | Training Time | Inference Latency | XAI Support | Accuracy  |
+--------------------+---------------+-------------------+-------------+-----------+
| Logistic Regression| Fast (<1s)    | Ultra-Fast (<5ms) | Coefficient | Low (0.71)|
| XGBoost Classifier | Fast (2s)     | Fast (12ms)       | Native SHAP | High(0.89)|
| Random Forest      | Fast (3s)     | Fast (18ms)       | Native SHAP | High(0.87)|
| LSTM Neural Net    | Slow (30s)    | Moderate (85ms)   | Integrated  | High(0.88)|
| Physics CFD Model  | Very Slow(hr) | Ultra-Slow (>10m) | Partial     | Exact     |
+--------------------+---------------+-------------------+-------------+-----------+
```

### Selection Rationale:
**XGBoost Classifier** paired with **Random Forest Regressor** was selected. It delivers high predictive accuracy on tabular spatial metrics, executes inference in milliseconds on standard CPU, and integrates natively with SHAP C-extensions for real-time feature attribution.

---

## 7. Explainable AI (XAI) Architecture

For every prediction run, the system executes a SHAP `TreeExplainer` on the input feature vector:

$$\text{Prediction Output} = \phi_0 + \sum_{i=1}^{M} \phi_i$$

Where $\phi_0$ is the base expected value, and $\phi_i$ represents the additive mathematical contribution of feature $i$.

### Illustrative Example XAI Output Schema:
```json
{
  "zone_id": "ZONE-NORTH-BASIN",
  "flood_probability": 0.875,
  "risk_level": "HIGH",
  "base_value": 0.150,
  "shap_factors": [
    {
      "feature": "rainfall_24h_mm",
      "value": 185.4,
      "shap_value": 0.420,
      "impact": "INCREASES_RISK",
      "human_label": "Torrential 24h Rainfall (185.4 mm)"
    },
    {
      "feature": "river_stage_ratio",
      "value": 1.25,
      "shap_value": 0.280,
      "impact": "INCREASES_RISK",
      "human_label": "River Level Exceeds Danger Stage (+25%)"
    },
    {
      "feature": "elevation_mean_m",
      "value": 4.2,
      "shap_value": 0.125,
      "impact": "INCREASES_RISK",
      "human_label": "Low-Lying Flat Coastal Elevation (4.2 m)"
    },
    {
      "feature": "drainage_capacity_score",
      "value": 8.0,
      "shap_value": -0.100,
      "impact": "DECREASES_RISK",
      "human_label": "Good Municipal Drainage Infrastructure"
    }
  ]
}
```

---

## 8. Conceptual Risk Framework

To synthesize ML probabilities into decision-ready risk ratings without exceeding database bounds:

$$\text{Elevation Score} = \min\left(1.0, \max\left(0.0, \frac{\text{elevation\_mean\_m}}{50.0}\right)\right)$$

$$\text{Raw Risk Score} = (\text{Flood Probability} \times 0.60) + (\text{HDI}_{\text{clamped}} \times 0.25) + ((1.0 - \text{Elevation Score}) \times 0.15)$$

$$\text{Risk Score (Numeric)} = \min(100.00, \max(0.00, \text{Raw Risk Score} \times 100.0))$$

This formula ensures the synthesized risk score is bounded within $[0.00, 100.00]$, strictly satisfying the database check constraint `CHECK (risk_score_numeric BETWEEN 0.00 AND 100.00)`.

### Risk Score Mapping Tiers:
- `0.00 - 29.99`: **LOW RISK** (Green) — Normal monitoring.
- `30.00 - 54.99`: **MODERATE RISK** (Yellow) — Internal agency advisory.
- `55.00 - 74.99`: **HIGH RISK** (Orange) — Public warnings & resource staging.
- `75.00 - 100.00`: **CRITICAL RISK** (Red) — Mandatory evacuation orders.

---

## 9. Specialized AI Modules Specification

### 9.1 AI-07: Time-Series Rainfall Forecasting
- **Purpose:** Forecast 24-hour rainfall progression trajectory to anticipate storm surges before external forecast updates.
- **Inputs:** 168-hour antecedent hourly rainfall sequence ($\text{rainfall\_1h\_mm}$) per zone.
- **Output:** Hourly forecasted precipitation array $\hat{R}_{t+1 \dots t+24}$ (mm) with $95\%$ upper and lower confidence intervals.
- **Processing Cadence:** Scheduled hourly cron job and on-demand trigger upon heavy rain detection ($>25\text{mm/hr}$).
- **Pipeline Integration:** Predicted rainfall array populates `forecast_rainfall_horizon_mm` in the feature store and renders the 24-hour forecast curve on dashboard charts.
- **Warning Trigger:** Triggers an automated internal advisory if forecasted 6-hour accumulation exceeds $75\text{mm}$.
- **Evaluation Metric & Benchmark Target:** Mean Absolute Percentage Error (MAPE) $< 15\%$ on validation time-series holdouts.

### 9.2 AI-08: River Hydrodynamic Anomaly Detection
- **Purpose:** Detect anomalous sensor readings, flash surges, or gauge transmission dropouts.
- **Inputs:** Stream of `water_level_m`, `discharge_rate_m3s`, and computed rate-of-rise $\frac{\Delta \text{water\_level}}{\Delta t}$ (m/hr).
- **Algorithm:** Isolation Forest anomaly detector.
- **Output:** Anomaly flag (`NORMAL` vs `ANOMALOUS`) and anomaly score in range $[-1.0, 1.0]$.
- **Processing Cadence:** Real-time evaluation on every incoming 15-minute gauge telemetry batch.
- **Pipeline Integration:** Anomaly flags mark telemetry as `POTENTIAL_FLASH_SURGE` or `SENSOR_ANOMALY` and write audit records to `system_events`.
- **Warning Trigger:** If rate of rise $> 0.5\text{m/hr}$ or anomaly score $< -0.50$, flags immediate gauge alert on Command Center.
- **Evaluation Metric & Benchmark Target:** Precision $> 0.90$, False Anomaly Rate $< 10\%$ on synthetic noise and rapid-rise test streams.

---

## 10. Model Monitoring & Ethical Disclaimer

1. **Decision Support Mandate:** The AI model operates purely as a decision-support system for human disaster management authorities. It does NOT automatically trigger public sirens or execute official orders without human-in-the-loop review.
2. **Out-of-Distribution Warning:** If input environmental values fall beyond 3 standard deviations of historical training bounds, the UI displays a warning banner: *"Extremely rare weather event detected. Model uncertainty elevated."*
