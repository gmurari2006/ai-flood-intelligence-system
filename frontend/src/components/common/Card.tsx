import React from 'react';

export type CardBorderAccent =
  | 'none'
  | 'low'
  | 'moderate'
  | 'high'
  | 'critical'
  | 'sky'
  | 'env'
  | 'ai'
  | 'spatial'
  | 'infra'
  | 'evac'
  | 'emergency';

export interface CardProps {
  title?: React.ReactNode;
  subtitle?: string;
  categoryLabel?: string;
  categoryColor?: string;
  headerAction?: React.ReactNode;
  borderAccent?: CardBorderAccent;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  categoryLabel,
  categoryColor,
  headerAction,
  borderAccent = 'none',
  className = '',
  children,
  style = {},
}) => {
  const accentBorder: React.CSSProperties =
    borderAccent === 'low'
      ? { borderTop: '3px solid var(--risk-low)' }
      : borderAccent === 'moderate'
      ? { borderTop: '3px solid var(--risk-moderate)' }
      : borderAccent === 'high'
      ? { borderTop: '3px solid var(--risk-high)' }
      : borderAccent === 'critical'
      ? { borderTop: '3px solid var(--risk-critical)' }
      : borderAccent === 'sky' || borderAccent === 'env'
      ? { borderTop: '3px solid var(--cat-env)' }
      : borderAccent === 'ai'
      ? { borderTop: '3px solid var(--cat-ai)' }
      : borderAccent === 'spatial'
      ? { borderTop: '3px solid var(--cat-spatial)' }
      : borderAccent === 'infra'
      ? { borderTop: '3px solid var(--cat-infra)' }
      : borderAccent === 'evac'
      ? { borderTop: '3px solid var(--cat-evac)' }
      : borderAccent === 'emergency'
      ? { borderTop: '3px solid var(--cat-emergency)' }
      : {};

  return (
    <div className={`card ${className}`} style={{ ...accentBorder, ...style }}>
      {(title || categoryLabel || headerAction) && (
        <div className="card-header">
          <div>
            {categoryLabel && (
              <div 
                className="eyebrow-label" 
                style={categoryColor ? { color: categoryColor } : {}}
              >
                {categoryLabel}
              </div>
            )}
            {title && <div className="card-title">{title}</div>}
            {subtitle && <div className="card-subtitle">{subtitle}</div>}
          </div>
          {headerAction && <div className="card-action">{headerAction}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
};

export default Card;
