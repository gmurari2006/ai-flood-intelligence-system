# Document 08 — Requirements Traceability Matrix (RTM)

**Project Title:** AI-Powered Flood Prediction & Early Warning System  
**Document Version:** 1.0.0  
**Date:** September 9, 2026  
**Status:** Final Draft  

---

## 1. End-to-End Requirements Traceability Matrix

The Requirements Traceability Matrix (RTM) establishes 100% bi-directional traceability across all system artifacts. Every Functional Requirement (`FR-xx`), Non-Functional Requirement (`NFR-xx`), and AI Feature (`AI-xx`) maps directly to an architecture component, database table, API endpoint, and test case.

```
+---------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|                                                               REQUIREMENTS TRACEABILITY MATRIX (RTM)                                                                |
+-------+-----------------------------+---------------------------+-------------------------------+--------------------------------------------+---------+------------+
| Req ID| Feature Name                | Architecture Component    | Database Table(s)             | API Endpoint                               | AI ID   | Test Case  |
+-------+-----------------------------+---------------------------+-------------------------------+--------------------------------------------+---------+------------+
| FR-01 | User Authentication & RBAC  | Auth Service / Controller | users, user_roles             | POST /api/v1/auth/login                    | N/A     | TC-AUTH-01 |
| FR-02 | Command Center KPI Summary  | Dashboard Controller      | geographic_zones, alerts      | GET /api/v1/zones, GET /api/v1/alerts      | N/A     | TC-MAP-01  |
| FR-03 | AI Flood Risk Prediction    | Prediction Controller     | prediction_runs, predictions  | POST /api/v1/predictions                   | AI-03/04| TC-PRED-01 |
| FR-04 | Feature Attribution (XAI)   | SHAP XAI Engine           | risk_factors                  | GET /api/v1/predictions/{id}/explain       | AI-06   | TC-PRED-04 |
| FR-05 | Interactive GIS Map Display | GIS Spatial Engine        | geographic_zones, locations   | GET /api/v1/risk-map/layers                | AI-05   | TC-MAP-01  |
| FR-06 | Zone Risk Heatmap Layer     | GIS Layer Renderer        | risk_scores                   | GET /api/v1/risk-map/layers                | AI-05   | TC-MAP-03  |
| FR-07 | Infrastructure Mapping      | Vulnerability Intersector | infrastructure_assets/risk    | GET /api/v1/infrastructure/vulnerable      | AI-09   | TC-INFRA-01|
| FR-08 | Evacuation & Safe Route     | Pathfinding Route Planner | evacuation_centers            | POST /api/v1/evacuation/plan-route         | AI-10   | TC-EVAC-01 |
| FR-09 | Alert Creation & Dispatch   | Alert Broadcast Controller| alerts, alert_recipients      | POST /api/v1/alerts                        | AI-10   | TC-ALERT-01|
| FR-10 | Public Warning Portal       | Public Warning Controller | alerts, evacuation_centers    | GET /api/v1/alerts/public                  | N/A     | TC-PUB-01  |
| FR-11 | Historical Flood Analytics  | Analytics Controller      | historical_flood_events       | GET /api/v1/analytics/historical           | N/A     | TC-HIST-01 |
| FR-12 | Meteorological Ingestion    | Ingestion Scheduler       | weather, rainfall_obs         | GET /api/v1/weather/{zone_id}              | AI-01/02| TC-PRED-02 |
| FR-13 | Water Level Gauge Monitor   | Hydrological Ingest Stream| water_level_observations      | GET /api/v1/water-levels/{zone_id}         | AI-08   | TC-AI-08   |
| FR-14 | Manual Officer Overrides    | Decision Support Engine   | system_events, alerts         | POST /api/v1/alerts/override               | N/A     | TC-OVR-01  |
| FR-15 | Data Export & Reporting     | Data Exporter             | flood_predictions, alerts     | GET /api/v1/analytics/export               | N/A     | TC-EXP-01  |
+-------+-----------------------------+---------------------------+-------------------------------+--------------------------------------------+---------+------------+
```

---

## 2. Non-Functional & AI Requirements Traceability

| Requirement ID | Specification | Primary Architecture Layer | Validation Test Case ID |
| :--- | :--- | :--- | :--- |
| **NFR-01** | AI Inference Latency < 1,500ms | AI ML Engine (XGBoost C-API) | `TC-PERF-01` |
| **NFR-02** | Map Vector Render < 1,000ms | Frontend Leaflet GeoJSON Engine | `TC-MAP-01` |
| **NFR-03** | System Availability 99.9% | Cloud Infrastructure (Vercel/Render) | `TC-PERF-02` |
| **NFR-04** | Page Load Time < 2.0s | React / Vite SPA Asset Bundler | `TC-PUB-01` |
| **NFR-05** | API 95th Percentile Latency < 500ms| FastAPI Async Engine | `TC-PERF-02` |
| **NFR-06** | Data Quality 100% Validation | Pydantic Sanitizer Middleware | `TC-PRED-02` |
| **NFR-07** | Usability Score (SUS > 80) | UI/UX Design System | `TC-PUB-01` |
| **NFR-08** | Mobile Viewport Responsiveness | CSS Grid / Flexbox Layout | `TC-PUB-01` |
| **NFR-09** | JWT Auth & Password Hashing | OAuth2 Bearer / BCrypt | `TC-SEC-01`, `TC-AUTH-01` |
| **NFR-10** | WCAG 2.1 AA Accessibility | Dark Slate High-Contrast Palette | `TC-PUB-02` |
| **AI-01** | Data Preprocessing Imputation | RobustScaler / KNNImputer | `TC-PRED-02` |
| **AI-02** | Feature Engineering | Rolling Window Aggregator | `TC-PRED-01` |
| **AI-03** | Flood Probability Prediction | XGBoost Classifier Engine | `TC-PRED-01` |
| **AI-04** | Flood Severity Prediction | Random Forest Regressor Engine | `TC-PRED-01` |
| **AI-05** | Spatial Risk Mapping | PostGIS Polygon Intersector | `TC-MAP-04` |
| **AI-06** | Risk Factor Explanation (XAI) | SHAP TreeExplainer | `TC-PRED-04` |
| **AI-07** | Time-Series Forecasting | Exponential Smoothing / Prophet | `TC-AI-07` |
| **AI-08** | River Anomaly Detection | Isolation Forest Stream Filter | `TC-AI-08` |
| **AI-09** | Infrastructure Risk Analysis | Point-in-Polygon Proximity Engine | `TC-INFRA-01` |
| **AI-10** | Alert Prioritization Engine | MCDA Ranking Controller | `TC-AI-10` |

---

## 3. Consistency & Traceability Audit

- **Orphan Requirements Count:** `0` (Every requirement maps to code & tests).
- **Unmapped Database Entities:** `0` (All 20 database tables map to functional APIs).
- **Undocumented APIs:** `0` (All REST endpoints explicitly defined with JSON schemas).
- **Untested Features:** `0` (All 15 functional requirements covered by test cases `TC-AUTH-01` to `TC-SEC-02`).
- **Traceability Integrity:** `100% Verified`.
