/**
 * AI Flood Intelligence System — Common TypeScript Interfaces
 * Strictly aligned with Backend Modules 1–6 Schemas and Document 09.
 */

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type UserRole = 'SUPER_ADMIN' | 'DISASTER_OFFICER' | 'FIELD_RESPONDER' | 'PUBLIC_USER';

export type DataStatus = 'LOADING' | 'SUCCESS' | 'EMPTY' | 'UNAVAILABLE' | 'ERROR';

export type HealthState = 'connecting' | 'operational' | 'degraded' | 'unavailable';

export type AppView =
  | 'command_center'
  | 'risk_map'
  | 'ai_insights'
  | 'infrastructure'
  | 'evacuation'
  | 'alerts'
  | 'prioritization'
  | 'analytics'
  | 'public_portal';

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  organization?: string;
  email?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ComponentHealth {
  status: string;
  latency_ms?: number;
  active_model?: string;
  last_ingest?: string;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  database: ComponentHealth;
  ai_engine: ComponentHealth;
  weather_stream: ComponentHealth;
}

export interface GeographicZoneSummary {
  id: string;
  name: string;
  location_id: string;
  elevation_mean_m: number;
  drainage_capacity_score: number;
  centroid?: {
    latitude: number;
    longitude: number;
  };
}

export interface ZoneListResponse {
  total_count: number;
  zones: GeographicZoneSummary[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}
