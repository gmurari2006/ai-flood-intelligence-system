/**
 * AI Flood Intelligence System — Leaflet Map Canvas Component.
 * Implements strict PostGIS GeoJSON vector rendering, risk choropleth styling,
 * custom SVG markers for telemetry & infrastructure, and zero-fabrication bounds handling.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  GeoJSONFeatureCollection,
  RiskZoneProperties,
  InfrastructureProperties,
  RiverGaugeProperties,
  RainfallProperties,
  LayerConfig,
  LayerId,
} from '../../types/gis';
import {
  createZonePopupContent,
  createInfrastructurePopupContent,
  createRiverGaugePopupContent,
  createRainfallPopupContent,
} from './MapPopup';
import MapEmptyState from './MapEmptyState';

interface LeafletMapCanvasProps {
  geoJsonData: GeoJSONFeatureCollection | null;
  selectedZoneId: string | null;
  layerConfigs: LayerConfig[];
  isLoading: boolean;
  error: string | null;
  onSelectZone: (zoneId: string) => void;
  onRetry?: () => void;
}

export const LeafletMapCanvas: React.FC<LeafletMapCanvasProps> = ({
  geoJsonData,
  selectedZoneId,
  layerConfigs,
  isLoading,
  error,
  onSelectZone,
  onRetry,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    risk_zones: L.GeoJSON | null;
    infrastructure: L.GeoJSON | null;
    river_lines: L.GeoJSON | null;
    rainfall_heatmap: L.GeoJSON | null;
  }>({
    risk_zones: null,
    infrastructure: null,
    river_lines: null,
    rainfall_heatmap: null,
  });

  const [hasValidGeometry, setHasValidGeometry] = useState<boolean>(true);

  // Initialize Map Instance on mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      minZoom: 2,
      maxZoom: 19,
    });

    // Clean Positron Light Tiles matching approved Light Theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution:
        '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    }).addTo(map);

    L.control.zoom({ position: 'bottomleft' }).addTo(map);
    L.control
      .attribution({ position: 'bottomright', prefix: false })
      .addAttribution(
        '&copy; <a href="https://carto.com/">CARTO</a> | PostGIS Vector Stream'
      )
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Helper to create custom infrastructure HTML markers
  const createInfrastructureIcon = (props: InfrastructureProperties) => {
    const isCritical = props.vulnerability_status === 'CRITICAL';
    const isAtRisk = props.vulnerability_status === 'AT_RISK';
    const borderColor = isCritical ? '#EF4444' : isAtRisk ? '#F97316' : '#10B981';
    const bgTint = isCritical ? 'rgba(239, 68, 68, 0.15)' : isAtRisk ? 'rgba(249, 115, 22, 0.15)' : 'rgba(16, 185, 129, 0.15)';

    let iconSymbol = '🏛️';
    if (props.asset_type?.toLowerCase().includes('hospital')) iconSymbol = '🏥';
    else if (props.asset_type?.toLowerCase().includes('power') || props.asset_type?.toLowerCase().includes('substation')) iconSymbol = '⚡';
    else if (props.asset_type?.toLowerCase().includes('water')) iconSymbol = '💧';

    return L.divIcon({
      className: 'custom-infra-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FFFFFF;
          border: 2px solid ${borderColor};
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          font-size: 15px;
          cursor: pointer;
        ">
          <span style="background-color: ${bgTint}; width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
            ${iconSymbol}
          </span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    });
  };

  // Helper to create custom River Gauge HTML markers
  const createRiverGaugeIcon = (props: RiverGaugeProperties) => {
    const isDanger = props.water_level_m >= props.danger_level_m;
    const isWarning = props.water_level_m >= props.warning_level_m;
    const markerColor = isDanger ? '#EF4444' : isWarning ? '#F97316' : 'var(--brand-emergency-blue)';

    return L.divIcon({
      className: 'custom-gauge-marker',
      html: `
        <div style="
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          background: #FFFFFF;
          border: 2px solid ${markerColor};
          border-radius: 16px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          font-size: 11px;
          font-weight: 750;
          color: var(--text-primary);
          cursor: pointer;
          white-space: nowrap;
        ">
          <span style="color: ${markerColor};">💧</span>
          <span>${props.water_level_m.toFixed(2)}m</span>
        </div>
      `,
      iconSize: [64, 24],
      iconAnchor: [32, 12],
      popupAnchor: [0, -14],
    });
  };

  // Helper to create custom Rainfall HTML markers
  const createRainfallIcon = (props: RainfallProperties) => {
    return L.divIcon({
      className: 'custom-rain-marker',
      html: `
        <div style="
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 3px 7px;
          background: var(--cat-env-bg);
          border: 1.5px solid var(--cat-env);
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(14, 165, 199, 0.2);
          font-size: 10.5px;
          font-weight: 700;
          color: var(--brand-deep-ocean);
          cursor: pointer;
        ">
          <span>🌧️</span>
          <span>${props.rainfall_24h_mm.toFixed(1)}mm</span>
        </div>
      `,
      iconSize: [60, 22],
      iconAnchor: [30, 11],
      popupAnchor: [0, -13],
    });
  };

  // Update Vector Layers & Fit Bounds strictly from actual backend data
  const updateMapLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing layer instances
    Object.values(layersRef.current).forEach((layer) => {
      if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    layersRef.current = {
      risk_zones: null,
      infrastructure: null,
      river_lines: null,
      rainfall_heatmap: null,
    };

    if (!geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) {
      setHasValidGeometry(false);
      return;
    }

    setHasValidGeometry(true);

    const isLayerEnabled = (id: LayerId) => {
      const conf = layerConfigs.find((c) => c.id === id);
      return conf ? conf.enabled && conf.status === 'AVAILABLE' : false;
    };

    // Separate features by layer
    const zoneFeatures = geoJsonData.features.filter((f) => f.properties?.layer === 'risk_zones');
    const infraFeatures = geoJsonData.features.filter((f) => f.properties?.layer === 'infrastructure');
    const riverFeatures = geoJsonData.features.filter((f) => f.properties?.layer === 'river_lines');
    const rainFeatures = geoJsonData.features.filter((f) => f.properties?.layer === 'rainfall_heatmap');

    let boundsToFit: L.LatLngBounds | null = null;

    // 1. Risk Zones Polygon Layer
    if (zoneFeatures.length > 0) {
      const zoneGeoJson = L.geoJSON(
        { type: 'FeatureCollection', features: zoneFeatures } as unknown as GeoJSON.GeoJsonObject,
        {
          style: (feature) => {
            const props = feature?.properties as unknown as RiskZoneProperties;
            const isSelected = selectedZoneId === props?.zone_id;
            const color = props?.risk_color || '#10B981';

            return {
              fillColor: color,
              fillOpacity: isSelected ? 0.55 : 0.35,
              color: color,
              weight: isSelected ? 3.5 : 2,
              dashArray: isSelected ? '4, 4' : undefined,
            };
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties as unknown as RiskZoneProperties;
            layer.bindPopup(createZonePopupContent(props), {
              className: 'custom-leaflet-popup',
              maxWidth: 320,
            });

            layer.on({
              mouseover: (e) => {
                const target = e.target;
                target.setStyle({
                  fillOpacity: 0.65,
                  weight: 3,
                });
              },
              mouseout: (e) => {
                const target = e.target;
                const isSelected = selectedZoneId === props?.zone_id;
                target.setStyle({
                  fillOpacity: isSelected ? 0.55 : 0.35,
                  weight: isSelected ? 3.5 : 2,
                });
              },
              click: () => {
                if (props?.zone_id) {
                  onSelectZone(props.zone_id);
                }
              },
            });
          },
        }
      );

      layersRef.current.risk_zones = zoneGeoJson;
      if (isLayerEnabled('risk_zones')) {
        zoneGeoJson.addTo(map);
      }

      // If a specific zone is selected, calculate its bounds
      if (selectedZoneId) {
        const selectedFeature = zoneFeatures.find((f) => (f.properties as unknown as RiskZoneProperties)?.zone_id === selectedZoneId);
        if (selectedFeature) {
          const selectedLayer = L.geoJSON(selectedFeature as unknown as GeoJSON.GeoJsonObject);
          const b = selectedLayer.getBounds();
          if (b.isValid()) {
            boundsToFit = b;
          }
        }
      }

      // If no specific zone selected yet or bounds not resolved, fit all zone boundaries
      if (!boundsToFit) {
        const allBounds = zoneGeoJson.getBounds();
        if (allBounds.isValid()) {
          boundsToFit = allBounds;
        }
      }
    }

    // 2. Infrastructure Point Layer
    if (infraFeatures.length > 0) {
      const infraGeoJson = L.geoJSON(
        { type: 'FeatureCollection', features: infraFeatures } as unknown as GeoJSON.GeoJsonObject,
        {
          pointToLayer: (feature, latlng) => {
            const props = feature.properties as unknown as InfrastructureProperties;
            return L.marker(latlng, {
              icon: createInfrastructureIcon(props),
              title: props.name,
            });
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties as unknown as InfrastructureProperties;
            layer.bindPopup(createInfrastructurePopupContent(props), {
              className: 'custom-leaflet-popup',
              maxWidth: 320,
            });
          },
        }
      );

      layersRef.current.infrastructure = infraGeoJson;
      if (isLayerEnabled('infrastructure')) {
        infraGeoJson.addTo(map);
      }
    }

    // 3. River Gauges Point Layer
    if (riverFeatures.length > 0) {
      const riverGeoJson = L.geoJSON(
        { type: 'FeatureCollection', features: riverFeatures } as unknown as GeoJSON.GeoJsonObject,
        {
          pointToLayer: (feature, latlng) => {
            const props = feature.properties as unknown as RiverGaugeProperties;
            return L.marker(latlng, {
              icon: createRiverGaugeIcon(props),
              title: `${props.river_name} (${props.gauge_station_id})`,
            });
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties as unknown as RiverGaugeProperties;
            layer.bindPopup(createRiverGaugePopupContent(props), {
              className: 'custom-leaflet-popup',
              maxWidth: 320,
            });
          },
        }
      );

      layersRef.current.river_lines = riverGeoJson;
      if (isLayerEnabled('river_lines')) {
        riverGeoJson.addTo(map);
      }
    }

    // 4. Rainfall Heatmap Point Layer
    if (rainFeatures.length > 0) {
      const rainGeoJson = L.geoJSON(
        { type: 'FeatureCollection', features: rainFeatures } as unknown as GeoJSON.GeoJsonObject,
        {
          pointToLayer: (feature, latlng) => {
            const props = feature.properties as unknown as RainfallProperties;
            return L.marker(latlng, {
              icon: createRainfallIcon(props),
              title: `Rainfall: ${props.zone_id}`,
            });
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties as unknown as RainfallProperties;
            layer.bindPopup(createRainfallPopupContent(props), {
              className: 'custom-leaflet-popup',
              maxWidth: 300,
            });
          },
        }
      );

      layersRef.current.rainfall_heatmap = rainGeoJson;
      if (isLayerEnabled('rainfall_heatmap')) {
        rainGeoJson.addTo(map);
      }
    }

    // Fit map bounds strictly from valid geometries
    if (boundsToFit && boundsToFit.isValid()) {
      map.fitBounds(boundsToFit, {
        padding: [30, 30],
        maxZoom: 14,
      });
    }
  }, [geoJsonData, selectedZoneId, layerConfigs, onSelectZone]);

  useEffect(() => {
    updateMapLayers();
  }, [updateMapLayers]);

  return (
    <div className="leaflet-map-wrapper">
      <div id="eoc-map-canvas" ref={containerRef} className="leaflet-map-canvas" />

      {/* Loading Skeleton Indicator */}
      {isLoading && (
        <div className="map-loading-overlay">
          <div className="map-loading-indicator">
            <span className="spinner-border" />
            <span style={{ fontSize: '13px', fontWeight: 650, color: 'var(--brand-deep-ocean)' }}>
              Loading PostGIS Vector Stream...
            </span>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && !isLoading && (
        <MapEmptyState
          type="error"
          title="GIS Vector Stream Unavailable"
          message={error}
          onRetry={onRetry}
        />
      )}

      {/* Zero Geometry Empty State (No Fabricated Center) */}
      {!isLoading && !error && !hasValidGeometry && (
        <MapEmptyState
          type="empty"
          title="No Spatial Geometry Available"
          message="No PostGIS vector boundaries or telemetry points are currently registered for the selected zone."
          onRetry={onRetry}
        />
      )}
    </div>
  );
};

export default LeafletMapCanvas;
