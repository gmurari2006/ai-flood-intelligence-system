/**
 * AI Flood Intelligence System — Infrastructure Matrix Table.
 * Renders filterable, searchable list of critical infrastructure assets
 * with vulnerability badges, inundation depths, and inspect actions.
 */

import React from 'react';
import { 
  Hospital, 
  Zap, 
  Landmark, 
  Building2, 
  Search, 
  ExternalLink,
  ShieldCheck,
  AlertOctagon
} from 'lucide-react';
import { useInfrastructure } from '../../context/InfrastructureContext';
import { VulnerabilityStatus } from '../../types/infrastructure';
import Badge from '../common/Badge';
import Button from '../common/Button';
import LoadingSkeleton from '../common/LoadingSkeleton';

const ASSET_TYPES = [
  { value: 'ALL', label: 'All Facility Types' },
  { value: 'HOSPITAL', label: 'Hospitals & Healthcare' },
  { value: 'POWER_STATION', label: 'Power & Sub-stations' },
  { value: 'SCHOOL', label: 'Schools & Shelters' },
  { value: 'WATER_TREATMENT', label: 'Water Treatment' },
  { value: 'TELECOM', label: 'Telecom & Antennae' },
];

const RISK_FILTERS: { value: VulnerabilityStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'CRITICAL', label: 'Critical Only' },
  { value: 'AT_RISK', label: 'At-Risk Only' },
  { value: 'SAFE', label: 'Safe Only' },
];

export const InfrastructureTable: React.FC = () => {
  const {
    assets,
    isLoading,
    error,
    minRiskFilter,
    setMinRiskFilter,
    searchTerm,
    setSearchTerm,
    assetTypeFilter,
    setAssetTypeFilter,
    setSelectedAsset,
    refreshInfrastructure,
  } = useInfrastructure();

  const renderTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'HOSPITAL':
        return <Hospital size={14} style={{ color: 'var(--cat-infra)' }} />;
      case 'POWER_STATION':
        return <Zap size={14} style={{ color: 'var(--risk-moderate)' }} />;
      case 'SCHOOL':
        return <Landmark size={14} style={{ color: 'var(--brand-water-cyan)' }} />;
      default:
        return <Building2 size={14} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  // Filter assets by search term and facility type
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.zone_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      assetTypeFilter === 'ALL' || asset.asset_type.toUpperCase() === assetTypeFilter;

    return matchesSearch && matchesType;
  });

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
      {/* Table Controls Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div className="eyebrow-label" style={{ color: 'var(--cat-infra)' }}>
            CRITICAL ASSET MATRIX
          </div>
          <h2 style={{ fontSize: '15px', fontWeight: 750, color: 'var(--text-primary)', margin: 0 }}>
            Impacted Facilities Registry
          </h2>
        </div>

        {/* Filter Controls Row */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '180px' }}>
            <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search facility..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 8px 5px 26px',
                fontSize: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                outline: 'none',
              }}
              aria-label="Search infrastructure by name or ID"
            />
          </div>

          {/* Type Filter */}
          <select
            value={assetTypeFilter}
            onChange={(e) => setAssetTypeFilter(e.target.value)}
            style={{
              padding: '5px 8px',
              fontSize: '12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              backgroundColor: '#FFFFFF',
              fontWeight: 600,
            }}
            aria-label="Filter by facility type"
          >
            {ASSET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Risk Level Filter */}
          <select
            value={minRiskFilter}
            onChange={(e) => setMinRiskFilter(e.target.value as VulnerabilityStatus | 'ALL')}
            style={{
              padding: '5px 8px',
              fontSize: '12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              backgroundColor: '#FFFFFF',
              fontWeight: 600,
            }}
            aria-label="Filter by vulnerability status"
          >
            {RISK_FILTERS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{ marginTop: 'var(--space-2)' }}>
          <LoadingSkeleton count={5} height="38px" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div style={{ padding: '16px', backgroundColor: 'var(--risk-critical-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--risk-critical-border)', textAlign: 'center' }}>
          <AlertOctagon size={24} style={{ color: 'var(--risk-critical)', margin: '0 auto 6px auto' }} />
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--risk-critical)' }}>
            Failed to Load Infrastructure Registry
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {error}
          </p>
          <Button variant="secondary" size="sm" onClick={refreshInfrastructure} style={{ marginTop: '8px' }}>
            Retry Query
          </Button>
        </div>
      )}

      {/* Table Body */}
      {!isLoading && !error && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-default)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px', fontWeight: 700 }}>FACILITY NAME</th>
                <th style={{ padding: '8px', fontWeight: 700 }}>CATEGORY</th>
                <th style={{ padding: '8px', fontWeight: 700 }}>BASIN</th>
                <th style={{ padding: '8px', fontWeight: 700 }}>ELEVATION</th>
                <th style={{ padding: '8px', fontWeight: 700 }}>EST. DEPTH</th>
                <th style={{ padding: '8px', fontWeight: 700 }}>STATUS</th>
                <th style={{ padding: '8px', fontWeight: 700, textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => {
                const badgeVariant =
                  asset.vulnerability_status === 'CRITICAL' ? 'critical' :
                  asset.vulnerability_status === 'AT_RISK' ? 'moderate' : 'low';

                return (
                  <tr
                    key={asset.asset_id}
                    style={{
                      borderBottom: '1px solid var(--border-default)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '8px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {renderTypeIcon(asset.asset_type)}
                        <span>{asset.name}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '20px' }}>
                        {asset.asset_id}
                      </div>
                    </td>

                    <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                      {asset.asset_type.replace('_', ' ')}
                    </td>

                    <td style={{ padding: '8px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {asset.zone_id}
                    </td>

                    <td style={{ padding: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {asset.elevation_m.toFixed(1)} m
                    </td>

                    <td style={{ padding: '8px', fontWeight: 750, color: asset.estimated_water_depth_m > 0 ? 'var(--risk-critical)' : 'var(--risk-low)' }}>
                      {asset.estimated_water_depth_m > 0 ? `${asset.estimated_water_depth_m.toFixed(2)} m` : '0.00 m (Dry)'}
                    </td>

                    <td style={{ padding: '8px' }}>
                      <Badge variant={badgeVariant}>
                        {asset.vulnerability_status}
                      </Badge>
                    </td>

                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedAsset(asset)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                        title="View mitigation instructions"
                      >
                        <ExternalLink size={11} style={{ marginRight: '4px' }} />
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <ShieldCheck size={24} style={{ margin: '0 auto 6px auto', color: 'var(--text-muted)' }} />
                    <div style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-primary)' }}>
                      No Infrastructure Assets Found
                    </div>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      No critical infrastructure matches the active filters or selected geographic basin.
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

export default InfrastructureTable;
