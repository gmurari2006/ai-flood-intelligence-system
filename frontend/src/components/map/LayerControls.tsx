import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp, Check, ShieldAlert, Waves, CloudRain, Route, Shield } from 'lucide-react';
import { LayerConfig, LayerId, LayerAvailabilityState } from '../../types/gis';

interface LayerControlsProps {
  layers: LayerConfig[];
  featureCounts: Record<LayerId, number>;
  onToggleLayer: (layerId: LayerId) => void;
  className?: string;
}

export const LayerControls: React.FC<LayerControlsProps> = ({
  layers,
  featureCounts,
  onToggleLayer,
  className = '',
}) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const getLayerIcon = (id: LayerId) => {
    switch (id) {
      case 'risk_zones':
        return <Shield size={14} style={{ color: 'var(--brand-deep-ocean)' }} />;
      case 'infrastructure':
        return <ShieldAlert size={14} style={{ color: 'var(--cat-infra)' }} />;
      case 'river_lines':
        return <Waves size={14} style={{ color: 'var(--brand-emergency-blue)' }} />;
      case 'rainfall_heatmap':
        return <CloudRain size={14} style={{ color: 'var(--cat-env)' }} />;
      case 'evacuation_routes':
        return <Route size={14} style={{ color: 'var(--cat-evac)' }} />;
    }
  };

  const renderStatusBadge = (status: LayerAvailabilityState, count: number) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="layer-status-pill available" title={`${count} vector features loaded`}>
            ● AVAILABLE {count > 0 ? `(${count})` : ''}
          </span>
        );
      case 'NO_DATA':
        return (
          <span className="layer-status-pill no-data" title="Endpoint responded with 0 features">
            ○ NO DATA
          </span>
        );
      case 'UNAVAILABLE':
        return (
          <span className="layer-status-pill unavailable" title="Subsystem not configured in current phase">
            ⚠ NOT CONFIGURED
          </span>
        );
      case 'ERROR':
        return (
          <span className="layer-status-pill error" title="Failed to fetch vector layer">
            ⚠ ERROR
          </span>
        );
    }
  };

  return (
    <div className={`map-layer-controls ${className}`} role="region" aria-label="GIS Vector Layer Controls">
      <div
        className="map-layer-controls-header"
        onClick={() => setCollapsed(!collapsed)}
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SlidersHorizontal size={13} style={{ color: 'var(--brand-emergency-blue)' }} />
          <span className="eyebrow-label" style={{ color: 'var(--brand-deep-ocean)', fontSize: '10.5px' }}>
            VECTOR GIS LAYERS
          </span>
        </div>
        <button
          className="btn btn-ghost btn-xs"
          style={{ padding: '2px', height: 'auto', minHeight: 0 }}
          aria-label={collapsed ? 'Expand Layer Controls' : 'Collapse Layer Controls'}
        >
          {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {!collapsed && (
        <div className="map-layer-controls-body">
          <ul className="layer-controls-list" role="list">
            {layers.map((layer) => {
              const isInteractable = layer.status === 'AVAILABLE' || layer.status === 'NO_DATA';
              const count = featureCounts[layer.id] || 0;

              return (
                <li key={layer.id} className={`layer-control-item ${!isInteractable ? 'disabled' : ''}`}>
                  <label className="layer-control-label">
                    <div className="layer-checkbox-wrap">
                      <input
                        type="checkbox"
                        checked={layer.enabled && isInteractable}
                        disabled={!isInteractable}
                        onChange={() => onToggleLayer(layer.id)}
                        aria-label={`Toggle ${layer.label} Layer`}
                      />
                      <span className={`custom-checkbox ${layer.enabled && isInteractable ? 'checked' : ''}`}>
                        {layer.enabled && isInteractable && <Check size={11} />}
                      </span>
                    </div>

                    <div className="layer-info-wrap">
                      <div className="layer-title-row">
                        <span className="layer-icon">{getLayerIcon(layer.id)}</span>
                        <span className="layer-name">{layer.label}</span>
                      </div>
                      <span className="layer-desc">{layer.description}</span>
                    </div>
                  </label>

                  <div className="layer-status-wrap">
                    {renderStatusBadge(layer.status, count)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LayerControls;
