import React from 'react';
import { Database, Cpu, Radio, Globe2 } from 'lucide-react';
import { SystemHealth, HealthState } from '../../types';
import StatusIndicator from '../common/StatusIndicator';

interface StatusBarProps {
  health: SystemHealth | null;
  healthState: HealthState;
}

export const StatusBar: React.FC<StatusBarProps> = ({ health, healthState }) => {
  const isHealthy = healthState === 'operational';
  const isConnecting = healthState === 'connecting';
  const isUnavailable = healthState === 'unavailable';

  const dbStatus = health?.database?.status === 'CONNECTED'
    ? 'PostGIS (EPSG:4326)'
    : (isConnecting ? 'Connecting...' : (isUnavailable ? 'Unavailable' : 'PostGIS (EPSG:4326)'));

  const inferenceMode = health?.ai_engine?.status === 'READY'
    ? (health?.ai_engine?.active_model || 'Deterministic Hydrological Heuristic')
    : (isConnecting ? 'Connecting...' : 'Deterministic Hydrological Heuristic');

  const telemetryStatus = health?.weather_stream?.status === 'ACTIVE'
    ? 'Stream Active'
    : (isConnecting ? 'Connecting...' : (isUnavailable ? 'Unavailable' : 'Ready / Standby'));

  const latency = health?.database?.latency_ms
    ? `${health.database.latency_ms}ms`
    : (isHealthy ? '< 15ms' : '-- ms');

  return (
    <footer className="app-statusbar" role="contentinfo">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Spatial Database State */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Database size={12} style={{ color: 'var(--accent-primary)' }} />
          <span>Spatial DB:</span>
          <span style={{ color: 'var(--text-secondary)' }}>{dbStatus}</span>
        </div>

        {/* Dynamic Inference Engine Mode State */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={12} style={{ color: 'var(--status-heuristic)' }} />
          <span>Inference Engine:</span>
          <span style={{ color: 'var(--status-heuristic)' }}>{inferenceMode}</span>
        </div>

        {/* Spatial Coordinate System */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Globe2 size={12} style={{ color: 'var(--text-muted)' }} />
          <span>CRS:</span>
          <span style={{ color: 'var(--text-secondary)' }}>EPSG:4326 / WGS 84</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Stream Ingestion State */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Radio size={12} style={{ color: isHealthy ? 'var(--status-healthy)' : (isConnecting ? 'var(--status-heuristic)' : 'var(--text-muted)') }} />
          <span>TELEMETRY:</span>
          <span style={{ color: 'var(--text-secondary)' }}>{telemetryStatus}</span>
        </div>

        {/* Latency & Pulse */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <StatusIndicator status={isHealthy ? 'healthy' : (isConnecting ? 'standby' : 'offline')} size="sm" />
          <span className="font-mono">{latency}</span>
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;
