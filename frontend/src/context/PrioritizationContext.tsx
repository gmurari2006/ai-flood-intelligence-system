/**
 * AI Flood Intelligence System — Prioritization Context.
 * Manages deterministic Multi-Criteria Decision Analysis (AI-10 MCDA) ranking queue
 * and criteria decomposition breakdown.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  ZonePriorityRank, 
  MCDAWeightsConfig, 
  AlertPrioritizationResponse 
} from '../types/mcda';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';

interface PrioritizationContextType {
  ranking: ZonePriorityRank[];
  weightsApplied: MCDAWeightsConfig | null;
  evaluatedAt: string | null;
  totalZonesEvaluated: number;
  isLoading: boolean;
  error: string | null;
  selectedRankedZone: ZonePriorityRank | null;
  setSelectedRankedZone: (zone: ZonePriorityRank | null) => void;
  fetchPrioritization: () => Promise<void>;
}

const PrioritizationContext = createContext<PrioritizationContextType | undefined>(undefined);

export const PrioritizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isOfficer } = useAuth();

  const [ranking, setRanking] = useState<ZonePriorityRank[]>([]);
  const [weightsApplied, setWeightsApplied] = useState<MCDAWeightsConfig | null>(null);
  const [evaluatedAt, setEvaluatedAt] = useState<string | null>(null);
  const [totalZonesEvaluated, setTotalZonesEvaluated] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRankedZone, setSelectedRankedZone] = useState<ZonePriorityRank | null>(null);

  const fetchPrioritization = useCallback(async () => {
    // If not authenticated as officer, skip protected call
    if (!isOfficer) {
      setRanking([]);
      setWeightsApplied(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Calls with official approved 50/30/10/10 operational weights
      const response: AlertPrioritizationResponse = await apiClient.getAlertPrioritization({
        weightRisk: 0.50,
        weightPop: 0.30,
        weightInfra: 0.10,
        weightRiver: 0.10,
      });

      setRanking(response.ranking || []);
      setWeightsApplied(response.weights_applied);
      setEvaluatedAt(response.evaluated_at);
      setTotalZonesEvaluated(response.total_zones_evaluated || 0);

      // Auto-select rank 1 zone if nothing selected
      if (response.ranking && response.ranking.length > 0) {
        setSelectedRankedZone((prev) => prev || response.ranking[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve MCDA prioritization queue.';
      setError(msg);
      setRanking([]);
      setWeightsApplied(null);
    } finally {
      setIsLoading(false);
    }
  }, [isOfficer]);

  useEffect(() => {
    fetchPrioritization();
  }, [fetchPrioritization]);

  return (
    <PrioritizationContext.Provider
      value={{
        ranking,
        weightsApplied,
        evaluatedAt,
        totalZonesEvaluated,
        isLoading,
        error,
        selectedRankedZone,
        setSelectedRankedZone,
        fetchPrioritization,
      }}
    >
      {children}
    </PrioritizationContext.Provider>
  );
};

export const usePrioritization = (): PrioritizationContextType => {
  const context = useContext(PrioritizationContext);
  if (!context) {
    throw new Error('usePrioritization must be used within a PrioritizationProvider');
  }
  return context;
};
