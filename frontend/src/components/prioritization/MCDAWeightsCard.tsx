/**
 * AI Flood Intelligence System — MCDA Weights Card.
 * Displays official immutable approved operational weights (50% Risk, 30% Pop, 10% Infra, 10% River).
 */

import React from 'react';
import { ShieldCheck, HelpCircle } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';

export const MCDAWeightsCard: React.FC = () => {
  return (
    <Card
      categoryLabel="OPERATIONAL CRITERIA CONFIGURATION"
      categoryColor="var(--brand-emergency-blue)"
      title="Approved Multi-Criteria Weights"
      subtitle="Authoritative AI-10 Decision Support Model"
      borderAccent="spatial"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 650 }}>
            Operational MCDA Configuration:
          </span>
          <Badge variant="low">
            <ShieldCheck size={11} style={{ marginRight: '4px' }} />
            OPERATIONAL MCDA — APPROVED WEIGHTS
          </Badge>
        </div>

        {/* 4 Criteria Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '8px',
            padding: '10px 12px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          {/* 1. Risk Score (50%) */}
          <div style={{ padding: '8px', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
            <div style={{ fontSize: '10px', color: 'var(--brand-emergency-blue)', fontWeight: 750 }}>CRITERION 1 (50%)</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>AI Flood Risk</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Weight: 0.50</div>
          </div>

          {/* 2. Population Density (30%) */}
          <div style={{ padding: '8px', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
            <div style={{ fontSize: '10px', color: 'var(--brand-water-cyan)', fontWeight: 750 }}>CRITERION 2 (30%)</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>Pop. Density</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Weight: 0.30</div>
          </div>

          {/* 3. Infrastructure Impact (10%) */}
          <div style={{ padding: '8px', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
            <div style={{ fontSize: '10px', color: 'var(--cat-infra)', fontWeight: 750 }}>CRITERION 3 (10%)</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>Critical Infra</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Weight: 0.10</div>
          </div>

          {/* 4. River Stage Ratio (10%) */}
          <div style={{ padding: '8px', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
            <div style={{ fontSize: '10px', color: 'var(--brand-deep-ocean)', fontWeight: 750 }}>CRITERION 4 (10%)</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>River Severity</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Weight: 0.10</div>
          </div>
        </div>

        {/* Immutability Subtext */}
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', borderTop: '1px solid var(--border-default)', paddingTop: '6px' }}>
          <HelpCircle size={11} />
          <span>Authoritative operational weights sum strictly to 1.0 (100%) per Document 04 Table 2.</span>
        </div>
      </div>
    </Card>
  );
};

export default MCDAWeightsCard;
