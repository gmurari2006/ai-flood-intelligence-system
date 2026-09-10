/**
 * AI Flood Intelligence System — Evacuation & Route Planning TypeScript Definitions.
 * Strictly matching backend Document 05 Section 8.1 & 8.2 (FR-08, FR-10).
 */

import { CentroidSchema } from './gis';

export interface EvacuationShelter {
  id: string;
  name: string;
  address: string;
  max_capacity: number;
  current_occupancy: number;
  available_capacity: number;
  has_backup_power: boolean;
  location: CentroidSchema;
  is_active: boolean;
  distance_meters: number | null;
}

export interface EvacuationShelterListResponse {
  total_shelters: number;
  shelters: EvacuationShelter[];
}

export interface EvacuationRoutePlanRequest {
  origin_latitude: number;
  origin_longitude: number;
  destination_shelter_id?: string;
  avoid_flood_zones?: boolean;
}

export interface RoutePathGeoJSON {
  type: 'LineString';
  coordinates: [number, number][]; // [longitude, latitude]
}

export interface RouteDetails {
  distance_km: number | null;
  estimated_time_minutes: number | null;
  route_status: string | null;
  path_geojson: RoutePathGeoJSON | null;
}

export type RoutingStatus = 'AVAILABLE' | 'ROUTING_UNAVAILABLE';

export interface EvacuationRoutePlanResponse {
  recommended_shelter: EvacuationShelter | null;
  route: RouteDetails | null;
  routing_status: RoutingStatus;
  message: string | null;
}
