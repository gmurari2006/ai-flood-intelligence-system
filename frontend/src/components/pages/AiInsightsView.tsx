/**
 * AI Flood Intelligence System — AI Risk Intelligence & XAI Insights View.
 * Module 7 Phase 3: AI Prediction Engine, Dynamic Forecast Execution,
 * Factor Attribution (XAI), and Epistemic Model State Transparency.
 */

import React, { useEffect } from 'react';
import { BrainCircuit, Cpu } from 'lucide-react';
import { useZone } from '../../context/ZoneContext';
import { usePrediction } from '../../context/PredictionContext';
import Badge from '../common/Badge';
import { 
  PredictionConsole, 
  RiskAssessmentCard, 
  ExplainabilityPanel, 
  ModelStatusCard 
} from '../ai';

export const AiInsightsView: React.FC = () => {
  const { selectedZoneId } = useZone();
  const { currentPrediction, triggerPrediction, isPredicting } = usePrediction();

  // If a zone is selected and no prediction has been executed yet in the session,
  // trigger a baseline 6h prediction run
  useEffect(() => {
    if (selectedZoneId && !currentPrediction && !isPredicting) {
      triggerPrediction(selectedZoneId, 6);
    }
  }, [selectedZoneId, currentPrediction, isPredicting, triggerPrediction]);

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* 1. Header & Operational Status Cluster */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: 'var(--space-4)',
        }}
      >
        <div>
          <div className="eyebrow-label" style={{ color: 'var(--cat-ai)' }}>
            AI RISK INTELLIGENCE &amp; EXPLAINABILITY
          </div>
          <h1 className="page-title">
            AI Risk Assessment &amp; Transparent Factor Attribution
          </h1>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>
            Multi-Horizon Flood Inundation Prediction, Physical Factor Decomposition, and Epistemic Reliability Metrics.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Badge variant="heuristic">
            <Cpu size={12} style={{ marginRight: '4px' }} />
            HEURISTIC DECISION ENGINE
          </Badge>
          <Badge variant="info">
            <BrainCircuit size={12} style={{ marginRight: '4px' }} />
            XAI FACTOR DECOMPOSITION
          </Badge>
        </div>
      </div>

      {/* 2. Top Prediction Control Console */}
      <PredictionConsole />

      {/* 3. Main 2-Column AI Intelligence Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.25fr)',
          gap: 'var(--space-5)',
          alignItems: 'start',
        }}
        className="ai-insights-grid"
      >
        {/* Left Column: Risk Assessment & Model Engine Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <RiskAssessmentCard />
          <ModelStatusCard />
        </div>

        {/* Right Column: Explainable AI & Factor Decomposition */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <ExplainabilityPanel />
        </div>
      </div>
    </div>
  );
};

export default AiInsightsView;
