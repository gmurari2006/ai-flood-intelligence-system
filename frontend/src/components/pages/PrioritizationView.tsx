/**
 * AI Flood Intelligence System — MCDA Prioritization View.
 * Displays authoritative AI-10 Multi-Criteria Decision Analysis ranking,
 * immutable approved weights, and factor decomposition.
 */

import React from 'react';
import { Flame, ShieldCheck } from 'lucide-react';
import Badge from '../common/Badge';
import {
  MCDAWeightsCard,
  PriorityRankQueue,
  CriteriaDecompositionTable,
} from '../prioritization';

export const PrioritizationView: React.FC = () => {
  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* View Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: 'var(--space-4)',
        }}
      >
        <div>
          <div className="eyebrow-label" style={{ color: 'var(--brand-emergency-blue)' }}>
            DECISION SUPPORT &amp; RESOURCE ALLOCATION
          </div>
          <h1 className="page-title">
            Multi-Criteria Decision Analysis (AI-10 MCDA) Prioritization
          </h1>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>
            Deterministic Urgency Ranking (Hazard 50%, Population 30%, Infrastructure 10%, River Severity 10%).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Badge variant="low">
            <ShieldCheck size={12} style={{ marginRight: '4px' }} />
            IMMUTABLE OPERATIONAL WEIGHTS
          </Badge>
          <Badge variant="high">
            <Flame size={12} style={{ marginRight: '4px' }} />
            RESOURCE DISPATCH QUEUE
          </Badge>
        </div>
      </div>

      {/* 1. Approved Operational Weights Card */}
      <MCDAWeightsCard />

      {/* 2. Main 2-Column Prioritization Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.25fr) minmax(320px, 1fr)',
          gap: 'var(--space-5)',
          alignItems: 'start',
        }}
        className="prioritization-grid"
      >
        <PriorityRankQueue />
        <CriteriaDecompositionTable />
      </div>
    </div>
  );
};

export default PrioritizationView;
