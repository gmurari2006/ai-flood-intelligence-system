/**
 * AI Flood Intelligence System — Historical Analytics & Reporting Context.
 * Manages state for archival flood event queries, latest telemetry snapshots,
 * and multi-dataset CSV/JSON export workflows.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient } from '../api/client';
import { 
  HistoricalFloodEventItem, 
  ExportDataType, 
  ExportFormat, 
  DataExportResponse 
} from '../types/analytics';
import { ZoneWeatherViewResponse, ZoneWaterLevelViewResponse } from '../types/gis';
import { useZone } from './ZoneContext';
import { useAuth } from './AuthContext';

interface AnalyticsContextType {
  historicalEvents: HistoricalFloodEventItem[];
  totalRecordedEvents: number;
  isLoadingHistorical: boolean;
  historicalError: string | null;
  weatherTelemetry: ZoneWeatherViewResponse | null;
  waterLevelTelemetry: ZoneWaterLevelViewResponse | null;
  isLoadingTelemetry: boolean;
  telemetryError: string | null;
  isExporting: boolean;
  exportError: string | null;
  selectedZoneId: string | null;
  startDate: string | null;
  endDate: string | null;
  fetchHistoricalEvents: (zoneId?: string, start?: string, end?: string) => Promise<void>;
  fetchTelemetry: (zoneId: string) => Promise<void>;
  exportDataset: (dataType: ExportDataType, format: ExportFormat) => Promise<DataExportResponse | Blob | null>;
  setFilterZone: (zoneId: string | null) => void;
  setDateRange: (start: string | null, end: string | null) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedZone } = useZone();
  const { isOfficer } = useAuth();

  const [historicalEvents, setHistoricalEvents] = useState<HistoricalFloodEventItem[]>([]);
  const [totalRecordedEvents, setTotalRecordedEvents] = useState<number>(0);
  const [isLoadingHistorical, setIsLoadingHistorical] = useState<boolean>(false);
  const [historicalError, setHistoricalError] = useState<string | null>(null);

  const [weatherTelemetry, setWeatherTelemetry] = useState<ZoneWeatherViewResponse | null>(null);
  const [waterLevelTelemetry, setWaterLevelTelemetry] = useState<ZoneWaterLevelViewResponse | null>(null);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState<boolean>(false);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Fetch historical flood events from GET /api/v1/analytics/historical
  const fetchHistoricalEvents = useCallback(async (zoneId?: string, start?: string, end?: string) => {
    if (!isOfficer) return;
    setIsLoadingHistorical(true);
    setHistoricalError(null);
    try {
      const resp = await apiClient.getHistoricalAnalytics({
        zoneId: zoneId || undefined,
        startDate: start || undefined,
        endDate: end || undefined,
      });
      setHistoricalEvents(resp.historical_events || []);
      setTotalRecordedEvents(resp.total_recorded_events || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query historical flood events';
      setHistoricalError(msg);
      setHistoricalEvents([]);
      setTotalRecordedEvents(0);
    } finally {
      setIsLoadingHistorical(false);
    }
  }, [isOfficer]);

  // Fetch environmental telemetry snapshot for the active zone
  const fetchTelemetry = useCallback(async (zoneId: string) => {
    if (!zoneId) return;
    setIsLoadingTelemetry(true);
    setTelemetryError(null);
    try {
      const [weather, waterLevels] = await Promise.allSettled([
        apiClient.getZoneWeather(zoneId),
        apiClient.getZoneWaterLevels(zoneId),
      ]);

      if (weather.status === 'fulfilled') {
        setWeatherTelemetry(weather.value);
      } else {
        setWeatherTelemetry(null);
      }

      if (waterLevels.status === 'fulfilled') {
        setWaterLevelTelemetry(waterLevels.value);
      } else {
        setWaterLevelTelemetry(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch zone telemetry';
      setTelemetryError(msg);
    } finally {
      setIsLoadingTelemetry(false);
    }
  }, []);

  // Export dataset in CSV or JSON
  const exportDataset = useCallback(async (dataType: ExportDataType, format: ExportFormat): Promise<DataExportResponse | Blob | null> => {
    if (!isOfficer) {
      setExportError('Export access restricted to Disaster Officers and Administrators.');
      return null;
    }
    setIsExporting(true);
    setExportError(null);
    try {
      const result = await apiClient.exportData(dataType, format);

      if (format === 'csv' && result instanceof Blob) {
        // Trigger browser file download
        const url = window.URL.createObjectURL(result);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `flood_intelligence_${dataType}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Data export execution failed';
      setExportError(msg);
      return null;
    } finally {
      setIsExporting(false);
    }
  }, [isOfficer]);

  // Sync selected zone from global context
  useEffect(() => {
    if (selectedZone?.id) {
      setSelectedZoneId(selectedZone.id);
      fetchTelemetry(selectedZone.id);
    }
  }, [selectedZone, fetchTelemetry]);

  // Query historical events on filter change
  useEffect(() => {
    if (isOfficer) {
      fetchHistoricalEvents(selectedZoneId || undefined, startDate || undefined, endDate || undefined);
    }
  }, [isOfficer, selectedZoneId, startDate, endDate, fetchHistoricalEvents]);

  const setFilterZone = (zoneId: string | null) => {
    setSelectedZoneId(zoneId);
  };

  const setDateRange = (start: string | null, end: string | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <AnalyticsContext.Provider
      value={{
        historicalEvents,
        totalRecordedEvents,
        isLoadingHistorical,
        historicalError,
        weatherTelemetry,
        waterLevelTelemetry,
        isLoadingTelemetry,
        telemetryError,
        isExporting,
        exportError,
        selectedZoneId,
        startDate,
        endDate,
        fetchHistoricalEvents,
        fetchTelemetry,
        exportDataset,
        setFilterZone,
        setDateRange,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};
