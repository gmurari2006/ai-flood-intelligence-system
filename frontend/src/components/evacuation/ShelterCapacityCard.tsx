/**
 * AI Flood Intelligence System — Shelter Capacity Card.
 * Displays real-time aggregate shelter capacity, registered occupancy,
 * and generator backup power availability.
 */

import React from 'react';
import { Zap, ShieldCheck } from 'lucide-react';
import { useEvacuation } from '../../context/EvacuationContext';
import Card from '../common/Card';
import Badge from '../common/Badge';
import LoadingSkeleton from '../common/LoadingSkeleton';

export const ShelterCapacityCard: React.FC = () => {
  const { shelters, isLoadingShelters, totalShelters } = useEvacuation();

  if (isLoadingShelters) {
    return (
      <Card
        categoryLabel="EVACUATION LOGISTICS"
        categoryColor="var(--cat-evac)"
        title="Loading Shelter Logistics..."
        subtitle="Querying Municipal Designated Safe Havens"
        borderAccent="evac"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <LoadingSkeleton count={3} height="36px" />
        </div>
      </Card>
    );
  }

  const totalMaxCapacity = shelters.reduce((sum, s) => sum + s.max_capacity, 0);
  const totalOccupancy = shelters.reduce((sum, s) => sum + s.current_occupancy, 0);
  const totalAvailable = shelters.reduce((sum, s) => sum + s.available_capacity, 0);
  const backupPowerCount = shelters.filter((s) => s.has_backup_power).length;
  const occupancyPercent = totalMaxCapacity > 0 ? (totalOccupancy / totalMaxCapacity) * 100 : 0;

  return (
    <Card
      categoryLabel="EVACUATION CAPACITY &amp; SAFE HAVENS"
      categoryColor="var(--cat-evac)"
      title="Regional Shelter Capacity Overview"
      subtitle={`${totalShelters} Active Shelters Monitored`}
      borderAccent="evac"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
        {/* Metric Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            padding: '12px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Available Capacity</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-deep-ocean)', marginTop: '2px' }}>
              {totalAvailable.toLocaleString()}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Remaining Safe Slots
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Current Occupancy</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {totalOccupancy.toLocaleString()} / {totalMaxCapacity.toLocaleString()}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {occupancyPercent.toFixed(1)}% Full
            </div>
          </div>
        </div>

        {/* Visual Capacity Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>Aggregate Capacity Fill Rate</span>
            <span>{occupancyPercent.toFixed(1)}%</span>
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'var(--border-default)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(0, occupancyPercent))}%`,
                height: '100%',
                backgroundColor: occupancyPercent > 85 ? 'var(--risk-critical)' : 'var(--cat-evac)',
                borderRadius: '3px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Facilities Status Tags */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', borderTop: '1px solid var(--border-default)', paddingTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            <Zap size={13} style={{ color: 'var(--risk-moderate)' }} />
            <span>Backup Generator Power: <strong>{backupPowerCount} / {totalShelters} Shelters</strong></span>
          </div>
          <Badge variant="low">
            <ShieldCheck size={11} style={{ marginRight: '4px' }} />
            ACTIVE HUBS
          </Badge>
        </div>
      </div>
    </Card>
  );
};

export default ShelterCapacityCard;
