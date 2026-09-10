/**
 * AI Flood Intelligence System — Strict GeoJSON and GIS Layer TypeScript Definitions.
 * Derived strictly from backend models and Document 05 Section 6.1 (FR-05, FR-06).
 */

import { RiskLevel } from './index';

// Strict RFC 7946 GeoJSON Types (Zero 'any' coordinates)
export type GeoJSONPosition = [number, number]; // [longitude, latitude]
export type GeoJSONPolygonCoordinates = GeoJSONPosition[][];
export type GeoJSONMultiPolygonCoordinates = GeoJSONPosition[][][];

export interface GeoJSONPointGeometry {
  type: 'Point';
  coordinates: GeoJSONPosition;
}

export interface GeoJSONPolygonGeometry {
  type: 'Polygon';
  coordinates: GeoJSONPolygonCoordinates;
}

export interface GeoJSONMultiPolygonGeometry {
  type: 'MultiPolygon';
  coordinates: GeoJSONMultiPolygonCoordinates;
}

export type GeoJSONGeometry =
  | GeoJSONPointGeometry
  | GeoJSONPolygonGeometry
  | GeoJSONMultiPolygonGeometry;

export interface GeoJSONFeature<
  G extends GeoJSONGeometry = GeoJSONGeometry,
  P = Record<string, unknown>
> {
  type: 'Feature';
  geometry: G;
  properties: P;
}

export interface GeoJSONFeatureCollection<
  G extends GeoJSONGeometry = GeoJSONGeometry,
  P = Record<string, unknown>
> {
  type: 'FeatureCollection';
  features: GeoJSONFeature<G, P>[];
}

// 1. Risk Zone Vector Layer Properties
export interface RiskZoneProperties {
  layer: 'risk_zones';
  zone_id: string;
  zone_name: string;
  elevation_mean_m: number;
  drainage_capacity_score: number | null;
  population_density: number | null;
  risk_level: RiskLevel | 'UNKNOWN';
  risk_color: string;
  flood_probability: number;
  water_depth_m: number;
}

// 2. Critical Infrastructure Layer Properties
export interface InfrastructureProperties {
  layer: 'infrastructure';
  asset_id: string;
  name: string;
  asset_type: string;
  zone_id: string;
  elevation_m: number;
  capacity: number | null;
  vulnerability_status: string;
  estimated_water_depth_m: number;
  recommended_protection: string | null;
}

// 3. River Gauge Layer Properties
export interface RiverGaugeProperties {
  layer: 'river_lines';
  zone_id: string;
  river_name: string;
  gauge_station_id: string;
  water_level_m: number;
  warning_level_m: number;
  danger_level_m: number;
  discharge_rate_m3s: number | null;
  observed_at: string | null;
}

// 4. Rainfall Heatmap Layer Properties
export interface RainfallProperties {
  layer: 'rainfall_heatmap';
  zone_id: string;
  rainfall_1h_mm: number;
  rainfall_6h_mm: number;
  rainfall_24h_mm: number;
  observed_at: string | null;
}

// Union of all supported layer property types
export type AnyLayerProperties =
  | RiskZoneProperties
  | InfrastructureProperties
  | RiverGaugeProperties
  | RainfallProperties;

// Zone summary and list schemas matching backend GET /api/v1/zones
export interface CentroidSchema {
  latitude: number;
  longitude: number;
}

export interface ZoneSummarySchema {
  id: string;
  name: string;
  location_id: string;
  elevation_mean_m: number;
  drainage_capacity_score: number | null;
  centroid: CentroidSchema;
}

export interface ZoneListResponse {
  total_count: number;
  zones: ZoneSummarySchema[];
}

// Telemetry schemas matching backend GET /api/v1/weather/{zone_id} and GET /api/v1/water-levels/{zone_id}
export interface RainfallMetricsSchema {
  '1h_mm': number;
  '6h_mm': number;
  '24h_mm': number;
  '72h_mm': number;
}

export interface ZoneWeatherViewResponse {
  zone_id: string;
  observed_at: string;
  temperature_c: number | null;
  humidity_pct: number | null;
  rainfall: RainfallMetricsSchema;
}

export interface ZoneWaterLevelViewResponse {
  zone_id: string;
  river_name: string;
  gauge_station_id: string;
  water_level_m: number;
  warning_level_m: number;
  danger_level_m: number;
  status: string;
}

// Layer Control state types
export type LayerId =
  | 'risk_zones'
  | 'infrastructure'
  | 'river_lines'
  | 'rainfall_heatmap'
  | 'evacuation_routes';

export type LayerAvailabilityState = 'AVAILABLE' | 'NO_DATA' | 'UNAVAILABLE' | 'ERROR';

export interface LayerConfig {
  id: LayerId;
  label: string;
  backendLayerKey?: string;
  enabled: boolean;
  status: LayerAvailabilityState;
  description: string;
}
