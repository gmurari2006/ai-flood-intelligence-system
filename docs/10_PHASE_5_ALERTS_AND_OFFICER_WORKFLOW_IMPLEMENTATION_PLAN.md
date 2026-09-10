# Document 10: Module 7 Phase 5 — Emergency Alerts & Officer Workflow Implementation Plan (Corrected)

**System Title**: AI Flood Intelligence System  
**Module**: Module 7 — Professional Frontend  
**Phase**: Phase 5 — Alerts + Emergency Officer Workflows  
**Document Status**: **REVISED PLAN-ONLY AUTHORIZATION** (Awaiting Review & Approval)  
**Date**: September 2026  
**Security Classification**: Operational Emergency Decision Support  

---

## 1. Executive Summary

Phase 5 delivers the authoritative **Emergency Alerting & Disaster Officer Decision Support Layer** for the AI Flood Intelligence System. This module connects emergency management authorities with real-time operational alert composition, lifecycle tracking, officer risk overrides with auditable system events, and a dedicated, mobile-optimized public citizen warning portal.

In strict compliance with contract integrity and data honesty rules:
- **Decision Support System**: The interface explicitly displays clear disclaimers that the application provides AI/heuristic decision support and does not replace official statutory disaster management command authorities.
- **Zero Persisted Draft Fabrication**: `POST /api/v1/alerts` publishes an alert immediately with active broadcast side effects. The UI will provide a local client-side pre-submission review step, clearly distinguished from backend persistence, and the final action is explicitly labeled **"PUBLISH ALERT"**.
- **Immutable Operational MCDA**: The authoritative 50/30/10/10 weights are hardcoded in operational mode (no sliders, no editable inputs, no client-side recalculations).
- **Contract-Bound Recipient & Audit Boundaries**: Because the backend does not expose recipient listing or historical audit log endpoints, the UI displays returned `audit_event_id` upon override and explicitly marks recipient delivery tracking and historical audit trails as `"Not exposed by current API"`.
- **Honest Lifecycle & Cancellation Handling**: Backend alert states are strictly `ACTIVE`, `EXPIRED`, and `CANCELLED`. In the absence of a backend cancellation endpoint, no fake cancel actions will be rendered.
- **Sanitized Public Warnings**: Citizen view (`GET /api/v1/alerts/public`) consumes only backend-provided fields (`zone_name`, `severity`, `title`, `message`, `safety_instructions`, `issued_at`, `expires_at`) without exposing internal infrastructure vulnerabilities or officer audit records.

---

## 2. Current Repository Findings & Backend Contract Verifications

### 2.1 Backend Endpoints & Services
- **Endpoints File**: `backend/app/api/v1/endpoints/alerts.py`
  - `GET /api/v1/alerts/public`: Unauthenticated public citizen warning feed.
  - `POST /api/v1/alerts`: Publishes alert immediately (status: `ACTIVE`), creates `AlertRecipient` records, and logs `ALERT_PUBLISHED` `SystemEvent`.
  - `GET /api/v1/alerts`: Lists authority alerts; auto-expires active alerts where `expires_at <= now()`.
  - `POST /api/v1/alerts/override`: Applies officer risk override with mandatory justification (min length 5); creates `SystemEvent` and returns `audit_event_id`.
  - `GET /api/v1/alerts/prioritization`: Deterministic AI-10 MCDA prioritization ranking across zones.

### 2.2 Backend Schemas & Exact Fields
- **Public Warning (`PublicWarningsResponse`)**:
  - `active_warnings_count: int`
  - `warnings: List[PublicWarningItem]`
    - `zone_name: str`
    - `severity: str` (`LOW`, `MODERATE`, `HIGH`, `RED_EMERGENCY`, `CRITICAL`)
    - `title: str`
    - `message: str`
    - `safety_instructions: List[str]`
    - `issued_at: datetime`
    - `expires_at: datetime`
- **Alert Publication Request (`AlertCreateRequest`)**:
  - `zone_id: str`
  - `severity: str` (`LOW`, `MODERATE`, `HIGH`, `RED_EMERGENCY`, `CRITICAL`)
  - `title: str` (max 200 chars)
  - `message: str`
  - `duration_hours: int` (default: 12, min: 1, max: 168)
  - `recipient_groups?: List[str]` (optional dispatch group tags)
- **Alert Publication Response (`AlertCreateResponse`)**:
  - `alert_id: str` (UUID)
  - `status: str` (`"ACTIVE"`)
  - `issued_at: datetime`
  - `expires_at: datetime`
- **Authority Alert Record (`AlertSummaryResponse`)**:
  - `id: str` (UUID)
  - `zone_id: str`
  - `severity: str`
  - `title: str`
  - `message: str`
  - `status: str` (`ACTIVE`, `EXPIRED`, `CANCELLED`, `DRAFT`)
  - `issued_at: datetime`
  - `expires_at: datetime`
- **Alert Override Request (`AlertOverrideRequest`)**:
  - `zone_id: str`
  - `override_severity: str`
  - `justification: str` (min length 5)
  - `duration_hours: int` (default: 6, min: 1, max: 168)
- **Alert Override Response (`AlertOverrideResponse`)**:
  - `status: str` (`"OVERRIDE_APPLIED"`)
  - `zone_id: str`
  - `effective_severity: str`
  - `audit_event_id: int`
  - `updated_at: datetime`

---

## 3. Actual Alert Lifecycle & State Model

### 3.1 Supported Backend Lifecycle States
The backend explicitly recognizes three operational lifecycle states:
1. **`ACTIVE`**: Alert published and currently within valid validity duration (`now < expires_at`).
2. **`EXPIRED`**: Alert has exceeded its `expires_at` validity window (auto-transitioned upon query by `AlertService.get_alerts`).
3. **`CANCELLED`**: Alert explicitly superseded or marked cancelled in database.

*(Note: There is no backend draft persistence. Draft states are local client-side memory only prior to submission).*

### 3.2 State Lifecycle Transitions
```
   [ Client-Side Input ]  ──(Review & Confirm)──►  [ Client-Side Review ]
                                                          │
                                                (POST /api/v1/alerts)
                                                          │
                                                          ▼
                                                     [ ACTIVE ]
                                                          │
                                              ┌───────────┴───────────┐
                                              ▼                       ▼
                                   (expires_at reached)      (Officer Override)
                                              │                       │
                                              ▼                       ▼
                                         [ EXPIRED ]            [ ACTIVE (Modified) ]
                                                                 + audit_event_id
```

---

## 4. Alert Composer & Officer Command Workflow

### 4.1 Officer Workflow Sequence
```
[ Step 1: Inundation & Weather Telemetry ]
   • Inspect river gauge levels & rainfall observations in target zone.
          ↓
[ Step 2: AI Heuristic Prediction Assessment ]
   • Review flood probability, predicted depth, and XAI factor attribution.
          ↓
[ Step 3: Infrastructure Impact & Shelter Capacity Check ]
   • Verify hospital/substation risk and municipal shelter availability.
          ↓
[ Step 4: AI-10 MCDA Prioritization Confirmation ]
   • Verify authoritative 50/30/10/10 operational priority ranking.
          ↓
[ Step 5: Input Alert Parameters ]
   • Select zone, severity, title, message, duration, and target groups.
          ↓
[ Step 6: Client-Side Review & Explicit Publish Confirmation ]
   • Verify parameters in client-side preview; confirm publication side-effects.
          ↓
[ Step 7: POST /api/v1/alerts (PUBLISH ALERT) ]
   • Commit alert to backend; display returned UUID, issued_at, and expires_at.
```

### 4.2 Alert Composer Honesty
- The composer UI consists of two explicit steps:
  1. **Compose & Preview**: Form inputs with live client-side validation and dynamic safety instruction preview.
  2. **Publish Confirmation Modal**: Explicit warning: *"Publishing this alert will immediately activate emergency broadcasts and log a permanent system audit event."*
- Button is explicitly labeled: **`PUBLISH ALERT`**.
- No "Save Draft to Server" button is presented.

---

## 5. Operational MCDA Prioritization Integrity

- Official approved operational weights:
  - **Risk Score**: 50% (`0.50`)
  - **Population Density**: 30% (`0.30`)
  - **Infrastructure Impact**: 10% (`0.10`)
  - **River Stage Ratio**: 10% (`0.10`)
- **Immutability Guarantee**:
  - No sliders or operator-editable weight fields.
  - No client-side recalculation of composite scores.
  - Fixed query parameters used: `weight_risk=0.50&weight_pop=0.30&weight_infra=0.10&weight_river=0.10`.
  - The UI displays: **`OPERATIONAL MCDA — APPROVED WEIGHTS (50 / 30 / 10 / 10)`**.
  - If `weights_applied` from the backend response differs from 50/30/10/10, the UI renders an explicit configuration inconsistency warning rather than silently recalculating.

---

## 6. Officer Override & Audit Boundaries

### 6.1 Officer Risk Override Workflow
1. Invoked via `AlertOverrideModal.tsx` from the active alerts matrix.
2. Displays active system severity alongside the officer's proposed override severity.
3. **Mandatory Field Justification**: Input field enforced with minimum 5 characters.
4. **Duration**: Selector (default: 6 hours).
5. Executes `POST /api/v1/alerts/override`.
6. Displays the returned `audit_event_id` and timestamp on the resulting alert badge (`[OFFICER OVERRIDE (Audit #ID)]`).

### 6.2 Audit History Boundary
- In the absence of a `GET /api/v1/system-events` listing endpoint, the UI will **not fabricate a historical audit timeline or event table**.
- The UI will display:
  ```
  AUDIT TRAIL
  Audit Event ID: Captured on override (#1024)
  Historical Log: Not available through current API
  ```

---

## 7. Recipient & Notification Handling Boundary

- `POST /api/v1/alerts` accepts optional `recipient_groups` (`ALL_RESIDENTS`, `EMERGENCY_SERVICES`, `MUNICIPAL_ADMIN`, `TRANSIT_AUTHORITY`).
- In the absence of a recipient retrieval API, the UI will:
  1. Allow selection of recipient groups during composition.
  2. Display recipient groups registered during publication.
  3. Explicitly state:
     ```
     RECIPIENT DELIVERY STATUS
     Group Dispatch Registered (Local EOC Dissemination)
     Carrier Delivery Confirmation: Not exposed by current API
     ```
  4. **Strictly not simulate SMS/email delivery percentages or fake telco receipts.**

---

## 8. Cancellation Capability Boundary

- The backend recognizes `CANCELLED` in its schema and queries, but exposes no `POST /api/v1/alerts/{id}/cancel` endpoint.
- Therefore:
  - The UI will display `CANCELLED` status badges when such records are returned by the backend.
  - The UI **will not render a fake "Cancel Alert" button** or simulate client-side cancellation.
  - Documented as a known backend contract limitation.

---

## 9. Public Warning Portal Design (Sanitized)

- **Endpoint**: `GET /api/v1/alerts/public` (Unauthenticated).
- **Presentation**:
  - Prominent high-contrast warning banner showing active regional alerts.
  - Sanitized public fields: `zone_name`, `severity`, `title`, `message`, `issued_at`, `expires_at`.
  - Dynamic actionable safety instructions (`safety_instructions: string[]`).
  - Nearest emergency shelter finder consuming public `GET /api/v1/evacuation/shelters`.
  - Decision Support & Statutory Authority Disclaimer: *"This public portal provides automated advisory intelligence. In emergency situations, citizens must adhere to official directives from local disaster management authorities."*
  - **Zero Exposure** of infrastructure vulnerabilities, officer prioritization queues, or internal system logs.

---

## 10. Role-Based Access Control (RBAC) Specification

| Capability | Unauthenticated / Citizen | `PUBLIC_USER` | `DISASTER_OFFICER` | `SUPER_ADMIN` |
| :--- | :---: | :---: | :---: | :---: |
| **Public Warning Feed (`/public`)** | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Public Shelter Finder** | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Authority Alerts Matrix (`/alerts`)** | ❌ Blocked (401/Lock) | ❌ Blocked (403/Lock) | ✅ Full Access | ✅ Full Access |
| **Alert Composer (`POST /alerts`)** | ❌ Blocked | ❌ Blocked | ✅ Authorized | ✅ Authorized |
| **Officer Override (`POST /alerts/override`)** | ❌ Blocked | ❌ Blocked | ✅ Authorized | ✅ Authorized |
| **MCDA Decision Queue** | ❌ Blocked | ❌ Blocked | ✅ Full Access | ✅ Full Access |

---

## 11. Provenance & Demo Data Transparency

- If any alert response contains `is_demo_data === true`, the component renders a prominent **`DEMO DATA — NOT FOR OPERATIONAL USE`** badge.
- Real operational alerts display authoritative UTC timestamps and system-generated UUIDs.

---

## 12. UI State Model

Every Phase 5 workflow strictly implements:
- **`LOADING`**: Geometry-matched skeleton loaders.
- **`AVAILABLE` / `LOADED`**: Authoritative backend alert records and public warning cards.
- **`NO_DATA` / `EMPTY`**: Calm, informative empty states (e.g. "No Active Emergency Warnings Broadcasted").
- **`UNAVAILABLE`**: Network or service outage notices.
- **`UNAUTHORIZED`**: Role-gated lock screen with login action.
- **`ERROR`**: Actionable error card displaying backend error details with retry triggers.

---

## 13. Component Architecture & File Matrix

```
frontend/src/
├── types/
│   └── alerts.ts                              <-- [NEW] Strict Alert & Warning TypeScript Types
├── context/
│   └── AlertContext.tsx                       <-- [NEW] Alert state provider (Officer & Public)
├── components/
│   └── alerts/                                <-- [NEW Directory]
│       ├── AlertComposerCard.tsx              <-- [NEW] Officer alert drafting & publication console
│       ├── AlertListTable.tsx                 <-- [NEW] Filterable operational alert matrix
│       ├── AlertOverrideModal.tsx             <-- [NEW] Manual risk override modal with justification
│       ├── AlertSummaryCard.tsx               <-- [NEW] High-level alert status metrics
│       ├── PublicWarningBanner.tsx            <-- [NEW] Citizen-facing high-contrast warning banner
│       ├── PublicSafetyGuidelines.tsx         <-- [NEW] Dynamic safety instructions checklist
│       └── index.ts                           <-- [NEW] Barrel exports
├── components/
│   └── pages/
│       ├── AlertsView.tsx                     <-- [MODIFY] Wire live officer components
│       └── PublicPortalView.tsx               <-- [MODIFY] Wire live public citizen components
└── api/
    └── client.ts                              <-- [MODIFY] Add alert API methods
```

---

## 14. Strict TypeScript Types (`frontend/src/types/alerts.ts`)

```typescript
export type AlertSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'RED_EMERGENCY' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'DRAFT' | 'EXPIRED' | 'CANCELLED';

export interface AlertSummary {
  id: string;
  zone_id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  issued_at: string;
  expires_at: string;
}

export interface AlertListResponse {
  total_alerts: number;
  alerts: AlertSummary[];
}

export interface AlertCreatePayload {
  zone_id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  duration_hours: number;
  recipient_groups?: string[];
}

export interface AlertCreateResult {
  alert_id: string;
  status: 'ACTIVE';
  issued_at: string;
  expires_at: string;
}

export interface AlertOverridePayload {
  zone_id: string;
  override_severity: AlertSeverity;
  justification: string;
  duration_hours: number;
}

export interface AlertOverrideResult {
  status: 'OVERRIDE_APPLIED';
  zone_id: string;
  effective_severity: AlertSeverity;
  audit_event_id: number;
  updated_at: string;
}

export interface PublicWarningItem {
  zone_name: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  safety_instructions: string[];
  issued_at: string;
  expires_at: string;
}

export interface PublicWarningsResponse {
  active_warnings_count: number;
  warnings: PublicWarningItem[];
}
```

---

## 15. Testing Strategy & Measurable Acceptance Criteria

### 15.1 Automated Verification
- `npm run build` in `frontend/` (Exit code 0, strict `tsc` checks pass).
- `.\venv\Scripts\pytest -q` in root (All 87 backend tests pass).

### 15.2 Functional Acceptance Criteria
1. **Public Warning Access**: Unauthenticated access to `/public` displays active warnings, safety checklists, and shelter finder.
2. **Officer Alert Publication**: Disaster Officer can compose, review in client modal, and broadcast alert via `POST /api/v1/alerts`.
3. **Officer Override & Audit**: Officer can apply manual risk override with justification (>= 5 chars) via `POST /api/v1/alerts/override` and receive valid `audit_event_id`.
4. **Auto-Expiration**: Overdue alerts render with `EXPIRED` status badge and are removed from active public feeds.
5. **No Data Fabrication**: No fake drafts, no simulated SMS deliveries, and no fake audit event tables.
6. **MCDA Immutability**: 50/30/10/10 weights rendered read-only.
7. **Responsive UI**: Verified on 1440x900, 1024x768, 768x1024, and 375x812 with 0 console errors.

---

## 16. Implementation Sequence (Post-Approval)

- **Phase 5.1**: TypeScript Interfaces (`types/alerts.ts`) & API Client Methods (`api/client.ts`)
- **Phase 5.2**: State Management (`AlertContext.tsx`)
- **Phase 5.3**: Officer Broadcast & Override Components (`AlertSummaryCard.tsx`, `AlertListTable.tsx`, `AlertComposerCard.tsx`, `AlertOverrideModal.tsx`)
- **Phase 5.4**: Citizen Warning Components (`PublicWarningBanner.tsx`, `PublicSafetyGuidelines.tsx`)
- **Phase 5.5**: Page Assemblies (`AlertsView.tsx`, `PublicPortalView.tsx`, `App.tsx`)
- **Phase 5.6**: Automated Build (`npm run build`) & Backend Regression Testing (`pytest -q`)
- **Phase 5.7**: Multi-Device Browser Verification (1440x900, 1024x768, 768x1024, 375x812)
- **Phase 5.8**: Final Implementation Walkthrough & Report

---

## 17. Absolute Hard Stop

**THIS DOCUMENT REPRESENTS THE PLAN ONLY.**  
No source code has been modified. No implementation has commenced.  
Awaiting user review and explicit approval before starting Phase 5 implementation.
