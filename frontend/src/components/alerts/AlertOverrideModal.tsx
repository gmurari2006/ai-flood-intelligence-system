/**
 * AI Flood Intelligence System — Alert Override Modal.
 * Enables authorized Disaster Officers to apply operational risk overrides
 * with mandatory field justification and auditable SystemEvent logging.
 */

import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, AlertOctagon } from 'lucide-react';
import { useAlerts } from '../../context/AlertContext';
import { AlertSeverity } from '../../types/alerts';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface AlertOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneId: string;
  currentSeverity: string;
}

const SEVERITY_OPTIONS: { label: string; value: AlertSeverity; variant: 'low' | 'moderate' | 'high' | 'critical' }[] = [
  { label: 'LOW (Advisory / Situational Awareness)', value: 'LOW', variant: 'low' },
  { label: 'MODERATE (Watch / Rising Water Alert)', value: 'MODERATE', variant: 'moderate' },
  { label: 'HIGH (Warning / Evacuation Preparation)', value: 'HIGH', variant: 'high' },
  { label: 'CRITICAL (Severe Threat / Mandatory Evacuation)', value: 'CRITICAL', variant: 'critical' },
  { label: 'RED_EMERGENCY (Extreme Catastrophic Inundation)', value: 'RED_EMERGENCY', variant: 'critical' },
];

export const AlertOverrideModal: React.FC<AlertOverrideModalProps> = ({
  isOpen,
  onClose,
  zoneId,
  currentSeverity,
}) => {
  const { overrideAlert, isOverriding, overrideError, lastOverrideResult, clearOverrideResult } = useAlerts();

  const [overrideSeverity, setOverrideSeverity] = useState<AlertSeverity>('HIGH');
  const [justification, setJustification] = useState<string>('');
  const [durationHours, setDurationHours] = useState<number>(6);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleClose = () => {
    setJustification('');
    setValidationError(null);
    clearOverrideResult();
    onClose();
  };

  const handleApplyOverride = async () => {
    if (justification.trim().length < 5) {
      setValidationError('Field justification must be at least 5 characters detailing operational rationale.');
      return;
    }
    setValidationError(null);

    const result = await overrideAlert({
      zone_id: zoneId,
      override_severity: overrideSeverity,
      justification: justification.trim(),
      duration_hours: durationHours,
    });

    if (result) {
      // Keep open briefly or allow user to see receipt
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Manual Officer Risk & Alert Override"
      maxWidth="560px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Button variant="secondary" size="sm" onClick={handleClose} disabled={isOverriding}>
            {lastOverrideResult ? 'Close Dossier' : 'Cancel'}
          </Button>
          {!lastOverrideResult && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleApplyOverride}
              isLoading={isOverriding}
              disabled={isOverriding}
              icon={<ShieldAlert size={14} />}
            >
              Commit Risk Override
            </Button>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Success Receipt State */}
        {lastOverrideResult ? (
          <div style={{ padding: '16px', backgroundColor: 'var(--risk-low-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--risk-low-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--risk-low)', fontWeight: 750, fontSize: '14px' }}>
              <CheckCircle size={18} />
              Manual Override Committed &amp; Audited
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', marginTop: '8px', lineHeight: 1.5 }}>
              <div>Target Zone: <strong>{lastOverrideResult.zone_id}</strong></div>
              <div>Effective Severity: <strong>{lastOverrideResult.effective_severity}</strong></div>
              <div>System Audit Event ID: <strong style={{ color: 'var(--brand-deep-ocean)' }}>#{lastOverrideResult.audit_event_id}</strong></div>
              <div>Timestamp: {new Date(lastOverrideResult.updated_at).toLocaleString()}</div>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid var(--risk-low-border)', paddingTop: '6px' }}>
              System audit record permanently logged to EOC system events repository.
            </div>
          </div>
        ) : (
          <>
            {/* Context Notice */}
            <div style={{ padding: '10px 12px', backgroundColor: 'var(--cat-emergency-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--cat-emergency-border)', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <strong>Operational Accountability Gate:</strong> Overriding algorithmic severity modifies active public broadcasts and records your user ID in the system audit log.
            </div>

            {/* Target & Baseline Severity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '10px 12px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Target Zone</div>
                <div style={{ fontSize: '13.5px', fontWeight: 750, color: 'var(--brand-deep-ocean)' }}>{zoneId}</div>
              </div>
              <div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Current Severity</div>
                <div style={{ fontSize: '13.5px', fontWeight: 750, color: 'var(--text-primary)' }}>{currentSeverity || 'BASELINE'}</div>
              </div>
            </div>

            {/* Proposed Override Severity */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '4px' }}>
                New Effective Severity Tier:
              </label>
              <select
                value={overrideSeverity}
                onChange={(e) => setOverrideSeverity(e.target.value as AlertSeverity)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-surface)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                {SEVERITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Override Validity Duration (Hours):
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-surface)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                }}
              >
                <option value={1}>1 Hour (Immediate verification)</option>
                <option value={3}>3 Hours</option>
                <option value={6}>6 Hours (Standard operational shift)</option>
                <option value={12}>12 Hours</option>
                <option value={24}>24 Hours</option>
                <option value={48}>48 Hours</option>
              </select>
            </div>

            {/* Mandatory Justification */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Mandatory Operational Justification <span style={{ color: 'var(--risk-critical)' }}>*</span>
              </label>
              <textarea
                rows={3}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Detail physical levee breach, field sensor discrepancy, unmonitored tributary influx, or emergency command directive..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${validationError ? 'var(--risk-critical)' : 'var(--border-default)'}`,
                  backgroundColor: 'var(--bg-surface)',
                  fontSize: '12.5px',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                <span>Minimum 5 characters required for audit compliance</span>
                <span>{justification.length} chars</span>
              </div>
            </div>

            {/* Validation & API Errors */}
            {validationError && (
              <div style={{ padding: '8px 10px', backgroundColor: 'var(--risk-critical-bg)', color: 'var(--risk-critical)', borderRadius: 'var(--radius-md)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertOctagon size={14} />
                {validationError}
              </div>
            )}

            {overrideError && (
              <div style={{ padding: '8px 10px', backgroundColor: 'var(--risk-critical-bg)', color: 'var(--risk-critical)', borderRadius: 'var(--radius-md)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertOctagon size={14} />
                {overrideError}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default AlertOverrideModal;
