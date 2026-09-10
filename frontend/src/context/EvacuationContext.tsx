/**
 * AI Flood Intelligence System — Evacuation Context.
 * Manages shelter directory queries, capacity tracking, and safe evacuation route planning.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  EvacuationShelter, 
  EvacuationRoutePlanResponse 
} from '../types/evacuation';
import { apiClient } from '../api/client';
import { useZone } from './ZoneContext';

interface EvacuationContextType {
  shelters: EvacuationShelter[];
  totalShelters: number;
  isLoadingShelters: boolean;
  sheltersError: string | null;
  selectedShelter: EvacuationShelter | null;
  currentRoutePlan: EvacuationRoutePlanResponse | null;
  isPlanningRoute: boolean;
  routePlanError: string | null;
  originLat: number;
  originLon: number;
  avoidFloodZones: boolean;
  setOriginLat: (lat: number) => void;
  setOriginLon: (lon: number) => void;
  setAvoidFloodZones: (avoid: boolean) => void;
  setSelectedShelter: (shelter: EvacuationShelter | null) => void;
  fetchShelters: () => Promise<void>;
  planRoute: (shelterId?: string) => Promise<EvacuationRoutePlanResponse | null>;
  resetRoutePlan: () => void;
}

const EvacuationContext = createContext<EvacuationContextType | undefined>(undefined);

export const EvacuationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedZone, selectedZoneId } = useZone();

  const [shelters, setShelters] = useState<EvacuationShelter[]>([]);
  const [totalShelters, setTotalShelters] = useState<number>(0);
  const [isLoadingShelters, setIsLoadingShelters] = useState<boolean>(false);
  const [sheltersError, setSheltersError] = useState<string | null>(null);
  const [selectedShelter, setSelectedShelter] = useState<EvacuationShelter | null>(null);

  // Route Planning State
  const [currentRoutePlan, setCurrentRoutePlan] = useState<EvacuationRoutePlanResponse | null>(null);
  const [isPlanningRoute, setIsPlanningRoute] = useState<boolean>(false);
  const [routePlanError, setRoutePlanError] = useState<string | null>(null);

  // Coordinates default to active zone centroid if available (e.g. 19.0760, 72.8777)
  const [originLat, setOriginLat] = useState<number>(19.0760);
  const [originLon, setOriginLon] = useState<number>(72.8777);
  const [avoidFloodZones, setAvoidFloodZones] = useState<boolean>(true);

  // Sync origin with selected zone centroid
  useEffect(() => {
    if (selectedZone?.centroid) {
      setOriginLat(selectedZone.centroid.latitude);
      setOriginLon(selectedZone.centroid.longitude);
    }
  }, [selectedZone]);

  const fetchShelters = useCallback(async () => {
    setIsLoadingShelters(true);
    setSheltersError(null);

    try {
      const response = await apiClient.getEvacuationShelters({
        zoneId: selectedZoneId || undefined,
        isActive: true,
        latitude: originLat,
        longitude: originLon,
      });
      setShelters(response.shelters || []);
      setTotalShelters(response.total_shelters || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query evacuation shelters.';
      setSheltersError(msg);
      setShelters([]);
      setTotalShelters(0);
    } finally {
      setIsLoadingShelters(false);
    }
  }, [selectedZoneId, originLat, originLon]);

  useEffect(() => {
    fetchShelters();
  }, [fetchShelters]);

  const planRoute = useCallback(async (shelterIdOverride?: string): Promise<EvacuationRoutePlanResponse | null> => {
    const targetShelterId = shelterIdOverride || selectedShelter?.id;

    setIsPlanningRoute(true);
    setRoutePlanError(null);

    try {
      const response = await apiClient.planEvacuationRoute({
        origin_latitude: originLat,
        origin_longitude: originLon,
        destination_shelter_id: targetShelterId || undefined,
        avoid_flood_zones: avoidFloodZones,
      });

      setCurrentRoutePlan(response);
      return response;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to compute safe evacuation route.';
      setRoutePlanError(msg);
      setCurrentRoutePlan(null);
      return null;
    } finally {
      setIsPlanningRoute(false);
    }
  }, [originLat, originLon, selectedShelter, avoidFloodZones]);

  const resetRoutePlan = useCallback(() => {
    setCurrentRoutePlan(null);
    setRoutePlanError(null);
  }, []);

  return (
    <EvacuationContext.Provider
      value={{
        shelters,
        totalShelters,
        isLoadingShelters,
        sheltersError,
        selectedShelter,
        currentRoutePlan,
        isPlanningRoute,
        routePlanError,
        originLat,
        originLon,
        avoidFloodZones,
        setOriginLat,
        setOriginLon,
        setAvoidFloodZones,
        setSelectedShelter,
        fetchShelters,
        planRoute,
        resetRoutePlan,
      }}
    >
      {children}
    </EvacuationContext.Provider>
  );
};

export const useEvacuation = (): EvacuationContextType => {
  const context = useContext(EvacuationContext);
  if (!context) {
    throw new Error('useEvacuation must be used within an EvacuationProvider');
  }
  return context;
};
