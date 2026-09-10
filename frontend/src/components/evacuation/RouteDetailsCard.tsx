/**
 * AI Flood Intelligence System — Evacuation Route Details Card.
 * Truthfully visualizes calculated route metrics or explicit ROUTING_UNAVAILABLE state.
 */

import React from 'react';
import { 
  Navigation, 
  ShieldAlert, 
  CheckCircle, 
  Info,
  HelpCircle
} from 'lucide-react';
import { useEvacuation } from '../../context/EvacuationContext';
import Card from '../common/Card';
import Badge from '../common/Badge';

export const RouteDetailsCard: React.FC = () => {
  const { currentRoutePlan, routePlanError } = useEvacuation();

  if (routePlanError) {
    return (
      <Card
        categoryLabel="EVACUATION ROUTE DETAILS"
        categoryColor="var(--risk-critical)"
        title="Pathfinding Error"
        subtitle="Route Computation Failed"
        borderAccent="critical"
      >
        <div style={{ padding: '12px', backgroundColor: 'var(--risk-critical-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--risk-critical-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--risk-critical)', fontWeight: 700, fontSize: '13px' }}>
            <ShieldAlert size={16} />
            Routing Computation Fault
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {routePlanError}
          </p>
        </div>
      </Card>
    );
  }

  if (!currentRoutePlan) {
    return (
      <Card
        categoryLabel="EVACUATION ROUTE DETAILS"
        categoryColor="var(--cat-evac)"
        title="Safe Evacuation Corridor Analysis"
        subtitle="Awaiting Route Pathfinding Request"
        borderAccent="evac"
      >
        <div style={{ padding: '24px 12px', textAlign: 'center', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-default)' }}>
          <Navigation size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
            No Active Route Computation
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '340px', margin: '4px auto 0 auto' }}>
            Configure the origin coordinates above and click <strong>Calculate Safe Route</strong> to evaluate traversable corridors to designated shelters.
          </p>
        </div>
      </Card>
    );
  }

  const isAvailable = currentRoutePlan.routing_status === 'AVAILABLE';
  const shelter = currentRoutePlan.recommended_shelter;
  const route = currentRoutePlan.route;

  return (
    <Card
      categoryLabel="EVACUATION ROUTE DETAILS"
      categoryColor="var(--cat-evac)"
      title={shelter ? `Target Destination: ${shelter.name}` : 'Evacuation Pathway Assessment'}
      subtitle={shelter ? `Address: ${shelter.address}` : 'Operational Route Status'}
      borderAccent={isAvailable ? 'evac' : 'spatial'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
        {/* Status Badge Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          {isAvailable ? (
            <Badge variant="low">
              <CheckCircle size={11} style={{ marginRight: '4px' }} />
              SAFE CORRIDOR ACTIVE
            </Badge>
          ) : (
            <Badge variant="neutral">
              <Info size={11} style={{ marginRight: '4px' }} />
              ROUTING UNAVAILABLE
            </Badge>
          )}

          {route?.route_status && (
            <Badge variant="info">
              {route.route_status.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>

        {/* Route Metrics Grid */}
        {isAvailable && route ? (
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
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Calculated Road Distance</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--brand-deep-ocean)', marginTop: '2px' }}>
                {route.distance_km !== null ? `${route.distance_km.toFixed(2)} km` : 'N/A'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Estimated Travel Time</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                {route.estimated_time_minutes !== null ? `${route.estimated_time_minutes} mins` : 'N/A'}
              </div>
            </div>
          </div>
        ) : (
          /* Honest Unavailability Notification */
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              fontSize: '12px',
              lineHeight: 1.45,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '3px' }}>
              <Info size={14} style={{ color: 'var(--brand-emergency-blue)' }} />
              Road Network Graph Offline
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {currentRoutePlan.message || 'Road network routing provider is not configured in this environment. Real road geometry cannot be fabricated.'}
            </div>
            {shelter?.location && (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-default)', fontSize: '11.5px', color: 'var(--text-primary)' }}>
                Target Shelter Coordinates: <strong>{shelter.location.latitude.toFixed(4)}°N, {shelter.location.longitude.toFixed(4)}°E</strong> ({shelter.available_capacity} slots available)
              </div>
            )}
          </div>
        )}

        {/* Epistemic Truthfulness Notice */}
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', borderTop: '1px solid var(--border-default)', paddingTop: '6px' }}>
          <HelpCircle size={11} />
          <span>Routes strictly follow verified graph topologies with flood exclusion barriers.</span>
        </div>
      </div>
    </Card>
  );
};

export default RouteDetailsCard;
