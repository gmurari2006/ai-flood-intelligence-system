import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Service Unavailable',
  message = 'An unexpected error occurred while communicating with the backend.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`state-box state-box-error ${className}`}>
      <div className="state-box-icon" style={{ color: 'var(--status-critical)' }}>
        <AlertCircle size={28} />
      </div>
      <div className="state-box-title">{title}</div>
      <div className="state-box-desc">{message}</div>
      {onRetry && (
        <div style={{ marginTop: '12px' }}>
          <Button variant="secondary" size="sm" icon={<RotateCcw size={12} />} onClick={onRetry}>
            Retry Request
          </Button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
