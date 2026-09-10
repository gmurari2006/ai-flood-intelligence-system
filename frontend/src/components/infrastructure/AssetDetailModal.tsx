/**
 * AI Flood Intelligence System — Infrastructure Asset Detail Modal.
 * Displays facility engineering mitigation directives, elevation, capacity, and coordinates.
 */

import React from 'react';
import { ShieldAlert, Hospital, Zap, Landmark, Building2, MapPin, X } from 'lucide-react';
import { useInfrastructure } from '../../context/InfrastructureContext';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';

export const AssetDetailModal: React.FC = () => {
  const { selectedAsset, setSelectedAsset } = useInfrastructure();

  if (!selectedAsset) return null;

  const renderTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'HOSPITAL':
        return <Hospital size={20} />;
      case 'POWER_STATION':
        return <Zap size={20} />;
      case 'SCHOOL':
        return <Landmark size={20} />;
      default:
        return <Building2 size={20} />;
    }
  };

  const badgeVariant =
    selectedAsset.vulnerability_status === 'CRITICAL' ? 'critical' :
    selectedAsset.vulnerability_status === 'AT_RISK' ? 'moderate' : 'low';

  return (
    <Modal
      isOpen={!!selectedAsset}
      onClose={() => setSelectedAsset(null)}
      title="Critical Infrastructure Vulnerability Dossier"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <Button variant="secondary" size="sm" onClick={() => setSelectedAsset(null)} icon={<X size={13} />}>
            Close Dossier
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Header Summary */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--cat-infra-bg)', borderRadius: 'var(--radius-md)', color: 'var(--cat-infra)' }}>
              {renderTypeIcon(selectedAsset.asset_type)}
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 750, color: 'var(--text-primary)', margin: 0 }}>
                {selectedAsset.name}
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Asset Code: <strong>{selectedAsset.asset_id}</strong> • Basin: <strong>{selectedAsset.zone_id}</strong>
              </div>
            </div>
          </div>
          <Badge variant={badgeVariant}>
            ● {selectedAsset.vulnerability_status}
          </Badge>
        </div>

        {/* Metric Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            padding: '12px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Estimated Inundation Depth</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: selectedAsset.estimated_water_depth_m > 0 ? 'var(--risk-critical)' : 'var(--risk-low)', marginTop: '2px' }}>
              {selectedAsset.estimated_water_depth_m.toFixed(2)} m
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Surface Elevation</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {selectedAsset.elevation_m.toFixed(1)} m MSL
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Facility Capacity</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {selectedAsset.capacity !== null ? `${selectedAsset.capacity.toLocaleString()} Units` : 'N/A'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Spatial Coordinates</div>
            <div style={{ fontSize: '12.5px', fontWeight: 650, color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <MapPin size={12} />
              {selectedAsset.location ? `${selectedAsset.location.latitude.toFixed(4)}, ${selectedAsset.location.longitude.toFixed(4)}` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Protective Engineering Guidance */}
        <div
          style={{
            padding: '12px',
            backgroundColor: selectedAsset.vulnerability_status === 'CRITICAL' ? 'var(--risk-critical-bg)' : 'var(--bg-primary)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${selectedAsset.vulnerability_status === 'CRITICAL' ? 'var(--risk-critical-border)' : 'var(--border-default)'}`,
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 750, color: selectedAsset.vulnerability_status === 'CRITICAL' ? 'var(--risk-critical)' : 'var(--cat-infra)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ShieldAlert size={14} />
            RECOMMENDED PROTECTIVE ACTION / MITIGATION DIRECTIVE:
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', marginTop: '6px', lineHeight: 1.45, fontWeight: 550 }}>
            {selectedAsset.recommended_protection || 'No specific engineering intervention recorded.'}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AssetDetailModal;
