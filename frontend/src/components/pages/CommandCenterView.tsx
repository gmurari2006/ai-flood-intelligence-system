import React from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import StatusIndicator from '../common/StatusIndicator';
import { usePrediction } from '../../context/PredictionContext';
import { useZone } from '../../context/ZoneContext';
import { useInfrastructure } from '../../context/InfrastructureContext';
import { useEvacuation } from '../../context/EvacuationContext';
import { usePrioritization } from '../../context/PrioritizationContext';
import { useAlerts } from '../../context/AlertContext';
import { 
  Cpu, 
  Radio, 
  Waves, 
  CloudRain, 
  BellRing,
  Building2,
  ShieldCheck,
  ListOrdered
} from 'lucide-react';

export const CommandCenterView: React.FC = () => {
  const { currentPrediction, currentExplanation, provenance } = usePrediction();
  const { selectedZone } = useZone();
  const { assets, totalAffected, isLoading: isInfraLoading } = useInfrastructure();
  const { shelters, totalShelters, isLoadingShelters } = useEvacuation();
  const { ranking, isLoading: isMcdaLoading } = usePrioritization();
  const { activeWarningsCount, publicWarnings } = useAlerts();

  const criticalInfraCount = assets.filter((a) => a.vulnerability_status === 'CRITICAL').length;
  const activeSheltersCount = shelters.filter((s) => s.is_active).length;
  const totalShelterCap = shelters.reduce((sum, s) => sum + s.max_capacity, 0);
  const totalShelterOcc = shelters.reduce((sum, s) => sum + s.current_occupancy, 0);
  const topPriorityZone = ranking.length > 0 ? ranking[0] : null;

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Command Center Master Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--space-5)' }}>
        <div>
          <div className="eyebrow-label">
            EOC TACTICAL COMMAND CENTER
          </div>
          <h1 className="page-title">
            Real-Time Flood Intelligence &amp; Emergency Decision Support
          </h1>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>
            Integrated PostGIS Geospatial Observation, Hydrological Heuristics, Infrastructure Impact, and Multi-Hazard Disaster Response Coordination.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Badge variant="heuristic">
            <Cpu size={12} style={{ marginRight: '4px' }} />
            BASELINE HEURISTIC ACTIVE
          </Badge>
          <Badge variant="info">
            <Radio size={12} style={{ marginRight: '4px' }} />
            PHASE 5 DECISION SUPPORT ACTIVE
          </Badge>
        </div>
      </div>

      {/* 2. Multi-Category Operational Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
        
        {/* CATEGORY 1: OBSERVED ENVIRONMENT & SENSORS (Cyan / Blue Accent) */}
        <Card 
          categoryLabel="OBSERVED ENVIRONMENT & TELEMETRY"
          categoryColor="var(--cat-env)"
          title="Hydrological & Meteorological Stream" 
          subtitle="Real-Time Station Feeds & Rainfall Gauges"
          borderAccent="env"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--cat-env-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--cat-env-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CloudRain size={18} style={{ color: 'var(--cat-env)' }} />
                <span style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: '13px' }}>Precipitation Feed</span>
              </div>
              <Badge variant="info">READY / STREAMING</Badge>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--cat-env-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--cat-env-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Waves size={18} style={{ color: 'var(--cat-env)' }} />
                <span style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: '13px' }}>River Gauge Stations</span>
              </div>
              <Badge variant="info">EPSG:4326 POSTGIS</Badge>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '2px' }}>
              Sensory ingestion pipeline configured for high-frequency water stage and rainfall timeseries.
            </div>
          </div>
        </Card>

        {/* CATEGORY 2: AI RISK INTELLIGENCE & XAI (Purple / Indigo Accent) */}
        <Card 
          categoryLabel="AI RISK ASSESSMENT & XAI"
          categoryColor="var(--cat-ai)"
          title={currentPrediction ? `${selectedZone?.name || 'Monitored Basin'}: ${currentPrediction.risk_level} Risk` : "Inference Engine Attribution"} 
          subtitle="Hydrological Heuristic Reasoning Model"
          borderAccent="ai"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 550 }}>Active Inference Mode:</span>
              <Badge variant="heuristic">Deterministic Hydrological Heuristic</Badge>
            </div>
            
            {currentPrediction ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px 12px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                <div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Flood Probability</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-deep-ocean)' }}>
                    {(currentPrediction.flood_probability * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Predicted Depth</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-deep-ocean)' }}>
                    {currentPrediction.predicted_depth_m.toFixed(2)} m
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 550 }}>Model Deployment:</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '12.5px', fontWeight: 600 }}>Heuristic Fallback Baseline</span>
              </div>
            )}

            <div style={{ padding: '10px 12px', backgroundColor: 'var(--cat-ai-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--cat-ai-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--cat-ai)', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                <span>XAI ATTRIBUTION:</span>
                {provenance === 'LIVE_PREDICTION_RUN' && (
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Live Run</span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 550, marginTop: '2px' }}>
                {currentExplanation?.factors ? (
                  `${currentExplanation.factors.length} Contributing Factors Identified (${currentExplanation.explanation_method === 'model_shap' ? 'SHAP' : 'Heuristic'})`
                ) : (
                  'Awaiting prediction explanation run'
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* CATEGORY 3: DECISION SUPPORT SUMMARY */}
        <Card 
          categoryLabel="INFRASTRUCTURE & EVACUATION SUMMARY"
          categoryColor="var(--cat-spatial)"
          title="Operational Assets & Capacity" 
          subtitle="Impact Assessments & Response Readiness"
          borderAccent="spatial"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={16} style={{ color: 'var(--brand-deep-ocean)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Critical Assets</span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 750, color: 'var(--brand-deep-ocean)' }}>
                {isInfraLoading ? 'Loading...' : `${totalAffected || assets.length} monitored (${criticalInfraCount} critical)`}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} style={{ color: 'var(--brand-deep-ocean)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Evacuation Shelters</span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 750, color: 'var(--brand-deep-ocean)' }}>
                {isLoadingShelters ? 'Loading...' : `${activeSheltersCount || totalShelters} active (${totalShelterCap - totalShelterOcc} available)`}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ListOrdered size={16} style={{ color: 'var(--brand-deep-ocean)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>MCDA Priority #1</span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 750, color: 'var(--risk-critical)' }}>
                {isMcdaLoading ? 'Evaluating...' : topPriorityZone ? `${topPriorityZone.zone_id} (${topPriorityZone.priority_tier})` : 'Ranked 50/30/10/10'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Emergency Action Area */}
      <div className="card card-emergency-action">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ padding: '10px', backgroundColor: activeWarningsCount > 0 ? '#FEE2E2' : 'var(--bg-surface-blue)', borderRadius: 'var(--radius-md)', color: activeWarningsCount > 0 ? 'var(--risk-critical)' : 'var(--brand-emergency-blue)' }}>
              <BellRing size={24} />
            </div>
            <div>
              <div className="eyebrow-label" style={{ color: activeWarningsCount > 0 ? 'var(--risk-critical)' : 'var(--brand-emergency-blue)' }}>
                EMERGENCY DISPATCH &amp; BROADCAST CONSOLE
              </div>
              <div style={{ fontSize: '16px', fontWeight: 750, color: 'var(--text-primary)' }}>
                {activeWarningsCount > 0
                  ? `Active Incident State: ${activeWarningsCount} Live Flood Warning${activeWarningsCount > 1 ? 's' : ''} Broadcasted`
                  : 'Active Incident State: No Active Emergency Warnings Dispatched'}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {activeWarningsCount > 0
                  ? `Targeting active regional sectors: ${publicWarnings.map((w) => w.zone_name).join(', ')}. Common Alerting Protocol broadcast active.`
                  : 'All monitored hydrological zones are currently operating within baseline parameters. CAP-v1.2 dispatch console on standby.'}
              </div>
            </div>
          </div>

          <Badge variant={activeWarningsCount > 0 ? 'critical' : 'neutral'}>
            <StatusIndicator status={activeWarningsCount > 0 ? 'healthy' : 'standby'} size="sm" />
            {activeWarningsCount > 0 ? 'BROADCAST ACTIVE' : 'STANDBY MODE'}
          </Badge>
        </div>
      </div>

      {/* 4. Spatial Decision-Support Chain Roadmap */}
      <Card 
        categoryLabel="SYSTEM ARCHITECTURE"
        title="Module 7 Implementation Roadmap" 
        subtitle="Phase 1: Shell &amp; Tokens → Phase 2: GIS Canvas → Phase 3: AI Inference → Phase 4: Decision Support → Phase 5: Alerts"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-blue)', borderRadius: 'var(--radius-md)', border: '1px solid #BAE6FD' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: 750, color: 'var(--brand-emergency-blue)', fontSize: '12px' }}>PHASE 1</span>
              <StatusIndicator status="healthy" size="sm" />
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              EOC design token system, application shell, top bar, RBAC navigation, and UI state primitives.
            </div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-blue)', borderRadius: 'var(--radius-md)', border: '1px solid #BAE6FD' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: 750, color: 'var(--brand-emergency-blue)', fontSize: '12px' }}>PHASE 2</span>
              <StatusIndicator status="healthy" size="sm" />
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Interactive Leaflet GIS map canvas, zone polygon overlays, and choropleth risk rendering.
            </div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-blue)', borderRadius: 'var(--radius-md)', border: '1px solid #BAE6FD' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: 750, color: 'var(--brand-emergency-blue)', fontSize: '12px' }}>PHASE 3</span>
              <StatusIndicator status="healthy" size="sm" />
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              AI Prediction Engine, dynamic forecast execution, transparent XAI factor attributions, and heuristic engine telemetry.
            </div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-blue)', borderRadius: 'var(--radius-md)', border: '1px solid #BAE6FD' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: 750, color: 'var(--brand-emergency-blue)', fontSize: '12px' }}>PHASE 4</span>
              <StatusIndicator status="healthy" size="sm" />
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Critical Infrastructure Impact, Evacuation Shelter Management, Safe Route Planning, and MCDA Decision Prioritization.
            </div>
          </div>

          <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-blue)', borderRadius: 'var(--radius-md)', border: '1px solid #BAE6FD' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: 750, color: 'var(--brand-emergency-blue)', fontSize: '12px' }}>PHASE 5 (ACTIVE)</span>
              <StatusIndicator status="healthy" size="sm" />
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Common Alerting Protocol (CAP) Broadcasts, Auditable Officer Overrides, and Citizen Public Warning Portal.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CommandCenterView;
