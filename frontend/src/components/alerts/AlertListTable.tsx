/**
 * AI Flood Intelligence System — Alert List Table Component.
 * Visualizes operational flood alerts with status filtering, severity badges,
 * audit provenance, and manual officer risk override triggers.
 */

import React, { useState } from 'react';
import { Radio, AlertOctagon, Filter, ShieldAlert, RefreshCw, Clock, HelpCircle } from 'lucide-react';
import { useAlerts } from '../../context/AlertContext';
import { useZone } from '../../context/ZoneContext';
import { AlertStatus, AlertSummary } from '../../types/alerts';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import LoadingSkeleton from '../common/LoadingSkeleton';
import AlertOverrideModal from './AlertOverrideModal';

const STATUS_FILTERS: { label: string; value: AlertStatus | 'ALL' }[] = [
  { label: 'All Operational Alerts', value: 'ALL' },
  { label: 'Active Broadcasts', value: 'ACTIVE' },
  { label: 'Expired / Archived', value: 'EXPIRED' },
  { label: 'Cancelled Alerts', value: 'CANCELLED' },
];

export const AlertListTable: React.FC = () => {
  const {
    alerts,
    isLoadingAlerts,
    error,
    statusFilter,
    setStatusFilter,
    zoneFilter,
    setZoneFilter,
    fetchAlerts,
  } = useAlerts();
  const { zones } = useZone();

  // Override Modal state
  const [overrideModalOpen, setOverrideModalOpen] = useState<boolean>(false);
  const [selectedForOverride, setSelectedForOverride] = useState<AlertSummary | null>(null);

  const handleOpenOverride = (alert: AlertSummary) => {
    setSelectedForOverride(alert);
    setOverrideModalOpen(true);
  };

  const getSeverityBadgeVariant = (sev: string): 'low' | 'moderate' | 'high' | 'critical' => {
    const s = sev.toUpperCase();
    if (s === 'CRITICAL' || s === 'RED_EMERGENCY') return 'critical';
    if (s === 'HIGH') return 'high';
    if (s === 'MODERATE') return 'moderate';
    return 'low';
  };

  const getStatusBadgeVariant = (status: string): 'low' | 'neutral' | 'moderate' | 'critical' => {
    const st = status.toUpperCase();
    if (st === 'ACTIVE') return 'low';
    if (st === 'EXPIRED') return 'neutral';
    if (st === 'CANCELLED') return 'moderate';
    return 'neutral';
  };

  return (
    <Card
      categoryLabel="EOC BROADCAST MATRIX"
      categoryColor="var(--cat-emergency)"
      title="Regional Alert Broadcast Log"
      subtitle="Authoritative CAP Emergency Messages & Active Geofenced Warnings"
      borderAccent="emergency"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
        {/* Filter Controls Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 650, color: 'var(--text-secondary)' }}>
              <Filter size={14} />
              Status:
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AlertStatus | 'ALL')}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-surface)',
                fontSize: '12.5px',
                color: 'var(--text-primary)',
                fontWeight: 600,
              }}
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 650, color: 'var(--text-secondary)', marginLeft: '8px' }}>
              Zone:
            </div>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-surface)',
                fontSize: '12.5px',
                color: 'var(--text-primary)',
              }}
            >
              <option value="ALL">All Monitored Basins</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          <Button variant="secondary" size="sm" onClick={() => fetchAlerts()} icon={<RefreshCw size={12} />}>
            Refresh Alerts
          </Button>
        </div>

        {/* Loading State */}
        {isLoadingAlerts ? (
          <LoadingSkeleton height="200px" />
        ) : error ? (
          <div style={{ padding: '16px', backgroundColor: 'var(--risk-critical-bg)', color: 'var(--risk-critical)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
            <AlertOctagon size={16} style={{ display: 'inline', marginRight: '6px' }} />
            {error}
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-default)' }}>
            <Radio size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px auto' }} />
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              No Operational Alerts Match Filter
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '4px auto 0 auto' }}>
              No alert records found for status '{statusFilter}' and zone '{zoneFilter}'. Use the composer above to issue new regional warnings.
            </p>
          </div>
        ) : (
          /* Table of Alert Records */
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Target Zone</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Severity</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Headline Warning Title</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px' }}>Issued / Expires</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px' }}>Officer Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    {/* Zone ID */}
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <span style={{ fontWeight: 700, color: 'var(--brand-deep-ocean)', fontSize: '12.5px' }}>
                        {alert.zone_id}
                      </span>
                    </td>

                    {/* Severity Badge */}
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </td>

                    {/* Headline & Directive */}
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 750, color: 'var(--text-primary)', fontSize: '13px' }}>
                        {alert.title}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
                        {alert.message}
                      </div>
                      {alert.message.includes('[OFFICER OVERRIDE]') && (
                        <div style={{ marginTop: '4px' }}>
                          <Badge variant="moderate">
                            <ShieldAlert size={10} style={{ marginRight: '3px' }} />
                            OFFICER OVERRIDE APPLIED
                          </Badge>
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <Badge variant={getStatusBadgeVariant(alert.status)}>
                        {alert.status}
                      </Badge>
                    </td>

                    {/* Timing */}
                    <td style={{ padding: '10px 12px', verticalAlign: 'top', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      <div>Issued: {new Date(alert.issued_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div>Expires: {new Date(alert.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>

                    {/* Officer Actions */}
                    <td style={{ padding: '10px 12px', textAlign: 'right', verticalAlign: 'top' }}>
                      {alert.status === 'ACTIVE' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenOverride(alert)}
                          icon={<ShieldAlert size={12} />}
                        >
                          Override Risk
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Contract Honesty Notice Footer */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px', borderTop: '1px solid var(--border-default)', paddingTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HelpCircle size={12} />
            <span><strong>Recipient Delivery Status:</strong> Group dispatch registered; carrier telco receipts not exposed by current API.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} />
            <span><strong>Audit Trail:</strong> Audit Event IDs captured on override; historical system event log not available via API.</span>
          </div>
        </div>
      </div>

      {/* Override Modal */}
      {selectedForOverride && (
        <AlertOverrideModal
          isOpen={overrideModalOpen}
          onClose={() => {
            setOverrideModalOpen(false);
            setSelectedForOverride(null);
          }}
          zoneId={selectedForOverride.zone_id}
          currentSeverity={selectedForOverride.severity}
        />
      )}
    </Card>
  );
};

export default AlertListTable;
