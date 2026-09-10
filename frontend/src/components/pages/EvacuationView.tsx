/**
 * AI Flood Intelligence System — Evacuation & Disaster Mobility View.
 * Safe route calculation, shelter capacity tracking, and truthfulness handling.
 */

import React from 'react';
import { Route, ShieldCheck } from 'lucide-react';
import Badge from '../common/Badge';
import {
  RoutePlannerConsole,
  RouteDetailsCard,
  ShelterCapacityCard,
  ShelterListTable,
} from '../evacuation';

export const EvacuationView: React.FC = () => {
  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* View Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: 'var(--space-4)',
        }}
      >
        <div>
          <div className="eyebrow-label" style={{ color: 'var(--cat-evac)' }}>
            DISASTER MOBILITY &amp; SAFE CORRIDORS
          </div>
          <h1 className="page-title">
            Evacuation Center Capacity &amp; Safe Path Routing
          </h1>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>
            Safe Dry Corridor Pathfinding, Municipal Shelter Capacity Monitoring, and Flood Exclusion Zones.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Badge variant="low">
            <ShieldCheck size={12} style={{ marginRight: '4px' }} />
            SAFE HAVENS REGISTRY
          </Badge>
          <Badge variant="info">
            <Route size={12} style={{ marginRight: '4px' }} />
            GRAPH PATHFINDING
          </Badge>
        </div>
      </div>

      {/* 1. Route Planner Controls */}
      <RoutePlannerConsole />

      {/* 2. Operational Logistics Grid (Route Details & Shelter Capacity) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.25fr) minmax(300px, 1fr)',
          gap: 'var(--space-5)',
          alignItems: 'start',
        }}
        className="evacuation-grid"
      >
        <RouteDetailsCard />
        <ShelterCapacityCard />
      </div>

      {/* 3. Shelter Directory Table */}
      <ShelterListTable />
    </div>
  );
};

export default EvacuationView;
