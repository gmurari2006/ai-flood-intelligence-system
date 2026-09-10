/**
 * AI Flood Intelligence System — Infrastructure Context.
 * Manages vulnerable infrastructure asset queries, filtering by zone and risk level,
 * and asset selection for detail inspection.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { InfrastructureAsset, VulnerabilityStatus } from '../types/infrastructure';
import { apiClient } from '../api/client';
import { useZone } from './ZoneContext';
import { useAuth } from './AuthContext';

interface InfrastructureContextType {
  assets: InfrastructureAsset[];
  totalAffected: number;
  isLoading: boolean;
  error: string | null;
  selectedAsset: InfrastructureAsset | null;
  minRiskFilter: VulnerabilityStatus | 'ALL';
  searchTerm: string;
  assetTypeFilter: string;
  setSelectedAsset: (asset: InfrastructureAsset | null) => void;
  setMinRiskFilter: (filter: VulnerabilityStatus | 'ALL') => void;
  setSearchTerm: (term: string) => void;
  setAssetTypeFilter: (type: string) => void;
  refreshInfrastructure: () => Promise<void>;
}

const InfrastructureContext = createContext<InfrastructureContextType | undefined>(undefined);

export const InfrastructureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedZoneId } = useZone();
  const { isOfficer } = useAuth();

  const [assets, setAssets] = useState<InfrastructureAsset[]>([]);
  const [totalAffected, setTotalAffected] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<InfrastructureAsset | null>(null);

  // Filters
  const [minRiskFilter, setMinRiskFilter] = useState<VulnerabilityStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('ALL');

  const fetchInfrastructure = useCallback(async () => {
    // If not authenticated as officer, skip protected API call
    if (!isOfficer) {
      setAssets([]);
      setTotalAffected(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const riskParam = minRiskFilter === 'ALL' ? undefined : minRiskFilter;
      const response = await apiClient.getVulnerableInfrastructure(
        selectedZoneId || undefined,
        riskParam
      );
      setAssets(response.assets || []);
      setTotalAffected(response.total_affected_assets || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query vulnerable infrastructure.';
      setError(msg);
      setAssets([]);
      setTotalAffected(0);
    } finally {
      setIsLoading(false);
    }
  }, [selectedZoneId, minRiskFilter, isOfficer]);

  useEffect(() => {
    fetchInfrastructure();
  }, [fetchInfrastructure]);

  return (
    <InfrastructureContext.Provider
      value={{
        assets,
        totalAffected,
        isLoading,
        error,
        selectedAsset,
        minRiskFilter,
        searchTerm,
        assetTypeFilter,
        setSelectedAsset,
        setMinRiskFilter,
        setSearchTerm,
        setAssetTypeFilter,
        refreshInfrastructure: fetchInfrastructure,
      }}
    >
      {children}
    </InfrastructureContext.Provider>
  );
};

export const useInfrastructure = (): InfrastructureContextType => {
  const context = useContext(InfrastructureContext);
  if (!context) {
    throw new Error('useInfrastructure must be used within an InfrastructureProvider');
  }
  return context;
};
