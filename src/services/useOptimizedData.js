// Hook personnalisé pour les données optimisées
import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

export const useOptimizedData = (key, fetchFunction, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const { autoRefresh = true, refreshInterval = 300000 } = options;

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      
      const result = await apiService.getData(key, fetchFunction, forceRefresh);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [key, fetchFunction]);

  useEffect(() => {
    loadData();

    // Rafraîchissement automatique
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadData(true);
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [loadData, autoRefresh, refreshInterval]);

  const refresh = () => loadData(true);

  return {
    data,
    loading,
    error,
    refreshing,
    refresh,
  };
};