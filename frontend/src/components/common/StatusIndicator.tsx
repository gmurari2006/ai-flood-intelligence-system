import React from 'react';

export type StatusType = 'healthy' | 'warning' | 'critical' | 'standby' | 'heuristic' | 'offline';

export interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  sublabel?: string;
  className?: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  sublabel,
  className = '',
  size = 'md',
  pulse = false,
}) => {
  const dotSizeStyle = size === 'sm' ? { width: '6px', height: '6px' } : {};
  const pulseClass = pulse ? 'pulse' : '';

  return (
    <div className={`status-indicator-wrap ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span className={`status-dot ${status} ${pulseClass}`} style={dotSizeStyle} />
      {(label || sublabel) && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          {label && <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>}
          {sublabel && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{sublabel}</span>}
        </div>
      )}
    </div>
  );
};

export default StatusIndicator;
