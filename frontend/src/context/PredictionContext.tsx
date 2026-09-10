/**
 * AI Flood Intelligence System — AI Prediction & XAI Context.
 * Manages dynamic forecast triggers, XAI explanation queries, and data provenance tracking.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  PredictionResponsePayload, 
  PredictionExplainResponsePayload, 
  PredictionProvenance 
} from '../types/prediction';
import { apiClient } from '../api/client';
import { useZone } from './ZoneContext';

interface PredictionContextType {
  currentPrediction: PredictionResponsePayload | null;
  currentExplanation: PredictionExplainResponsePayload | null;
  selectedHorizon: number;
  isPredicting: boolean;
  isLoadingExplanation: boolean;
  predictionError: string | null;
  explanationError: string | null;
  provenance: PredictionProvenance;
  setSelectedHorizon: (horizon: number) => void;
  triggerPrediction: (zoneId?: string, horizon?: number) => Promise<PredictionResponsePayload | null>;
  loadExplanation: (predictionRunId: string) => Promise<void>;
  resetPredictionState: () => void;
}

const PredictionContext = createContext<PredictionContextType | undefined>(undefined);

export const PredictionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedZoneId } = useZone();

  const [currentPrediction, setCurrentPrediction] = useState<PredictionResponsePayload | null>(null);
  const [currentExplanation, setCurrentExplanation] = useState<PredictionExplainResponsePayload | null>(null);
  const [selectedHorizon, setSelectedHorizon] = useState<number>(6);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState<boolean>(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const [provenance, setProvenance] = useState<PredictionProvenance>('AWAITING_EXECUTION');

  // Load XAI Explanation for a specific run ID
  const loadExplanation = useCallback(async (predictionRunId: string) => {
    setIsLoadingExplanation(true);
    setExplanationError(null);
    try {
      const explanation = await apiClient.getPredictionExplanation(predictionRunId);
      setCurrentExplanation(explanation);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve XAI explanation.';
      setExplanationError(msg);
      setCurrentExplanation(null);
    } finally {
      setIsLoadingExplanation(false);
    }
  }, []);

  // Trigger dynamic prediction run
  const triggerPrediction = useCallback(
    async (zoneIdOverride?: string, horizonOverride?: number): Promise<PredictionResponsePayload | null> => {
      const targetZoneId = zoneIdOverride || selectedZoneId;
      const targetHorizon = horizonOverride || selectedHorizon;

      if (!targetZoneId) {
        setPredictionError('No geographic basin selected for prediction.');
        return null;
      }

      setIsPredicting(true);
      setPredictionError(null);
      setExplanationError(null);
      setCurrentExplanation(null);

      try {
        const response = await apiClient.triggerPrediction({
          zone_id: targetZoneId,
          forecast_horizon_hours: targetHorizon,
        });

        setCurrentPrediction(response);
        setProvenance('LIVE_PREDICTION_RUN');

        // Automatically fetch explanation for the newly executed run
        if (response.prediction_run_id) {
          loadExplanation(response.prediction_run_id);
        }

        return response;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Prediction execution failed.';
        setPredictionError(msg);
        setCurrentPrediction(null);
        setProvenance('AWAITING_EXECUTION');
        return null;
      } finally {
        setIsPredicting(false);
      }
    },
    [selectedZoneId, selectedHorizon, loadExplanation]
  );

  const resetPredictionState = useCallback(() => {
    setCurrentPrediction(null);
    setCurrentExplanation(null);
    setPredictionError(null);
    setExplanationError(null);
    setProvenance('AWAITING_EXECUTION');
  }, []);

  return (
    <PredictionContext.Provider
      value={{
        currentPrediction,
        currentExplanation,
        selectedHorizon,
        isPredicting,
        isLoadingExplanation,
        predictionError,
        explanationError,
        provenance,
        setSelectedHorizon,
        triggerPrediction,
        loadExplanation,
        resetPredictionState,
      }}
    >
      {children}
    </PredictionContext.Provider>
  );
};

export const usePrediction = (): PredictionContextType => {
  const context = useContext(PredictionContext);
  if (!context) {
    throw new Error('usePrediction must be used within a PredictionProvider');
  }
  return context;
};
