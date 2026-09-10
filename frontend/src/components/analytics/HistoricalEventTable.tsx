/**
 * AI Flood Intelligence System — Historical Event Matrix Component.
 * Displays recorded historical deluge events from GET /api/v1/analytics/historical
 * with strict data honesty and an explicit empty state when 0 records are cataloged.
 */

import React from 'react';
import { Calendar, Droplets, CloudRain, AlertTriangle, FileText, Info } from 'lucide-react';
import { useAnalytics } from '../../context/AnalyticsContext';
import Card from '../common/Card';
import Badge from '../common/Badge';
import LoadingSkeleton from '../common/LoadingSkeleton';

export const HistoricalEventTable: React.FC = () => {
  const {
    historicalEvents,
    totalRecordedEvents,
    isLoadingHistorical,
    historicalError,
    selectedZoneId,
  } = useAnalytics();

  const getSeverityBadgeVariant = (severity: string | null): 'low' | 'moderate' | 'high' | 'critical' => {
    const s = (severity || '').toUpperCase();
    if (s.includes('CATASTROPHIC') || s.includes('RED') || s.includes('CRITICAL')) return 'critical';
    if (s.includes('HIGH') || s.includes('MAJOR')) return 'high';
    if (s.includes('MODERATE') || s.includes('MEDIUM')) return 'moderate';
    return 'low';
  };

  return (
    <Card
      categoryLabel="HISTORICAL FLOOD ARCHIVE"
      categoryColor="var(--cat-env)"
      title="Recorded Historical Deluge Events"
      subtitle="Archival Flood Inundation & Precipitation Records"
      borderAccent="env"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
        {/* Loading State */}
        {isLoadingHistorical ? (
          <LoadingSkeleton height="180px" />
        ) : historicalError ? (
          <div style={{ padding: '16px', backgroundColor: 'var(--risk-critical-bg)', color: 'var(--risk-critical)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
            <AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px' }} />
            {historicalError}
          </div>
        ) : totalRecordedEvents === 0 || historicalEvents.length === 0 ? (
          /* Honest Empty State for 0 Records */
          <div
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-default)',
            }}
          >
            <Calendar size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 10px auto' }} />
            <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
              NO HISTORICAL FLOOD EVENTS AVAILABLE
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '6px auto 0 auto', lineHeight: 1.5 }}>
              No historical flood records are currently cataloged in the database {selectedZoneId ? `for zone '${selectedZoneId}'` : 'for the selected temporal filters'}.
            </p>
            <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', padding: '4px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-default)' }}>
              <Info size={12} />
              <span>Data Source: PostgreSQL <code>historical_flood_events</code> Archive (FR-11)</span>
            </div>
          </div>
        ) : (
          /* Real Data Table */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '8px 10px', fontWeight: 650 }}>Event Date</th>
                  <th style={{ padding: '8px 10px', fontWeight: 650 }}>Severity Classification</th>
                  <th style={{ padding: '8px 10px', fontWeight: 650 }}>Peak Water Depth</th>
                  <th style={{ padding: '8px 10px', fontWeight: 650 }}>Total Rainfall</th>
                  <th style={{ padding: '8px 10px', fontWeight: 650 }}>Archival Notes</th>
                </tr>
              </thead>
              <tbody>
                {historicalEvents.map((evt) => (
                  <tr key={evt.event_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                        {evt.event_date}
                      </div>
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      <Badge variant={getSeverityBadgeVariant(evt.severity_level)}>
                        {evt.severity_level || 'RECORDED'}
                      </Badge>
                    </td>
                    <td style={{ padding: '10px 10px', fontWeight: 600, color: 'var(--brand-deep-ocean)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Droplets size={13} style={{ color: 'var(--brand-water-cyan)' }} />
                        {evt.peak_water_depth_m !== null ? `${evt.peak_water_depth_m.toFixed(2)} m` : 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CloudRain size={13} style={{ color: 'var(--cat-env)' }} />
                        {evt.total_rainfall_mm !== null ? `${evt.total_rainfall_mm.toFixed(1)} mm` : 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 10px', color: 'var(--text-secondary)', fontSize: '11.5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FileText size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <span>{evt.notes || 'Archived historical event log'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
};

export default HistoricalEventTable;
