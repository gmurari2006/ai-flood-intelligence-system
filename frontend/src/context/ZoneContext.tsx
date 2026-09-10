/**
 * AI Flood Intelligence System — Zone & Telemetry Synchronization Context.
 * Manages active geographic zone selection, list of monitored basins, and live telemetry feeds.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient } from '../api/client';
import { 
  ZoneSummarySchema, 
  ZoneWeatherViewResponse, 
  ZoneWaterLevelViewResponse 
} from '../types/gis';

interface ZoneContextType {
  zones: ZoneSummarySchema[];
  selectedZoneId: string | null;
  selectedZone: ZoneSummarySchema | null;
  selectedZoneWeather: ZoneWeatherViewResponse | null;
  selectedZoneWaterLevel: ZoneWaterLevelViewResponse | null;
  isLoadingZones: boolean;
  isLoadingTelemetry: boolean;
  zonesError: string | null;
  telemetryError: string | null;
  selectZone: (zoneId: string) => void;
  refreshZones: () => Promise<void>;
  refreshTelemetry: () => Promise<void>;
}

const ZoneContext = createContext<ZoneContextType | undefined>(undefined);

export const ZoneProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [zones, setZones] = useState<ZoneSummarySchema[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedZoneWeather, setSelectedZoneWeather] = useState<ZoneWeatherViewResponse | null>(null);
  const [selectedZoneWaterLevel, setSelectedZoneWaterLevel] = useState<ZoneWaterLevelViewResponse | null>(null);
  const [isLoadingZones, setIsLoadingZones] = useState<boolean>(true);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState<boolean>(false);
  const [zonesError, setZonesError] = useState<string | null>(null);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);

  // Fetch zones on initial mount
  const fetchZones = useCallback(async () => {
    setIsLoadingZones(true);
    setZonesError(null);
    try {
      const response = await apiClient.getZones();
      if (response && response.zones) {
        setZones(response.zones);
        // Default to first zone if none selected yet
        setSelectedZoneId((prev) => prev || (response.zones.length > 0 ? response.zones[0].id : null));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve monitored zones.';
      setZonesError(msg);
      setZones([]);
    } finally {
      setIsLoadingZones(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  // Fetch telemetry whenever selectedZoneId changes
  const fetchTelemetry = useCallback(async (zoneId: string) => {
    setIsLoadingTelemetry(true);
    setTelemetryError(null);
    try {
      const [weatherRes, waterRes] = await Promise.allSettled([
        apiClient.getZoneWeather(zoneId),
        apiClient.getZoneWaterLevels(zoneId),
      ]);

      if (weatherRes.status === 'fulfilled') {
        setSelectedZoneWeather(weatherRes.value);
      } else {
        setSelectedZoneWeather(null);
      }

      if (waterRes.status === 'fulfilled') {
        setSelectedZoneWaterLevel(waterRes.value);
      } else {
        setSelectedZoneWaterLevel(null);
      }

      if (weatherRes.status === 'rejected' && waterRes.status === 'rejected') {
        setTelemetryError('Telemetry observations unavailable for this zone.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Telemetry sync error.';
      setTelemetryError(msg);
      setSelectedZoneWeather(null);
      setSelectedZoneWaterLevel(null);
    } finally {
      setIsLoadingTelemetry(false);
    }
  }, []);

  useEffect(() => {
    if (selectedZoneId) {
      fetchTelemetry(selectedZoneId);
    } else {
      setSelectedZoneWeather(null);
      setSelectedZoneWaterLevel(null);
    }
  }, [selectedZoneId, fetchTelemetry]);

  const selectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
  };

  const selectedZone = zones.find((z) => z.id === selectedZoneId) || null;

  return (
    <ZoneContext.Provider
      value={{
        zones,
        selectedZoneId,
        selectedZone,
        selectedZoneWeather,
        selectedZoneWaterLevel,
        isLoadingZones,
        isLoadingTelemetry,
        zonesError,
        telemetryError,
        selectZone,
        refreshZones: fetchZones,
        refreshTelemetry: () => (selectedZoneId ? fetchTelemetry(selectedZoneId) : Promise.resolve()),
      }}
    >
      {children}
    </ZoneContext.Provider>
  );
};

export const useZone = (): ZoneContextType => {
  const context = useContext(ZoneContext);
  if (!context) {
    throw new Error('useZone must be used within a ZoneProvider');
  }
  return context;
};

export default ZoneContext;
