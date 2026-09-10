/**
 * AI Flood Intelligence System — Historical Analytics & Decision Intelligence View.
 * Authorized Disaster Officer console for archival flood event exploration,
 * current station telemetry assessments, zone baselines, and multi-dataset CSV/JSON export.
 */

import React, { useState } from 'react';
import { 
  Download, 
  Filter, 
  Calendar, 
  Lock, 
  ShieldAlert, 
  TrendingUp, 
  Building2,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAnalytics } from '../../context/AnalyticsContext';
import { useZone } from '../../context/ZoneContext';
import {
  HistoricalEventTable,
  HistoricalDepthChart,
  EnvironmentalTelemetryCard,
  ZoneComparisonTable,
  AlertHistorySummaryCard,
  ModelEvaluationNoticeCard,
  DataExportModal,
} from '../analytics';
import { InfrastructureTable, InfrastructureSummaryCards } from '../infrastructure';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';

export const AnalyticsView: React.FC = () => {
  const { isAuthenticated, isOfficer } = useAuth();
  const { selectedZoneId, setFilterZone, startDate, endDate, setDateRange } = useAnalytics();
  const { zones } = useZone();

  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [tempStartDate, setTempStartDate] = useState<string>(startDate || '');
  const [tempEndDate, setTempEndDate] = useState<string>(endDate || '');

  // 1. RBAC Guard: Unauthenticated
  if (!isAuthenticated) {
    return (
      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--space-4)' }}>
          <div className="eyebrow-label" style={{ color: 'var(--risk-critical)' }}>
            AUTHENTICATION REQUIRED
          </div>
          <h1 className="page-title">Historical Intelligence &amp; Data Analytics</h1>
        </div>
        <Card borderAccent="critical">
          <div style={{ padding: '36px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Lock size={40} style={{ color: 'var(--risk-critical)', marginBottom: '12px' }} />
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Authentication Required to Access Analytics Archive
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '460px', margin: '8px auto 0 auto', lineHeight: 1.5 }}>
              Historical flood dossiers, station telemetry diagnostics, and operational dataset exports are restricted to authenticated emergency personnel. Please log in to proceed.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // 2. RBAC Guard: PUBLIC_USER (Access Restricted)
  if (!isOfficer) {
    return (
      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--space-4)' }}>
          <div className="eyebrow-label" style={{ color: 'var(--risk-high)' }}>
            OFFICER ACCESS RESTRICTED
          </div>
          <h1 className="page-title">Historical Intelligence &amp; Data Analytics</h1>
        </div>
        <Card borderAccent="high">
          <div style={{ padding: '36px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ShieldAlert size={40} style={{ color: 'var(--risk-high)', marginBottom: '12px' }} />
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Officer Authorization Required
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '460px', margin: '8px auto 0 auto', lineHeight: 1.5 }}>
              Your current account role (<strong>Public Citizen</strong>) does not have operational clearance for historical disaster archives or dataset exports. Citizens may access active warnings via the <strong>Public Safety Portal</strong>.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const handleApplyDateFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setDateRange(tempStartDate || null, tempEndDate || null);
  };

  const handleResetFilters = () => {
    setTempStartDate('');
    setTempEndDate('');
    setDateRange(null, null);
    setFilterZone(null);
  };

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
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
          <div className="eyebrow-label" style={{ color: 'var(--cat-env)' }}>
            DECISION SUPPORT &amp; DATA ANALYTICS
          </div>
          <h1 className="page-title">Historical Intelligence &amp; Decision Analytics</h1>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>
            Archival Deluge Exploration, Station Telemetry Baselines, and Multi-Dataset Operational Exports.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Badge variant="info">
            <TrendingUp size={12} style={{ marginRight: '4px' }} />
            OFFICER DOSSIER
          </Badge>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsExportModalOpen(true)}
            icon={<Download size={14} />}
          >
            Export Operational Records
          </Button>
        </div>
      </div>

      {/* Query Filters Bar */}
      <Card borderAccent="env">
        <form
          onSubmit={handleApplyDateFilters}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 650, color: 'var(--text-secondary)' }}>
              <Filter size={14} style={{ color: 'var(--brand-emergency-blue)' }} />
              <span>Target Zone:</span>
            </div>

            <select
              value={selectedZoneId || 'ALL'}
              onChange={(e) => setFilterZone(e.target.value === 'ALL' ? null : e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="ALL">All Monitored Geographic Zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.id})
                </option>
              ))}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 650, color: 'var(--text-secondary)', marginLeft: '8px' }}>
              <Calendar size={14} style={{ color: 'var(--cat-env)' }} />
              <span>Date Range:</span>
            </div>

            <input
              type="date"
              value={tempStartDate}
              onChange={(e) => setTempStartDate(e.target.value)}
              placeholder="YYYY-MM-DD"
              style={{
                padding: '5px 8px',
                fontSize: '11.5px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>to</span>
            <input
              type="date"
              value={tempEndDate}
              onChange={(e) => setTempEndDate(e.target.value)}
              placeholder="YYYY-MM-DD"
              style={{
                padding: '5px 8px',
                fontSize: '11.5px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
              }}
            />

            <Button type="submit" variant="secondary" size="sm">
              Apply Filters
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters}>
              Reset
            </Button>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Info size={12} />
            <span>Direct queries against <code>GET /api/v1/analytics/historical</code></span>
          </div>
        </form>
      </Card>

      {/* SECTION 1: Historical Flood Events Matrix & Precipitation vs Depth Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
        <HistoricalEventTable />
        <HistoricalDepthChart />
      </div>

      {/* SECTION 2: Environmental Telemetry (Latest Observation Snapshot) */}
      <EnvironmentalTelemetryCard />

      {/* SECTION 3: Zone Comparison Baseline Table */}
      <ZoneComparisonTable />

      {/* SECTION 4: Operational Alert History & Model Evaluation Notice */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-6)' }}>
        <AlertHistorySummaryCard />
        <ModelEvaluationNoticeCard />
      </div>

      {/* SECTION 5: Current Infrastructure Risk Dossier */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={18} style={{ color: 'var(--cat-infra)' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-deep-ocean)', margin: 0 }}>
            CURRENT INFRASTRUCTURE RISK
          </h2>
          <Badge variant="high">REAL-TIME INUNDATION THREAT</Badge>
        </div>
        <InfrastructureSummaryCards />
        <InfrastructureTable />
      </div>

      {/* Export Modal */}
      <DataExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};

export default AnalyticsView;
