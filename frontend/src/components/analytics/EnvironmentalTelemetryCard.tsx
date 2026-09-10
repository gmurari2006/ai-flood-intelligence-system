/**
 * AI Flood Intelligence System — Environmental Telemetry Component.
 * Displays current station observation metrics (1h/6h/24h/72h rainfall & river stage buffer)
 * while explicitly documenting the unavailability of historical environmental time-series logs.
 */

import React from 'react';
import { CloudRain, Droplets, AlertTriangle, Info } from 'lucide-react';
import { useAnalytics } from '../../context/AnalyticsContext';
import Card from '../common/Card';
import Badge from '../common/Badge';
import LoadingSkeleton from '../common/LoadingSkeleton';

export const EnvironmentalTelemetryCard: React.FC = () => {
  const {
    weatherTelemetry,
    waterLevelTelemetry,
    isLoadingTelemetry,
    telemetryError,
    selectedZoneId,
  } = useAnalytics();

  if (isLoadingTelemetry) {
    return (
      <Card
        categoryLabel="CURRENT METEOROLOGICAL &amp; RIVER TELEMETRY"
        categoryColor="var(--cat-env)"
        title="Loading Station Telemetry..."
        subtitle="Querying Environmental Ingestion Sensors"
        borderAccent="env"
      >
        <LoadingSkeleton height="160px" />
      </Card>
    );
  }

  const rainfall = weatherTelemetry?.rainfall;
  const waterLevel = waterLevelTelemetry;

  const currentLevel = waterLevel?.water_level_m ?? 0;
  const warningLevel = waterLevel?.warning_level_m ?? 3.5;
  const dangerLevel = waterLevel?.danger_level_m ?? 4.2;

  // Percentage for river threshold gauge (capped at 100%)
  const gaugePercent = Math.min(100, Math.max(5, (currentLevel / dangerLevel) * 100));

  const isDanger = currentLevel >= dangerLevel;
  const isWarning = currentLevel >= warningLevel && !isDanger;

  return (
    <Card
      categoryLabel="CURRENT METEOROLOGICAL &amp; RIVER TELEMETRY"
      categoryColor="var(--cat-env)"
      title={`Active Station Observations — Zone ${selectedZoneId || 'Default'}`}
      subtitle="Latest Ingested Telemetry (Current Snapshot Only)"
      borderAccent="env"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
        {/* Explicit Timeseries Notice */}
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: 'var(--bg-surface-blue)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #BAE6FD',
            fontSize: '12px',
            color: 'var(--brand-deep-ocean)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Info size={16} style={{ color: 'var(--brand-emergency-blue)', flexShrink: 0 }} />
          <div>
            <strong>HISTORICAL ENVIRONMENTAL TIME SERIES: NOT AVAILABLE THROUGH CURRENT API</strong>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              The ingestion service exposes only the latest observation snapshot. Continuous historical telemetry curves are not supported by the backend schema.
            </div>
          </div>
        </div>

        {telemetryError ? (
          <div style={{ padding: '12px', backgroundColor: 'var(--risk-critical-bg)', color: 'var(--risk-critical)', borderRadius: 'var(--radius-md)', fontSize: '12px' }}>
            <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px' }} />
            {telemetryError}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {/* 1. Rainfall Accumulation Profile */}
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: 'var(--brand-deep-ocean)' }}>
                  <CloudRain size={15} style={{ color: 'var(--cat-env)' }} />
                  Rainfall Accumulation
                </div>
                <Badge variant="info">CURRENT SNAPSHOT</Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', color: 'var(--text-secondary)' }}>
                    <span>1-Hour Precipitation</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{rainfall?.['1h_mm']?.toFixed(1) ?? '0.0'} mm</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, ((rainfall?.['1h_mm'] ?? 0) / 50) * 100)}%`, height: '100%', backgroundColor: 'var(--cat-env)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', color: 'var(--text-secondary)' }}>
                    <span>6-Hour Precipitation</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{rainfall?.['6h_mm']?.toFixed(1) ?? '0.0'} mm</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, ((rainfall?.['6h_mm'] ?? 0) / 100) * 100)}%`, height: '100%', backgroundColor: 'var(--brand-water-cyan)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', color: 'var(--text-secondary)' }}>
                    <span>24-Hour Precipitation</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{rainfall?.['24h_mm']?.toFixed(1) ?? '0.0'} mm</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, ((rainfall?.['24h_mm'] ?? 0) / 200) * 100)}%`, height: '100%', backgroundColor: 'var(--brand-emergency-blue)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', color: 'var(--text-secondary)' }}>
                    <span>72-Hour Cumulative Storm</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{rainfall?.['72h_mm']?.toFixed(1) ?? '0.0'} mm</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, ((rainfall?.['72h_mm'] ?? 0) / 350) * 100)}%`, height: '100%', backgroundColor: 'var(--brand-deep-ocean)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. River Stage Threshold Gauge */}
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: 'var(--brand-deep-ocean)' }}>
                  <Droplets size={15} style={{ color: 'var(--brand-water-cyan)' }} />
                  River Gauge Status
                </div>
                <Badge variant={isDanger ? 'critical' : isWarning ? 'high' : 'low'}>
                  {waterLevel?.status || 'NORMAL'}
                </Badge>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                <div>Station: <strong>{waterLevel?.gauge_station_id || 'GAUGE-STN-01'}</strong> ({waterLevel?.river_name || 'Basin Channel'})</div>
                <div style={{ marginTop: '4px', fontSize: '16px', fontWeight: 750, color: isDanger ? 'var(--risk-critical)' : isWarning ? 'var(--risk-high)' : 'var(--brand-deep-ocean)' }}>
                  {currentLevel.toFixed(2)} m
                  <span style={{ fontSize: '11.5px', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px' }}>
                    (Warning: {warningLevel.toFixed(2)}m | Danger: {dangerLevel.toFixed(2)}m)
                  </span>
                </div>
              </div>

              {/* Threshold Progress Bar */}
              <div style={{ position: 'relative', width: '100%', height: '12px', backgroundColor: 'var(--border-subtle)', borderRadius: '6px', overflow: 'hidden', marginTop: '6px' }}>
                <div
                  style={{
                    width: `${gaugePercent}%`,
                    height: '100%',
                    backgroundColor: isDanger ? 'var(--risk-critical)' : isWarning ? 'var(--risk-high)' : 'var(--risk-low)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>0.0m Baseline</span>
                <span style={{ color: 'var(--risk-high)' }}>▲ {warningLevel.toFixed(1)}m Warning</span>
                <span style={{ color: 'var(--risk-critical)' }}>▲ {dangerLevel.toFixed(1)}m Danger</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default EnvironmentalTelemetryCard;
