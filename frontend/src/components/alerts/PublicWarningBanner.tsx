/**
 * AI Flood Intelligence System — Public Warning Banner Component.
 * High-contrast, citizen-facing warning banner rendering active regional advisories
 * from GET /api/v1/alerts/public with zero sensitive data leakage.
 */

import React from 'react';
import { AlertOctagon, Radio, ShieldCheck, Clock, MapPin } from 'lucide-react';
import { useAlerts } from '../../context/AlertContext';
import Badge from '../common/Badge';
import LoadingSkeleton from '../common/LoadingSkeleton';

export const PublicWarningBanner: React.FC = () => {
  const { publicWarnings, isLoadingPublicWarnings, publicError } = useAlerts();

  if (isLoadingPublicWarnings) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-blue)', borderRadius: 'var(--radius-lg)', border: '1px solid #BAE6FD' }}>
        <LoadingSkeleton height="80px" />
      </div>
    );
  }

  if (publicError) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'var(--risk-critical-bg)', color: 'var(--risk-critical)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--risk-critical-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13.5px' }}>
          <AlertOctagon size={18} />
          Public Advisory Feed Notice
        </div>
        <p style={{ fontSize: '12.5px', marginTop: '4px', margin: 0 }}>
          {publicError}
        </p>
      </div>
    );
  }

  if (publicWarnings.length === 0) {
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: 'var(--risk-low-bg)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--risk-low-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <div style={{ padding: '10px', backgroundColor: '#D1FAE5', borderRadius: 'var(--radius-full)', color: 'var(--risk-low)' }}>
          <ShieldCheck size={28} />
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 750, color: 'var(--risk-low)' }}>
            No Active Regional Flood Warnings
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            All monitored river basins and drainage channels are operating within normal baseline limits. Continue monitoring official meteorological updates.
          </div>
        </div>
      </div>
    );
  }

  const getSeverityBadgeVariant = (sev: string): 'low' | 'moderate' | 'high' | 'critical' => {
    const s = sev.toUpperCase();
    if (s === 'CRITICAL' || s === 'RED_EMERGENCY') return 'critical';
    if (s === 'HIGH') return 'high';
    if (s === 'MODERATE') return 'moderate';
    return 'low';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {publicWarnings.map((warning, idx) => (
        <div
          key={idx}
          style={{
            padding: '18px 20px',
            backgroundColor: warning.severity === 'CRITICAL' || warning.severity === 'RED_EMERGENCY' ? 'var(--risk-critical-bg)' : 'var(--risk-high-bg)',
            borderRadius: 'var(--radius-lg)',
            border: `2px solid ${warning.severity === 'CRITICAL' || warning.severity === 'RED_EMERGENCY' ? 'var(--risk-critical-border)' : 'var(--risk-high-border)'}`,
          }}
        >
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  padding: '8px',
                  backgroundColor: warning.severity === 'CRITICAL' || warning.severity === 'RED_EMERGENCY' ? '#FEE2E2' : '#FFEDD5',
                  borderRadius: 'var(--radius-md)',
                  color: warning.severity === 'CRITICAL' || warning.severity === 'RED_EMERGENCY' ? 'var(--risk-critical)' : 'var(--risk-high)',
                }}
              >
                <Radio size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={13} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    {warning.zone_name}
                  </span>
                </div>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
                  {warning.title}
                </h2>
              </div>
            </div>

            <Badge variant={getSeverityBadgeVariant(warning.severity)}>
              {warning.severity} SEVERITY
            </Badge>
          </div>

          {/* Narrative Advisory */}
          <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '10px', lineHeight: 1.5, marginBottom: '12px' }}>
            {warning.message}
          </p>

          {/* Actionable Safety Instructions Checklist */}
          {warning.safety_instructions && warning.safety_instructions.length > 0 && (
            <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 750, color: 'var(--brand-deep-ocean)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Immediate Citizen Protective Instructions:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {warning.safety_instructions.map((inst, i) => (
                  <li key={i} style={{ marginBottom: '2px' }}>
                    <strong>{inst}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Timing Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} />
              <span>Broadcast Active until {new Date(warning.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(warning.expires_at).toLocaleDateString()})</span>
            </div>
            <span>Official EOC Public Notice</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PublicWarningBanner;
