# Document 05 — REST API Specification

**Project Title:** AI-Powered Flood Prediction & Early Warning System  
**Document Version:** 1.0.0  
**Date:** September 9, 2026  
**Base URL:** `/api/v1`  
**Status:** Final Draft  

---

## 1. API Overview & Standards

The system backend exposes a stateless RESTful JSON API. Built with FastAPI, all endpoints comply with the OpenAPI 3.0 standard.

### Key API Conventions:
- **Protocol:** HTTPS
- **Content-Type:** `application/json`
- **Authentication:** HTTP Bearer Token (`Authorization: Bearer <JWT_TOKEN>`)
- **Standard HTTP Status Codes:** `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`

---

## 2. Authentication & Authorization Endpoints

### 2.1 Login & Obtain JWT Token
- **Endpoint:** `POST /api/v1/auth/login`
- **Requirement ID:** `FR-01`
- **Authentication:** None (Public)
- **Request Body:**
```json
{
  "username": "officer_rajesh",
  "password": "SecurePassword123!"
}
```
- **Response `200 OK`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in_seconds": 43200,
  "user": {
    "id": "u78a2f1b-5e4d-4c3a-9b1a-0f1e2d3c4b5a",
    "username": "officer_rajesh",
    "full_name": "Rajesh Verma",
    "role": "DISASTER_OFFICER"
  }
}
```

---

## 3. Geographic & Zone Endpoints

### 3.1 Get All Monitored Zones
- **Endpoint:** `GET /api/v1/zones`
- **Requirement ID:** `FR-02`, `FR-05`
- **Authentication:** Bearer Token / Public Read
- **Response `200 OK`:**
```json
{
  "total_count": 4,
  "zones": [
    {
      "id": "ZONE-NORTH-BASIN",
      "name": "North River Basin",
      "location_id": "DIST-MUMBAI-01",
      "elevation_mean_m": 4.20,
      "drainage_capacity_score": 5.50,
      "centroid": { "latitude": 19.0760, "longitude": 72.8777 }
    }
  ]
}
```

---

## 4. Environmental Ingestion & Weather Endpoints

### 4.1 Get Zone Weather Observation
- **Endpoint:** `GET /api/v1/weather/{zone_id}`
- **Requirement ID:** `FR-12`
- **Response `200 OK`:**
```json
{
  "zone_id": "ZONE-NORTH-BASIN",
  "observed_at": "2026-09-09T22:30:00Z",
  "temperature_c": 27.5,
  "humidity_pct": 92.0,
  "rainfall": {
    "1h_mm": 45.2,
    "6h_mm": 112.0,
    "24h_mm": 185.4,
    "72h_mm": 240.0
  }
}
```

### 4.2 Get River Water Level Gauges
- **Endpoint:** `GET /api/v1/water-levels/{zone_id}`
- **Requirement ID:** `FR-13`
- **Response `200 OK`:**
```json
{
  "zone_id": "ZONE-NORTH-BASIN",
  "river_name": "Mithi River",
  "gauge_station_id": "GAUGE-MITHI-02",
  "water_level_m": 4.85,
  "warning_level_m": 3.50,
  "danger_level_m": 4.20,
  "status": "DANGER_EXCEEDED"
}
```

---

## 5. AI Flood Prediction Endpoints

### 5.1 Trigger AI Flood Risk Prediction
- **Endpoint:** `POST /api/v1/predictions`
- **Requirement ID:** `FR-03`, `AI-03`, `AI-04`
- **Authentication:** Bearer Token
- **Request Body:**
```json
{
  "zone_id": "ZONE-NORTH-BASIN",
  "forecast_horizon_hours": 6
}
```
- **Response `200 OK`:**
```json
{
  "prediction_run_id": "p98f7e6d-5c4b-3a21-0f9e-8d7c6b5a4321",
  "zone_id": "ZONE-NORTH-BASIN",
  "forecast_horizon_hours": 6,
  "flood_probability": 0.875,
  "predicted_depth_m": 1.45,
  "confidence_score": 0.920,
  "risk_score_numeric": 84.50,
  "risk_level": "HIGH",
  "recommended_action": "Issue evacuation warning for low-lying areas. Stage rescue teams.",
  "is_demo_data": false,
  "executed_at": "2026-09-09T22:35:10Z"
}
```

### 5.2 Get Explainable AI (XAI) Factor Attribution
- **Endpoint:** `GET /api/v1/predictions/{prediction_run_id}/explain`
- **Requirement ID:** `FR-04`, `AI-06`
- **Authentication:** Bearer Token
- **Note:** Values shown below are illustrative example payloads demonstrating mathematical feature attribution schema.
- **Response `200 OK`:**
```json
{
  "prediction_run_id": "p98f7e6d-5c4b-3a21-0f9e-8d7c6b5a4321",
  "base_expected_value": 0.150,
  "final_probability": 0.875,
  "factors": [
    {
      "feature_name": "rainfall_24h_mm",
      "observed_value": 185.4,
      "shap_contribution": 0.420,
      "impact_direction": "INCREASES_RISK",
      "description": "Heavy 24-hour accumulated rainfall"
    },
    {
      "feature_name": "river_stage_ratio",
      "observed_value": 1.15,
      "shap_contribution": 0.280,
      "impact_direction": "INCREASES_RISK",
      "description": "River water level exceeding danger stage"
    },
    {
      "feature_name": "elevation_mean_m",
      "observed_value": 4.2,
      "shap_contribution": 0.125,
      "impact_direction": "INCREASES_RISK",
      "description": "Low baseline coastal elevation"
    },
    {
      "feature_name": "drainage_capacity_score",
      "observed_value": 8.0,
      "shap_contribution": -0.100,
      "impact_direction": "DECREASES_RISK",
      "description": "Effective municipal drainage infrastructure"
    }
  ]
}
```

---

## 6. GIS & Risk Map Endpoints

### 6.1 Get GIS Map GeoJSON Vector Layers
- **Endpoint:** `GET /api/v1/risk-map/layers`
- **Requirement ID:** `FR-05`, `FR-06`
- **Query Parameters:** `layer_type` (`risk_zones`, `rainfall_heatmap`, `river_lines`, `infrastructure`)
- **Response `200 OK`:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[72.87, 19.07], [72.89, 19.07], [72.89, 19.09], [72.87, 19.09], [72.87, 19.07]]]
      },
      "properties": {
        "zone_id": "ZONE-NORTH-BASIN",
        "zone_name": "North River Basin",
        "risk_level": "HIGH",
        "risk_color": "#F97316",
        "flood_probability": 0.875,
        "water_depth_m": 1.45
      }
    }
  ]
}
```

---

## 7. Infrastructure Vulnerability Endpoints

### 7.1 Get Impacted Infrastructure Assets
- **Endpoint:** `GET /api/v1/infrastructure/vulnerable`
- **Requirement ID:** `FR-07`, `AI-09`
- **Query Parameters:** `zone_id` (optional), `min_risk_level` (optional)
- **Response `200 OK`:**
```json
{
  "total_affected_assets": 2,
  "assets": [
    {
      "asset_id": "ASSET-HOSP-01",
      "name": "City General Hospital",
      "asset_type": "HOSPITAL",
      "zone_id": "ZONE-NORTH-BASIN",
      "vulnerability_status": "AT_RISK",
      "estimated_water_depth_m": 0.85,
      "recommended_protection": "Deploy mobile sandbag barrier around basement generators."
    }
  ]
}
```

---

## 8. Evacuation & Safe Route Endpoints

### 8.1 Plan Evacuation Route to Shelter
- **Endpoint:** `POST /api/v1/evacuation/plan-route`
- **Requirement ID:** `FR-08`
- **Request Body:**
```json
{
  "origin_latitude": 19.0780,
  "origin_longitude": 72.8810,
  "avoid_flood_zones": true
}
```
- **Response `200 OK`:**
```json
{
  "recommended_shelter": {
    "shelter_id": "SHELTER-NORTH-01",
    "name": "North Community Shelter Hub",
    "address": "Civic Center Road 12",
    "available_capacity": 450
  },
  "route": {
    "distance_km": 3.2,
    "estimated_time_minutes": 12,
    "route_status": "SAFE_DRY_PATH",
    "path_geojson": {
      "type": "LineString",
      "coordinates": [[72.8810, 19.0780], [72.8840, 19.0810], [72.8890, 19.0850]]
    }
  }
}
```

### 8.2 Get All Evacuation Shelters
- **Endpoint:** `GET /api/v1/evacuation/shelters`
- **Requirement ID:** `FR-08`, `FR-10`
- **Authentication:** Public / Bearer Token
- **Query Parameters:** `zone_id` (optional), `is_active` (default `true`)
- **Response `200 OK`:**
```json
{
  "total_shelters": 3,
  "shelters": [
    {
      "id": "SHELTER-NORTH-01",
      "name": "North Community Shelter Hub",
      "address": "Civic Center Road 12",
      "max_capacity": 500,
      "current_occupancy": 50,
      "available_capacity": 450,
      "has_backup_power": true,
      "location": { "latitude": 19.0850, "longitude": 72.8890 },
      "is_active": true
    }
  ]
}
```

---

## 9. Emergency Alert Endpoints

### 9.1 Publish Regional Flood Alert
- **Endpoint:** `POST /api/v1/alerts`
- **Requirement ID:** `FR-09`
- **Authentication:** Bearer Token (Officer Role)
- **Request Body:**
```json
{
  "zone_id": "ZONE-NORTH-BASIN",
  "severity": "RED_EMERGENCY",
  "title": "CRITICAL FLOOD WARNING — NORTH BASIN",
  "message": "Heavy rainfall has caused river level to overflow. Immediate evacuation ordered for low-lying sectors.",
  "duration_hours": 12
}
```
- **Response `201 Created`:**
```json
{
  "alert_id": "a11b22c3-33d4-44e5-55f6-66a77b88c99d",
  "status": "ACTIVE",
  "issued_at": "2026-09-09T22:40:00Z",
  "expires_at": "2026-09-10T10:40:00Z"
}
```

### 9.2 Get All Alerts (Authority View)
- **Endpoint:** `GET /api/v1/alerts`
- **Requirement ID:** `FR-02`, `FR-09`
- **Authentication:** Bearer Token (Officer / Admin Role)
- **Query Parameters:** `status` (optional: `ACTIVE`, `DRAFT`, `EXPIRED`, `CANCELLED`), `zone_id` (optional)
- **Response `200 OK`:**
```json
{
  "total_alerts": 1,
  "alerts": [
    {
      "id": "a11b22c3-33d4-44e5-55f6-66a77b88c99d",
      "zone_id": "ZONE-NORTH-BASIN",
      "severity": "RED_EMERGENCY",
      "title": "CRITICAL FLOOD WARNING — NORTH BASIN",
      "message": "Immediate evacuation ordered for low-lying sectors.",
      "status": "ACTIVE",
      "issued_at": "2026-09-09T22:40:00Z",
      "expires_at": "2026-09-10T10:40:00Z"
    }
  ]
}
```

### 9.3 Manual Alert / Risk Override
- **Endpoint:** `POST /api/v1/alerts/override`
- **Requirement ID:** `FR-14`
- **Authentication:** Bearer Token (Officer Role)
- **Request Body:**
```json
{
  "zone_id": "ZONE-NORTH-BASIN",
  "override_severity": "RED_EMERGENCY",
  "justification": "Field reports indicate local drainage blockage causing rapid water accumulation.",
  "duration_hours": 6
}
```
- **Response `200 OK`:**
```json
{
  "status": "OVERRIDE_APPLIED",
  "zone_id": "ZONE-NORTH-BASIN",
  "effective_severity": "RED_EMERGENCY",
  "audit_event_id": 1042,
  "updated_at": "2026-09-09T22:45:00Z"
}
```

---

## 10. Public Safety Warnings Endpoint

### 10.1 Get Active Public Warnings (Unauthenticated)
- **Endpoint:** `GET /api/v1/alerts/public`
- **Requirement ID:** `FR-10`
- **Note:** `safety_instructions` are dynamically mapped from the alert severity tier by the backend API service rather than stored as an independent database column.
- **Response `200 OK`:**
```json
{
  "active_warnings_count": 1,
  "warnings": [
    {
      "zone_name": "North River Basin",
      "severity": "RED_EMERGENCY",
      "title": "CRITICAL FLOOD WARNING — NORTH BASIN",
      "message": "Immediate evacuation ordered for low-lying sectors.",
      "safety_instructions": [
        "Move to upper floors or nearest emergency shelter immediately.",
        "Do not walk or drive through flowing water.",
        "Keep emergency contacts ready."
      ]
    }
  ]
}
```

---

## 11. Historical Analytics & Export Endpoints

### 11.1 Get Historical Flood Analytics
- **Endpoint:** `GET /api/v1/analytics/historical`
- **Requirement ID:** `FR-11`
- **Authentication:** Bearer Token
- **Query Parameters:** `zone_id` (optional), `start_date` (optional, YYYY-MM-DD), `end_date` (optional, YYYY-MM-DD)
- **Response `200 OK`:**
```json
{
  "zone_id": "ZONE-NORTH-BASIN",
  "total_recorded_events": 2,
  "historical_events": [
    {
      "event_id": "e89a1b2c-3d4e-5f6a-7b8c-9d0e1f2a3b4c",
      "event_date": "2005-07-26",
      "peak_water_depth_m": 2.40,
      "total_rainfall_mm": 944.20,
      "severity_level": "CATASTROPHIC",
      "notes": "Historic cloudburst deluge"
    }
  ]
}
```

### 11.2 Export Risk and Alert Data
- **Endpoint:** `GET /api/v1/analytics/export`
- **Requirement ID:** `FR-15`
- **Authentication:** Bearer Token
- **Query Parameters:** `format` (`json` or `csv`), `data_type` (`predictions`, `alerts`, `infrastructure`)
- **Response `200 OK` (JSON Format):**
```json
{
  "exported_at": "2026-09-09T23:00:00Z",
  "record_count": 1,
  "data_type": "predictions",
  "records": [
    {
      "prediction_run_id": "p98f7e6d-5c4b-3a21-0f9e-8d7c6b5a4321",
      "zone_id": "ZONE-NORTH-BASIN",
      "flood_probability": 0.875,
      "predicted_depth_m": 1.45,
      "risk_level": "HIGH"
    }
  ]
}
```

---

## 12. System Health & Diagnostics Endpoints

### 12.1 System Health Check
- **Endpoint:** `GET /api/v1/system/health`
- **Requirement ID:** `NFR-03`
- **Authentication:** None (Public)
- **Response `200 OK`:**
```json
{
  "status": "HEALTHY",
  "timestamp": "2026-09-09T23:05:00Z",
  "database": { "status": "CONNECTED", "latency_ms": 4.2 },
  "ai_engine": { "status": "READY", "active_model": "XGB-FLOOD-V1.0" },
  "weather_stream": { "status": "ACTIVE", "last_ingest": "2026-09-09T23:00:00Z" }
}
```
