# Module 7 Phase 6: Historical Analytics, Reporting & Decision Intelligence Implementation Plan

**Project:** AI Flood Intelligence System  
**Document Version:** 3.0.0 (Strict RBAC & Contract-Integrity Architecture)  
**Phase:** Module 7 — Phase 6  
**Status:** PLAN-ONLY (Awaiting Explicit Review & Approval)  

---

## 1. Executive Summary
Module 7 Phase 6 delivers the **Historical Analytics, Reporting, and Decision Intelligence** layer for the AI Flood Intelligence System. This module provides authorized emergency officers and regional planners with historical flood event exploration, latest environmental telemetry assessments, zone-level comparative baselines, and multi-dataset export capabilities (CSV/JSON).

In strict accordance with contract honesty, data classification, and non-fabrication mandates:
- **100% Contract-Bound:** Uses only verified backend endpoints (`GET /api/v1/analytics/historical` and `GET /api/v1/analytics/export`).
- **Decisive RBAC Separation:**
  - **Officer / Admin Only:** Historical analytics and operational data exports are strictly restricted to `DISASTER_OFFICER` and `SUPER_ADMIN` roles.
  - **Public Restriction:** `PUBLIC_USER` and unauthenticated citizens are denied access to `/analytics` and receive an explicit access restriction / authentication notice. Public users remain strictly confined to public safety contracts (`GET /api/v1/alerts/public` and `GET /api/v1/evacuation/shelters`).
- **Current Historical Count Verification:** Database inspection confirms `historical_flood_events = 0`. The UI renders an honest `NO HISTORICAL FLOOD EVENTS AVAILABLE` state; no mock or seeded records are fabricated.
- **Environmental Time-Series Boundary:** Because the backend provides only current aggregate observations (`GET /api/v1/weather/{zone_id}` and `GET /api/v1/water-levels/{zone_id}`), the UI displays current station telemetry and explicitly marks:  
  **HISTORICAL ENVIRONMENTAL TIME SERIES: NOT AVAILABLE THROUGH CURRENT API**. No synthetic timeseries curves or interpolated charts will be generated.
- **Model Evaluation Transparency:** Preserves the prominent notice:  
  **MODEL PERFORMANCE: NOT AVAILABLE — NO TRAINED PRODUCTION MODEL**. Zero simulated machine learning metrics (accuracy, ROC-AUC, precision, recall, confusion matrix) will be rendered.
- **Infrastructure Integrity:** Clearly labeled as **CURRENT INFRASTRUCTURE RISK** (not historical damage).
- **Export Capabilities:** Consumes verified `GET /api/v1/analytics/export` across 5 datasets (`predictions`, `alerts`, `infrastructure`, `zones`, `historical`) in RFC 4180 CSV and structured JSON exclusively for authorized officers. No fake PDF generation.

---

## 2. Current Repository Findings & Database State

### Current Database Count Verification
- **`historical_flood_events` Table:** **0 records** (`COUNT: 0`).
- **Required UI Behavior:** Empty state with message: **"NO HISTORICAL FLOOD EVENTS AVAILABLE — No historical flood records cataloged for selected filters."**

### Backend API Inventory
1. `GET /api/v1/analytics/historical` (`backend/app/api/v1/endpoints/analytics.py`):
   - Requires Bearer Token (`get_current_user`).
   - Supports query params: `zone_id`, `start_date`, `end_date`.
   - Returns `HistoricalAnalyticsResponse` (`total_recorded_events`, `historical_events`).
2. `GET /api/v1/analytics/export` (`backend/app/api/v1/endpoints/analytics.py`):
   - Requires Bearer Token (`get_current_user`).
   - Supports query params: `format` (`json` / `csv`), `data_type` (`predictions` / `alerts` / `infrastructure` / `zones` / `historical`).
   - Returns RFC 4180 CSV attachment stream or JSON `DataExportResponse`.
3. `GET /api/v1/weather/{zone_id}`:
   - Returns latest single observation with `rainfall_1h_mm`, `rainfall_6h_mm`, `rainfall_24h_mm`, `rainfall_72h_mm`, `temperature_c`, `humidity_pct`.
   - *Not an environmental time-series array.*
4. `GET /api/v1/water-levels/{zone_id}`:
   - Returns latest single river stage with `water_level_m`, `warning_level_m`, `danger_level_m`, `status`.
   - *Not a river level time-series array.*
5. `GET /api/v1/alerts`:
   - Requires `require_role(["DISASTER_OFFICER", "SUPER_ADMIN"])`.
   - Supports query params: `status` (`ACTIVE`, `DRAFT`, `EXPIRED`, `CANCELLED`), `zone_id`.
   - Returns all matching operational alerts with automatic backend expiration.
6. `GET /api/v1/infrastructure/vulnerable`:
   - Returns current asset vulnerability status (`SAFE`, `AT_RISK`, `CRITICAL`), elevation, and water depth.
   - *Not a historical damage log.*

---

## 3. Verified Analytics API Contracts & RBAC Rules

### 3.1 Historical Flood Analytics (`GET /api/v1/analytics/historical`)
- **Requirement:** `FR-11`
- **Authorized Roles:** `DISASTER_OFFICER`, `SUPER_ADMIN`
- **Denied Roles:** `PUBLIC_USER` (Access Restricted), `Unauthenticated` (401 Unauthorized)
- **Query Parameters:**
  - `zone_id` (`Optional[str]`): Geographic zone filter.
  - `start_date` (`Optional[date]`, format `YYYY-MM-DD`): Start date.
  - `end_date` (`Optional[date]`, format `YYYY-MM-DD`): End date.
- **Response Schema:**
  ```typescript
  export interface HistoricalFloodEventItem {
    event_id: string;
    event_date: string; // YYYY-MM-DD
    peak_water_depth_m: number | null;
    total_rainfall_mm: number | null;
    severity_level: string | null;
    notes: string | null;
  }

  export interface HistoricalAnalyticsResponse {
    zone_id: string | null;
    total_recorded_events: number;
    historical_events: HistoricalFloodEventItem[];
  }
  ```

### 3.2 Operational Data Export (`GET /api/v1/analytics/export`)
- **Requirement:** `FR-15`
- **Authorized Roles:** `DISASTER_OFFICER`, `SUPER_ADMIN`
- **Denied Roles:** `PUBLIC_USER` (Access Restricted), `Unauthenticated` (401 Unauthorized)
- **Query Parameters:**
  - `format` (`str`, default `"json"`): `"json"` | `"csv"`
  - `data_type` (`str`, default `"predictions"`): `"predictions"` | `"alerts"` | `"infrastructure"` | `"zones"` | `"historical"`
- **Response Behavior:**
  - `csv`: Direct streaming download (`media_type: text/csv`, header `Content-Disposition: attachment; filename=flood_intelligence_{data_type}.csv`).
  - `json`: `DataExportResponse` payload.

---

## 4. Role-Based Access Control & Frontend Route Guarding

### Access Control Matrix

| Role / User State | Route: `/analytics` | `GET /analytics/historical` | `GET /analytics/export` | Operational Datasets | Public Safety Portal (`/public`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`UNAUTHENTICATED`** | **DENIED** (Authentication Required) | **401 Unauthorized** | **401 Unauthorized** | Hidden | **ALLOWED** |
| **`PUBLIC_USER`** | **DENIED** (Access Restricted) | **Blocked** | **Blocked** | Hidden | **ALLOWED** |
| **`DISASTER_OFFICER`** | **ALLOWED** | **ALLOWED** | **ALLOWED** | Accessible | **ALLOWED** |
| **`SUPER_ADMIN`** | **ALLOWED** | **ALLOWED** | **ALLOWED** | Accessible | **ALLOWED** |

### Frontend Route Guard Implementation Pattern
In [`AnalyticsView.tsx`](file:///c:/Users/tinku/OneDrive/Desktop/ai-flood-intelligence-system/frontend/src/components/pages/AnalyticsView.tsx):
```tsx
const { isAuthenticated, isOfficer } = useAuth();

if (!isAuthenticated) {
  return <UnauthorizedGuard title="Authentication Required" message="Please log in to access the Historical Analytics & Decision Intelligence console." />;
}

if (!isOfficer) {
  return <AccessRestrictedGuard title="Officer Access Restricted" message="Historical analytics dossiers and operational data export are restricted to Disaster Officers and Emergency Administrators." />;
}
```

---

## 5. Data Classification & Information Boundaries

### Public Data Classification (Citizen Safe)
- Active Public Warning Advisories (`GET /api/v1/alerts/public`)
- Tailored Safety Directives and Flash Flood SOPs
- Emergency Evacuation Shelter Finder (`GET /api/v1/evacuation/shelters`)

### Officer / Admin Data Classification (Protected Operational Intelligence)
- Retrospective Historical Deluge Catalog (`GET /api/v1/analytics/historical`)
- Environmental Meteorological & River Threshold Diagnostics
- Cross-Zone Comparative Baselines (PostGIS drainage & population metrics)
- Critical Infrastructure Inundation Dossiers (`GET /api/v1/infrastructure/vulnerable`)
- Full Operational Alert Matrix & Severity Distribution (`GET /api/v1/alerts`)
- Multi-Dataset Operational Exports (`predictions`, `alerts`, `infrastructure`, `zones`, `historical`)

---

## 6. Data Sufficiency & Honest Representation Rules

| Analytical Module | Backend Contract Source | Current Data State | UI Presentation Rule |
| :--- | :--- | :--- | :--- |
| **Historical Flood Events** | `GET /api/v1/analytics/historical` | 0 Records | Render **"NO HISTORICAL FLOOD EVENTS AVAILABLE"** empty state. Zero sample events. |
| **Historical Environmental Time Series** | None (APIs provide latest snapshot only) | Unsupported by API | Render **"HISTORICAL ENVIRONMENTAL TIME SERIES: NOT AVAILABLE THROUGH CURRENT API"**. Render current 1h/6h/24h/72h and river stage buffer without synthetic curves. |
| **Model Evaluation / ML Metrics** | None (No trained production model) | Unsupported | Render **"MODEL PERFORMANCE: NOT AVAILABLE — NO TRAINED PRODUCTION MODEL"**. Zero fake accuracy/ROC-AUC. |
| **Infrastructure Impact** | `GET /api/v1/infrastructure/vulnerable` | Current risk only | Label as **"CURRENT INFRASTRUCTURE RISK"** (never "Historical Impact"). |
| **Operational Alert History** | `GET /api/v1/alerts` | Live/Expired records | Render real status and severity breakdown. |
| **Zone Comparison** | `GET /api/v1/zones` | PostGIS zones | Display authoritative elevation, drainage score, and population density. If data missing, show **"INSUFFICIENT DATA"**. |

---

## 7. Historical Flood Event Analytics Architecture
- **Matrix & Empty State:** Displays historical events table when records exist; renders clean, honest empty state when `total_recorded_events === 0`.
- **Precipitation vs. Inundation SVG Chart:** Rendered dynamically **only** if $\ge 1$ historical record is returned. If 0 records, the chart container displays the empty state rather than blank axes.
- **Filter Controls:** Zone selector and date bounds (`start_date`, `end_date`) that trigger filtered backend queries.

---

## 8. Environmental Analytics & Gauge Telemetry (Current Snapshot)
- **Current Rainfall Profile:** Displays latest 1h, 6h, 24h, and 72h precipitation values for the active zone from `GET /api/v1/weather/{zone_id}`.
- **River Stage Gauge Status:** Displays current water level relative to Warning Level ($m$) and Danger Level ($m$) with calculated buffer headroom from `GET /api/v1/water-levels/{zone_id}`.
- **Explicit Notice:** Clear label indicating that historical time-series logs are not exposed by the current ingestion API.

---

## 9. Temporal Analysis & Timestamp Handling
- **Timezone Standardization:** ISO-8601 UTC parsed to localized operational format.
- **Date Filter Boundaries:** Validates `start_date <= end_date`.
- **No Trend Interpolation:** Never connects sparse discrete points into imaginary continuous timeseries.

---

## 10. Zone-Level Comparative Baseline Intelligence
- **PostGIS Comparative Baseline Table:** Compares monitored geographic zones using real database fields from `GET /api/v1/zones`:
  - Mean Elevation ($m$)
  - Drainage Capacity Score (0–10)
  - Population Density ($/km^2$)
  - Monitored River Stage Status
- **Zero Fabricated Rankings:** No client-side arbitrary safety rankings or synthetic scores.

---

## 11. Historical Risk Analysis & Heuristic Provenance
- **Strict Distinction:**
  1. `OBSERVED HISTORICAL DATA`: Archival event records.
  2. `CURRENT HEURISTIC ASSESSMENT`: Deterministic Hydrological Heuristic Decision Engine output.
  3. `HISTORICAL PREDICTION OUTPUT`: Past prediction runs in database.
  4. `POSTGIS SPATIAL BASELINE`: Static zone elevation & drainage attributes.
- **No Blending:** These four data categories are never blended into a single chart without distinct provenance tagging.

---

## 12. Model Evaluation Transparency
- **Immutable Transparency Notice:**
  > **MODEL PERFORMANCE: NOT AVAILABLE — NO TRAINED PRODUCTION MODEL**  
  > *System currently operates on the deterministic Hydrological Heuristic Decision Engine. Accuracy, ROC-AUC, precision, recall, and confusion matrices are unconfigured and will not be displayed.*
- **Zero Fabrication:** No simulated performance metrics under any circumstances.

---

## 13. Historical AI / XAI Explanation Availability
- Factor attributions (`heuristic_factor_attribution`) are fetched strictly on demand per prediction run ID via `GET /api/v1/predictions/{id}/explain`.
- No historical SHAP curves or unbacked feature drift charts will be constructed.

---

## 14. Infrastructure Risk Assessment
- **Component:** `InfrastructureVulnerabilitySummary.tsx`
- **Data Source:** `GET /api/v1/infrastructure/vulnerable`
- **Labeling:** Explicitly titled **CURRENT INFRASTRUCTURE RISK** to reflect real-time inundation threat rather than historical disaster damage.

---

## 15. Operational Alert History Analytics
- **Data Source:** `GET /api/v1/alerts`
- **Analytics:** Calculates distribution across returned records:
  - Active Broadcasts
  - Expired / Archived Advisories
  - Cancelled Alerts
  - Severity Breakdown (`RED_EMERGENCY`, `CRITICAL`, `HIGH`, `MODERATE`, `LOW`)
- **Honest Limitations:** Notes that historical statistics reflect records currently retrievable via authority query without fabricated historical years.

---

## 16. Multi-Dataset Export Engine
- **Endpoint:** `GET /api/v1/analytics/export`
- **Authorized Roles:** `DISASTER_OFFICER`, `SUPER_ADMIN`
- **Supported Formats:** RFC 4180 CSV and Structured JSON.
- **Supported Datasets:** `predictions`, `alerts`, `infrastructure`, `zones`, `historical`.
- **Export Modal (`DataExportModal.tsx`):** Allows selecting dataset and format, triggers direct file download via blob streaming, and displays returned record counts.
- **No PDF Export:** PDF export is not supported by the backend and will not be simulated.

---

## 17. GIS Integration
- Reuses the existing Phase 2 Leaflet map container (`RiskMapView.tsx` / `CommandCenterView.tsx`).
- Does not instantiate duplicate map objects.

---

## 18. Visualization & Charting Strategy
- **Native SVG Approach:** Lightweight, zero-dependency SVG visualizers:
  - `HistoricalDepthChart.tsx`: Dual-bar chart (rendered only when historical records exist).
  - `EnvironmentalTelemetryCard.tsx`: Current 1h/6h/24h/72h rainfall bars and river stage gauge meter.
  - `AlertSeverityDistribution.tsx`: Segmented alert severity bar.
- **Data-Backed Rule:** Every chart renders an empty or notice state if data is absent or insufficient.

---

## 19. UI/UX Architecture & Layout Flow

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Page Header: Historical Intelligence & Data Analytics  [ Export Records ] │
├──────────────────────────────────────┬────────────────────────────────────┤
│ Zone & Date Range Filter Bar         │ Operational Provenance Badge       │
├──────────────────────────────────────┴────────────────────────────────────┤
│ SECTION 1: Historical Flood Events Matrix & Precipitation vs Depth Chart  │
│            (Renders "NO HISTORICAL FLOOD EVENTS AVAILABLE" when count=0)  │
├──────────────────────────────────────┬────────────────────────────────────┤
│ SECTION 2: Current Environmental     │ SECTION 3: River Stage Gauge vs    │
│ Telemetry (1h/6h/24h/72h Rainfall)   │ Warning / Danger Thresholds        │
│ [ Notice: Timeseries Unavailable ]   │ [ Notice: Timeseries Unavailable ] │
├──────────────────────────────────────┴────────────────────────────────────┤
│ SECTION 4: Zone-Level Comparative Baseline Matrix (Elevation, Drainage)   │
├──────────────────────────────────────┬────────────────────────────────────┤
│ SECTION 5: Operational Alert History │ SECTION 6: Model Evaluation Status │
│ & Severity Distribution Breakdown    │ [ Prominent NOT AVAILABLE Notice ] │
├──────────────────────────────────────┴────────────────────────────────────┤
│ SECTION 7: Current Infrastructure Risk Dossier                            │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 20. State Management Architecture (`AnalyticsContext.tsx`)
- **State:**
  - `historicalEvents`: `HistoricalFloodEventItem[]`
  - `totalRecordedEvents`: `number`
  - `isLoadingHistorical`: `boolean`
  - `historicalError`: `string | null`
  - `weatherTelemetry`: `ZoneWeatherViewResponse | null`
  - `waterLevelTelemetry`: `ZoneWaterLevelViewResponse | null`
  - `isExporting`: `boolean`
  - `exportError`: `string | null`
  - `selectedZoneId`: `string | null`
  - `startDate`: `string | null`
  - `endDate`: `string | null`
- **Methods:**
  - `fetchHistoricalEvents(zoneId?, startDate?, endDate?)`
  - `fetchTelemetry(zoneId)`
  - `exportDataset(dataType, format)`
  - `setFilterZone(zoneId)`
  - `setDateRange(startDate, endDate)`

---

## 21. Strict TypeScript Architecture (`frontend/src/types/analytics.ts`)

```typescript
export interface HistoricalFloodEventItem {
  event_id: string;
  event_date: string;
  peak_water_depth_m: number | null;
  total_rainfall_mm: number | null;
  severity_level: string | null;
  notes: string | null;
}

export interface HistoricalAnalyticsResponse {
  zone_id: string | null;
  total_recorded_events: number;
  historical_events: HistoricalFloodEventItem[];
}

export type ExportDataType = 'predictions' | 'alerts' | 'infrastructure' | 'zones' | 'historical';
export type ExportFormat = 'json' | 'csv';

export interface DataExportResponse {
  exported_at: string;
  record_count: number;
  data_type: ExportDataType;
  records: Array<Record<string, unknown>>;
}
```

---

## 22. API Client Extensions (`frontend/src/api/client.ts`)
- `getHistoricalAnalytics(options?: { zoneId?: string; startDate?: string; endDate?: string }): Promise<HistoricalAnalyticsResponse>`
- `exportData(dataType: ExportDataType, format: ExportFormat): Promise<DataExportResponse | Blob>`

---

## 23. File-by-File Implementation Matrix

| File Path | Action | Description | Dependencies |
| :--- | :--- | :--- | :--- |
| `frontend/src/types/analytics.ts` | **NEW** | Strict interfaces for historical analytics, responses, and export schemas | None |
| `frontend/src/context/AnalyticsContext.tsx` | **NEW** | Global provider for historical events, telemetry caching, and export actions | `api/client.ts` |
| `frontend/src/components/analytics/HistoricalEventTable.tsx` | **NEW** | Table of historical flood events with honest empty state | `types/analytics.ts` |
| `frontend/src/components/analytics/HistoricalDepthChart.tsx` | **NEW** | Native SVG dual-bar chart (renders only when records exist) | `common/Card.tsx` |
| `frontend/src/components/analytics/EnvironmentalTelemetryCard.tsx` | **NEW** | Current 1h/6h/24h/72h rainfall & river stage gauge with timeseries limitation notice | `types/gis.ts` |
| `frontend/src/components/analytics/ZoneComparisonTable.tsx` | **NEW** | PostGIS baseline comparison (elevation, drainage score, population density) | `types/gis.ts` |
| `frontend/src/components/analytics/AlertHistorySummaryCard.tsx` | **NEW** | Operational alert distribution and severity breakdown | `types/alerts.ts` |
| `frontend/src/components/analytics/ModelEvaluationNoticeCard.tsx` | **NEW** | Prominent notice of unconfigured ML model performance metrics | `common/Card.tsx` |
| `frontend/src/components/analytics/DataExportModal.tsx` | **NEW** | Export modal for 5 datasets in CSV and JSON formats | `api/client.ts` |
| `frontend/src/components/analytics/index.ts` | **NEW** | Barrel export for analytics components | None |
| `frontend/src/components/pages/AnalyticsView.tsx` | **MODIFY** | Replaces placeholder with full analytical workspace with officer RBAC guard | `components/analytics/*` |
| `frontend/src/api/client.ts` | **MODIFY** | Adds `getHistoricalAnalytics` and `exportData` methods | `types/analytics.ts` |
| `frontend/src/App.tsx` | **MODIFY** | Registers `AnalyticsProvider` | `context/AnalyticsContext.tsx` |

---

## 24. Performance Considerations
- Direct CSV streaming to browser Blob avoids memory overhead.
- Debounced query parameter updates prevent redundant network requests.
- Lightweight SVG components eliminate charting bundle overhead.

---

## 25. Testing Strategy
- **Build Validation:** `npm run build` (0 TypeScript errors).
- **Backend Regression:** `pytest -q` (87/87 tests passed).
- **Analytics Contract Tests:**
  - `EXP-TEST-01`: `GET /api/v1/analytics/historical`
  - `EXP-TEST-02`: `GET /api/v1/analytics/export?format=csv`
  - `EXP-TEST-03`: `GET /api/v1/analytics/export?format=json`

---

## 26. Multi-Device Browser Verification Plan
Target viewports: `1440 × 900`, `1024 × 768`, `768 × 1024`, `375 × 812`.
- Verify officer guard blocks `PUBLIC_USER` and unauthenticated sessions with explicit notice.
- Verify empty state for historical events (`NO HISTORICAL FLOOD EVENTS AVAILABLE`).
- Verify environmental telemetry limitation notice.
- Verify model performance `NOT AVAILABLE` notice.
- Verify export modal triggers real CSV and JSON downloads.
- Verify 0 console errors.

---

## 27. Requirement Traceability Matrix

| Requirement ID | Specification Document | Backend Endpoint | Frontend Component | Verification Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **FR-11** | Historical Flood Analytics | `GET /api/v1/analytics/historical` | `HistoricalEventTable.tsx`, `HistoricalDepthChart.tsx` | `test_historical_flood_analytics` |
| **FR-15** | Data Export (CSV/JSON) | `GET /api/v1/analytics/export` | `DataExportModal.tsx` | `test_export_csv`, `test_export_json` |
| **FR-03** | Weather Telemetry | `GET /api/v1/weather/{zone_id}` | `EnvironmentalTelemetryCard.tsx` | `test_weather_ingestion` |
| **FR-04** | River Stage Telemetry | `GET /api/v1/water-levels/{zone_id}` | `EnvironmentalTelemetryCard.tsx` | `test_water_level_ingestion` |
| **FR-09** | Alert History | `GET /api/v1/alerts` | `AlertHistorySummaryCard.tsx` | `test_get_authority_alerts` |
| **FR-07** | Current Infrastructure Risk | `GET /api/v1/infrastructure/vulnerable` | `AnalyticsView.tsx` | `test_vulnerable_infrastructure` |
| **NFR-03** | System Transparency | N/A (Heuristic Engine) | `ModelEvaluationNoticeCard.tsx` | Manual UI verification |

---

## 28. Contract Gaps & Explicit Exclusions
1. **No Historical Environmental Timeseries Endpoint:** Current APIs only expose latest snapshot.
2. **No ML Model Evaluation Endpoint:** No trained ML model exists.
3. **No Damage / Financial Loss Tracking:** Not in DB schema.
4. **No PDF Export Endpoint:** Backend supports CSV and JSON only.

---

## 29. Out of Scope for Phase 6
- Training ML models.
- Modifying `database/init.sql` or seeding mock historical records.
- Creating fake environmental timeseries curves.
- Phase 7 Administration & User Management.

---

## 30. Acceptance Criteria (Planned / To Be Verified)
- [ ] `GET /api/v1/analytics/historical` rendered in `HistoricalEventTable` with honest empty state when count is 0.
- [ ] `GET /api/v1/analytics/export` functional for all 5 datasets in CSV and JSON formats exclusively for authorized roles.
- [ ] RBAC route guard verified: `PUBLIC_USER` and unauthenticated sessions are strictly denied access to `/analytics`.
- [ ] Environmental card displays current snapshot and explicitly notes timeseries unavailability.
- [ ] Model evaluation section renders prominent `NOT AVAILABLE` notice.
- [ ] Infrastructure section explicitly labeled `CURRENT INFRASTRUCTURE RISK`.
- [ ] All 87 backend pytest tests pass.
- [ ] `npm run build` succeeds with 0 errors.
- [ ] Multi-device browser verification succeeds across all 4 target viewports.

---

## 31. Implementation Sequence (Upon Explicit Approval)
1. **Types & API Client:** Create `types/analytics.ts` and update `api/client.ts`.
2. **Context Layer:** Implement `context/AnalyticsContext.tsx` and wire in `App.tsx`.
3. **Analytical Components:**
   - Implement `HistoricalEventTable.tsx` & `HistoricalDepthChart.tsx`.
   - Implement `EnvironmentalTelemetryCard.tsx` (Current rainfall & river stage buffer with timeseries notice).
   - Implement `ZoneComparisonTable.tsx` & `AlertHistorySummaryCard.tsx`.
   - Implement `ModelEvaluationNoticeCard.tsx`.
   - Implement `DataExportModal.tsx`.
4. **View Integration:** Wire all components into `AnalyticsView.tsx` with officer RBAC lock guard.
5. **Testing & Build Verification:** Execute `npm run build` and `pytest -q`.
6. **Multi-Device Browser Verification:** Test 1440x900, 1024x768, 768x1024, 375x812.
7. **Walkthrough & Final Report:** Document all changes and present evidence.

---

## 32. Final Phase 6 Completion Checklist (Planned / To Be Verified)
- [ ] Strict contract adherence to `GET /api/v1/analytics/historical` & `GET /api/v1/analytics/export`
- [ ] Strict RBAC enforcement (`PUBLIC_USER` denied, `DISASTER_OFFICER` and `SUPER_ADMIN` allowed)
- [ ] Zero fabricated historical flood events, damages, or timeseries
- [ ] Explicit honesty notice for unconfigured ML model performance
- [ ] Multi-dataset CSV/JSON export capability
- [ ] 0 TypeScript build errors (`npm run build`)
- [ ] 87/87 backend regression tests passing (`pytest -q`)
- [ ] Phase 1–5 locked features 100% preserved
