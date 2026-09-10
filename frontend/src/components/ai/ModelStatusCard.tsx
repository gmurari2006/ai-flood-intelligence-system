/**
 * AI Flood Intelligence System — Model Status Card Component.
 * Communicates the active inference engine, epistemic model readiness,
 * and data honesty declarations.
 */

import React from 'react';
import { Cpu } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';

export const ModelStatusCard: React.FC = () => {
  return (
    <Card
      categoryLabel="INFERENCE ENGINE STATUS"
      categoryColor="var(--cat-ai)"
      title="Deterministic Hydrological Engine"
      subtitle="Production Epistemic Honesty Baseline"
      borderAccent="ai"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Operational Engine State:
          </span>
          <Badge variant="heuristic">
            <Cpu size={12} style={{ marginRight: '4px' }} />
            HEURISTIC ACTIVE
          </Badge>
        </div>

        <div
          style={{
            padding: '10px 12px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Registered Model ID:</span>
            <strong style={{ color: 'var(--text-primary)' }}>HEURISTIC-DECISION-SUPPORT-V1.0</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Algorithm Architecture:</span>
            <span style={{ color: 'var(--cat-ai)', fontWeight: 700 }}>HEURISTIC_RISK_INDEX</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Feature Dimension:</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>16 Features (Module 3)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>ML Artifact Path:</span>
            <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>internal://services/prediction</span>
          </div>
        </div>

        {/* Epistemic Honesty Declaration */}
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: 'var(--cat-ai-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--cat-ai-border)',
            fontSize: '11.5px',
            color: 'var(--text-secondary)',
            lineHeight: 1.4,
          }}
        >
          <strong style={{ color: 'var(--cat-ai)', display: 'block', marginBottom: '2px' }}>
            EPISTEMIC HONESTY NOTICE:
          </strong>
          The system evaluates physical stage-to-depth ratios, drainage scores, and rainfall accumulation thresholds. Supervised machine learning weights (e.g. XGBoost / Random Forest) are not active in the current deployment.
        </div>
      </div>
    </Card>
  );
};

export default ModelStatusCard;
