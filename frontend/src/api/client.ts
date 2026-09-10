/**
 * Base API Client Module.
 * Provides standard HTTP request methods communicating with the FastAPI backend.
 */

import { SystemHealth } from '../types';
import { 
  ZoneListResponse, 
  GeoJSONFeatureCollection, 
  ZoneWeatherViewResponse, 
  ZoneWaterLevelViewResponse 
} from '../types/gis';
import {
  PredictionRequestPayload,
  PredictionResponsePayload,
  PredictionExplainResponsePayload
} from '../types/prediction';
import { VulnerableInfrastructureListResponse } from '../types/infrastructure';
import { 
  EvacuationShelterListResponse, 
  EvacuationRoutePlanRequest, 
  EvacuationRoutePlanResponse 
} from '../types/evacuation';
import { AlertPrioritizationResponse } from '../types/mcda';
import {
  AlertListResponse,
  AlertCreatePayload,
  AlertCreateResult,
  AlertOverridePayload,
  AlertOverrideResult,
  PublicWarningsResponse,
} from '../types/alerts';
import {
  HistoricalAnalyticsResponse,
  DataExportResponse,
  ExportDataType,
  ExportFormat,
} from '../types/analytics';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('ai_flood_auth_token') : null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorBody = await response.text();
      let message = `API Error ${response.status}: ${response.statusText}`;
      try {
        const parsed = JSON.parse(errorBody);
        if (parsed.detail) {
          message = typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail);
        }
      } catch {
        if (errorBody) message = errorBody;
      }
      throw new Error(message);
    }

    return response.json();
  }

  public async getHealth(): Promise<SystemHealth> {
    return this.request<SystemHealth>('/system/health');
  }

  public async getZones(): Promise<ZoneListResponse> {
    return this.request<ZoneListResponse>('/zones');
  }

  public async getRiskMapLayers(layerType?: string): Promise<GeoJSONFeatureCollection> {
    const query = layerType ? `?layer_type=${encodeURIComponent(layerType)}` : '';
    return this.request<GeoJSONFeatureCollection>(`/risk-map/layers${query}`);
  }

  public async getZoneWeather(zoneId: string): Promise<ZoneWeatherViewResponse> {
    return this.request<ZoneWeatherViewResponse>(`/weather/${encodeURIComponent(zoneId)}`);
  }

  public async getZoneWaterLevels(zoneId: string): Promise<ZoneWaterLevelViewResponse> {
    return this.request<ZoneWaterLevelViewResponse>(`/water-levels/${encodeURIComponent(zoneId)}`);
  }

  public async triggerPrediction(request: PredictionRequestPayload): Promise<PredictionResponsePayload> {
    return this.request<PredictionResponsePayload>('/predictions', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  public async getPredictionExplanation(predictionRunId: string): Promise<PredictionExplainResponsePayload> {
    return this.request<PredictionExplainResponsePayload>(`/predictions/${encodeURIComponent(predictionRunId)}/explain`);
  }

  public async getVulnerableInfrastructure(zoneId?: string, minRiskLevel?: string): Promise<VulnerableInfrastructureListResponse> {
    const params = new URLSearchParams();
    if (zoneId) params.append('zone_id', zoneId);
    if (minRiskLevel) params.append('min_risk_level', minRiskLevel);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<VulnerableInfrastructureListResponse>(`/infrastructure/vulnerable${query}`);
  }

  public async getEvacuationShelters(options: {
    zoneId?: string;
    isActive?: boolean;
    latitude?: number;
    longitude?: number;
    maxDistanceMeters?: number;
  } = {}): Promise<EvacuationShelterListResponse> {
    const params = new URLSearchParams();
    if (options.zoneId) params.append('zone_id', options.zoneId);
    if (options.isActive !== undefined) params.append('is_active', String(options.isActive));
    if (options.latitude !== undefined) params.append('latitude', String(options.latitude));
    if (options.longitude !== undefined) params.append('longitude', String(options.longitude));
    if (options.maxDistanceMeters !== undefined) params.append('max_distance_meters', String(options.maxDistanceMeters));
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<EvacuationShelterListResponse>(`/evacuation/shelters${query}`);
  }

  public async planEvacuationRoute(request: EvacuationRoutePlanRequest): Promise<EvacuationRoutePlanResponse> {
    return this.request<EvacuationRoutePlanResponse>('/evacuation/plan-route', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  public async getAlertPrioritization(weights?: {
    weightRisk?: number;
    weightPop?: number;
    weightInfra?: number;
    weightRiver?: number;
  }): Promise<AlertPrioritizationResponse> {
    const params = new URLSearchParams();
    if (weights?.weightRisk !== undefined) params.append('weight_risk', String(weights.weightRisk));
    if (weights?.weightPop !== undefined) params.append('weight_pop', String(weights.weightPop));
    if (weights?.weightInfra !== undefined) params.append('weight_infra', String(weights.weightInfra));
    if (weights?.weightRiver !== undefined) params.append('weight_river', String(weights.weightRiver));
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<AlertPrioritizationResponse>(`/alerts/prioritization${query}`);
  }

  public async getPublicWarnings(): Promise<PublicWarningsResponse> {
    return this.request<PublicWarningsResponse>('/alerts/public');
  }

  public async getAuthorityAlerts(status?: string, zoneId?: string): Promise<AlertListResponse> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (zoneId) params.append('zone_id', zoneId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<AlertListResponse>(`/alerts${query}`);
  }

  public async publishAlert(payload: AlertCreatePayload): Promise<AlertCreateResult> {
    return this.request<AlertCreateResult>('/alerts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async overrideAlert(payload: AlertOverridePayload): Promise<AlertOverrideResult> {
    return this.request<AlertOverrideResult>('/alerts/override', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getHistoricalAnalytics(options?: {
    zoneId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<HistoricalAnalyticsResponse> {
    const params = new URLSearchParams();
    if (options?.zoneId) params.append('zone_id', options.zoneId);
    if (options?.startDate) params.append('start_date', options.startDate);
    if (options?.endDate) params.append('end_date', options.endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<HistoricalAnalyticsResponse>(`/analytics/historical${query}`);
  }

  public async exportData(
    dataType: ExportDataType = 'predictions',
    format: ExportFormat = 'json'
  ): Promise<DataExportResponse | Blob> {
    const endpoint = `/analytics/export?data_type=${encodeURIComponent(dataType)}&format=${encodeURIComponent(format)}`;
    const url = `${this.baseUrl}${endpoint}`;
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('ai_flood_auth_token') : null;

    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(url, { headers });
    if (!response.ok) {
      const errorBody = await response.text();
      let message = `Export failed (${response.status}): ${response.statusText}`;
      try {
        const parsed = JSON.parse(errorBody);
        if (parsed.detail) {
          message = typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail);
        }
      } catch {
        if (errorBody) message = errorBody;
      }
      throw new Error(message);
    }

    if (format === 'csv') {
      return response.blob();
    }
    return response.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;

