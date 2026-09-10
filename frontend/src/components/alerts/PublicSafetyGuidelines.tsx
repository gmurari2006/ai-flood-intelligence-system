/**
 * AI Flood Intelligence System — Public Safety Guidelines Component.
 * Authoritative citizen emergency guidelines, grab-bag preparedness,
 * and flood safety protocols.
 */

import React from 'react';
import { AlertTriangle, LifeBuoy } from 'lucide-react';
import Card from '../common/Card';

export const PublicSafetyGuidelines: React.FC = () => {
  return (
    <Card
      categoryLabel="CITIZEN PREPAREDNESS &amp; SAFETY"
      categoryColor="var(--cat-evac)"
      title="Flood Emergency Safety Protocols"
      subtitle="Standard Operating Procedures for Affected Citizens"
      borderAccent="evac"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
        {/* Immediate Flash Inundation Safety */}
        <div style={{ padding: '14px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-deep-ocean)', fontWeight: 750, fontSize: '13.5px', marginBottom: '8px' }}>
            <AlertTriangle size={16} style={{ color: 'var(--risk-high)' }} />
            Immediate Flash Inundation Safety
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <li>Never attempt to walk, swim, or drive through moving floodwaters.</li>
            <li>6 inches of moving water can knock down an adult; 12 inches can sweep a vehicle away.</li>
            <li>Disconnect electrical power and gas supply at the main switch before water enters your premises.</li>
            <li>Move immediately to higher ground or upper floors of structurally sound buildings if trapped.</li>
          </ul>
        </div>

        {/* Evacuation Grab-Bag Readiness */}
        <div style={{ padding: '14px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-deep-ocean)', fontWeight: 750, fontSize: '13.5px', marginBottom: '8px' }}>
            <LifeBuoy size={16} style={{ color: 'var(--brand-emergency-blue)' }} />
            Evacuation Grab-Bag Readiness
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <li>Essential prescription medications, personal identification documents, and emergency funds.</li>
            <li>Waterproof LED flashlight, battery-operated radio receiver, and fully charged power banks.</li>
            <li>Clean drinking water supply and non-perishable food rations for household members.</li>
            <li>Warm waterproof clothing, basic first-aid supplies, and sanitation necessities.</li>
          </ul>
        </div>
      </div>

      {/* Decision Support Disclaimer */}
      <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', marginTop: 'var(--space-3)', fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
        <strong>Statutory Notice:</strong> This automated citizen portal provides decision support guidance. In all disaster scenarios, citizens must prioritize direct instructions issued by local municipal authorities, police, and State Disaster Response Forces (SDRF).
      </div>
    </Card>
  );
};

export default PublicSafetyGuidelines;
