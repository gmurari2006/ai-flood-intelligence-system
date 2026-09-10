# Document 09 — Frontend Design and Implementation Plan

**Project Title:** AI-Powered Flood Prediction & Early Warning System  
**Document Version:** 1.1.0 (Refined Architecture & Epistemic Honesty Baseline)  
**Date:** September 10, 2026  
**Status:** Approved Design Plan / Ready for Phased Implementation  
**Target Milestone:** Module 7 — Frontend Professional Implementation  

---

## 1. Frontend Goals

The primary objective of the frontend for the **AI Flood Intelligence System** is to provide an elite, mission-critical Emergency Operations Center (EOC) intelligence terminal that fuses meteorological observations, hydrological telemetry, predictive assessment, geospatial intelligence, and decision-support response tools into a unified, highly responsive interface.

### Key Functional Objectives:
1. **Real-Time Situation Awareness:** Provide an uncompromised spatial overview of all monitored river basins, displaying dynamic flood risk contours, rain gauges, and river stages anchored around the interactive Leaflet GIS canvas.
2. **Dynamic & Epistemically Honest AI Presentation:** Strictly render inference modes and feature attributions dynamically from actual backend responses. When operating under the current production state (deterministic hydrological heuristic fallback), the UI must explicitly state this and **never** claim an active XGBoost model or generate fake SHAP values.
3. **Spatial Decision-Support Chain:** Visually link ground-truth environmental observations to risk assessments, affected geographic zones, impacted critical infrastructure, emergency shelter capacities, safe evacuation routes, and tiered alert dispatches.
4. **Role-Tailored Dual Interfaces:**
   - **Authority Command Center:** High-density, GIS-centered tactical console for authenticated disaster officers and system administrators.
   - **Public Safety Portal (`/public`):** Accessible, fast-loading, mobile-first citizen advisory screen providing plain-language warnings and nearest shelter locations.
5. **Absolute Data Integrity:** Strictly reflect genuine backend states without fabricating synthetic road routes, fake model claims during heuristic fallbacks, or artificial historical charts.

---

## 2. Design Philosophy & Purpose-Built Visual Identity

The interface follows a **"Mission-Critical Command & Intelligence"** design philosophy, specifically engineered for emergency managers operating under high cognitive load:

### 2.1 Core Identity
The visual identity communicates four essential pillars:
$$\text{FLOOD INTELLIGENCE} + \text{GEOSPATIAL AWARENESS} + \text{AI DECISION SUPPORT} + \text{EMERGENCY RESPONSE}$$

### 2.2 Spatial Chain as Organizing Principle
Rather than filling the screen with generic, disconnected KPI metric cards, the layout organizes intelligence along the operational disaster decision chain:
$$\text{Observed Environment} \longrightarrow \text{AI Risk Assessment} \longrightarrow \text{Affected Area (GIS)} \longrightarrow \text{Infrastructure Impact} \longrightarrow \text{Evacuation Options} \longrightarrow \text{Emergency Response}$$

The interactive GIS map is the **visual anchor** of the command center, with analytical side-panels dynamically synchronizing with the spatial context.

### 2.3 Visual Restraint & Anti-Patterns to Avoid
The design avoids all common generic dashboard tropes:
- **NO** generic Bootstrap / Material dashboard appearance.
- **NO** excessive glassmorphism, glowing neon borders, or heavy gradient fills.
- **NO** overly rounded cards or decorative AI graphics (no robot avatars or fake neural network nodes).
- **NO** meaningless animated counters or fake ticker numbers.
- **NO** synthetic telemetry or fake historical charts populated to "look busy."
- **Restrained Motion:** Animations (150ms–250ms transitions) exist strictly to communicate state changes, guide operator attention, or indicate asynchronous loading.

---

## 3. Visual Design System

### 3.1 Design Tokens & Theme Architecture
The styling system is built entirely on standard Vanilla CSS custom properties (`:root` tokens) in `frontend/src/styles/main.css`, ensuring zero runtime overhead and complete architectural flexibility.

```css
:root {
  /* Surface & Background Hierarchy */
  --bg-app: #0B0F19;            /* Deep navy canvas */
  --bg-primary: #0F172A;        /* Slate 900 primary panel */
  --bg-secondary: #1E293B;      /* Slate 800 secondary cards */
  --bg-tertiary: #334155;       /* Slate 700 elevated hover/input */
  --bg-overlay: rgba(15, 23, 42, 0.85);

  /* Borders & Dividers */
  --border-subtle: #1E293B;
  --border-default: #334155;
  --border-strong: #475569;
  --border-focus: #38BDF8;      /* Sky 400 */

  /* Text & Content Hierarchy */
  --text-primary: #F8FAFC;      /* Slate 50 (High contrast) */
  --text-secondary: #94A3B8;    /* Slate 400 (Labels/metadata) */
  --text-muted: #64748B;        /* Slate 500 (Footers/captions) */
  --text-inverse: #0F172A;

  /* Accent & Interactive */
  --accent-primary: #0284C7;    /* Sky 600 */
  --accent-hover: #0369A1;      /* Sky 700 */
  --accent-glow: rgba(56, 189, 248, 0.15);

  /* Spacing Scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  /* Border Radii */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-full: 9999px;

  /* Elevation Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4);
}
```

---

## 4. Color & Risk Semantics

Risk categories strictly match the project's frozen specifications (`docs/01` line 261, `docs/03` table `risk_scores`, and `docs/04` Section 8):

| Severity Tier | Score Range | Hex Code | Semantic Meaning | Operational Protocol |
| :--- | :--- | :--- | :--- | :--- |
| **LOW** | `0.00 - 29.99` | `#10B981` (Emerald) | Normal Baseline | Routine telemetry monitoring; standard hydrological surveillance. |
| **MODERATE** | `30.00 - 54.99` | `#F59E0B` (Amber) | Elevated Advisory | Internal agency alert; drainage bottleneck inspections; standby teams. |
| **HIGH** | `55.00 - 74.99` | `#F97316` (Orange) | Active Warning | Public warning broadcasts; shelter activation; pre-positioning NDRF. |
| **CRITICAL** | `75.00 - 100.00` | `#EF4444` (Crimson) | Emergency Alert | Mandatory evacuation orders; emergency siren broadcast; disaster deployment. |

### Auxiliary Status Indicators:
- **Informational / Safe:** `#38BDF8` (Sky Blue)
- **Heuristic Fallback Badge:** `#A855F7` (Purple) — Displays: `Inference Mode: Deterministic Hydrological Heuristic`
- **Trained Model Badge:** `#0284C7` (Sky Blue) — Rendered **only** when the backend explicitly returns a deployed model ID.
- **Telemetry Anomaly:** `#EC4899` (Pink/Magenta) — Rendered when river rate-of-rise triggers anomaly detection.

---

## 5. Typography

- **Primary Font Family:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Monospace/Numeric Font Family:** `'JetBrains Mono', 'Fira Code', 'Courier New', monospace` (for coordinates, risk percentages, river stages, and timestamps).

### Type Scale:
- **Display Heading (`h1`):** `24px` (`1.5rem`), font-weight: `700`, line-height: `1.2`
- **Section Heading (`h2`):** `18px` (`1.125rem`), font-weight: `600`, line-height: `1.3`
- **Card/Subheading (`h3`):** `14px` (`0.875rem`), font-weight: `600`, line-height: `1.4`
- **Body Regular:** `13px` (`0.8125rem`), font-weight: `400`, line-height: `1.5`
- **Caption / Metadata:** `11px` (`0.6875rem`), font-weight: `500`, line-height: `1.4`
- **KPI Metric Value:** `28px` (`1.75rem`), font-weight: `700`, monospace figures

---

## 6. Layout Architecture

The Command Center features a spatial-first layout optimized for emergency consoles:

```
+-------------------------------------------------------------------------------------------------------------+
| TOP STATUS BAR: System Status | Dynamic Inference Mode | Time (UTC/IST) | Mode: [OFFICER / PUBLIC] | Auth   |
+-------------------------------------------------------------------------------------------------------------+
| SIDEBAR NAV      | MAIN SPATIAL STAGE (Leaflet GIS Canvas)       | ANALYTICAL INSPECTOR PANEL               |
| - Overview       | - Layer Switcher (Risk, Rain, Gauges, Assets) | [Tab: AI Assessment & Factor Breakdown]  |
| - GIS Risk Map   | - Interactive Zone Polygons                   | - Flood Prob % + Numeric Score Gauge     |
| - AI Engine      | - Critical Infrastructure Markers             | - Dynamic Feature Contribution List      |
| - Infrastructure | - Evacuation Centers & Routes                 | - Epistemic Inference Mode Banner        |
| - Shelters/Route | - Map Legend & Coordinate Tracker             +------------------------------------------+
| - Alert Dispatch |                                               | [Tab: Infrastructure & Protective Action]|
| - MCDA Queue     |                                               | - Impacted Assets in Selected Zone       |
| - Analytics Logs +-----------------------------------------------+ - Tailored SOP Recommendations          |
|                  | ENVIRONMENTAL TELEMETRY STRIP (Bottom)        +------------------------------------------+
|                  | - 1h/6h/24h Rainfall | River Gauge Ratio       | [Tab: Evacuation & Shelter Finder]       |
|                  | - Forecast Horizon Slider (3h, 6h, 12h, 24h)  | - Available Capacity & Route Guidance    |
+-------------------------------------------------------------------------------------------------------------+
```

---

## 7. Page & Route Architecture

The application organizes views by role and operational context:

| Route Path | View Component | Role Access | Primary Purpose |
| :--- | :--- | :--- | :--- |
| `/` | `CommandCenterPage` | Public / Officer | Full multi-panel GIS and operational intelligence console. |
| `/map` | `RiskMapPage` | Public / Officer | Expanded, full-viewport GIS exploration terminal. |
| `/ai-insights` | `AIPredictionPage` | Officer / Admin | Deep-dive forecast triggering, horizon testing, and factor breakdown. |
| `/infrastructure`| `InfrastructurePage` | Officer / Admin | Complete critical asset vulnerability table with export. |
| `/evacuation` | `EvacuationPage` | Public / Officer | Shelter directory, distance calculator, and route drawer. |
| `/alerts` | `AlertManagementPage` | Officer / Admin | Alert dispatcher, active warning monitor, and officer override modal. |
| `/prioritization`| `MCDAQueuePage` | Officer / Admin | AI-10 Multi-Criteria Decision Analysis ranking table with configurable weights. |
| `/analytics` | `HistoricalAnalyticsPage`| Officer / Admin | Historical flood event query engine and CSV/JSON export. |
| `/public` | `PublicWarningPortal` | Public (Unauth) | Clean, simplified citizen advisory and evacuation portal. |
| `/login` | `LoginPage` | Public | Officer authentication modal / screen. |

---

## 8. Component Architecture

```
frontend/src/
├── api/
│   ├── client.ts                 # Base HTTP client with error formatting & interceptors
│   ├── authApi.ts                # Login & JWT token storage
│   ├── zonesApi.ts               # Zone geometry & metadata queries
│   ├── weatherApi.ts             # Environmental observations & gauges
│   ├── predictionApi.ts          # Prediction trigger & factor explainers
│   ├── gisApi.ts                 # PostGIS GeoJSON vector layers
│   ├── infrastructureApi.ts      # Vulnerable asset queries
│   ├── evacuationApi.ts          # Shelter listings & route planner
│   ├── alertApi.ts               # Alert publish, list, override, and public feeds
│   ├── mcdaApi.ts                # AI-10 prioritization queries
│   └── analyticsApi.ts           # Historical events & data export
├── components/
│   ├── common/
│   │   ├── Badge.tsx             # Risk tier & status badges
│   │   ├── Button.tsx            # Styled action buttons with loading spinners
│   │   ├── Card.tsx              # Elevated container panels
│   │   ├── EmptyState.tsx        # Professional empty data placeholders
│   │   ├── ErrorState.tsx        # API error banners with retry triggers
│   │   ├── LoadingSkeleton.tsx   # Pulse loading placeholders
│   │   ├── Modal.tsx             # Accessible dialog overlays
│   │   └── TabNav.tsx            # Sub-view tab switchers
│   ├── layout/
│   │   ├── TopNavBar.tsx         # System status header & dynamic inference mode badge
│   │   ├── SidebarNav.tsx        # Main navigation bar with Lucide icons
│   │   └── StatusBar.tsx         # Health heartbeat & latency tracker
│   ├── map/
│   │   ├── LeafletMapCanvas.tsx  # Core Leaflet container & coordinate synchronization
│   │   ├── LayerControls.tsx     # Vector layer toggle switches
│   │   ├── MapLegend.tsx         # Risk severity & marker symbol legend
│   │   ├── ZonePolygonLayer.tsx  # GeoJSON catchment basin renderer
│   │   ├── AssetMarkerLayer.tsx  # Critical infrastructure marker pins
│   │   ├── ShelterMarkerLayer.tsx# Evacuation shelter markers
│   │   └── RouteLineLayer.tsx    # Evacuation safe path LineString drawer
│   ├── ai/
│   │   ├── RiskGaugeCard.tsx     # Circular/linear 0–100 risk score meter
│   │   ├── FactorAttributionChart.tsx # Dynamic feature attribution bars (+/-)
│   │   ├── HorizonSelector.tsx   # 3h / 6h / 12h / 24h forecast window toggle
│   │   └── DynamicInferenceBadge.tsx # Renders exact mode returned by backend
│   ├── environmental/
│   │   ├── WeatherCard.tsx       # 1h/6h/24h rainfall statistics
│   │   ├── RiverGaugeCard.tsx    # River stage ratio & danger level gauge
│   │   └── HydroTrendSparkline.tsx# Mini sparkline for rate-of-rise
│   ├── infrastructure/
│   │   ├── AssetVulnerabilityTable.tsx # Filterable asset list
│   │   └── ProtectionGuidanceCard.tsx  # Tailored SOP mitigation cards
│   ├── evacuation/
│   │   ├── ShelterListCard.tsx   # Shelter capacity & distance ranking
│   │   └── RoutePlanForm.tsx     # Coordinate inputs & honest ROUTING_UNAVAILABLE state
│   ├── alerts/
│   │   ├── ActiveAlertList.tsx   # Expandable emergency alert feed
│   │   ├── AlertCreateModal.tsx  # Officer alert drafting form
│   │   ├── OfficerOverrideModal.tsx # Severity adjustment with mandatory justification
│   │   └── McdaPrioritizationTable.tsx # Sorted zone ranking table
│   └── public/
│       ├── PublicHeader.tsx      # High-contrast citizen banner
│       ├── PublicRiskSummary.tsx # Plain-language zone advisory
│       └── EmergencyActionList.tsx# Numbered citizen action checklist
├── context/
│   ├── AuthContext.tsx           # JWT token, user role, and logout state
│   └── ZoneContext.tsx           # Currently selected geographic zone & forecast window
├── hooks/
│   ├── useHealthCheck.ts         # Periodic 30s background health ping
│   ├── useZoneTelemetry.ts       # Weather & gauge fetch hook
│   ├── usePrediction.ts          # Prediction trigger & factor fetcher
│   ├── useRiskLayers.ts          # GeoJSON vector layer caching
│   └── useAlerts.ts              # Live alerts & MCDA queue hook
├── types/                        # Full TypeScript schemas matching backend models
└── styles/                       # CSS design tokens & modular stylesheets
```

---

## 9. GIS / Map Design

The Leaflet GIS map is the central operational anchor:
- **Base Tile Provider:** Dark CartoDB / OpenStreetMap tile layers (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`).
- **Dynamic PostGIS Vector Layers:**
  1. `risk_zones`: Zone boundary polygons colored dynamically by `risk_color` (`#EF4444`, `#F97316`, `#EAB308`, `#22C55E`, `#64748B`). Clicking a polygon selects the active zone across the entire dashboard.
  2. `inundation`: Semi-transparent hatched water depth extent overlays.
  3. `infrastructure`: Category-specific SVG icon markers (Hospital 🏥, Power ⚡, School 🏫, Water 💧, Telecom 📡) with vulnerability status rings.
  4. `evacuation_centers`: Green shelter badges with live occupancy tooltips (e.g., `450/500 Available`).
  5. `route`: High-contrast cyan/emerald LineString paths showing safe dry transit corridors.
- **Layer Toggle Toolbar:** Floating glass panel allowing operators to toggle individual vector layers on/off independently.
- **Interactive Legend:** Bottom-right visual key displaying color scales, icon definitions, and warning tiers.
- **Failure & Loading Handling:** If the GIS API fails, displays an inline non-blocking map notification with a manual "Retry Spatial Sync" button without crashing the map canvas.

---

## 10. AI / XAI Presentation & Epistemic Honesty Rules

The AI Decision-Support panel enforces strict epistemic honesty:

### 10.1 Model Display Rules:
- **NEVER hard-code "XGBoost" or "XGB-FLOOD-V1.0" or "SHAP" in the UI.**
- The UI reads the active prediction response payload:
  - If the backend returns `is_heuristic_fallback: true` or `inference_mode: "deterministic_heuristic"`:
    The UI renders a **Purple Badge**: `MODE: DETERMINISTIC HYDROLOGICAL HEURISTIC` with tooltip:
    *"Prediction generated via deterministic hydrological rules (rainfall + river gauge danger stage + elevation gradient) because empirical historical training records are pending verification."*
  - If a future trained model is actually returned by the backend:
    The UI renders a **Sky Blue Badge**: `MODE: [model_name] ([algorithm])` using the exact string returned by the API.

### 10.2 Feature Attribution Rules:
- Render feature contribution bars based solely on factors returned by `GET /api/v1/predictions/{id}/explain`.
- Displays observed value, calculated contribution magnitude, and directional impact:
  - **Increases Risk (Red/Orange):** Bars extending right (e.g., 24h rainfall, river stage ratio).
  - **Decreases Risk (Green):** Bars extending left (e.g., municipal drainage capacity).
- **Never synthesize fake SHAP values or placeholder feature percentages.**

---

## 11. Observation vs. Assessment vs. Response Triad

To prevent cognitive confusion during emergency operations, the UI strictly segregates content into three distinct visual sections:

```
+-------------------------------------------------------------------------------+
| 1. OBSERVED DATA (Environmental Ground Truth)                                 |
|    - 1h / 6h / 24h / 72h Measured Precipitation                               |
|    - Real-Time River Water Level (meters) & Danger Threshold Ratio            |
|    - Terrain Mean Elevation & Drainage Capacity Index                         |
+-------------------------------------------------------------------------------+
| 2. AI ASSESSMENT (Predictive Intelligence & Interpretation)                   |
|    - Flood Inundation Probability & Numeric Risk Score [0–100]                |
|    - 3h / 6h / 12h / 24h Horizon Forecast Trajectory                          |
|    - Dynamic Feature Attribution Breakdown (Why is this zone at risk?)        |
|    - Dynamic Inference Mode Badge (Heuristic Fallback vs ML Model)            |
+-------------------------------------------------------------------------------+
| 3. RESPONSE & ACTIONS (Operational Decision Support)                          |
|    - Impacted Infrastructure Vulnerabilities & Mitigation SOP Guidance       |
|    - Emergency Shelter Discovery & Safe Dry Pathfinding                       |
|    - Multi-Channel Alert Dispatch & Officer Severity Override                 |
+-------------------------------------------------------------------------------+
```

---

## 12. Infrastructure Vulnerability UI

- **Asset Summary Table:** Lists assets in the selected basin with columns: `Name`, `Type`, `Elevation (m)`, `Predicted Water Depth (m)`, `Vulnerability Status`, and `Action`.
- **Status Pills:**
  - `CRITICAL` (Red) — Inundation depth $> 0.5\text{m}$.
  - `AT_RISK` (Orange) — Inundation depth $> 0.0\text{m}$.
  - `SAFE` (Green) — Elevated above flood contour.
- **Tailored Protective Action Cards:**
  Clicking an asset reveals actionable engineering recommendations (e.g., *"Deploy mobile sandbag barrier around basement electrical switchgear; verify backup generator fuel elevation"*).
- **Zero Data Fabrication:** Shows an empty state with a message *"No registered infrastructure assets in this zone"* if no assets exist in the database.

---

## 13. Evacuation & Safe Route Experience

- **Shelter Discovery Panel:**
  - Lists evacuation centers ranked by geodesic proximity (`ST_DistanceSphere`).
  - Highlights available capacity: `available_capacity / max_capacity` with progress bars.
  - Automatically flags full shelters (`0 Available`) and disables them as primary routing targets.
- **Route Planning Workflow:**
  - Operator enters origin coordinates (or clicks on the map).
  - Clicks **"Plan Evacuation Route"**.
- **Honest `ROUTING_UNAVAILABLE` Handling:**
  - If the backend returns `routing_status: "ROUTING_UNAVAILABLE"`:
    - The UI renders an amber warning banner: *"Live street-level road network graph is unconfigured. Routing cannot be computed. Nearest safe shelter is [Shelter Name] at [Address] ([Distance] km away)."*
    - The UI **does NOT draw fake straight lines** across the map.
  - If the backend returns `routing_status: "AVAILABLE"`:
    - Renders the safe `LineString` route in vibrant cyan on the map with step summary.

---

## 14. Emergency Alert & Notification UI

- **Active Alerts Feed:** Displays active warnings with severity badges, affected zones, issuance timestamps, and countdown timers to `expires_at`.
- **Officer Alert Dispatch Modal (Protected):**
  - Allows selecting Zone, Severity (`YELLOW_ADVISORY`, `ORANGE_WARNING`, `RED_EMERGENCY`), Headline, and Custom Advisory Message.
  - Submits to `POST /api/v1/alerts`.
- **Officer Severity Override Modal (Protected):**
  - Allows adjusting active severity in response to field observations.
  - Enforces mandatory `justification` field (minimum 5 characters).
  - Displays audit confirmation: *"Audit record #1042 logged to system_events with Officer ID."*
- **Role Gating:** Public users see active alerts but have all dispatch/override buttons hidden or disabled.

---

## 15. AI-10 MCDA Prioritization Queue UI

- **Prioritization Table:**
  - Columns: `Rank`, `Zone Name`, `Composite Score (0–100)`, `Priority Tier`, `Risk Factor`, `Pop Factor`, `Infra Factor`, `River Factor`, `Recommended SOP Action`.
- **Authoritative Weights & Score Baseline:**
  - $w_{\text{risk}} = 0.50$ (Flood Risk Score normalized $[0.00, 100.00]$)
  - $w_{\text{pop}} = 0.30$ (Population Density normalized relative to $25,000\text{/km}^2$)
  - $w_{\text{infra}} = 0.10$ (Vulnerable Infrastructure Count normalized relative to $5\text{ assets}$)
  - $w_{\text{river}} = 0.10$ (River Stage Severity Ratio)
  - Composite Score: $S \in [0.00, 100.00]$
- **Tier Badge Styling:**
  - `CRITICAL_TIER_1` (Score $\ge 75.0$): Crimson Badge.
  - `HIGH_TIER_2` ($55.0 \le \text{Score} < 75.0$): Orange Badge.
  - `MEDIUM_TIER_3` ($30.0 \le \text{Score} < 55.0$): Amber Badge.
  - `LOW_TIER_4` ($\text{Score} < 30.0$): Slate Badge.
- **Configurable Weights Slider Panel (Officer View):**
  - Sliders for $w_{\text{risk}}$ (0.50), $w_{\text{pop}}$ (0.30), $w_{\text{infra}}$ (0.10), $w_{\text{river}}$ (0.10) with automatic 1.0 normalization enforcement.

---

## 16. Public Safety Portal (Citizen View)

A dedicated, lightweight view (`/public`) optimized for mobile devices and stressed citizens:
- **Immediate Status Header:** Large color-coded status banner (e.g., `CRITICAL FLOOD WARNING — NORTH RIVER BASIN`).
- **Clear Answer to 5 Essential Citizen Questions:**
  1. **WHAT IS HAPPENING?** *"Heavy rainfall has caused the Mithi River to overflow."*
  2. **WHERE?** *"Low-lying sectors of North River Basin."*
  3. **HOW SERIOUS?** *Prominent Red "CRITICAL EMERGENCY" status indicator.*
  4. **WHAT SHOULD I DO?** Numbered, plain-language checklist (*"Move to upper floors immediately", "Do not walk or drive through flowing water"*).
  5. **WHERE CAN I EVACUATE?** Cards showing nearest shelters with live capacity badges and clickable navigation addresses.
- **Strict Privacy:** Zero exposure of officer IDs, system event logs, database UUIDs, or internal sensor diagnostics.

---

## 17. Historical Flood Analytics & Export UI

- **Historical Records Query Tool:**
  - Date range pickers (`start_date`, `end_date`), Zone selector, and Severity filter.
  - Displays historical records table (`Date`, `Zone`, `Peak Depth (m)`, `Total Rainfall (mm)`, `Severity`, `Notes`).
- **Honest Empty State:**
  - If the database contains 0 historical records, the UI displays a clean placeholder: *"No historical flood events recorded in this database partition. Use export tools to load archived benchmark datasets."*
  - **No fake charts are rendered** to falsely imply populated data.
- **Data Export Buttons:**
  - **"Export CSV"**: Triggers direct browser download of `GET /api/v1/analytics/export?format=csv`.
  - **"Export JSON"**: Triggers structured JSON download of `GET /api/v1/analytics/export?format=json`.

---

## 18. API Integration Matrix

| UI Component | Backend Endpoint | Method | Request Payload / Params | Response Schema | Loading State | Empty State | Error State |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **System Status** | `/system/health` | `GET` | None | `SystemHealth` | Pulsing dot | N/A | Red "Disconnected" pill |
| **Zone Selector** | `/zones` | `GET` | None | `ZoneListResponse` | Dropdown skeleton | "No zones registered" | "Failed to load zones" |
| **Weather Strip** | `/weather/{zone_id}` | `GET` | `zone_id` path param | `ZoneWeatherResponse` | 3-card skeleton | "No sensor data" | "Weather stream offline" |
| **River Gauge** | `/water-levels/{zone_id}` | `GET` | `zone_id` path param | `ZoneWaterLevelResponse` | Meter skeleton | "No active gauge" | "Gauge telemetry offline" |
| **AI Prediction** | `/predictions` | `POST` | `{zone_id, forecast_horizon_hours}` | `FloodPredictionResponse`| Circular spinner | "Select zone to predict"| "Inference failed" |
| **XAI Explainer** | `/predictions/{id}/explain`| `GET` | `prediction_run_id` path | `PredictionExplanationResponse`| Bar skeletons | "No factors available" | "Explainer timeout" |
| **GIS Layers** | `/risk-map/layers` | `GET` | `layer_type` query param | `GeoJSON FeatureCollection`| Map overlay spinner | "Empty layer geometry" | "Spatial layer error" |
| **Infrastructure**| `/infrastructure/vulnerable`| `GET` | `zone_id`, `min_risk_level` | `VulnerableInfrastructureListResponse`| Table skeleton | "No assets in danger" | "Asset query failed" |
| **Shelters** | `/evacuation/shelters` | `GET` | `latitude`, `longitude` | `EvacuationShelterListResponse`| List skeleton | "No active shelters" | "Shelter registry offline" |
| **Route Planner**| `/evacuation/plan-route` | `POST` | `{origin_lat, origin_lon, avoid_flood_zones}` | `EvacuationRoutePlanResponse`| Path animation | "Select origin & shelter"| "Routing error" / "ROUTING_UNAVAILABLE" |
| **Alert List** | `/alerts` | `GET` | `status`, `zone_id` | `AlertListResponse` | Feed skeleton | "No active alerts" | "Alert query failed" |
| **Alert Dispatch**| `/alerts` | `POST` | `AlertCreateRequest` | `AlertCreateResponse` | Button spinner | N/A | Validation / 403 banner |
| **Officer Override**| `/alerts/override` | `POST` | `AlertOverrideRequest` | `AlertOverrideResponse` | Button spinner | N/A | Rejection / 422 banner |
| **MCDA Queue** | `/alerts/prioritization`| `GET` | `weight_risk`, `weight_pop`, etc. | `AlertPrioritizationResponse` | Table skeleton | "No zones to rank" | "Ranking service error" |
| **Public Feed** | `/alerts/public` | `GET` | None | `PublicWarningsResponse` | Banner skeleton | "All zones normal" | "Public feed unavailable" |
| **Historical Logs**| `/analytics/historical` | `GET` | `zone_id`, `start_date`, `end_date` | `HistoricalAnalyticsResponse` | Table skeleton | "No historical events" | "Analytics query failed" |
| **Data Export** | `/analytics/export` | `GET` | `format`, `data_type` | `StreamingResponse` | Download spinner | N/A | "Export failed" |

---

## 19. Authentication & RBAC UI Behavior

- **State Management:** Stored via `AuthContext` with JWT tokens persisted in `sessionStorage` (or memory with secure refresh).
- **Role Permissions Matrix in UI:**

| Role | Top Bar Status | Prediction Controls | Alert Dispatch | Officer Override | Public Portal |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PUBLIC_USER** | `Role: Public Citizen` | View-only | Hidden | Hidden | Full Access |
| **DISASTER_OFFICER** | `Officer: Sanjay Rao (NDRF)` | Active Trigger | Enabled | Enabled | Full Access |
| **SUPER_ADMIN** | `Admin: Platform Director` | Active Trigger | Enabled | Enabled | Full Access |
- **Unauthorized Interception:** Attempting to access protected officer modals while unauthenticated displays an inline login trigger rather than breaking the application state.

---

## 20. Data States & Edge Case Resilience

Every component explicitly supports 5 canonical states:
1. **LOADING:** Elegant pulse skeletons matching the exact dimensions of final data cards.
2. **SUCCESS:** Full interactive data rendering with crisp typography.
3. **EMPTY:** Professional, informative placeholder text explaining why data is absent (e.g., *"No historical events recorded"*).
4. **UNAVAILABLE:** Clear warning badge (e.g., `ROUTING_UNAVAILABLE`, `DETERMINISTIC_HYDROLOGICAL_HEURISTIC`) with helpful explanation.
5. **ERROR:** High-contrast alert box detailing HTTP status and a non-destructive **"Retry"** button.

---

## 21. Accessibility (a11y) Standards

- **WCAG 2.1 Level AA Compliance:** Contrast ratio $> 4.5:1$ between text and background surfaces.
- **Non-Color-Only Risk Communication:** Every risk indicator combines color (`#EF4444`) with an icon (⚠️ / 🚨 / ℹ️) and a textual label (`CRITICAL RISK`).
- **Keyboard Navigation:** Full tab-indexing across all buttons, dropdowns, inputs, and modals with visible focus rings (`--border-focus: #38BDF8`).
- **Screen Reader Support:** Semantic HTML5 tags (`<main>`, `<nav>`, `<header>`, `<article>`, `<aside>`) and explicit `aria-label` / `aria-live` regions for dynamic alerts.

---

## 22. Responsive Behavior

- **Desktop Console ($> 1280\text{px}$):** Multi-column 3-pane layout (Navigation + Map Canvas + Analytical Inspector).
- **Laptop / Tablet ($768\text{px} - 1279\text{px}$):** 2-column layout; analytical inspector collapses into tabbed bottom/side drawer.
- **Mobile Viewport ($< 768\text{px}$):**
  - Command Center stacks vertically into clean modular cards.
  - Public Warning view prioritizes high-contrast emergency headers, one-touch emergency contacts, and scrollable shelter list.

---

## 23. Performance Strategy

- **Zero Heavy Framework Bloat:** Vanilla CSS design tokens with React 18 and Leaflet.js.
- **GeoJSON Rendering Optimization:** PostGIS vector layers utilize simplified geometries for high-zoom overviews and cached layer references.
- **Debounced Interaction:** Horizon slider adjustments and weight configuration changes are debounced ($300\text{ms}$) to prevent API flooding.
- **Selective API Polling:** Periodic background status polling occurs at measured intervals (Health: 30s, Alerts: 15s) with automatic pause when the tab is hidden (`document.visibilityState`).

---

## 24. Animation Strategy

- **CSS Transitions Only:** 150ms–250ms ease-out transitions on hover states, tab selections, and modal fades.
- **Restrained Alert Pulse:** Subtle outline pulse on active `CRITICAL` alerts to attract attention without causing visual fatigue.
- **No Decorative Overhead:** Zero canvas particle effects, zero fake 3D spins, and zero distracting animated counters.

---

## 25. 30-Second Judge Demonstration Flow

The frontend architecture is optimized for a seamless, persuasive 5-minute hackathon evaluation or 30-second live demonstration:

1. **Step 1 — Tactical Overview (0:00–0:30):** Open Command Center; judge immediately sees real-time monitored basins on Leaflet GIS map with North Basin highlighted in Orange High Risk.
2. **Step 2 — Environmental Observations (0:30–1:00):** Inspect bottom telemetry bar showing heavy 24h rainfall (185.4mm) and Mithi River gauge crossing warning level.
3. **Step 3 — AI Predictive Assessment (1:00–2:00):** Select 6h Horizon; model outputs 87.5% flood probability. Point to Explainable AI panel showing exact additive factors (Rainfall $+42\%$, River stage $+28\%$, Drainage capacity $-10\%$). Note the honest dynamic inference mode badge (`Deterministic Hydrological Heuristic`).
4. **Step 4 — Infrastructure Impact (2:00–2:45):** Switch to Infrastructure tab; City General Hospital flagged `AT_RISK` (0.85m depth) with specific sandbag SOP recommendation.
5. **Step 5 — Safe Evacuation Routing (2:45–3:30):** Switch to Evacuation tab; nearest shelter identified with 450 available beds. Trigger route planning and demonstrate honest `ROUTING_UNAVAILABLE` feedback when external road graphs are not loaded.
6. **Step 6 — Alert Dispatch & Public Portal (3:30–4:30):** Officer publishes `RED_EMERGENCY` alert. Switch to `/public` view to demonstrate instantaneous mobile citizen bulletin with safety instructions.
7. **Step 7 — AI-10 MCDA Prioritization (4:30–5:00):** Display deterministic multi-zone priority ranking table with factor weights.

---

## 26. Frontend Implementation Phases

1. **Phase 1 — Core Layout, Navigation & Design Tokens:**
   - Implement top status bar, sidebar navigation, and CSS theme tokens in `main.css`.
   - Setup `AuthContext`, `ZoneContext`, and modular API client services.
2. **Phase 2 — Leaflet GIS Map Canvas & Spatial Layers:**
   - Integrate `LeafletMapCanvas` with dark tile basemap.
   - Connect `GET /api/v1/risk-map/layers` for dynamic zone polygons, asset markers, and shelter pins.
3. **Phase 3 — AI Prediction & XAI Panel:**
   - Implement `RiskGaugeCard`, `HorizonSelector`, `FactorAttributionChart`, and `DynamicInferenceBadge`.
   - Connect `POST /api/v1/predictions` and `GET /api/v1/predictions/{id}/explain`.
4. **Phase 4 — Infrastructure & Evacuation Modules:**
   - Implement `AssetVulnerabilityTable` and `ProtectionGuidanceCard`.
   - Implement `ShelterListCard`, `RoutePlanForm`, and honest routing feedback.
5. **Phase 5 — Alerts, MCDA & Public Warning Portal:**
   - Implement `ActiveAlertList`, `AlertCreateModal`, `OfficerOverrideModal`, and `McdaPrioritizationTable`.
   - Implement lightweight, responsive `/public` citizen portal.
6. **Phase 6 — Historical Analytics, Data Export & End-to-End Polish:**
   - Implement `HistoricalAnalyticsPage` with CSV/JSON streaming downloads.
   - Complete responsive auditing, keyboard accessibility, and judge flow validation.

---

## 27. Testing Strategy

- **Component Unit & Integration Tests (Vitest + React Testing Library):**
  - Validate state rendering for Loading, Empty, Unavailable, and Error states.
  - Verify RBAC role gating (Officer buttons hidden for public users).
  - Test dynamic inference mode badge rendering.
  - Test honest `ROUTING_UNAVAILABLE` message display.
- **End-to-End Integration Verification:**
  - Verify live HTTP communication against the FastAPI backend (running on port 8000).
  - Test JWT login and session persistence.
  - Test GeoJSON layer parsing and selection synchronization.

---

## 28. Known Backend Limitations & Boundaries

1. **OpenStreetMap Road Network:** Backend returns `routing_status: "ROUTING_UNAVAILABLE"` until an external OSM road graph is ingested. The frontend must honor this status honestly.
2. **Unverified Historical Data Gate:** Until historical events are verified, model training is blocked by the backend safety gate. The frontend accurately reports the active mode (e.g. `Deterministic Hydrological Heuristic`).
3. **SMS / Telecom Broadcast:** Cell broadcast is simulated via database records; no live telecom carrier API is required for the prototype.

---

## 29. Exact Dependencies Required

All required dependencies are **already present** in `frontend/package.json`:
- `react`: `^18.2.0`
- `react-dom`: `^18.2.0`
- `leaflet`: `^1.9.4`
- `@types/leaflet`: `^1.9.8`
- `lucide-react`: `^0.359.0`
- `typescript`: `^5.2.2`
- `vite`: `^5.1.6`

*Zero additional external npm packages or heavyweight CSS libraries are needed.*

---

## 30. Explicitly Out-of-Scope (What NOT to Implement)

1. **No Fake / Synthetic Data Mocking:** Do not hardcode fake river levels, fake alerts, or fake historical charts in frontend files.
2. **No Unnecessary CSS Frameworks:** No Tailwind, Bootstrap, or Material UI; use Vanilla CSS tokens.
3. **No 3D WebGL / Heavy CFD Fluid Simulators:** Leaflet 2D vector GIS is the approved standard.
4. **No Direct Backend / Database Modifications:** The backend is verified and frozen with 87/87 passing tests.
