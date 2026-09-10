/**
 * AI Flood Intelligence System — Emergency Alerts & Common Alerting Protocol (CAP) View.
 * Authorized Officer console for composing, client-side reviewing, broadcasting,
 * and overriding regional flood warnings with system audit logging.
 */

import React from 'react';
import { Radio, ShieldAlert, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  AlertSummaryCard,
  AlertComposerCard,
  AlertListTable,
} from '../alerts';
import Card from '../common/Card';
import Badge from '../common/Badge';

export const AlertsView: React.FC = () => {
  const { isOfficer } = useAuth();

  if (!isOfficer) {
    return (
      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--space-5)' }}>
          <div>
            <div className="eyebrow-label" style={{ color: 'var(--cat-emergency)' }}>
              EMERGENCY BROADCAST &amp; CAP-v1.2 DISPATCH
            </div>
            <h1 className="page-title">
              Common Alerting Protocol (CAP) Management
            </h1>
          </div>
          <Badge variant="critical">
            <Lock size={12} style={{ marginRight: '4px' }} />
            RESTRICTED ACCESS
          </Badge>
        </div>

        <Card borderAccent="critical">
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <ShieldAlert size={44} style={{ color: 'var(--risk-critical)', margin: '0 auto 12px auto' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Officer Authentication Required
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '8px auto 0 auto', lineHeight: 1.5 }}>
              The Emergency Broadcast &amp; CAP Alert Console is strictly restricted to certified <strong>Disaster Officers</strong> and <strong>Super Administrators</strong>. Please authenticate via the top right login console to access broadcast authorization.
            </p>
          </div>
        </Card>
      </div>
    );
  }

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
          paddingBottom: 'var(--space-5)',
        }}
      >
        <div>
          <div className="eyebrow-label" style={{ color: 'var(--cat-emergency)' }}>
            EMERGENCY BROADCAST &amp; CAP-v1.2 DISPATCH
          </div>
          <h1 className="page-title">
            Common Alerting Protocol (CAP) Management
          </h1>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>
            Authoritative EOC Broadcast Dispatch, Regional Inundation Alerts, and Auditable Officer Overrides.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Badge variant="critical">
            <Radio size={12} style={{ marginRight: '4px' }} />
            OFFICER BROADCAST AUTHORIZED
          </Badge>
          <Badge variant="info">
            PHASE 5 DECISION SUPPORT ACTIVE
          </Badge>
        </div>
      </div>

      {/* High-Level Broadcast Metrics */}
      <AlertSummaryCard />

      {/* Emergency Alert Composer */}
      <AlertComposerCard />

      {/* Operational Alerts Matrix */}
      <AlertListTable />
    </div>
  );
};

export default AlertsView;
