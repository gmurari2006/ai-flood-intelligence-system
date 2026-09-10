/**
 * AI Flood Intelligence System — Prediction Empty State Handler.
 * Renders distinct states for NO_DATA, UNAVAILABLE, UNAUTHORIZED, and ERROR.
 */

import React from 'react';
import { AlertCircle, Lock, Database, Clock, RefreshCw } from 'lucide-react';
import Button from '../common/Button';

interface PredictionEmptyStateProps {
  type: 'NO_DATA' | 'UNAVAILABLE' | 'UNAUTHORIZED' | 'ERROR';
  message?: string;
  onRetry?: () => void;
}

export const PredictionEmptyState: React.FC<PredictionEmptyStateProps> = ({
  type,
  message,
  onRetry,
}) => {
  if (type === 'UNAUTHORIZED') {
    return (
      <div
        style={{
          padding: 'var(--space-6)',
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'var(--cat-env-bg)',
            color: 'var(--brand-emergency-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-3) auto',
          }}
        >
          <Lock size={22} />
        </div>
        <h3 style={{ fontSize: '15px', fontWeight: 750, color: 'var(--text-primary)' }}>
          Disaster Officer Authentication Required
        </h3>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '360px', margin: '6px auto 0 auto', lineHeight: 1.4 }}>
          {message || 'Operational prediction execution and detailed XAI decomposition are restricted to authenticated emergency management personnel.'}
        </p>
      </div>
    );
  }

  if (type === 'ERROR') {
    return (
      <div
        style={{
          padding: 'var(--space-6)',
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--risk-critical-border)',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'var(--risk-critical-bg)',
            color: 'var(--risk-critical)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-3) auto',
          }}
        >
          <AlertCircle size={22} />
        </div>
        <h3 style={{ fontSize: '15px', fontWeight: 750, color: 'var(--text-primary)' }}>
          Prediction Evaluation Failed
        </h3>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '360px', margin: '6px auto var(--space-4) auto', lineHeight: 1.4 }}>
          {message || 'An unexpected error occurred while communicating with the hydrological inference engine.'}
        </p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry} icon={<RefreshCw size={12} />}>
            Retry Assessment
          </Button>
        )}
      </div>
    );
  }

  if (type === 'UNAVAILABLE') {
    return (
      <div
        style={{
          padding: 'var(--space-6)',
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-3) auto',
          }}
        >
          <Clock size={22} />
        </div>
        <h3 style={{ fontSize: '15px', fontWeight: 750, color: 'var(--text-primary)' }}>
          Feature Attribution Unavailable
        </h3>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '360px', margin: '6px auto 0 auto', lineHeight: 1.4 }}>
          {message || 'XAI factor attributions are not available for this record.'}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 'var(--space-6)',
        textAlign: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-default)',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-3) auto',
        }}
      >
        <Database size={22} />
      </div>
      <h3 style={{ fontSize: '15px', fontWeight: 750, color: 'var(--text-primary)' }}>
        No Active Prediction Records
      </h3>
      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '360px', margin: '6px auto 0 auto', lineHeight: 1.4 }}>
        {message || 'Select a monitored basin from the selector and click Run AI Prediction to execute risk modeling.'}
      </p>
    </div>
  );
};

export default PredictionEmptyState;
