import React from 'react';

export interface LoadingSkeletonProps {
  height?: string | number;
  width?: string | number;
  borderRadius?: string | number;
  className?: string;
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  height = '16px',
  width = '100%',
  borderRadius = 'var(--radius-sm)',
  className = '',
  count = 1,
}) => {
  const items = Array.from({ length: count });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {items.map((_, i) => (
        <div
          key={i}
          className={`skeleton ${className}`}
          style={{
            height,
            width,
            borderRadius,
          }}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
