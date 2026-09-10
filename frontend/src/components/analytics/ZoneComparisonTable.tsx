/**
 * AI Flood Intelligence System — Zone Comparison Matrix Component.
 * Displays authoritative PostGIS baseline parameters from GET /api/v1/zones
 * with strict data honesty and zero fabricated rankings.
 */

import React from 'react';
import { MapPin, Mountain, Gauge, Compass, Info } from 'lucide-react';
import { useZone } from '../../context/ZoneContext';
import Card from '../common/Card';

export const ZoneComparisonTable: React.FC = () => {
  const { zones, selectedZone, selectZone, isLoadingZones } = useZone();

  return (
    <Card
      categoryLabel="GEOGRAPHIC ZONE INTELLIGENCE"
      categoryColor="var(--cat-gis)"
      title="Regional Hydrological Baseline Comparison"
      subtitle="Authoritative PostGIS Physical & Geographic Zone Parameters"
      borderAccent="env"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
        {isLoadingZones ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading geographic baseline data...
          </div>
        ) : zones.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-secondary)' }}>INSUFFICIENT DATA</div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>No geographic zones cataloged in database.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '8px 10px', fontWeight: 650 }}>Zone ID &amp; Name</th>
                  <th style={{ padding: '8px 10px', fontWeight: 650 }}>Mean Elevation</th>
                  <th style={{ padding: '8px 10px', fontWeight: 650 }}>Drainage Capacity</th>
                  <th style={{ padding: '8px 10px', fontWeight: 650 }}>Centroid (Lat, Lng)</th>
                  <th style={{ padding: '8px 10px', fontWeight: 650 }}>Focus Zone</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => {
                  const isSelected = selectedZone?.id === z.id;
                  return (
                    <tr
                      key={z.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? 'var(--bg-surface-blue)' : 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '10px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={13} style={{ color: isSelected ? 'var(--brand-emergency-blue)' : 'var(--text-muted)' }} />
                          <span>{z.name}</span>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>({z.id})</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 10px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mountain size={12} style={{ color: 'var(--brand-water-cyan)' }} />
                          <span>{z.elevation_mean_m !== undefined && z.elevation_mean_m !== null ? `${z.elevation_mean_m.toFixed(1)} m` : 'N/A'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 10px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Gauge size={12} style={{ color: 'var(--cat-env)' }} />
                          <span>{z.drainage_capacity_score !== undefined && z.drainage_capacity_score !== null ? `${z.drainage_capacity_score.toFixed(1)} / 10` : 'N/A'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 10px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Compass size={12} style={{ color: 'var(--brand-emergency-blue)' }} />
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                            {z.centroid ? `${z.centroid.latitude.toFixed(3)}, ${z.centroid.longitude.toFixed(3)}` : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <button
                          type="button"
                          onClick={() => selectZone(z.id)}
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-default)',
                            backgroundColor: isSelected ? 'var(--brand-emergency-blue)' : 'var(--bg-app)',
                            color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                            cursor: 'pointer',
                          }}
                        >
                          {isSelected ? 'Active Filter' : 'Select Zone'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
          <Info size={12} />
          <span>PostGIS baseline attributes represent immutable physical records. Zero synthetic rankings computed.</span>
        </div>
      </div>
    </Card>
  );
};

export default ZoneComparisonTable;
