/**
 * AI Flood Intelligence System — Historical Analytics & Export Types.
 * Matches backend contracts in backend/app/schemas/analytics.py (FR-11, FR-15).
 */

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

export type ExportDataType = 'predictions' | 'alerts' | 'infrastructure' | 'zones' | 'historical';
export type ExportFormat = 'json' | 'csv';

export interface DataExportResponse {
  exported_at: string;
  record_count: number;
  data_type: ExportDataType;
  records: Array<Record<string, unknown>>;
}

export interface AnalyticsFilterState {
  zoneId: string | null;
  startDate: string | null;
  endDate: string | null;
}
