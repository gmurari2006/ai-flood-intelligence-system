/**
 * AI Flood Intelligence System — Infrastructure Summary Cards.
 * Visualizes asset counts by vulnerability tier (Critical, At-Risk, Safe).
 */

import React from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, Building2 } from 'lucide-react';
import { useInfrastructure } from '../../context/InfrastructureContext';
import Card from '../common/Card';
import LoadingSkeleton from '../common/LoadingSkeleton';

export const InfrastructureSummaryCards: React.FC = () => {
  const { assets, isLoading, totalAffected } = useInfrastructure();

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <LoadingSkeleton count={4} height="85px" />
      </div>
    );
  }

  const criticalCount = assets.filter((a) => a.vulnerability_status === 'CRITICAL').length;
  const atRiskCount = assets.filter((a) => a.vulnerability_status === 'AT_RISK').length;
  const safeCount = assets.filter((a) => a.vulnerability_status === 'SAFE').length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
      {/* Total Assets */}
      <Card borderAccent="spatial">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Evaluated Assets
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {totalAffected}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Critical Facilities Monitored
            </div>
          </div>
          <div style={{ padding: '10px', backgroundColor: 'var(--cat-spatial-bg)', borderRadius: 'var(--radius-md)', color: 'var(--cat-spatial)' }}>
            <Building2 size={24} />
          </div>
        </div>
      </Card>

      {/* Critical Status */}
      <Card borderAccent="critical">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--risk-critical)', fontWeight: 700, textTransform: 'uppercase' }}>
              Critical Inundation
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--risk-critical)', marginTop: '2px' }}>
              {criticalCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Immediate Mitigation Required
            </div>
          </div>
          <div style={{ padding: '10px', backgroundColor: 'var(--risk-critical-bg)', borderRadius: 'var(--radius-md)', color: 'var(--risk-critical)' }}>
            <ShieldAlert size={24} />
          </div>
        </div>
      </Card>

      {/* At-Risk Status */}
      <Card borderAccent="moderate">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--risk-moderate)', fontWeight: 700, textTransform: 'uppercase' }}>
              At-Risk Warning
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--risk-moderate)', marginTop: '2px' }}>
              {atRiskCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Heightened Buffer Monitoring
            </div>
          </div>
          <div style={{ padding: '10px', backgroundColor: 'var(--risk-moderate-bg)', borderRadius: 'var(--radius-md)', color: 'var(--risk-moderate)' }}>
            <AlertTriangle size={24} />
          </div>
        </div>
      </Card>

      {/* Safe Status */}
      <Card borderAccent="low">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--risk-low)', fontWeight: 700, textTransform: 'uppercase' }}>
              Baseline Safe
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--risk-low)', marginTop: '2px' }}>
              {safeCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Above Flood Inundation Margin
            </div>
          </div>
          <div style={{ padding: '10px', backgroundColor: 'var(--risk-low-bg)', borderRadius: 'var(--radius-md)', color: 'var(--risk-low)' }}>
            <ShieldCheck size={24} />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InfrastructureSummaryCards;
