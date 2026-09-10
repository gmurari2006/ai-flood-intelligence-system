/**
 * AI Flood Intelligence System — AI Prediction Console Component.
 * Enables zone selection, forecast horizon configuration, and dynamic prediction execution.
 */

import React from 'react';
import { Play, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { useZone } from '../../context/ZoneContext';
import { usePrediction } from '../../context/PredictionContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import Badge from '../common/Badge';

const HORIZONS = [
  { value: 1, label: '1h Horizon', desc: 'Immediate flash flood risk' },
  { value: 6, label: '6h Horizon', desc: 'Standard operational window' },
  { value: 12, label: '12h Horizon', desc: 'Extended tactical forecast' },
  { value: 24, label: '24h Horizon', desc: 'Full-day strategic lead time' },
];

export const PredictionConsole: React.FC = () => {
  const { zones, selectedZoneId, selectZone, isLoadingZones } = useZone();
  const { 
    selectedHorizon, 
    setSelectedHorizon, 
    triggerPrediction, 
    isPredicting, 
    currentPrediction,
    provenance 
  } = usePrediction();
  const { isAuthenticated, user } = useAuth();

  const handleExecute = () => {
    triggerPrediction(selectedZoneId || undefined, selectedHorizon);
  };

  const isPublicOrGuest = !isAuthenticated || user?.role === 'PUBLIC_USER';

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        padding: 'var(--space-4)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div className="eyebrow-label" style={{ color: 'var(--cat-ai)' }}>
            PREDICTION CONTROL CONSOLE
          </div>
          <h2 style={{ fontSize: '15px', fontWeight: 750, color: 'var(--text-primary)', margin: 0 }}>
            Run Environmental Risk Assessment
          </h2>
        </div>

        {provenance === 'LIVE_PREDICTION_RUN' && currentPrediction && (
          <Badge variant="heuristic">
            <Clock size={11} style={{ marginRight: '4px' }} />
            RUN ID: {currentPrediction.prediction_run_id.slice(0, 8)}...
          </Badge>
        )}
      </div>

      {/* Public / Unauthenticated Notice Banner */}
      {isPublicOrGuest && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--cat-env-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--cat-env-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          <AlertTriangle size={15} style={{ color: 'var(--brand-emergency-blue)', flexShrink: 0 }} />
          <span>
            Operating in public viewing mode. Disaster Officer authentication is required for full operational control.
          </span>
        </div>
      )}

      {/* Control Grid: Zone Selector & Horizon Selector & Action Button */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(180px, 1fr) auto minmax(160px, auto)',
          gap: 'var(--space-3)',
          alignItems: 'center',
        }}
        className="prediction-controls-grid"
      >
        {/* Zone Dropdown */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            TARGET BASIN
          </label>
          <select
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', padding: '6px 10px', fontSize: '12.5px', fontWeight: 600, backgroundColor: '#FFFFFF' }}
            value={selectedZoneId || ''}
            onChange={(e) => selectZone(e.target.value)}
            disabled={isLoadingZones || isPredicting}
            aria-label="Select Target Geographic Basin"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name} ({z.id})
              </option>
            ))}
            {zones.length === 0 && <option value="">No Basins Available</option>}
          </select>
        </div>

        {/* Horizon Pill Group */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            FORECAST HORIZON (H)
          </label>
          <div style={{ display: 'flex', gap: '4px' }} role="radiogroup" aria-label="Forecast Lead Time Horizon">
            {HORIZONS.map((h) => {
              const active = selectedHorizon === h.value;
              return (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => setSelectedHorizon(h.value)}
                  disabled={isPredicting}
                  style={{
                    padding: '5px 10px',
                    fontSize: '11.5px',
                    fontWeight: active ? 750 : 600,
                    borderRadius: 'var(--radius-sm)',
                    border: active ? '1px solid var(--cat-ai)' : '1px solid var(--border-default)',
                    backgroundColor: active ? 'var(--cat-ai-bg)' : '#FFFFFF',
                    color: active ? 'var(--cat-ai)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title={h.desc}
                  aria-checked={active}
                  role="radio"
                >
                  {h.value}h
                </button>
              );
            })}
          </div>
        </div>

        {/* Trigger Button */}
        <div style={{ alignSelf: 'flex-end' }}>
          <Button
            variant="primary"
            size="md"
            onClick={handleExecute}
            isLoading={isPredicting}
            disabled={!selectedZoneId || isLoadingZones}
            icon={isPredicting ? <RefreshCw size={14} className="spinner-border" /> : <Play size={14} />}
            title="Execute physical hydrological risk assessment for selected horizon"
          >
            {isPredicting ? 'Evaluating Risk...' : 'Run AI Prediction'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PredictionConsole;
