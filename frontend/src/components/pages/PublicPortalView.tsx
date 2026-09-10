/**
 * AI Flood Intelligence System — Citizen Public Safety & Emergency Warning Portal.
 * Unauthenticated, accessible, mobile-optimized public portal delivering
 * real-time flood warning feeds, tailored safety checklists, and nearest shelter finders.
 */

import React from 'react';
import { LifeBuoy } from 'lucide-react';
import { PublicWarningBanner, PublicSafetyGuidelines } from '../alerts';
import { ShelterListTable } from '../evacuation';
import Badge from '../common/Badge';
import Card from '../common/Card';

export const PublicPortalView: React.FC = () => {
  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Portal Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: 'var(--space-5)',
        }}
      >
        <div>
          <div className="eyebrow-label" style={{ color: 'var(--cat-evac)' }}>
            CITIZEN SAFETY &amp; PUBLIC ADVISORY
          </div>
          <h1 className="page-title">
            Public Safety &amp; Emergency Flood Advisory Portal
          </h1>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>
            Live Regional Flood Warnings, Actionable Protective Protocols, and Designated Safe Haven Shelters.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Badge variant="low">
            <LifeBuoy size={12} style={{ marginRight: '4px' }} />
            PUBLIC CITIZEN ACCESS
          </Badge>
          <Badge variant="info">
            LIVE BROADCAST FEED
          </Badge>
        </div>
      </div>

      {/* 1. Active Regional Public Warning Banner */}
      <PublicWarningBanner />

      {/* 2. Public Safety Guidelines & Grab-Bag Preparedness */}
      <PublicSafetyGuidelines />

      {/* 3. Municipal Safe Haven Shelters Directory */}
      <Card
        categoryLabel="EMERGENCY ACCOMMODATION"
        categoryColor="var(--cat-evac)"
        title="Designated Municipal Safe Havens &amp; Shelters"
        subtitle="Public Evacuation Facilities with Backup Power &amp; Live Capacity Tracking"
        borderAccent="evac"
      >
        <ShelterListTable />
      </Card>

      {/* Bottom Authority Disclaimer */}
      <div style={{ padding: '14px', textAlign: 'center', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        <div><strong>State &amp; Municipal Disaster Management Command Integration</strong></div>
        <div>In life-threatening situations, dial <strong>112</strong> immediately. This automated decision-support portal operates in conjunction with State Emergency Operations Centers.</div>
      </div>
    </div>
  );
};

export default PublicPortalView;
