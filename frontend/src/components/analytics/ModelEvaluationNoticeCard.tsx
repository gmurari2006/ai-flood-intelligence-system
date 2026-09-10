/**
 * AI Flood Intelligence System — Model Evaluation Transparency Card.
 * Explicitly documents the absence of a trained ML model in production
 * and prevents any fabricated evaluation metrics (accuracy, ROC-AUC, precision, recall).
 */

import React from 'react';
import { Cpu, Info } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';

export const ModelEvaluationNoticeCard: React.FC = () => {
  return (
    <Card
      categoryLabel="AI / ML MODEL PERFORMANCE EVALUATION"
      categoryColor="var(--cat-ai)"
      title="Machine Learning Evaluation Metrics"
      subtitle="Production Model Calibration, Accuracy & Validation Status"
      borderAccent="ai"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
        {/* Prominent Transparency Banner */}
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--bg-surface-purple)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #E9D5FF',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <Cpu size={24} style={{ color: 'var(--brand-ai-purple)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 750, color: '#581C87' }}>
                MODEL PERFORMANCE: NOT AVAILABLE — NO TRAINED PRODUCTION MODEL
              </div>
              <Badge variant="info">HEURISTIC ENGINE ACTIVE</Badge>
            </div>
            <p style={{ fontSize: '12px', color: '#6B21A8', margin: '6px 0 0 0', lineHeight: 1.5 }}>
              The flood intelligence pipeline operates on the 100% deterministic <strong>Hydrological Heuristic Decision Engine</strong>.
              No supervised machine learning model (e.g. XGBoost, Random Forest) has been trained or deployed into the production registry.
            </p>
          </div>
        </div>

        {/* Evaluation Policy Notice */}
        <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <div style={{ fontWeight: 650, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={13} style={{ color: 'var(--text-muted)' }} />
            Policy Regarding Synthetic AI Metrics:
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>
            <li>Statistical metrics (ROC-AUC, Precision, Recall, F1 Score, Confusion Matrices) are intentionally withheld to prevent misleading operational assumptions.</li>
            <li>Real-time factor attribution is calculated deterministically via Physical Hydrological Formulation (AI-06) rather than empirical SHAP approximations.</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default ModelEvaluationNoticeCard;
