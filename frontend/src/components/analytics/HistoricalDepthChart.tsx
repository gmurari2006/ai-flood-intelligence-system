/**
 * AI Flood Intelligence System — Historical Depth & Rainfall SVG Chart.
 * Native SVG visualization rendered strictly from actual API records returned by
 * GET /api/v1/analytics/historical, with an explicit no-data state when records = 0.
 */

import React from 'react';
import { BarChart3, Info } from 'lucide-react';
import { useAnalytics } from '../../context/AnalyticsContext';
import Card from '../common/Card';

export const HistoricalDepthChart: React.FC = () => {
  const { historicalEvents, isLoadingHistorical } = useAnalytics();

  // If no records or loading, render honest state
  if (isLoadingHistorical || historicalEvents.length === 0) {
    return (
      <Card
        categoryLabel="PRECIPITATION VS INUNDATION CORRELATION"
        categoryColor="var(--cat-env)"
        title="Historical Deluge Intensity"
        subtitle="Peak Inundation Depth (m) vs Storm Rainfall (mm)"
        borderAccent="env"
      >
        <div
          style={{
            padding: '36px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-default)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
          }}
        >
          <BarChart3 size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
            CHART VISUALIZATION UNAVAILABLE
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '380px', margin: '4px 0 0 0', lineHeight: 1.4 }}>
            Correlation chart requires at least 1 verified historical flood event in the database archive.
          </p>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <Info size={12} />
            <span>Zero synthetic chart bars generated</span>
          </div>
        </div>
      </Card>
    );
  }

  // Calculate scales for actual data
  const maxRainfall = Math.max(...historicalEvents.map((e) => e.total_rainfall_mm || 0), 100);
  const maxDepth = Math.max(...historicalEvents.map((e) => e.peak_water_depth_m || 0), 1);

  const chartHeight = 160;
  const chartWidth = 460;
  const padding = { top: 20, right: 30, bottom: 30, left: 40 };

  const usableWidth = chartWidth - padding.left - padding.right;
  const usableHeight = chartHeight - padding.top - padding.bottom;
  const barWidth = Math.min(32, usableWidth / (historicalEvents.length * 2.5));

  return (
    <Card
      categoryLabel="PRECIPITATION VS INUNDATION CORRELATION"
      categoryColor="var(--cat-env)"
      title="Historical Deluge Intensity"
      subtitle="Peak Inundation Depth (m) vs Storm Rainfall (mm)"
      borderAccent="env"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', fontSize: '11.5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--cat-env)', borderRadius: '2px' }} />
            Total Rainfall (mm)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--brand-water-cyan)', borderRadius: '2px' }} />
            Peak Water Depth (m)
          </div>
        </div>

        {/* Responsive SVG Chart */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', maxHeight: '200px' }}>
            {/* Grid lines */}
            <line x1={padding.left} y1={padding.top} x2={chartWidth - padding.right} y2={padding.top} stroke="var(--border-subtle)" strokeDasharray="3,3" />
            <line x1={padding.left} y1={padding.top + usableHeight / 2} x2={chartWidth - padding.right} y2={padding.top + usableHeight / 2} stroke="var(--border-subtle)" strokeDasharray="3,3" />
            <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} stroke="var(--border-default)" />

            {/* Bars for events */}
            {historicalEvents.map((evt, idx) => {
              const groupX = padding.left + (idx + 0.5) * (usableWidth / historicalEvents.length);
              const rainHeight = ((evt.total_rainfall_mm || 0) / maxRainfall) * usableHeight;
              const depthHeight = ((evt.peak_water_depth_m || 0) / maxDepth) * usableHeight;

              return (
                <g key={evt.event_id}>
                  {/* Rainfall Bar */}
                  <rect
                    x={groupX - barWidth - 2}
                    y={chartHeight - padding.bottom - rainHeight}
                    width={barWidth}
                    height={rainHeight}
                    fill="var(--cat-env)"
                    rx={2}
                  />
                  {/* Water Depth Bar */}
                  <rect
                    x={groupX + 2}
                    y={chartHeight - padding.bottom - depthHeight}
                    width={barWidth}
                    height={depthHeight}
                    fill="var(--brand-water-cyan)"
                    rx={2}
                  />
                  {/* Date label */}
                  <text
                    x={groupX}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--text-muted)"
                  >
                    {evt.event_date.substring(5)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </Card>
  );
};

export default HistoricalDepthChart;
