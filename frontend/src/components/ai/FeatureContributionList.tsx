/**
 * AI Flood Intelligence System — Feature Contribution List Component.
 * Renders ranked contributing factors with dynamic semantic labels (Factor vs SHAP),
 * positive/negative directional contribution bars, observed measurements, and units.
 */

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { RiskFactorPayload } from '../../types/prediction';

interface FeatureContributionListProps {
  factors: RiskFactorPayload[];
  explanationMethod?: string;
}

const FEATURE_NAME_LABELS: Record<string, string> = {
  rainfall_1h_mm: '1-Hour Rainfall Accumulation',
  rainfall_6h_mm: '6-Hour Rainfall Accumulation',
  rainfall_24h_mm: '24-Hour Rainfall Accumulation',
  rainfall_72h_mm: '72-Hour Antecedent Precipitation',
  rain_intensity_delta: 'Rainfall Intensity Acceleration',
  forecast_rainfall_horizon_mm: 'Forecast Horizon Precipitation',
  river_water_level_m: 'River Stage Water Level',
  river_stage_ratio: 'River Stage Danger Ratio',
  elevation_mean_m: 'Mean Basin Elevation',
  slope_mean_deg: 'Mean Terrain Slope',
  drainage_capacity_score: 'Municipal Drainage Effectiveness',
  soil_saturation_proxy: 'Estimated Soil Saturation',
  distance_to_river_m: 'Distance to Main River Channel',
  antecedent_precipitation_index: 'Antecedent Precipitation Index (API)',
  runoff_potential_index: 'Runoff Potential Index (RPI)',
  hydro_danger_index_clamped: 'Clamped Hydro Danger Index (HDI)',
};

const FEATURE_UNITS: Record<string, string> = {
  rainfall_1h_mm: 'mm',
  rainfall_6h_mm: 'mm',
  rainfall_24h_mm: 'mm',
  rainfall_72h_mm: 'mm',
  rain_intensity_delta: 'mm/hr',
  forecast_rainfall_horizon_mm: 'mm',
  river_water_level_m: 'm',
  river_stage_ratio: 'x danger',
  elevation_mean_m: 'm',
  slope_mean_deg: '°',
  drainage_capacity_score: '/10',
  soil_saturation_proxy: 'ratio',
  distance_to_river_m: 'm',
  antecedent_precipitation_index: 'idx',
  runoff_potential_index: 'idx',
  hydro_danger_index_clamped: 'idx',
};

export const FeatureContributionList: React.FC<FeatureContributionListProps> = ({
  factors,
  explanationMethod = 'heuristic_factor_attribution',
}) => {
  const isModelShap = explanationMethod === 'model_shap';
  const contributionLabel = isModelShap ? 'SHAP Contribution' : 'Factor Contribution';

  // Sort factors by absolute contribution magnitude descending
  const sortedFactors = [...factors].sort(
    (a, b) => Math.abs(b.shap_contribution) - Math.abs(a.shap_contribution)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid var(--border-default)', paddingBottom: '6px' }}>
        <span>CONTRIBUTING FEATURE</span>
        <span>{contributionLabel.toUpperCase()}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {sortedFactors.map((factor, idx) => {
          const displayName = FEATURE_NAME_LABELS[factor.feature_name] || factor.feature_name;
          const unit = FEATURE_UNITS[factor.feature_name] || '';
          const isIncreasing = factor.impact_direction === 'INCREASES_RISK' || factor.shap_contribution > 0;
          const barColor = isIncreasing ? 'var(--risk-critical)' : 'var(--risk-low)';
          const badgeBg = isIncreasing ? 'var(--risk-critical-bg)' : 'var(--risk-low-bg)';
          const badgeBorder = isIncreasing ? 'var(--risk-critical-border)' : 'var(--risk-low-border)';
          const barWidthPercent = Math.min(100, Math.max(8, Math.abs(factor.shap_contribution) * 100 * 2));

          return (
            <div
              key={`${factor.feature_name}-${idx}`}
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Observed: <strong>{factor.observed_value.toFixed(2)} {unit}</strong>
                  </div>
                </div>

                {/* Contribution Pill */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    backgroundColor: badgeBg,
                    border: `1px solid ${badgeBorder}`,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11.5px',
                    fontWeight: 750,
                    color: barColor,
                  }}
                >
                  {isIncreasing ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  <span>
                    {factor.shap_contribution > 0 ? '+' : ''}
                    {factor.shap_contribution.toFixed(3)}
                  </span>
                </div>
              </div>

              {/* Contribution Magnitude Bar */}
              <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-default)', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${barWidthPercent}%`,
                    height: '100%',
                    backgroundColor: barColor,
                    borderRadius: '2px',
                    transition: 'width 0.25s ease',
                  }}
                />
              </div>

              {/* Backend Description */}
              {factor.description && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                  {factor.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FeatureContributionList;
