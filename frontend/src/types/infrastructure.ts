/**
 * AI Flood Intelligence System — Infrastructure Vulnerability TypeScript Definitions.
 * Strictly matching backend Document 05 Section 7.1 (FR-07, AI-09).
 */

import { CentroidSchema } from './gis';

export type InfrastructureAssetType =
  | 'HOSPITAL'
  | 'POWER_STATION'
  | 'SCHOOL'
  | 'WATER_TREATMENT'
  | 'TELECOM'
  | string;

export type VulnerabilityStatus = 'SAFE' | 'AT_RISK' | 'CRITICAL';

export interface InfrastructureAsset {
  asset_id: string;
  name: string;
  asset_type: InfrastructureAssetType;
  zone_id: string;
  elevation_m: number;
  capacity: number | null;
  location: CentroidSchema | null;
  vulnerability_status: VulnerabilityStatus;
  estimated_water_depth_m: number;
  recommended_protection: string | null;
}

export interface VulnerableInfrastructureListResponse {
  total_affected_assets: number;
  assets: InfrastructureAsset[];
}
