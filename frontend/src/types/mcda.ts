/**
 * AI Flood Intelligence System — MCDA Prioritization TypeScript Definitions.
 * Strictly matching backend Document 04 Table 2 & Document 05 Section 10 (AI-10).
 */

export interface MCDAWeightsConfig {
  weight_risk_score: number;
  weight_population_density: number;
  weight_infrastructure_impact: number;
  weight_river_stage: number;
  max_population_density: number;
  max_vulnerable_assets: number;
}

export interface MCDAFactorBreakdown {
  factor_name: string;
  raw_value: number;
  normalized_score: number;
  weight: number;
  weighted_score: number;
}

export type PriorityTier =
  | 'CRITICAL_TIER_1'
  | 'HIGH_TIER_2'
  | 'MEDIUM_TIER_3'
  | 'LOW_TIER_4'
  | string;

export interface ZonePriorityRank {
  rank: number;
  zone_id: string;
  zone_name: string;
  composite_priority_score: number;
  priority_tier: PriorityTier;
  recommended_alert_action: string;
  factors: MCDAFactorBreakdown[];
}

export interface AlertPrioritizationResponse {
  evaluated_at: string;
  total_zones_evaluated: number;
  weights_applied: MCDAWeightsConfig;
  ranking: ZonePriorityRank[];
}
