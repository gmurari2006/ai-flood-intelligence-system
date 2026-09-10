/**
 * AI Flood Intelligence System — Priority Rank Queue Component.
 * Visualizes deterministic MCDA priority ranking of zones with composite scores,
 * priority tiers, and operational dispatch directives.
 */

import React from 'react';
import { Flame, AlertCircle } from 'lucide-react';
import { usePrioritization } from '../../context/PrioritizationContext';
import Badge from '../common/Badge';
import Button from '../common/Button';
import LoadingSkeleton from '../common/LoadingSkeleton';

export const PriorityRankQueue: React.FC = () => {
  const {
    ranking,
    isLoading,
    error,
    selectedRankedZone,
    setSelectedRankedZone,
    fetchPrioritization,
    evaluatedAt,
  } = usePrioritization();

  if (isLoading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)', padding: 'var(--space-4)' }}>
        <LoadingSkeleton count={4} height="52px" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'var(--risk-critical-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--risk-critical-border)', textAlign: 'center' }}>
        <AlertCircle size={24} style={{ color: 'var(--risk-critical)', margin: '0 auto 6px auto' }} />
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--risk-critical)' }}>
          Prioritization Queue Failed
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          {error}
        </p>
        <Button variant="secondary" size="sm" onClick={fetchPrioritization} style={{ marginTop: '8px' }}>
          Retry
        </Button>
      </div>
    );
  }

  const getTierVariant = (tier: string) => {
    switch (tier.toUpperCase()) {
      case 'CRITICAL_TIER_1':
        return 'critical';
      case 'HIGH_TIER_2':
        return 'high';
      case 'MEDIUM_TIER_3':
        return 'moderate';
      default:
        return 'low';
    }
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
          <div className="eyebrow-label" style={{ color: 'var(--brand-emergency-blue)' }}>
            DETERMINISTIC RANKING QUEUE
          </div>
          <h2 style={{ fontSize: '15px', fontWeight: 750, color: 'var(--text-primary)', margin: 0 }}>
            Resource Allocation &amp; Alert Urgency Queue
          </h2>
        </div>

        {evaluatedAt && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Evaluated: {new Date(evaluatedAt).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Ranked Zone Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {ranking.map((item) => {
          const isSelected = selectedRankedZone?.zone_id === item.zone_id;
          const tierVariant = getTierVariant(item.priority_tier);

          return (
            <div
              key={item.zone_id}
              onClick={() => setSelectedRankedZone(item)}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: isSelected ? '1px solid var(--brand-emergency-blue)' : '1px solid var(--border-default)',
                backgroundColor: isSelected ? 'var(--bg-surface-blue)' : 'var(--bg-app)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              {/* Rank & Zone Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: item.rank === 1 ? 'var(--risk-critical)' : 'var(--border-strong)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '13px',
                    flexShrink: 0,
                  }}
                >
                  #{item.rank}
                </div>

                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 750, color: 'var(--text-primary)' }}>
                    {item.zone_name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Basin ID: <strong>{item.zone_id}</strong>
                  </div>
                </div>
              </div>

              {/* Score & Tier Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 650 }}>COMPOSITE SCORE</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brand-deep-ocean)' }}>
                    {item.composite_priority_score.toFixed(2)} / 100
                  </div>
                </div>

                <Badge variant={tierVariant}>
                  {item.priority_tier.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
          );
        })}

        {ranking.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Flame size={24} style={{ margin: '0 auto 6px auto' }} />
            <div style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-primary)' }}>
              No Prioritization Data Available
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriorityRankQueue;
