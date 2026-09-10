/**
 * AI Flood Intelligence System — Operational Alert History Summary Card.
 * Aggregates alert distribution across operational statuses and severity tiers
 * from GET /api/v1/alerts.
 */

import React from 'react';
import { Radio, Clock, ShieldCheck } from 'lucide-react';
import { useAlerts } from '../../context/AlertContext';
import Card from '../common/Card';
import LoadingSkeleton from '../common/LoadingSkeleton';

export const AlertHistorySummaryCard: React.FC = () => {
  const { alerts, totalAlerts, isLoadingAlerts } = useAlerts();

  if (isLoadingAlerts) {
    return (
      <Card
        categoryLabel="OPERATIONAL WARNING ARCHIVE"
        categoryColor="var(--cat-emergency)"
        title="Loading Alert Distribution..."
        subtitle="Aggregating Operational Dispatches"
        borderAccent="emergency"
      >
        <LoadingSkeleton height="140px" />
      </Card>
    );
  }

  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const expiredCount = alerts.filter((a) => a.status === 'EXPIRED').length;

  const redCount = alerts.filter((a) => a.severity === 'RED_EMERGENCY' || a.severity === 'CRITICAL').length;
  const highCount = alerts.filter((a) => a.severity === 'HIGH').length;
  const modCount = alerts.filter((a) => a.severity === 'MODERATE').length;
  const lowCount = alerts.filter((a) => a.severity === 'LOW').length;

  return (
    <Card
      categoryLabel="OPERATIONAL WARNING ARCHIVE"
      categoryColor="var(--cat-emergency)"
      title="Emergency Warning &amp; CAP Distribution"
      subtitle="Operational Alert History Breakdown by Lifecycle &amp; Severity Tier"
      borderAccent="emergency"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-2)' }}>
          <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              <Radio size={12} style={{ color: 'var(--risk-critical)' }} />
              Active Broadcasts
            </div>
            <div style={{ fontSize: '18px', fontWeight: 750, color: 'var(--risk-critical)', marginTop: '2px' }}>
              {activeCount}
            </div>
          </div>

          <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              <Clock size={12} style={{ color: 'var(--text-muted)' }} />
              Expired / Archived
            </div>
            <div style={{ fontSize: '18px', fontWeight: 750, color: 'var(--text-primary)', marginTop: '2px' }}>
              {expiredCount}
            </div>
          </div>

          <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={12} style={{ color: 'var(--brand-deep-ocean)' }} />
              Total Logged
            </div>
            <div style={{ fontSize: '18px', fontWeight: 750, color: 'var(--brand-deep-ocean)', marginTop: '2px' }}>
              {totalAlerts}
            </div>
          </div>
        </div>

        {/* Severity Distribution Meter */}
        <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            <span>Severity Tier Breakdown</span>
            <span>{totalAlerts} Total Records</span>
          </div>

          <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', backgroundColor: 'var(--border-subtle)', gap: '2px' }}>
            {totalAlerts > 0 ? (
              <>
                <div style={{ width: `${(redCount / totalAlerts) * 100}%`, backgroundColor: 'var(--risk-critical)' }} title={`Critical/Red: ${redCount}`} />
                <div style={{ width: `${(highCount / totalAlerts) * 100}%`, backgroundColor: 'var(--risk-high)' }} title={`High: ${highCount}`} />
                <div style={{ width: `${(modCount / totalAlerts) * 100}%`, backgroundColor: 'var(--risk-moderate)' }} title={`Moderate: ${modCount}`} />
                <div style={{ width: `${(lowCount / totalAlerts) * 100}%`, backgroundColor: 'var(--risk-low)' }} title={`Low: ${lowCount}`} />
              </>
            ) : (
              <div style={{ width: '100%', backgroundColor: 'var(--border-subtle)' }} />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ color: 'var(--risk-critical)' }}>■ Critical/Red: {redCount}</span>
            <span style={{ color: 'var(--risk-high)' }}>■ High: {highCount}</span>
            <span style={{ color: 'var(--risk-moderate)' }}>■ Moderate: {modCount}</span>
            <span style={{ color: 'var(--risk-low)' }}>■ Low: {lowCount}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AlertHistorySummaryCard;
