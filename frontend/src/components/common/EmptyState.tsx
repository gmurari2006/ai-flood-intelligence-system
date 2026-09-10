import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Available',
  description = 'There are no active records in this partition.',
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`state-box ${className}`}>
      <div className="state-box-icon">
        {icon || <Inbox size={28} />}
      </div>
      <div className="state-box-title">{title}</div>
      <div className="state-box-desc">{description}</div>
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
  );
};

export default EmptyState;
