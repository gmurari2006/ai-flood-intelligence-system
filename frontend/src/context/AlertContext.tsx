/**
 * AI Flood Intelligence System — Alert Context.
 * Manages operational authority alerts, unauthenticated public citizen warnings,
 * client-side alert composition, and officer risk overrides with audit logs.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  AlertSummary,
  AlertStatus,
  AlertCreatePayload,
  AlertCreateResult,
  AlertOverridePayload,
  AlertOverrideResult,
  PublicWarningItem,
} from '../types/alerts';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';
import { useZone } from './ZoneContext';

interface AlertContextType {
  alerts: AlertSummary[];
  totalAlerts: number;
  publicWarnings: PublicWarningItem[];
  activeWarningsCount: number;
  isLoadingAlerts: boolean;
  isLoadingPublicWarnings: boolean;
  error: string | null;
  publicError: string | null;
  statusFilter: AlertStatus | 'ALL';
  zoneFilter: string;
  selectedAlert: AlertSummary | null;
  isPublishing: boolean;
  isOverriding: boolean;
  publishError: string | null;
  overrideError: string | null;
  lastOverrideResult: AlertOverrideResult | null;
  setStatusFilter: (status: AlertStatus | 'ALL') => void;
  setZoneFilter: (zoneId: string) => void;
  setSelectedAlert: (alert: AlertSummary | null) => void;
  fetchAlerts: () => Promise<void>;
  fetchPublicWarnings: () => Promise<void>;
  publishAlert: (payload: AlertCreatePayload) => Promise<AlertCreateResult | null>;
  overrideAlert: (payload: AlertOverridePayload) => Promise<AlertOverrideResult | null>;
  clearOverrideResult: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isOfficer } = useAuth();
  const { selectedZoneId } = useZone();

  const [alerts, setAlerts] = useState<AlertSummary[]>([]);
  const [totalAlerts, setTotalAlerts] = useState<number>(0);
  const [publicWarnings, setPublicWarnings] = useState<PublicWarningItem[]>([]);
  const [activeWarningsCount, setActiveWarningsCount] = useState<number>(0);

  const [isLoadingAlerts, setIsLoadingAlerts] = useState<boolean>(false);
  const [isLoadingPublicWarnings, setIsLoadingPublicWarnings] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [publicError, setPublicError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'ALL'>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<AlertSummary | null>(null);

  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isOverriding, setIsOverriding] = useState<boolean>(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [lastOverrideResult, setLastOverrideResult] = useState<AlertOverrideResult | null>(null);

  // 1. Fetch Public Warnings (Unauthenticated Citizen Feed)
  const fetchPublicWarnings = useCallback(async () => {
    setIsLoadingPublicWarnings(true);
    setPublicError(null);
    try {
      const res = await apiClient.getPublicWarnings();
      setPublicWarnings(res.warnings || []);
      setActiveWarningsCount(res.active_warnings_count || 0);
    } catch (err: any) {
      setPublicError(err.message || 'Failed to retrieve public warning advisories');
    } finally {
      setIsLoadingPublicWarnings(false);
    }
  }, []);

  // 2. Fetch Operational Alerts (Authority Command Center View)
  const fetchAlerts = useCallback(async () => {
    if (!isOfficer) {
      setAlerts([]);
      setTotalAlerts(0);
      return;
    }

    setIsLoadingAlerts(true);
    setError(null);
    try {
      const statusParam = statusFilter !== 'ALL' ? statusFilter : undefined;
      const zoneParam = zoneFilter !== 'ALL' ? zoneFilter : undefined;
      const res = await apiClient.getAuthorityAlerts(statusParam, zoneParam);
      setAlerts(res.alerts || []);
      setTotalAlerts(res.total_alerts || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve operational alert records');
    } finally {
      setIsLoadingAlerts(false);
    }
  }, [isOfficer, statusFilter, zoneFilter]);

  // Initial fetch and dependency trigger
  useEffect(() => {
    fetchPublicWarnings();
  }, [fetchPublicWarnings]);

  useEffect(() => {
    if (isOfficer) {
      fetchAlerts();
    }
  }, [isOfficer, fetchAlerts]);

  // Sync with global zone selector if zone filter is active
  useEffect(() => {
    if (selectedZoneId && zoneFilter !== selectedZoneId && zoneFilter !== 'ALL') {
      setZoneFilter(selectedZoneId);
    }
  }, [selectedZoneId, zoneFilter]);

  // 3. Publish Alert (Immediate POST /api/v1/alerts)
  const publishAlert = useCallback(
    async (payload: AlertCreatePayload): Promise<AlertCreateResult | null> => {
      setIsPublishing(true);
      setPublishError(null);
      try {
        const res = await apiClient.publishAlert(payload);
        // Refresh alerts and public warnings immediately
        await fetchAlerts();
        await fetchPublicWarnings();
        return res;
      } catch (err: any) {
        setPublishError(err.message || 'Failed to publish emergency alert');
        return null;
      } finally {
        setIsPublishing(false);
      }
    },
    [fetchAlerts, fetchPublicWarnings]
  );

  // 4. Override Alert (POST /api/v1/alerts/override with justification)
  const overrideAlert = useCallback(
    async (payload: AlertOverridePayload): Promise<AlertOverrideResult | null> => {
      setIsOverriding(true);
      setOverrideError(null);
      try {
        const res = await apiClient.overrideAlert(payload);
        setLastOverrideResult(res);
        // Refresh authority and public lists
        await fetchAlerts();
        await fetchPublicWarnings();
        return res;
      } catch (err: any) {
        setOverrideError(err.message || 'Failed to commit officer risk override');
        return null;
      } finally {
        setIsOverriding(false);
      }
    },
    [fetchAlerts, fetchPublicWarnings]
  );

  const clearOverrideResult = useCallback(() => {
    setLastOverrideResult(null);
  }, []);

  return (
    <AlertContext.Provider
      value={{
        alerts,
        totalAlerts,
        publicWarnings,
        activeWarningsCount,
        isLoadingAlerts,
        isLoadingPublicWarnings,
        error,
        publicError,
        statusFilter,
        zoneFilter,
        selectedAlert,
        isPublishing,
        isOverriding,
        publishError,
        overrideError,
        lastOverrideResult,
        setStatusFilter,
        setZoneFilter,
        setSelectedAlert,
        fetchAlerts,
        fetchPublicWarnings,
        publishAlert,
        overrideAlert,
        clearOverrideResult,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};

export default AlertContext;
