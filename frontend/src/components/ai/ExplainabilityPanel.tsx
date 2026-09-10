/**
 * AI Flood Intelligence System — Explainability Panel (XAI).
 * Provides transparent reasoning for flood probability through dynamic factor attribution.
 */

import React from 'react';
import { BrainCircuit, Info, AlertCircle } from 'lucide-react';
import { usePrediction } from '../../context/PredictionContext';
import Card from '../common/Card';
import Badge from '../common/Badge';
import LoadingSkeleton from '../common/LoadingSkeleton';
import FeatureContributionList from './FeatureContributionList';

export const ExplainabilityPanel: React.FC = () => {
  const { currentExplanation, isLoadingExplanation, explanationError, currentPrediction } = usePrediction();

  if (isLoadingExplanation) {
    return (
      <Card
        categoryLabel="EXPLAINABLE AI (XAI)"
        categoryColor="var(--cat-ai)"
        title="Synthesizing Factor Attribution..."
        subtitle="Retrieving Feature Decomposition Matrix"
        borderAccent="ai"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <LoadingSkeleton count={4} height="40px" />
        </div>
      </Card>
    );
  }

  if (explanationError) {
    return (
      <Card
        categoryLabel="EXPLAINABLE AI (XAI)"
        categoryColor="var(--risk-critical)"
        title="Explanation Unavailable"
        subtitle="Factor Attribution Query Failed"
        borderAccent="critical"
      >
        <div style={{ padding: '12px', backgroundColor: 'var(--risk-critical-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--risk-critical-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--risk-critical)', fontWeight: 700, fontSize: '12.5px' }}>
            <AlertCircle size={15} />
            Attribution Error
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {explanationError}
          </p>
        </div>
      </Card>
    );
  }

  const hasExplanation = currentExplanation && currentExplanation.factors && currentExplanation.factors.length > 0;
  const isModelShap = currentExplanation?.explanation_method === 'model_shap';
  const explanationTitle = isModelShap ? 'Machine Learning Feature Attribution (SHAP)' : 'Heuristic Factor Attribution Breakdown';

  return (
    <Card
      categoryLabel="EXPLAINABLE AI (XAI)"
      categoryColor="var(--cat-ai)"
      title={explanationTitle}
      subtitle="Why is this area currently assessed at this risk level?"
      borderAccent="ai"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
        {/* Method Badge & Baseline Probability Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          {isModelShap ? (
            <Badge variant="info">
              <BrainCircuit size={11} style={{ marginRight: '4px' }} />
              SHAP ATTRIBUTION (MODEL)
            </Badge>
          ) : (
            <Badge variant="heuristic">
              <BrainCircuit size={11} style={{ marginRight: '4px' }} />
              HEURISTIC ATTRIBUTION (RULE-BASED)
            </Badge>
          )}

          {currentExplanation && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Baseline Expected: <strong>{(currentExplanation.base_expected_value * 100).toFixed(1)}%</strong> → Final: <strong>{(currentExplanation.final_probability * 100).toFixed(1)}%</strong>
            </div>
          )}
        </div>

        {/* Explainability Content */}
        {hasExplanation ? (
          <>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {isModelShap
                ? 'SHAP values compute the marginal contribution of each observed environmental parameter to the model output probability.'
                : 'Factor attributions decompose the physical impact of observed rainfall accumulation, river stage ratio, terrain elevation, and municipal drainage effectiveness.'}
            </p>

            <FeatureContributionList
              factors={currentExplanation.factors}
              explanationMethod={currentExplanation.explanation_method}
            />
          </>
        ) : (
          <div style={{ padding: '16px 12px', textAlign: 'center', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-default)' }}>
            <Info size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 6px auto' }} />
            <div style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-primary)' }}>
              {currentPrediction ? 'Explanation Not Generated for this Run' : 'Awaiting Prediction Run'}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '300px', margin: '4px auto 0 auto' }}>
              Execute an AI risk prediction from the control console to inspect the underlying feature attribution breakdown.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ExplainabilityPanel;
