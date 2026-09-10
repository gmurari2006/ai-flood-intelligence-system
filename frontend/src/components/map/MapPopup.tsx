/**
 * Standardized Leaflet Popup HTML Generators.
 * Renders verified backend attributes matching Document 05 Section 6.1.
 */

import {
  RiskZoneProperties,
  InfrastructureProperties,
  RiverGaugeProperties,
  RainfallProperties,
} from '../../types/gis';

export const createZonePopupContent = (props: RiskZoneProperties): string => {
  const riskColor = props.risk_color || '#10B981';
  const riskLevel = props.risk_level || 'LOW';
  const elev = props.elevation_mean_m !== undefined ? `${props.elevation_mean_m.toFixed(1)}m` : 'N/A';
  const drainage = props.drainage_capacity_score !== null && props.drainage_capacity_score !== undefined
    ? `${props.drainage_capacity_score.toFixed(2)}`
    : 'Not Recorded';
  const pop = props.population_density !== null && props.population_density !== undefined
    ? `${props.population_density.toLocaleString()}/km²`
    : 'Not Recorded';
  const floodProb = `${(props.flood_probability * 100).toFixed(1)}%`;
  const waterDepth = `${props.water_depth_m.toFixed(2)}m`;

  return `
    <div class="leaflet-popup-card">
      <div class="leaflet-popup-header">
        <div class="leaflet-popup-tag">GEOGRAPHIC ZONE</div>
        <div class="leaflet-popup-title">${props.zone_name || props.zone_id}</div>
      </div>
      <div class="leaflet-popup-body">
        <div class="leaflet-popup-badge-row">
          <span class="leaflet-popup-badge" style="background-color: ${riskColor}15; color: ${riskColor}; border-color: ${riskColor}40;">
            ● ${riskLevel} RISK
          </span>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">ID: ${props.zone_id}</span>
        </div>
        <div class="leaflet-popup-grid">
          <div class="leaflet-popup-metric">
            <span class="metric-label">Mean Elevation</span>
            <span class="metric-value">${elev}</span>
          </div>
          <div class="leaflet-popup-metric">
            <span class="metric-label">Drainage Capacity</span>
            <span class="metric-value">${drainage}</span>
          </div>
          <div class="leaflet-popup-metric">
            <span class="metric-label">Population Density</span>
            <span class="metric-value">${pop}</span>
          </div>
          <div class="leaflet-popup-metric">
            <span class="metric-label">Flood Probability</span>
            <span class="metric-value" style="color: ${riskColor}; font-weight: 750;">${floodProb}</span>
          </div>
          <div class="leaflet-popup-metric">
            <span class="metric-label">Predicted Depth</span>
            <span class="metric-value" style="color: ${riskColor}; font-weight: 750;">${waterDepth}</span>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const createInfrastructurePopupContent = (props: InfrastructureProperties): string => {
  const isCritical = props.vulnerability_status === 'CRITICAL';
  const isAtRisk = props.vulnerability_status === 'AT_RISK';
  const statusColor = isCritical ? '#EF4444' : isAtRisk ? '#F97316' : '#10B981';
  const depth = props.estimated_water_depth_m !== undefined ? `${props.estimated_water_depth_m.toFixed(2)}m` : '0.00m';
  const elev = props.elevation_m !== undefined ? `${props.elevation_m.toFixed(1)}m` : 'N/A';
  const cap = props.capacity !== null && props.capacity !== undefined ? `${props.capacity.toLocaleString()}` : 'N/A';

  return `
    <div class="leaflet-popup-card">
      <div class="leaflet-popup-header">
        <div class="leaflet-popup-tag">CRITICAL INFRASTRUCTURE</div>
        <div class="leaflet-popup-title">${props.name}</div>
      </div>
      <div class="leaflet-popup-body">
        <div class="leaflet-popup-badge-row">
          <span class="leaflet-popup-badge" style="background-color: ${statusColor}15; color: ${statusColor}; border-color: ${statusColor}40;">
            ● ${props.vulnerability_status}
          </span>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Type: ${props.asset_type}</span>
        </div>
        <div class="leaflet-popup-grid">
          <div class="leaflet-popup-metric">
            <span class="metric-label">Base Elevation</span>
            <span class="metric-value">${elev}</span>
          </div>
          <div class="leaflet-popup-metric">
            <span class="metric-label">Estimated Water Depth</span>
            <span class="metric-value" style="color: ${statusColor}; font-weight: 750;">${depth}</span>
          </div>
          <div class="leaflet-popup-metric">
            <span class="metric-label">Service Capacity</span>
            <span class="metric-value">${cap}</span>
          </div>
          <div class="leaflet-popup-metric">
            <span class="metric-label">Zone ID</span>
            <span class="metric-value">${props.zone_id}</span>
          </div>
        </div>
        ${
          props.recommended_protection
            ? `
          <div style="margin-top: 8px; padding: 6px 8px; background-color: var(--bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--border-default); font-size: 11.5px; color: var(--text-secondary);">
            <strong style="color: var(--text-primary);">SOP Mitigation:</strong> ${props.recommended_protection}
          </div>
        `
            : ''
        }
      </div>
    </div>
  `;
};

export const createRiverGaugePopupContent = (props: RiverGaugeProperties): string => {
  const isDanger = props.water_level_m >= props.danger_level_m;
  const isWarning = props.water_level_m >= props.warning_level_m;
  const statusColor = isDanger ? '#EF4444' : isWarning ? '#F97316' : '#10B981';
  const statusLabel = isDanger ? 'DANGER STAGE' : isWarning ? 'WARNING STAGE' : 'NORMAL STAGE';
  const discharge = props.discharge_rate_m3s !== null && props.discharge_rate_m3s !== undefined
    ? `${props.discharge_rate_m3s.toFixed(1)} m³/s`
    : 'N/A';
  const observedAt = props.observed_at ? new Date(props.observed_at).toUTCString().substring(17, 22) + ' UTC' : 'Recent';

  return `
    <div class="leaflet-popup-card">
      <div class="leaflet-popup-header">
        <div class="leaflet-popup-tag">RIVER GAUGE STATION</div>
        <div class="leaflet-popup-title">${props.river_name} (${props.gauge_station_id})</div>
      </div>
      <div class="leaflet-popup-body">
        <div class="leaflet-popup-badge-row">
          <span class="leaflet-popup-badge" style="background-color: ${statusColor}15; color: ${statusColor}; border-color: ${statusColor}40;">
            ● ${statusLabel}
          </span>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Time: ${observedAt}</span>
        </div>
        <div class="leaflet-popup-grid">
          <div class="leaflet-popup-metric">
            <span class="metric-label">Current Water Level</span>
            <span class="metric-value" style="color: ${statusColor}; font-weight: 800; font-size: 13.5px;">${props.water_level_m.toFixed(2)}m</span>
          </div>
          <div class="leaflet-popup-metric">
            <span class="metric-label">Warning Threshold</span>
            <span class="metric-value">${props.warning_level_m.toFixed(2)}m</span>
          </div>
          <div class="leaflet-popup-metric">
            <span class="metric-label">Danger Threshold</span>
            <span class="metric-value" style="color: #EF4444; font-weight: 700;">${props.danger_level_m.toFixed(2)}m</span>
          </div>
          <div class="leaflet-popup-metric">
            <span class="metric-label">Discharge Rate</span>
            <span class="metric-value">${discharge}</span>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const createRainfallPopupContent = (props: RainfallProperties): string => {
  const observedAt = props.observed_at ? new Date(props.observed_at).toUTCString().substring(17, 22) + ' UTC' : 'Recent';
  const r1h = `${props.rainfall_1h_mm.toFixed(1)} mm`;
  const r6h = `${props.rainfall_6h_mm.toFixed(1)} mm`;
  const r24h = `${props.rainfall_24h_mm.toFixed(1)} mm`;

  return `
    <div class="leaflet-popup-card">
      <div class="leaflet-popup-header">
        <div class="leaflet-popup-tag">RAINFALL OBSERVATION</div>
        <div class="leaflet-popup-title">Zone Telemetry: ${props.zone_id}</div>
      </div>
      <div class="leaflet-popup-body">
        <div class="leaflet-popup-badge-row">
          <span class="leaflet-popup-badge" style="background-color: var(--cat-env-bg); color: var(--cat-env); border-color: var(--cat-env-border);">
            ● PRECIPITATION GAUGE
          </span>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Time: ${observedAt}</span>
        </div>
        <div class="leaflet-popup-grid">
          <div class="leaflet-popup-metric">
            <span class="metric-label">1-Hour Acc.</span>
            <span class="metric-value">${r1h}</span>
          </div>
          <div class="leaflet-popup-metric">
            <span class="metric-label">6-Hour Acc.</span>
            <span class="metric-value">${r6h}</span>
          </div>
          <div class="leaflet-popup-metric">
            <span class="metric-label">24-Hour Acc.</span>
            <span class="metric-value" style="font-weight: 750; color: var(--cat-env);">${r24h}</span>
          </div>
        </div>
      </div>
    </div>
  `;
};
