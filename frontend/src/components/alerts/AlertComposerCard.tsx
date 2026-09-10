/**
 * AI Flood Intelligence System — Emergency Alert Composer Card.
 * Enables authorized Disaster Officers to draft, client-side review, and broadcast
 * CAP-compliant regional flood warnings with explicit publication confirmation.
 */

import { useState } from 'react';
import { 
  Send, 
  Eye, 
  CheckCircle, 
  AlertOctagon,
  HelpCircle
} from 'lucide-react';
import { useAlerts } from '../../context/AlertContext';
import { useZone } from '../../context/ZoneContext';
import { AlertSeverity } from '../../types/alerts';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

const SEVERITY_LEVELS: { label: string; value: AlertSeverity; variant: 'low' | 'moderate' | 'high' | 'critical' }[] = [
  { label: 'LOW — Advisory Notice', value: 'LOW', variant: 'low' },
  { label: 'MODERATE — Rising Water Watch', value: 'MODERATE', variant: 'moderate' },
  { label: 'HIGH — Flood Warning Stage', value: 'HIGH', variant: 'high' },
  { label: 'CRITICAL — Mandatory Evacuation Order', value: 'CRITICAL', variant: 'critical' },
  { label: 'RED_EMERGENCY — Extreme Disaster Inundation', value: 'RED_EMERGENCY', variant: 'critical' },
];

const RECIPIENT_GROUP_OPTIONS = [
  { id: 'ALL_RESIDENTS', label: 'All Registered Regional Citizens' },
  { id: 'EMERGENCY_SERVICES', label: 'Emergency First Responders & SDRF' },
  { id: 'MUNICIPAL_ADMIN', label: 'Municipal Disaster Management EOC' },
  { id: 'TRANSIT_AUTHORITY', label: 'Regional Transit & Road Infrastructure' },
];

const PREVIEW_SAFETY_INSTRUCTIONS: Record<AlertSeverity, string[]> = {
  RED_EMERGENCY: [
    'Move to upper floors or nearest emergency shelter immediately.',
    'Do not walk or drive through flowing water.',
    'Keep emergency contacts ready.',
  ],
  CRITICAL: [
    'Mandatory evacuation ordered for all low-lying sectors.',
    'Move to designated emergency shelters immediately.',
    'Do not enter floodwaters.',
  ],
  HIGH: [
    'Prepare emergency grab-bags and monitor official broadcasts.',
    'Avoid low-lying basements and underpasses.',
    'Verify nearest evacuation shelter location.',
  ],
  MODERATE: [
    'Stay alert for rising river levels and municipal advisories.',
    'Clear local drain blockages if safe to do so.',
  ],
  LOW: [
    'Normal situational awareness. Monitor regular weather bulletins.',
  ],
};

export const AlertComposerCard: React.FC = () => {
  const { publishAlert, isPublishing, publishError } = useAlerts();
  const { zones, selectedZoneId } = useZone();

  const [targetZone, setTargetZone] = useState<string>(selectedZoneId || 'ZONE-NORTH-BASIN');
  const [severity, setSeverity] = useState<AlertSeverity>('HIGH');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [durationHours, setDurationHours] = useState<number>(12);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(['ALL_RESIDENTS', 'EMERGENCY_SERVICES']);

  // Client-Side Review & Confirmation State
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [publishedAlertId, setPublishedAlertId] = useState<string | null>(null);

  const toggleGroup = (group: string) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Alert headline title is required (max 200 chars).');
      return;
    }
    if (!message.trim()) {
      setValidationError('Actionable alert details message is required.');
      return;
    }
    setValidationError(null);
    setIsReviewOpen(true);
  };

  const handleConfirmPublish = async () => {
    const result = await publishAlert({
      zone_id: targetZone,
      severity,
      title: title.trim(),
      message: message.trim(),
      duration_hours: durationHours,
      recipient_groups: selectedGroups.length > 0 ? selectedGroups : undefined,
    });

    if (result) {
      setPublishedAlertId(result.alert_id);
      setIsReviewOpen(false);
      // Reset form
      setTitle('');
      setMessage('');
    }
  };

  return (
    <Card
      categoryLabel="EMERGENCY ALERT COMPOSER"
      categoryColor="var(--cat-emergency)"
      title="Publish Regional Flood Warning"
      subtitle="Authoritative EOC Broadcast & Multi-Channel Geofenced Dispatch"
      borderAccent="emergency"
    >
      <form onSubmit={handleOpenReview} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
        {/* Published Success Receipt Banner */}
        {publishedAlertId && (
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--risk-low-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--risk-low-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--risk-low)', fontWeight: 700, fontSize: '13px' }}>
              <CheckCircle size={16} />
              Alert Broadcast Active — UUID: {publishedAlertId}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setPublishedAlertId(null)}>
              Dismiss
            </Button>
          </div>
        )}

        {/* Target Zone & Severity Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
          {/* Target Zone */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Target Geographic Zone <span style={{ color: 'var(--risk-critical)' }}>*</span>
            </label>
            <select
              value={targetZone}
              onChange={(e) => setTargetZone(e.target.value)}
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
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.id})
                </option>
              ))}
            </select>
          </div>

          {/* Severity Level */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Severity Classification <span style={{ color: 'var(--risk-critical)' }}>*</span>
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
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
              {SEVERITY_LEVELS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Warning Title */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Headline Warning Title <span style={{ color: 'var(--risk-critical)' }}>*</span>
          </label>
          <input
            type="text"
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., IMMEDIATE EVACUATION ORDER: MITHI RIVER LEVEL CRITICAL"
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${validationError && !title.trim() ? 'var(--risk-critical)' : 'var(--border-default)'}`,
              backgroundColor: 'var(--bg-surface)',
              fontSize: '13px',
              color: 'var(--text-primary)',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            <span>Concise headline for public broadcast &amp; banner feeds</span>
            <span>{title.length}/200</span>
          </div>
        </div>

        {/* Narrative Message */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Actionable Directive &amp; Operational Instructions <span style={{ color: 'var(--risk-critical)' }}>*</span>
          </label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Specify affected sub-sectors, road blockades, assembly points, and emergency contact frequencies..."
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${validationError && !message.trim() ? 'var(--risk-critical)' : 'var(--border-default)'}`,
              backgroundColor: 'var(--bg-surface)',
              fontSize: '12.5px',
              color: 'var(--text-primary)',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Duration & Target Dispatch Groups */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
          {/* Validity Duration */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Alert Validity Period:
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
              <option value={1}>1 Hour (Rapid flash flood alert)</option>
              <option value={3}>3 Hours</option>
              <option value={6}>6 Hours</option>
              <option value={12}>12 Hours (Standard operational cycle)</option>
              <option value={24}>24 Hours (Day warning)</option>
              <option value={48}>48 Hours</option>
              <option value={72}>72 Hours</option>
            </select>
          </div>

          {/* Recipient Groups Checkboxes */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Target Dispatch Groups:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {RECIPIENT_GROUP_OPTIONS.map((grp) => (
                <label key={grp.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(grp.id)}
                    onChange={() => toggleGroup(grp.id)}
                  />
                  {grp.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Safety Instructions Attachment Preview */}
        <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
            System Attached Safety Guidelines ({severity}):
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {PREVIEW_SAFETY_INSTRUCTIONS[severity].map((inst, idx) => (
              <li key={idx}>{inst}</li>
            ))}
          </ul>
        </div>

        {/* Validation & Error Messages */}
        {validationError && (
          <div style={{ padding: '8px 10px', backgroundColor: 'var(--risk-critical-bg)', color: 'var(--risk-critical)', borderRadius: 'var(--radius-md)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertOctagon size={14} />
            {validationError}
          </div>
        )}

        {publishError && (
          <div style={{ padding: '8px 10px', backgroundColor: 'var(--risk-critical-bg)', color: 'var(--risk-critical)', borderRadius: 'var(--radius-md)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertOctagon size={14} />
            {publishError}
          </div>
        )}

        {/* Form Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-3)' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HelpCircle size={12} />
            <span>Pre-submission review enforces two-stage operational confirmation</span>
          </div>

          <Button type="submit" variant="primary" size="md" icon={<Eye size={14} />}>
            Review &amp; Authorize Alert
          </Button>
        </div>
      </form>

      {/* Client-Side Pre-Submission Review Modal */}
      <Modal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title="Authorize Emergency Alert Broadcast"
        maxWidth="540px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Button variant="secondary" size="sm" onClick={() => setIsReviewOpen(false)} disabled={isPublishing}>
              Modify Draft
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmPublish}
              isLoading={isPublishing}
              disabled={isPublishing}
              icon={<Send size={14} />}
            >
              PUBLISH ALERT
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ padding: '10px 12px', backgroundColor: 'var(--risk-critical-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--risk-critical-border)', color: 'var(--risk-critical)', fontSize: '12px', fontWeight: 650 }}>
            WARNING: Publishing this alert will immediately activate emergency public broadcasts and log a permanent system audit record.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px 12px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Target Zone</div>
              <div style={{ fontSize: '13px', fontWeight: 750, color: 'var(--brand-deep-ocean)' }}>{targetZone}</div>
            </div>
            <div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Severity Level</div>
              <Badge variant={severity === 'CRITICAL' || severity === 'RED_EMERGENCY' ? 'critical' : severity === 'HIGH' ? 'high' : 'moderate'}>
                {severity}
              </Badge>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Broadcast Headline</div>
            <div style={{ fontSize: '14px', fontWeight: 750, color: 'var(--text-primary)', marginTop: '2px' }}>{title}</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Actionable Directive</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.45 }}>{message}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-default)', paddingTop: '8px' }}>
            <div>Validity Window: <strong>{durationHours} Hours</strong></div>
            <div>Target Groups: <strong>{selectedGroups.length} selected</strong></div>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default AlertComposerCard;
