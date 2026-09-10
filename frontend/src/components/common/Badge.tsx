import React from 'react';

export type BadgeVariant =
  | 'low'
  | 'moderate'
  | 'high'
  | 'critical'
  | 'heuristic'
  | 'info'
  | 'neutral';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  icon,
  className = '',
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {icon && <span className="badge-icon">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
