/**
 * AI Flood Intelligence System — AI Risk Assessment Card Component.
 * Visualizes flood probability, predicted inundation depth, numeric risk score,
 * risk tier, audited heuristic reliability, recommended action, and data provenance.
 */

import React from 'react';
import { 
  ShieldAlert, 
  Info, 
  AlertOctagon, 
  Clock, 
  HelpCircle
} from 'lucide-react';
import { usePrediction } from '../../context/PredictionContext';
import { useZone } from '../../context/ZoneContext';
import Card from '../common/Card';
import Badge from '../common/Badge';
import LoadingSkeleton from '../common/LoadingSkeleton';

export const RiskAssessmentCard: React.FC = () => {
  const { currentPrediction, isPredicting, predictionError, provenance, selectedHorizon } = usePrediction();
  const { selectedZone, selectedZoneId } = useZone();

  if (isPredicting) {
    return (
      <Card
        categoryLabel="AI RISK ASSESSMENT"
        categoryColor="var(--cat-ai)"
        title="Evaluating Risk Parameters..."
        subtitle="Executing Module 3 Hydrological Feature Pipeline"
        borderAccent="ai"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <LoadingSkeleton count={4} height="36px" />
        </div>
      </Card>
    );
  }

  if (predictionError) {
    return (
      <Card
        categoryLabel="AI RISK ASSESSMENT"
        categoryColor="var(--risk-critical)"
        title="Prediction Execution Error"
        subtitle="Hydrological Engine Fault"
        borderAccent="critical"
      >
        <div style={{ padding: '14px', backgroundColor: 'var(--risk-critical-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--risk-critical-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--risk-critical)', fontWeight: 700, fontSize: '13px' }}>
            <AlertOctagon size={16} />
            Execution Failure
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
            {predictionError}
          </p>
        </div>
      </Card>
    );
  }

  // Determine if we have a live prediction run
  const hasPrediction = !!currentPrediction;

  const floodProb = hasPrediction ? currentPrediction.flood_probability : null;
  const depthM = hasPrediction ? currentPrediction.predicted_depth_m : null;
  const riskScore = hasPrediction ? currentPrediction.risk_score_numeric : null;
  const riskLevel = hasPrediction ? currentPrediction.risk_level : null;
  const action = hasPrediction ? currentPrediction.recommended_action : null;
  const reliability = hasPrediction ? currentPrediction.confidence_score : null;
  const inferenceMode = hasPrediction ? currentPrediction.inference_mode : 'heuristic_fallback';
  const executedAt = hasPrediction ? currentPrediction.executed_at : null;

  const isDemoData = hasPrediction ? currentPrediction.is_demo_data : false;

  const riskBadgeVariant = 
    riskLevel === 'CRITICAL' ? 'critical' :
    riskLevel === 'HIGH' ? 'high' :
    riskLevel === 'MODERATE' ? 'moderate' : 'low';

  const riskColor = 
    riskLevel === 'CRITICAL' ? 'var(--risk-critical)' :
    riskLevel === 'HIGH' ? 'var(--risk-high)' :
    riskLevel === 'MODERATE' ? 'var(--risk-moderate)' : 'var(--risk-low)';

  return (
    <Card
      categoryLabel="AI RISK ASSESSMENT"
      categoryColor="var(--cat-ai)"
      title={selectedZone ? selectedZone.name : 'Select Monitored Basin'}
      subtitle={`Basin Code: ${selectedZoneId || 'N/A'}`}
      borderAccent={riskLevel ? (riskLevel.toLowerCase() as 'low' | 'moderate' | 'high' | 'critical') : 'ai'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
        
        {/* 1. Data Provenance Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          {provenance === 'LIVE_PREDICTION_RUN' && executedAt ? (
            isDemoData ? (
              <Badge variant="moderate">
                <AlertOctagon size={11} style={{ marginRight: '4px' }} />
                DEMO DATA — NOT FOR OPERATIONAL USE
              </Badge>
            ) : (
              <Badge variant="heuristic">
                <span className="pulse-dot" style={{ width: '6px', height: '6px', backgroundColor: 'var(--cat-ai)', borderRadius: '50%', display: 'inline-block', marginRight: '5px' }} />
                PROVENANCE: LIVE RUN ({selectedHorizon}h Horizon at {new Date(executedAt).toLocaleTimeString()})
              </Badge>
            )
          ) : (
            <Badge variant="neutral">
              <Clock size={11} style={{ marginRight: '4px' }} />
              PROVENANCE: AWAITING DYNAMIC RUN
            </Badge>
          )}

          {riskLevel && (
            <Badge variant={riskBadgeVariant}>
              ● {riskLevel} RISK TIER
            </Badge>
          )}
        </div>

        {/* Non-operational Demo Data Callout */}
        {isDemoData && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--risk-moderate-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--risk-moderate-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              color: 'var(--risk-moderate)',
              fontWeight: 700,
            }}
          >
            <AlertOctagon size={14} />
            DEMO SCENARIO ACTIVE — METRICS ARE SYNTHETIC AND NOT FOR OPERATIONAL USE
          </div>
        )}

        {hasPrediction ? (
          <>
            {/* 2. Primary Metric Score Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                padding: '12px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
              }}
            >
              {/* Flood Probability */}
              <div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Flood Probability</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: riskColor, marginTop: '2px' }}>
                  {floodProb !== null ? `${(floodProb * 100).toFixed(1)}%` : 'N/A'}
                </div>
                {/* Visual Progress Bar */}
                {floodProb !== null && (
                  <div
                    style={{
                      width: '100%',
                      height: '5px',
                      backgroundColor: 'var(--border-default)',
                      borderRadius: '3px',
                      marginTop: '4px',
                      overflow: 'hidden',
                    }}
                    role="progressbar"
                    aria-valuenow={Math.round(floodProb * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(0, floodProb * 100))}%`,
                        height: '100%',
                        backgroundColor: riskColor,
                        borderRadius: '3px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Predicted Inundation Depth */}
              <div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Predicted Water Depth</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {depthM !== null ? `${depthM.toFixed(2)} m` : 'N/A'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Inundation Above Surface
                </div>
              </div>

              {/* Decision Risk Rating Score */}
              <div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Decision Risk Rating</div>
                <div style={{ fontSize: '15px', fontWeight: 750, color: riskColor, marginTop: '2px' }}>
                  {riskScore !== null ? `${riskScore.toFixed(2)} / 100.0` : 'N/A'}
                </div>
              </div>

              {/* Audited Heuristic Reliability */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <span>Data Reliability</span>
                  <span title="Deterministic heuristic baseline confidence based on sensor telemetry availability; not a calibrated statistical ML interval." style={{ cursor: 'help', display: 'inline-flex', alignItems: 'center' }}>
                    <HelpCircle size={10} />
                  </span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 750, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {reliability !== null ? `${(reliability * 100).toFixed(1)}%` : 'N/A'}
                </div>
              </div>
            </div>

            {/* 3. Recommended Action Callout */}
            {action && (
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 
                    riskLevel === 'CRITICAL' ? 'var(--risk-critical-bg)' :
                    riskLevel === 'HIGH' ? 'var(--risk-high-bg)' :
                    riskLevel === 'MODERATE' ? 'var(--risk-moderate-bg)' : 'var(--risk-low-bg)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${
                    riskLevel === 'CRITICAL' ? 'var(--risk-critical-border)' :
                    riskLevel === 'HIGH' ? 'var(--risk-high-border)' :
                    riskLevel === 'MODERATE' ? 'var(--risk-moderate-border)' : 'var(--risk-low-border)'
                  }`,
                }}
              >
                <div style={{ fontSize: '10.5px', fontWeight: 750, color: riskColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldAlert size={12} />
                  RECOMMENDED OPERATIONAL DIRECTIVE:
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '3px', lineHeight: 1.4 }}>
                  {action}
                </div>
              </div>
            )}

            {/* 4. Inference Engine Mode Tag */}
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-default)', paddingTop: '8px' }}>
              <span>Inference Engine:</span>
              <strong style={{ color: 'var(--cat-ai)' }}>
                {inferenceMode === 'heuristic_fallback' ? 'Deterministic Hydrological Heuristic' : inferenceMode}
              </strong>
            </div>
          </>
        ) : (
          <div style={{ padding: '16px 12px', textAlign: 'center', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-default)' }}>
            <Info size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 6px auto' }} />
            <div style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-primary)' }}>
              No Prediction Executed in this Session
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '280px', margin: '4px auto 0 auto' }}>
              Select a forecast horizon (1h–24h) above and click <strong>Run AI Prediction</strong> to execute hydrological risk evaluation.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RiskAssessmentCard;
