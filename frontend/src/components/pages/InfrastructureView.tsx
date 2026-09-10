/**
 * AI Flood Intelligence System — Infrastructure Vulnerability View.
 * Displays critical infrastructure evaluation, inundation depths, and mitigation dossiers.
 */

import React from 'react';
import { Building2, ShieldAlert } from 'lucide-react';
import Badge from '../common/Badge';
import {
  InfrastructureSummaryCards,
  InfrastructureTable,
  AssetDetailModal,
} from '../infrastructure';

export const InfrastructureView: React.FC = () => {
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
          <div className="eyebrow-label" style={{ color: 'var(--cat-infra)' }}>
            DECISION SUPPORT &amp; ASSET VULNERABILITY
          </div>
          <h1 className="page-title">
            Critical Infrastructure Flood Impact &amp; Mitigation
          </h1>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>
            Inundation Depth Modeling, Facility Vulnerability Classification, and Actionable Protective Guidance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Badge variant="moderate">
            <Building2 size={12} style={{ marginRight: '4px' }} />
            POSTGIS FACILITY BUFFERS
          </Badge>
          <Badge variant="critical">
            <ShieldAlert size={12} style={{ marginRight: '4px' }} />
            ENGINEERING TRIAGE
          </Badge>
        </div>
      </div>

      {/* 1. Infrastructure Severity Summary Cards */}
      <InfrastructureSummaryCards />

      {/* 2. Critical Facilities Matrix Table */}
      <InfrastructureTable />

      {/* 3. Asset Detail Modal */}
      <AssetDetailModal />
    </div>
  );
};

export default InfrastructureView;
