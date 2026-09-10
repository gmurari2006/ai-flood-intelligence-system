/**
 * AI Flood Intelligence System — Spatial Risk Command Center.
 * Module 7 Phase 2: Leaflet GIS Map Canvas, PostGIS Vector Layers,
 * Zone Synchronization & Epistemic Environmental Telemetry.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Map, 
  RefreshCw, 
  MapPin, 
  Waves, 
  CloudRain, 
  AlertCircle
} from 'lucide-react';
import { useZone } from '../../context/ZoneContext';
import { apiClient } from '../../api/client';
import { 
  GeoJSONFeatureCollection, 
  LayerConfig, 
  LayerId, 
  RiskZoneProperties 
} from '../../types/gis';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import LoadingSkeleton from '../common/LoadingSkeleton';
import LeafletMapCanvas from '../map/LeafletMapCanvas';
import LayerControls from '../map/LayerControls';
import MapLegend from '../map/MapLegend';

const INITIAL_LAYERS: LayerConfig[] = [
  {
    id: 'risk_zones',
    label: 'Flood Risk Zones (Polygons)',
    backendLayerKey: 'risk_zones',
    enabled: true,
    status: 'AVAILABLE',
    description: 'PostGIS polygon boundaries with choropleth risk styling',
  },
  {
    id: 'infrastructure',
    label: 'Critical Infrastructure',
    backendLayerKey: 'infrastructure',
    enabled: true,
    status: 'AVAILABLE',
    description: 'Hospitals, power stations, shelters & water facilities',
  },
  {
    id: 'river_lines',
    label: 'River Gauge Stations',
    backendLayerKey: 'river_lines',
    enabled: true,
    status: 'AVAILABLE',
    description: 'Hydrological gauge telemetry & danger stage levels',
  },
  {
    id: 'rainfall_heatmap',
    label: 'Rainfall Observations',
    backendLayerKey: 'rainfall_heatmap',
    enabled: true,
    status: 'AVAILABLE',
    description: 'Precipitation accumulation telemetry (1h / 6h / 24h)',
  },
  {
    id: 'evacuation_routes',
    label: 'Evacuation Routing',
    enabled: false,
    status: 'UNAVAILABLE',
    description: 'Road network graph unconfigured in Phase 2',
  },
];

export const RiskMapView: React.FC = () => {
  const {
    zones,
    selectedZoneId,
    selectedZone,
    selectedZoneWeather,
    selectedZoneWaterLevel,
    isLoadingZones,
    isLoadingTelemetry,
    selectZone,
    refreshTelemetry,
  } = useZone();

  const [geoJsonData, setGeoJsonData] = useState<GeoJSONFeatureCollection | null>(null);
  const [layerConfigs, setLayerConfigs] = useState<LayerConfig[]>(INITIAL_LAYERS);
  const [featureCounts, setFeatureCounts] = useState<Record<LayerId, number>>({
    risk_zones: 0,
    infrastructure: 0,
    river_lines: 0,
    rainfall_heatmap: 0,
    evacuation_routes: 0,
  });
  const [isLoadingGis, setIsLoadingGis] = useState<boolean>(true);
  const [gisError, setGisError] = useState<string | null>(null);

  // Fetch GIS Vector Layers strictly from backend
  const fetchGisLayers = useCallback(async () => {
    setIsLoadingGis(true);
    setGisError(null);
    try {
      const data = await apiClient.getRiskMapLayers('all');
      if (data && Array.isArray(data.features)) {
        setGeoJsonData(data);

        // Count features per layer
        const counts: Record<LayerId, number> = {
          risk_zones: data.features.filter((f) => f.properties?.layer === 'risk_zones').length,
          infrastructure: data.features.filter((f) => f.properties?.layer === 'infrastructure').length,
          river_lines: data.features.filter((f) => f.properties?.layer === 'river_lines').length,
          rainfall_heatmap: data.features.filter((f) => f.properties?.layer === 'rainfall_heatmap').length,
          evacuation_routes: 0,
        };
        setFeatureCounts(counts);

        // Update layer availability statuses
        setLayerConfigs((prev) =>
          prev.map((l) => {
            if (l.id === 'evacuation_routes') {
              return { ...l, status: 'UNAVAILABLE' };
            }
            const count = counts[l.id] || 0;
            return {
              ...l,
              status: count > 0 ? 'AVAILABLE' : 'NO_DATA',
            };
          })
        );
      } else {
        setGeoJsonData(null);
        setFeatureCounts({
          risk_zones: 0,
          infrastructure: 0,
          river_lines: 0,
          rainfall_heatmap: 0,
          evacuation_routes: 0,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve PostGIS vector layers.';
      setGisError(msg);
      setGeoJsonData(null);
      setLayerConfigs((prev) =>
        prev.map((l) => (l.id === 'evacuation_routes' ? l : { ...l, status: 'ERROR' }))
      );
    } finally {
      setIsLoadingGis(false);
    }
  }, []);

  useEffect(() => {
    fetchGisLayers();
  }, [fetchGisLayers]);

  // Handle Layer Toggle
  const handleToggleLayer = (layerId: LayerId) => {
    setLayerConfigs((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, enabled: !l.enabled } : l))
    );
  };

  // Find selected zone properties from GIS FeatureCollection if available
  const selectedZoneFeature = geoJsonData?.features.find(
    (f) => f.properties?.layer === 'risk_zones' && (f.properties as unknown as RiskZoneProperties)?.zone_id === selectedZoneId
  );
  const selectedZoneProps = selectedZoneFeature ? (selectedZoneFeature.properties as unknown as RiskZoneProperties) : null;

  const totalFeatures = Object.values(featureCounts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* 1. Command Center Master Header & Zone Selector */}
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
          <div className="eyebrow-label" style={{ color: 'var(--brand-deep-ocean)' }}>
            SPATIAL RISK INTELLIGENCE &amp; VECTOR GIS
          </div>
          <h1 className="page-title">
            Spatial Risk Command Center
          </h1>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>
            PostGIS Spatial Geometries (SRID 4326), Hydrological Gauge Telemetry &amp; Critical Asset Vulnerability Buffers.
          </p>
        </div>

        {/* Zone Selector & GIS Status Cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          {/* Zone Dropdown Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Monitored Basin:
            </span>
            <select
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 12px', fontSize: '12.5px', fontWeight: 650, backgroundColor: '#FFFFFF' }}
              value={selectedZoneId || ''}
              onChange={(e) => selectZone(e.target.value)}
              disabled={isLoadingZones || zones.length === 0}
              aria-label="Select Geographic Zone"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.id})
                </option>
              ))}
              {zones.length === 0 && <option value="">No Monitored Zones Found</option>}
            </select>
          </div>

          {/* GIS Data Status Badge */}
          {gisError ? (
            <Badge variant="critical">
              <AlertCircle size={12} style={{ marginRight: '4px' }} />
              GIS: ERROR
            </Badge>
          ) : isLoadingGis ? (
            <Badge variant="info">
              <RefreshCw size={12} className="spinner-border" style={{ marginRight: '4px', width: '10px', height: '10px' }} />
              GIS: SYNCING...
            </Badge>
          ) : totalFeatures > 0 ? (
            <Badge variant="low">
              <Map size={12} style={{ marginRight: '4px' }} />
              POSTGIS: OPERATIONAL ({totalFeatures} FEATURES)
            </Badge>
          ) : (
            <Badge variant="neutral">
              <MapPin size={12} style={{ marginRight: '4px' }} />
              POSTGIS: NO DATA
            </Badge>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              fetchGisLayers();
              refreshTelemetry();
            }}
            isLoading={isLoadingGis || isLoadingTelemetry}
            icon={<RefreshCw size={12} />}
            title="Refresh PostGIS Layers & Telemetry"
          >
            Refresh Stream
          </Button>
        </div>
      </div>

      {/* 2. Main 2-Panel Layout: Dominant GIS Map (70%) + Side Panel (30%) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: 'var(--space-5)',
          alignItems: 'start',
        }}
        className="gis-command-grid"
      >
        {/* LEFT / CENTER: DOMINANT GIS LEAFLET MAP CANVAS */}
        <div style={{ position: 'relative', width: '100%', minHeight: '620px', height: '620px' }}>
          <LeafletMapCanvas
            geoJsonData={geoJsonData}
            selectedZoneId={selectedZoneId}
            layerConfigs={layerConfigs}
            isLoading={isLoadingGis}
            error={gisError}
            onSelectZone={selectZone}
            onRetry={fetchGisLayers}
          />

          {/* Floating Layer Controls Panel */}
          <LayerControls
            layers={layerConfigs}
            featureCounts={featureCounts}
            onToggleLayer={handleToggleLayer}
          />

          {/* Floating Map Legend */}
          <MapLegend />
        </div>

        {/* RIGHT: DEDICATED SPATIAL TELEMETRY & DECISION SUPPORT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Card 1: Active Zone Risk Assessment */}
          <Card
            categoryLabel="ZONE RISK ASSESSMENT"
            categoryColor="var(--cat-ai)"
            title={selectedZone ? selectedZone.name : 'Select Monitored Basin'}
            subtitle={`Zone Identifier: ${selectedZoneId || 'N/A'}`}
            borderAccent="ai"
          >
            {selectedZoneProps ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Operational Risk Rating:
                  </span>
                  <Badge
                    variant={
                      selectedZoneProps.risk_level === 'CRITICAL'
                        ? 'critical'
                        : selectedZoneProps.risk_level === 'HIGH'
                        ? 'high'
                        : selectedZoneProps.risk_level === 'MODERATE'
                        ? 'moderate'
                        : 'low'
                    }
                  >
                    ● {selectedZoneProps.risk_level}
                  </Badge>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Flood Probability</div>
                    <div style={{ fontSize: '14px', fontWeight: 750, color: selectedZoneProps.risk_color }}>
                      {(selectedZoneProps.flood_probability * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Predicted Depth</div>
                    <div style={{ fontSize: '14px', fontWeight: 750, color: selectedZoneProps.risk_color }}>
                      {selectedZoneProps.water_depth_m.toFixed(2)}m
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Mean Elevation</div>
                    <div style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-primary)' }}>
                      {selectedZoneProps.elevation_mean_m.toFixed(1)}m
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Drainage Score</div>
                    <div style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-primary)' }}>
                      {selectedZoneProps.drainage_capacity_score !== null
                        ? selectedZoneProps.drainage_capacity_score.toFixed(2)
                        : 'N/A'}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Inference Mode:{' '}
                  <strong style={{ color: 'var(--status-heuristic)' }}>
                    Deterministic Hydrological Heuristic
                  </strong>
                </div>
              </div>
            ) : isLoadingGis ? (
              <LoadingSkeleton count={3} height="28px" />
            ) : (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                No active prediction records available for this zone.
              </div>
            )}
          </Card>

          {/* Card 2: Live Observed Environmental Telemetry */}
          <Card
            categoryLabel="OBSERVED TELEMETRY"
            categoryColor="var(--cat-env)"
            title="Hydrological Observations"
            subtitle="River Stage &amp; Precipitation Stream"
            borderAccent="env"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              {/* River Stage Reading */}
              {selectedZoneWaterLevel ? (
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-surface-blue)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #BAE6FD',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Waves size={15} style={{ color: 'var(--brand-emergency-blue)' }} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {selectedZoneWaterLevel.river_name}
                      </span>
                    </div>
                    <Badge
                      variant={
                        selectedZoneWaterLevel.status === 'DANGER'
                          ? 'critical'
                          : selectedZoneWaterLevel.status === 'WARNING'
                          ? 'high'
                          : 'low'
                      }
                    >
                      ● {selectedZoneWaterLevel.status}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Water Stage Level:</span>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brand-deep-ocean)' }}>
                      {selectedZoneWaterLevel.water_level_m.toFixed(2)}m
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    <span>Warning: {selectedZoneWaterLevel.warning_level_m.toFixed(2)}m</span>
                    <span>Danger: {selectedZoneWaterLevel.danger_level_m.toFixed(2)}m</span>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-muted)' }}>
                  River gauge telemetry unavailable for this zone.
                </div>
              )}

              {/* Rainfall Accumulation */}
              {selectedZoneWeather ? (
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--cat-env-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--cat-env-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <CloudRain size={15} style={{ color: 'var(--cat-env)' }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Precipitation Ingestion
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', textAlign: 'center' }}>
                    <div style={{ padding: '4px', backgroundColor: '#FFFFFF', borderRadius: '4px', border: '1px solid var(--border-default)' }}>
                      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontWeight: 600 }}>1h Acc</div>
                      <div style={{ fontSize: '12px', fontWeight: 750, color: 'var(--text-primary)' }}>
                        {selectedZoneWeather.rainfall['1h_mm']?.toFixed(1) || '0.0'}mm
                      </div>
                    </div>
                    <div style={{ padding: '4px', backgroundColor: '#FFFFFF', borderRadius: '4px', border: '1px solid var(--border-default)' }}>
                      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontWeight: 600 }}>6h Acc</div>
                      <div style={{ fontSize: '12px', fontWeight: 750, color: 'var(--text-primary)' }}>
                        {selectedZoneWeather.rainfall['6h_mm']?.toFixed(1) || '0.0'}mm
                      </div>
                    </div>
                    <div style={{ padding: '4px', backgroundColor: '#FFFFFF', borderRadius: '4px', border: '1px solid var(--border-default)' }}>
                      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', fontWeight: 600 }}>24h Acc</div>
                      <div style={{ fontSize: '12px', fontWeight: 750, color: 'var(--cat-env)' }}>
                        {selectedZoneWeather.rainfall['24h_mm']?.toFixed(1) || '0.0'}mm
                      </div>
                    </div>
                  </div>
                  {selectedZoneWeather.temperature_c !== null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      <span>Temp: {selectedZoneWeather.temperature_c.toFixed(1)}°C</span>
                      <span>Humidity: {selectedZoneWeather.humidity_pct?.toFixed(0) || '--'}%</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Rainfall observation stream unavailable for this zone.
                </div>
              )}
            </div>
          </Card>

          {/* Card 3: PostGIS Spatial Metadata */}
          <Card
            categoryLabel="SPATIAL REGISTRY"
            title="PostGIS Engine State"
            subtitle="Coordinate Reference System &amp; Vectors"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', marginTop: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>CRS Projection:</span>
                <strong style={{ color: 'var(--text-primary)' }}>EPSG:4326 (WGS 84)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vector Layers:</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>4 Active</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Monitored Basins:</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{zones.length} Zones</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Infrastructure Points:</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{featureCounts.infrastructure} Assets</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>River Stations:</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{featureCounts.river_lines} Gauges</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RiskMapView;
