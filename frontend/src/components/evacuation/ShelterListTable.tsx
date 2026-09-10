/**
 * AI Flood Intelligence System — Shelter List Table.
 * Renders directory of designated evacuation shelters, occupancy,
 * PostGIS distance from origin, and route selection triggers.
 */

import React from 'react';
import { 
  Landmark, 
  MapPin, 
  Zap, 
  Navigation, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { useEvacuation } from '../../context/EvacuationContext';
import Badge from '../common/Badge';
import Button from '../common/Button';
import LoadingSkeleton from '../common/LoadingSkeleton';

export const ShelterListTable: React.FC = () => {
  const {
    shelters,
    isLoadingShelters,
    sheltersError,
    selectedShelter,
    setSelectedShelter,
    planRoute,
    isPlanningRoute,
    fetchShelters,
  } = useEvacuation();

  const handleSelectAndRoute = (shelterId: string) => {
    const target = shelters.find((s) => s.id === shelterId) || null;
    setSelectedShelter(target);
    planRoute(shelterId);
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
            DESIGNATED SAFE HAVENS
          </div>
          <h2 style={{ fontSize: '15px', fontWeight: 750, color: 'var(--text-primary)', margin: 0 }}>
            Operational Shelter Directory
          </h2>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Total Registered: <strong>{shelters.length} Hubs</strong>
        </div>
      </div>

      {isLoadingShelters && (
        <div style={{ marginTop: 'var(--space-2)' }}>
          <LoadingSkeleton count={4} height="40px" />
        </div>
      )}

      {sheltersError && !isLoadingShelters && (
        <div style={{ padding: '16px', backgroundColor: 'var(--risk-critical-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--risk-critical-border)', textAlign: 'center' }}>
          <AlertCircle size={24} style={{ color: 'var(--risk-critical)', margin: '0 auto 6px auto' }} />
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--risk-critical)' }}>
            Failed to Retrieve Evacuation Shelters
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {sheltersError}
          </p>
          <Button variant="secondary" size="sm" onClick={fetchShelters} style={{ marginTop: '8px' }}>
            Retry
          </Button>
        </div>
      )}

      {!isLoadingShelters && !sheltersError && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-default)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px', fontWeight: 700 }}>SHELTER NAME</th>
                <th style={{ padding: '8px', fontWeight: 700 }}>ADDRESS</th>
                <th style={{ padding: '8px', fontWeight: 700 }}>AVAILABLE / TOTAL</th>
                <th style={{ padding: '8px', fontWeight: 700 }}>DISTANCE</th>
                <th style={{ padding: '8px', fontWeight: 700 }}>BACKUP POWER</th>
                <th style={{ padding: '8px', fontWeight: 700, textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {shelters.map((shelter) => {
                const isSelected = selectedShelter?.id === shelter.id;
                const distanceKm = shelter.distance_meters !== null ? (shelter.distance_meters / 1000).toFixed(2) : null;

                return (
                  <tr
                    key={shelter.id}
                    style={{
                      borderBottom: '1px solid var(--border-default)',
                      backgroundColor: isSelected ? 'var(--cat-evac-bg)' : 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '8px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Landmark size={14} style={{ color: 'var(--cat-evac)' }} />
                        <span>{shelter.name}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '20px' }}>
                        {shelter.id}
                      </div>
                    </td>

                    <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                        <span>{shelter.address}</span>
                      </div>
                    </td>

                    <td style={{ padding: '8px', fontWeight: 750, color: shelter.available_capacity > 0 ? 'var(--brand-deep-ocean)' : 'var(--risk-critical)' }}>
                      {shelter.available_capacity.toLocaleString()} / {shelter.max_capacity.toLocaleString()} Slots
                    </td>

                    <td style={{ padding: '8px', color: 'var(--text-primary)', fontWeight: 650 }}>
                      {distanceKm ? `${distanceKm} km` : 'Proximity Baseline'}
                    </td>

                    <td style={{ padding: '8px' }}>
                      {shelter.has_backup_power ? (
                        <Badge variant="low">
                          <Zap size={10} style={{ marginRight: '3px' }} />
                          GENERATOR READY
                        </Badge>
                      ) : (
                        <Badge variant="neutral">
                          MAINS GRID ONLY
                        </Badge>
                      )}
                    </td>

                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleSelectAndRoute(shelter.id)}
                        disabled={isPlanningRoute}
                        className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                        title="Calculate safe corridor to this shelter"
                      >
                        <Navigation size={11} style={{ marginRight: '4px' }} />
                        {isSelected ? 'Selected' : 'Route Here'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {shelters.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <ShieldCheck size={24} style={{ margin: '0 auto 6px auto', color: 'var(--text-muted)' }} />
                    <div style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-primary)' }}>
                      No Evacuation Shelters Registered
                    </div>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      No active evacuation shelters match the search parameters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ShelterListTable;
