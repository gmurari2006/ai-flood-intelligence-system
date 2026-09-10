/**
 * AI Flood Intelligence System — Evacuation Route Planner Console.
 * Configures origin coordinates, target shelter, flood avoidance options,
 * and triggers safe evacuation path calculation.
 */

import React from 'react';
import { Navigation, RefreshCw, Shield } from 'lucide-react';
import { useEvacuation } from '../../context/EvacuationContext';
import Button from '../common/Button';

export const RoutePlannerConsole: React.FC = () => {
  const {
    shelters,
    selectedShelter,
    setSelectedShelter,
    originLat,
    originLon,
    setOriginLat,
    setOriginLon,
    avoidFloodZones,
    setAvoidFloodZones,
    planRoute,
    isPlanningRoute,
  } = useEvacuation();

  const handleExecutePlan = () => {
    planRoute();
  };

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
          <div className="eyebrow-label" style={{ color: 'var(--cat-evac)' }}>
            DISASTER MOBILITY ROUTING
          </div>
          <h2 style={{ fontSize: '15px', fontWeight: 750, color: 'var(--text-primary)', margin: 0 }}>
            Safe Corridor Pathfinding Planner
          </h2>
        </div>
      </div>

      {/* Inputs Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(140px, 1fr) minmax(140px, 1fr) minmax(200px, 1.5fr) auto',
          gap: 'var(--space-3)',
          alignItems: 'flex-end',
        }}
        className="route-planner-grid"
      >
        {/* Origin Latitude */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            ORIGIN LATITUDE (°N)
          </label>
          <input
            type="number"
            step="0.0001"
            value={originLat}
            onChange={(e) => setOriginLat(parseFloat(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '12px',
              fontWeight: 650,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              backgroundColor: '#FFFFFF',
            }}
            aria-label="Evacuation origin latitude"
          />
        </div>

        {/* Origin Longitude */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            ORIGIN LONGITUDE (°E)
          </label>
          <input
            type="number"
            step="0.0001"
            value={originLon}
            onChange={(e) => setOriginLon(parseFloat(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '12px',
              fontWeight: 650,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              backgroundColor: '#FFFFFF',
            }}
            aria-label="Evacuation origin longitude"
          />
        </div>

        {/* Destination Shelter Dropdown */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            DESTINATION SHELTER
          </label>
          <select
            value={selectedShelter?.id || ''}
            onChange={(e) => {
              const target = shelters.find((s) => s.id === e.target.value) || null;
              setSelectedShelter(target);
            }}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '12px',
              fontWeight: 650,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              backgroundColor: '#FFFFFF',
            }}
            aria-label="Select target destination shelter"
          >
            <option value="">Auto-Assign Nearest Available Shelter</option>
            {shelters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.available_capacity} slots)
              </option>
            ))}
          </select>
        </div>

        {/* Action Button & Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={avoidFloodZones}
              onChange={(e) => setAvoidFloodZones(e.target.checked)}
            />
            <Shield size={12} style={{ color: 'var(--cat-evac)' }} />
            <span>Avoid Flooded Corridors</span>
          </label>

          <Button
            variant="primary"
            size="md"
            onClick={handleExecutePlan}
            isLoading={isPlanningRoute}
            icon={isPlanningRoute ? <RefreshCw size={13} className="spinner-border" /> : <Navigation size={13} />}
          >
            {isPlanningRoute ? 'Computing...' : 'Calculate Safe Route'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoutePlannerConsole;
