import React from 'react';
import { MapPinOff, AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../common/Button';

interface MapEmptyStateProps {
  type?: 'empty' | 'error' | 'unavailable';
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const MapEmptyState: React.FC<MapEmptyStateProps> = ({
  type = 'empty',
  title,
  message,
  onRetry,
}) => {
  const isError = type === 'error';
  const isUnavailable = type === 'unavailable';

  const defaultTitle = isError
    ? 'Spatial Layer Error'
    : isUnavailable
    ? 'Spatial Layer Unavailable'
    : 'No Spatial Geometry Available';

  return (
    <div className="map-empty-overlay" role="alert">
      <div className="map-empty-card">
        <div
          style={{
            padding: '12px',
            backgroundColor: isError ? 'var(--risk-critical-bg)' : isUnavailable ? 'var(--risk-moderate-bg)' : 'var(--bg-surface-blue)',
            borderRadius: '50%',
            color: isError ? 'var(--risk-critical)' : isUnavailable ? 'var(--risk-moderate)' : 'var(--brand-emergency-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-3)',
          }}
        >
          {isError || isUnavailable ? <AlertTriangle size={24} /> : <MapPinOff size={24} />}
        </div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          {title || defaultTitle}
        </h3>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.45, maxWidth: '320px', marginBottom: onRetry ? 'var(--space-4)' : 0 }}>
          {message}
        </p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry} icon={<RefreshCw size={12} />}>
            Retry Spatial Sync
          </Button>
        )}
      </div>
    </div>
  );
};

export default MapEmptyState;
