/**
 * AI Flood Intelligence System — Criteria Decomposition Table Component.
 * Visualizes the transparent mathematical breakdown of normalized values and
 * weighted contributions for the selected zone in the MCDA queue.
 */

import React from 'react';
import { ShieldAlert, Scale } from 'lucide-react';
import { usePrioritization } from '../../context/PrioritizationContext';
import Card from '../common/Card';

const CRITERIA_DISPLAY_NAMES: Record<string, string> = {
  flood_risk_score: 'AI Flood Risk Score',
  population_density: 'Population Density Metric',
  infrastructure_impact: 'Vulnerable Infrastructure Assets',
  river_stage_ratio: 'River Gauge Stage Severity Ratio',
};

export const CriteriaDecompositionTable: React.FC = () => {
  const { selectedRankedZone } = usePrioritization();

  if (!selectedRankedZone) {
    return (
      <Card
        categoryLabel="MATHEMATICAL DECOMPOSITION"
        categoryColor="var(--brand-water-cyan)"
        title="Criteria Breakdown"
        subtitle="Select a zone from the ranking queue to inspect factors"
        borderAccent="spatial"
      >
        <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Scale size={24} style={{ margin: '0 auto 6px auto' }} />
          <div style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-primary)' }}>
            No Basin Selected
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      categoryLabel="MATHEMATICAL CRITERIA DECOMPOSITION"
      categoryColor="var(--brand-water-cyan)"
      title={`${selectedRankedZone.zone_name} (Rank #${selectedRankedZone.rank})`}
      subtitle={`Composite Decision Score: ${selectedRankedZone.composite_priority_score.toFixed(2)} / 100.00`}
      borderAccent="spatial"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
        {/* Recommended Action Callout */}
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ fontSize: '10.5px', fontWeight: 750, color: 'var(--brand-emergency-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldAlert size={13} />
            RECOMMENDED OPERATIONAL DIRECTIVE:
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '3px', lineHeight: 1.4 }}>
            {selectedRankedZone.recommended_alert_action}
          </div>
        </div>

        {/* Criteria Decomposition Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-default)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '6px 8px', fontWeight: 700 }}>CRITERION</th>
                <th style={{ padding: '6px 8px', fontWeight: 700 }}>RAW VALUE</th>
                <th style={{ padding: '6px 8px', fontWeight: 700 }}>NORMALIZED</th>
                <th style={{ padding: '6px 8px', fontWeight: 700 }}>WEIGHT</th>
                <th style={{ padding: '6px 8px', fontWeight: 700, textAlign: 'right' }}>WEIGHTED SCORE</th>
              </tr>
            </thead>
            <tbody>
              {selectedRankedZone.factors.map((factor, idx) => {
                const displayName = CRITERIA_DISPLAY_NAMES[factor.factor_name] || factor.factor_name.replace(/_/g, ' ');

                return (
                  <tr key={`${factor.factor_name}-${idx}`} style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <td style={{ padding: '8px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {displayName}
                    </td>
                    <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                      {factor.raw_value.toFixed(2)}
                    </td>
                    <td style={{ padding: '8px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {(factor.normalized_score * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>
                      {(factor.weight * 100).toFixed(0)}%
                    </td>
                    <td style={{ padding: '8px', fontWeight: 800, color: 'var(--brand-deep-ocean)', textAlign: 'right' }}>
                      +{factor.weighted_score.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

export default CriteriaDecompositionTable;
