import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface MapLegendProps {
  className?: string;
}

export const MapLegend: React.FC<MapLegendProps> = ({ className = '' }) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);

  return (
    <div className={`map-legend-card ${className}`} role="region" aria-label="Map Legend">
      <div
        className="map-legend-header"
        onClick={() => setCollapsed(!collapsed)}
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={13} style={{ color: 'var(--brand-emergency-blue)' }} />
          <span className="eyebrow-label" style={{ color: 'var(--brand-deep-ocean)', fontSize: '10.5px' }}>
            MAP LEGEND &amp; RISK SCALE
          </span>
        </div>
        <button
          className="btn btn-ghost btn-xs"
          style={{ padding: '2px', height: 'auto', minHeight: 0 }}
          aria-label={collapsed ? 'Expand Legend' : 'Collapse Legend'}
        >
          {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {!collapsed && (
        <div className="map-legend-body">
          {/* 1. Risk Severity Tiers */}
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            FLOOD RISK SEVERITY
          </div>
          <div className="map-legend-scale">
            <div className="map-legend-tier">
              <span className="legend-swatch" style={{ backgroundColor: 'var(--risk-low)' }} />
              <div className="legend-tier-text">
                <span className="tier-name">LOW [0–29.9]</span>
                <span className="tier-desc">Advisory / Safe</span>
              </div>
            </div>
            <div className="map-legend-tier">
              <span className="legend-swatch" style={{ backgroundColor: 'var(--risk-moderate)' }} />
              <div className="legend-tier-text">
                <span className="tier-name">MODERATE [30–54.9]</span>
                <span className="tier-desc">Watch / Alert</span>
              </div>
            </div>
            <div className="map-legend-tier">
              <span className="legend-swatch" style={{ backgroundColor: 'var(--risk-high)' }} />
              <div className="legend-tier-text">
                <span className="tier-name">HIGH [55–74.9]</span>
                <span className="tier-desc">Warning Stage</span>
              </div>
            </div>
            <div className="map-legend-tier">
              <span className="legend-swatch" style={{ backgroundColor: 'var(--risk-critical)' }} />
              <div className="legend-tier-text">
                <span className="tier-name">CRITICAL [75–100]</span>
                <span className="tier-desc">Evacuation Stage</span>
              </div>
            </div>
          </div>

          {/* 2. Vector Layer Marker Symbols */}
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '10px', marginBottom: '6px', borderTop: '1px solid var(--border-default)', paddingTop: '8px' }}>
            SPATIAL ASSETS &amp; TELEMETRY
          </div>
          <div className="map-legend-symbols">
            <div className="legend-symbol-row">
              <span className="legend-icon-badge" style={{ backgroundColor: 'var(--cat-infra-bg)', color: 'var(--cat-infra)' }}>
                🏥
              </span>
              <span>Critical Infrastructure (Hospital / Grid / Shelter)</span>
            </div>
            <div className="legend-symbol-row">
              <span className="legend-icon-badge" style={{ backgroundColor: 'var(--bg-surface-blue)', color: 'var(--brand-emergency-blue)' }}>
                💧
              </span>
              <span>River Stage Gauges (Warning &amp; Danger Levels)</span>
            </div>
            <div className="legend-symbol-row">
              <span className="legend-icon-badge" style={{ backgroundColor: 'var(--cat-env-bg)', color: 'var(--cat-env)' }}>
                🌧️
              </span>
              <span>Rainfall Ingestion Centroids (1h/6h/24h)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLegend;
