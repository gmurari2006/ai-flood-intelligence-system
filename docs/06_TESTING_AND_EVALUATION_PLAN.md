# Document 06 — Testing and Evaluation Plan

**Project Title:** AI-Powered Flood Prediction & Early Warning System  
**Document Version:** 1.0.0  
**Date:** September 9, 2026  
**Status:** Final Draft  

---

## 1. Testing Strategy & Philosophy

Quality assurance for the Flood Early Warning System is governed by a zero-silent-failure principle. Because disaster management decisions impact human lives, every system layer—from weather ingestion to ML inference, PostGIS spatial queries, and frontend warning displays—is validated against rigorous test cases.

---

## 2. Edge Cases & Failure Scenarios Matrix

| Scenario ID | Edge Case Description | Expected System Behavior | Pass Criteria |
| :--- | :--- | :--- | :--- |
| **FAIL-01** | Weather API stream drops or times out | Backend reads most recent DB observation and displays "SIMULATED / ESTIMATED" badge on UI. | API returns HTTP 200 with fallback data badge; UI does not crash. |
| **FAIL-02** | Extreme out-of-distribution rainfall (e.g., 500mm/1h) | Model outputs 99.9% probability and UI attaches "EXTREME WEATHER ANOMALY" warning banner. | Risk score caps at 100.00; XAI highlights extreme rain factor. |
| **FAIL-03** | Invalid lat/long coordinates submitted to API | Server rejects request with descriptive JSON validation error. | Returns HTTP 400 Bad Request: "Coordinates outside coverage zone." |
| **FAIL-04** | AI Inference service unavailable | System falls back to a deterministic hydrological heuristic calculation. | System records system event log; returns heuristic score. |
| **FAIL-05** | Unclosed or corrupt GIS polygon geometry | GeoAlchemy validation rejects invalid GeoJSON server-side. | Database rejects commit; spatial index stays clean. |
| **FAIL-06** | Unauthorized user attempts to publish alert | Auth middleware blocks request and logs security event. | Returns HTTP 403 Forbidden. |

---

## 3. Comprehensive Test Case Matrix

Below is the complete 25-point test matrix covering functional, performance, security, and AI requirements.

| Test Case ID | Requirement ID | Feature Under Test | Input / Test Action | Expected Result | Pass / Fail Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | FR-01 | User Login | POST valid credentials to `/api/v1/auth/login` | Returns HTTP 200 OK with valid JWT bearer token. | Valid JWT returned |
| **TC-AUTH-02** | FR-01 | Invalid Credentials | POST wrong password to `/api/v1/auth/login` | Returns HTTP 401 Unauthorized with error message. | HTTP 401 returned |
| **TC-PRED-01** | FR-03, AI-03 | AI Prediction Exec | POST `/api/v1/predictions` for ZONE-NORTH-BASIN | Returns `flood_probability`, depth, risk level in < 1500ms. | Valid prediction JSON returned |
| **TC-PRED-02** | FR-03, AI-01 | Missing Data Fallback | POST prediction with missing 24h rain vector | Preprocessor imputes value; attaches fallback badge. | Inference succeeds with badge |
| **TC-PRED-03** | FR-03 | Horizon Bounds | POST horizon = 120 hours (out of bounds) | Returns HTTP 400 Bad Request: "Horizon must be 1-24 hours." | HTTP 400 returned |
| **TC-PRED-04** | FR-04, AI-06 | XAI Factor Breakdown | GET `/api/v1/predictions/{id}/explain` | Returns sorted array of SHAP factors with impact directions. | 100% features explained |
| **TC-PRED-05** | FR-03, NFR-01 | Prediction Latency | Execute 50 automated prediction requests | 95th percentile response time is under 1,500ms. | Response time < 1.5s |
| **TC-MAP-01** | FR-05 | Vector Tile Render | Request `/api/v1/risk-map/layers` | Returns valid FeatureCollection GeoJSON with polygon coords. | GeoJSON syntax valid |
| **TC-MAP-02** | FR-05 | Zone Click Popup | Click zone polygon on Leaflet UI | Map opens popup displaying Zone Name, Risk %, Water Depth. | Popup renders instantly |
| **TC-MAP-03** | FR-06 | Risk Color Mapping | Trigger prediction with 87% flood risk | Zone polygon fill color changes to `#F97316` (Orange High Risk). | Color matches risk tier |
| **TC-MAP-04** | FR-05 | Spatial Intersection | Execute PostGIS `ST_Intersects` query | Returns assets located inside high-risk flood geometry. | Correct assets intersected |
| **TC-ALERT-01** | FR-09 | Issue Alert | POST `/api/v1/alerts` with RED_EMERGENCY severity | Alert saved in DB; active status banner appears on dashboard. | Alert created HTTP 201 |
| **TC-ALERT-02** | FR-10 | Public Warning List | GET `/api/v1/alerts/public` | Public API returns active warning payload without token. | Public payload returned |
| **TC-ALERT-03** | FR-09, NFR-09 | Unauthorized Alert | POST alert using PUBLIC_USER bearer token | Returns HTTP 403 Forbidden: "Insufficient permissions." | HTTP 403 returned |
| **TC-ALERT-04** | FR-09 | Expired Alert Status | Query alert after `expires_at` timestamp | Background worker updates status to `EXPIRED`. | Status equals EXPIRED |
| **TC-INFRA-01** | FR-07, AI-09 | Vulnerable Infrastructure | Query vulnerable assets for high-risk zone | Returns hospital asset with status `AT_RISK` & depth. | Asset correctly identified |
| **TC-INFRA-02** | FR-07 | Protective Guidance | Inspect hospital asset risk output | Recommended protection suggests sandbag deployment. | Guidance present |
| **TC-EVAC-01** | FR-08 | Safe Evacuation Path | POST `/api/v1/evacuation/plan-route` | Returns LineString GeoJSON routing around flooded zone. | Route avoids flood polygon |
| **TC-EVAC-02** | FR-08 | Shelter Capacity | Query shelter with full occupancy | System selects next nearest shelter with available capacity. | Shelter capacity > 0 |
| **TC-PUB-01** | FR-10, NFR-08 | Mobile Public View | Open public portal on mobile viewport (375px) | UI renders cleanly with high-contrast text and zero overflow. | Mobile layout intact |
| **TC-PUB-02** | FR-10 | Public Risk Display | Load public page during active RED alert | Top warning banner displays in prominent red styling. | Banner clearly visible |
| **TC-HIST-01** | FR-11 | Historical Analytics | GET `/api/v1/analytics/historical` for zone with date range | Returns recorded flood events, peak depths, and rainfall spikes. | Historical list returned |
| **TC-OVR-01** | FR-14 | Manual Alert Override | POST `/api/v1/alerts/override` with officer credentials | Updates active severity and logs audit record into `system_events`. | Override logged in DB |
| **TC-EXP-01** | FR-15 | Data Export | GET `/api/v1/analytics/export?format=csv&data_type=predictions` | Returns formatted downloadable CSV stream with headers. | CSV stream valid |
| **TC-AI-07** | AI-07 | Time-Series Forecasting | Execute 24h rainfall trajectory prediction | Returns 24-point hourly forecast array with confidence intervals. | 24-hour curve returned |
| **TC-AI-08** | AI-08 | River Anomaly Detection | Stream river stage surge (>0.5m/hr) to anomaly detector | Isolation forest flags `ANOMALOUS` flash surge condition. | Anomaly flag triggered |
| **TC-AI-10** | AI-10 | Alert Prioritization | Execute MCDA ranking across 4 zones with risk & population | Returns deterministic sorted priority tier queue. | Valid priority ranking |
| **TC-PERF-01** | NFR-01 | End-to-End Latency | Benchmark total time from button click to UI render | Total time < 2,000 ms. | Benchmark passed |
| **TC-PERF-02** | NFR-05 | Concurrent Load Test | Run Locust load script at 50 req/sec for 60s | 0% HTTP error rate; 95th percentile latency < 500ms. | 0 errors under load |
| **TC-SEC-01** | NFR-09 | SQL Injection Defense | Pass `' OR '1'='1` into zone search query | System escapes input safely; returns 0 matches or 400. | SQL injection neutralized |
| **TC-SEC-02** | NFR-09 | CORS Validation | Send request with unauthorized `Origin` header | Server rejects request without `Access-Control-Allow-Origin`. | CORS policy enforced |

---

## 4. Evaluation Framework

To evaluate the ML model during development and prototype validation:

```
+---------------------------------------------------------------------------------------------------------+
|                                  MODEL PERFORMANCE EVALUATION TARGETS                                   |
+----------------------+-----------------------+----------------------------------------------------------+
| Metric               | Classification Target | Prototype Design Target / Benchmark Validation Criteria  |
+----------------------+-----------------------+----------------------------------------------------------+
| ROC-AUC              | > 0.850               | 0.892 (Target Benchmark)                                 |
| Precision (High Risk)| > 0.800               | 0.845 (Target Benchmark)                                 |
| Recall (High Risk)   | > 0.850               | 0.880 (Target Benchmark - Low False Negatives)           |
| F1-Score             | > 0.820               | 0.862 (Target Benchmark)                                 |
| Brier Score          | < 0.150               | 0.112 (Target Well-Calibrated Probability)               |
| Inundation Depth MAE | < 0.30 meters         | 0.21 meters (Target Benchmark)                           |
+----------------------+-----------------------+----------------------------------------------------------+
```

> [!NOTE]
> Values above represent prototype design targets and benchmark validation criteria for model development and evaluation, not empirical operational production deployments.
