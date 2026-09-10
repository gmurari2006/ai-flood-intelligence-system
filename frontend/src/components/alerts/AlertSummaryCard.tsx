/**
 * AI Flood Intelligence System — Alert Summary Card Component.
 * Displays high-level alert metrics: Active Broadcasts, Expired Warnings, and Severity breakdown.
 */

import React from 'react';
import { Radio, AlertOctagon, Clock, ShieldCheck } from 'lucide-react';
import { useAlerts } from '../../context/AlertContext';
import Card from '../common/Card';
import LoadingSkeleton from '../common/LoadingSkeleton';

export const AlertSummaryCard: React.FC = () => {
  const { alerts, totalAlerts, isLoadingAlerts } = useAlerts();

  if (isLoadingAlerts) {
    return (
      <Card
        categoryLabel="EMERGENCY BROADCAST STATUS"
        categoryColor="var(--cat-emergency)"
        title="Loading Broadcast Metrics..."
        subtitle="Querying Regional Dispatch Items"
        borderAccent="emergency"
      >
        <LoadingSkeleton height="110px" />
      </Card>
    );
  }

  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const expiredCount = alerts.filter((a) => a.status === 'EXPIRED').length;
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'RED_EMERGENCY').length;

  return (
    <Card
      categoryLabel="REGIONAL BROADCAST METRICS"
      categoryColor="var(--cat-emergency)"
      title="Operational Emergency Alerts"
      subtitle="Multi-Channel EOC Common Alerting Protocol Broadcasts"
      borderAccent="emergency"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
        {/* Active Alerts */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: activeCount > 0 ? 'var(--risk-critical-bg)' : 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${activeCount > 0 ? 'var(--risk-critical-border)' : 'var(--border-default)'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: activeCount > 0 ? 'var(--risk-critical)' : 'var(--text-muted)', fontWeight: 700 }}>
              ACTIVE BROADCASTS
            </span>
            <Radio size={14} style={{ color: activeCount > 0 ? 'var(--risk-critical)' : 'var(--text-muted)' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: activeCount > 0 ? 'var(--risk-critical)' : 'var(--text-primary)', marginTop: '4px' }}>
            {activeCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Live public feeds
          </div>
        </div>

        {/* Critical Warnings */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
              CRITICAL / RED TIER
            </span>
            <AlertOctagon size={14} style={{ color: 'var(--risk-high)' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Severe hazard level
          </div>
        </div>

        {/* Total Records */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
              TOTAL REGIONAL ALERTS
            </span>
            <ShieldCheck size={14} style={{ color: 'var(--brand-deep-ocean)' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--brand-deep-ocean)', marginTop: '4px' }}>
            {totalAlerts}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Database records
          </div>
        </div>

        {/* Expired Records */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
              EXPIRED / ARCHIVED
            </span>
            <Clock size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-muted)', marginTop: '4px' }}>
            {expiredCount}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Auto-expired by backend
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AlertSummaryCard;
