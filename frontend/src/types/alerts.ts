/**
 * AI Flood Intelligence System — Alerts & Public Warning TypeScript Interfaces
 * Strictly matches Document 05 Section 9 & 10 (FR-09, FR-10, FR-14) backend contracts.
 */

export type AlertSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'RED_EMERGENCY' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'DRAFT' | 'EXPIRED' | 'CANCELLED';

export interface AlertSummary {
  id: string;
  zone_id: string;
  severity: AlertSeverity | string;
  title: string;
  message: string;
  status: AlertStatus | string;
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
  status: 'ACTIVE' | string;
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
  status: 'OVERRIDE_APPLIED' | string;
  zone_id: string;
  effective_severity: string;
  audit_event_id: number;
  updated_at: string;
}

export interface PublicWarningItem {
  zone_name: string;
  severity: AlertSeverity | string;
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
