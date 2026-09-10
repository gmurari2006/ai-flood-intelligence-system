/**
 * AI Flood Intelligence System — AI Prediction & XAI TypeScript Interfaces.
 * Strictly aligned with Backend Modules 3, 4, 5, 6 and Document 05 Sections 5.1 & 5.2.
 */

import { RiskLevel } from './index';

export type InferenceMode = 'heuristic_fallback' | 'trained_model';

export type ExplanationMethod = 'heuristic_factor_attribution' | 'model_shap';

export type ImpactDirection = 'INCREASES_RISK' | 'DECREASES_RISK';

export type PredictionProvenance = 'LIVE_PREDICTION_RUN' | 'POSTGIS_SPATIAL_BASELINE' | 'AWAITING_EXECUTION';

export interface PredictionRequestPayload {
  zone_id: string;
  forecast_horizon_hours: number;
}

export interface PredictionResponsePayload {
  prediction_run_id: string;
  zone_id: string;
  forecast_horizon_hours: number;
  flood_probability: number;
  predicted_depth_m: number;
  confidence_score: number; // Heuristic baseline reliability (0.0 - 1.0)
  risk_score_numeric: number; // 0.00 - 100.00
  risk_level: RiskLevel;
  recommended_action: string;
  inference_mode: InferenceMode | string;
  is_demo_data: boolean;
  executed_at: string;
}

export interface RiskFactorPayload {
  feature_name: string;
  observed_value: number;
  shap_contribution: number; // Signed float; label derives semantically from explanation_method
  impact_direction: ImpactDirection | string;
  description: string;
}

export interface PredictionExplainResponsePayload {
  prediction_run_id: string;
  base_expected_value: number;
  final_probability: number;
  explanation_method: ExplanationMethod | string;
  factors: RiskFactorPayload[];
}

export interface PredictionState {
  currentPrediction: PredictionResponsePayload | null;
  currentExplanation: PredictionExplainResponsePayload | null;
  selectedHorizon: number; // 1, 6, 12, 24
  isPredicting: boolean;
  isLoadingExplanation: boolean;
  predictionError: string | null;
  explanationError: string | null;
  provenance: PredictionProvenance;
}
