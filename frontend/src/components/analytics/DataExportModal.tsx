/**
 * AI Flood Intelligence System — Operational Data Export Modal.
 * Enables authorized Disaster Officers to export system datasets in RFC 4180 CSV
 * or structured JSON from GET /api/v1/analytics/export.
 */

import React, { useState } from 'react';
import { Download, CheckCircle2, AlertOctagon, Info } from 'lucide-react';
import { useAnalytics } from '../../context/AnalyticsContext';
import { ExportDataType, ExportFormat, DataExportResponse } from '../../types/analytics';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DATASETS: { label: string; value: ExportDataType; description: string }[] = [
  { label: 'Risk Predictions & Probabilities', value: 'predictions', description: 'Model inference runs, flood probabilities, predicted water depths, and risk scores.' },
  { label: 'Operational Emergency Alerts', value: 'alerts', description: 'Broadcast alert history, severities, issued timestamps, and lifecycle status.' },
  { label: 'Critical Infrastructure Inventory', value: 'infrastructure', description: 'Hospitals, substations, schools, baseline elevations, and asset capacities.' },
  { label: 'Historical Flood Archives', value: 'historical', description: 'Archival deluge records, peak recorded water depths, and storm precipitation.' },
  { label: 'Geographic Zone Boundaries', value: 'zones', description: 'PostGIS spatial attributes, mean elevations, drainage capacity, and demographics.' },
];

export const DataExportModal: React.FC<DataExportModalProps> = ({ isOpen, onClose }) => {
  const { exportDataset, isExporting, exportError } = useAnalytics();

  const [selectedDataset, setSelectedDataset] = useState<ExportDataType>('predictions');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [jsonExportResult, setJsonExportResult] = useState<DataExportResponse | null>(null);

  const handleExecuteExport = async () => {
    setJsonExportResult(null);
    const result = await exportDataset(selectedDataset, selectedFormat);
    if (result && !(result instanceof Blob)) {
      setJsonExportResult(result);
    }
  };

  const handleClose = () => {
    setJsonExportResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Export Operational Intelligence Datasets"
      maxWidth="560px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Button variant="secondary" size="sm" onClick={handleClose} disabled={isExporting}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExecuteExport}
            isLoading={isExporting}
            disabled={isExporting}
            icon={<Download size={14} />}
          >
            Export {selectedFormat.toUpperCase()} Stream
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Dataset Selection */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Select Target Operational Dataset (FR-15)
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {DATASETS.map((ds) => (
              <label
                key={ds.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: selectedDataset === ds.value ? '1.5px solid var(--brand-emergency-blue)' : '1px solid var(--border-default)',
                  backgroundColor: selectedDataset === ds.value ? 'var(--bg-surface-blue)' : 'var(--bg-app)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="radio"
                  name="dataset"
                  value={ds.value}
                  checked={selectedDataset === ds.value}
                  onChange={() => setSelectedDataset(ds.value)}
                  style={{ marginTop: '2px' }}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-primary)' }}>
                    {ds.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {ds.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Select Output Serialization Format
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <button
              type="button"
              onClick={() => setSelectedFormat('csv')}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: selectedFormat === 'csv' ? '2px solid var(--brand-emergency-blue)' : '1px solid var(--border-default)',
                backgroundColor: selectedFormat === 'csv' ? 'var(--bg-surface-blue)' : 'var(--bg-app)',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--brand-deep-ocean)' }}>
                RFC 4180 CSV
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Direct attachment file download for spreadsheet analysis
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFormat('json')}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: selectedFormat === 'json' ? '2px solid var(--brand-emergency-blue)' : '1px solid var(--border-default)',
                backgroundColor: selectedFormat === 'json' ? 'var(--bg-surface-blue)' : 'var(--bg-app)',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--brand-deep-ocean)' }}>
                Structured JSON
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Programmatic payload with timestamped audit metadata
              </div>
            </button>
          </div>
        </div>

        {/* Export Success Result (JSON View) */}
        {jsonExportResult && (
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--risk-low-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--risk-low-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--risk-low)', fontWeight: 700, fontSize: '13px' }}>
              <CheckCircle2 size={16} />
              JSON Export Generated Successfully
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Extracted <strong>{jsonExportResult.record_count} records</strong> from dataset <code>{jsonExportResult.data_type}</code> at {jsonExportResult.exported_at}.
            </div>
          </div>
        )}

        {/* Export Error */}
        {exportError && (
          <div style={{ padding: '10px 12px', backgroundColor: 'var(--risk-critical-bg)', color: 'var(--risk-critical)', borderRadius: 'var(--radius-md)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertOctagon size={15} />
            {exportError}
          </div>
        )}

        {/* Integrity Notice */}
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Info size={12} />
          <span>Queries execute directly against production PostgreSQL tables. No client-side modifications applied.</span>
        </div>
      </div>
    </Modal>
  );
};

export default DataExportModal;
