import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheService, CacheType } from '../services/cacheService';
import { refreshService } from '../services/refreshService';

export const useOptimizedFetch = ({
  service,
  method,
  params = {},
  fetchFunction,
  cacheType = CacheType.MEDIUM_PRIORITY,
  autoRefresh = true,
  refreshInterval = 300000, // 5 minutes
  enabled = true
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const key = cacheService.generateKey(service, method, params);
  const isMounted = useRef(true);

  const loadData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await cacheService.getDataWithCache({
        service,
        method,
        params,
        fetchFunction,
        cacheType,
        forceRefresh
      });

      if (isMounted.current) {
        setData(result);
        setError(null);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.message || 'Erreur de chargement');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [service, method, params, fetchFunction, cacheType, enabled]);

  // Effet principal
  useEffect(() => {
    if (!enabled) return;

    isMounted.current = true;
    
    // Charger les données
    loadData();

    // Enregistrer pour rafraîchissement automatique
    let cleanupRefresh = null;
    
    if (autoRefresh) {
      cleanupRefresh = refreshService.registerRefreshCallback(
        key,
        () => loadData(true),
        refreshInterval
      );
    }

    return () => {
      isMounted.current = false;
      if (cleanupRefresh) cleanupRefresh();
    };
  }, [loadData, key, autoRefresh, refreshInterval, enabled]);

  // Rafraîchissement manuel
  const refresh = useCallback(() => {
    if (!refreshing) {
      loadData(true);
    }
  }, [loadData, refreshing]);

  // Réinitialiser les erreurs
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // Forcer l'invalidation du cache
  const invalidateCache = useCallback(() => {
    cacheService.invalidateCache(key.split('_')[0]); // Invalider par service
  }, [key]);

  return {
    data,
    loading,
    error,
    refreshing,
    lastUpdated,
    refresh,
    resetError,
    invalidateCache,
    setData // Permettre des mises à jour manuelles optimistes
  };
};

// Hook simplifié pour les cas courants
export const useStudentData = (studentId, method, options = {}) => {
  const { StudentService } = require('../services/studentService');
  
  const fetchFunction = () => {
    switch (method) {
      case 'getStudentGroups':
        return StudentService.getStudentGroups(studentId);
      case 'getStudentAttendance':
        return StudentService.getStudentAttendance(studentId);
      case 'getStudentPayments':
        return StudentService.getStudentPayments(studentId);
      case 'getStudentCalendar':
        return StudentService.getStudentCalendar(studentId);
      case 'getUpcomingSessions':
        return StudentService.getUpcomingSessions(studentId);
      default:
        throw new Error(`Méthode non supportée: ${method}`);
    }
  };

  return useOptimizedFetch({
    service: 'student',
    method,
    params: { studentId },
    fetchFunction,
    cacheType: options.cacheType || CacheType.MEDIUM_PRIORITY,
    autoRefresh: options.autoRefresh ?? true,
    refreshInterval: options.refreshInterval || 300000
  });
};

export const useTeacherData = (teacherId, method, options = {}) => {
  const TeacherService = require('../services/TeacherService').default;
  
  const fetchFunction = () => {
    switch (method) {
      case 'getTeacherGroups':
        return TeacherService.getTeacherGroups(teacherId);
      case 'getAllTeacherSessions':
        return TeacherService.getAllTeacherSessions(teacherId);
      case 'getUpcomingSessions':
        return TeacherService.getUpcomingSessions(teacherId);
      case 'getAttendanceStats':
        return TeacherService.getAttendanceStats(teacherId);
      default:
        throw new Error(`Méthode non supportée: ${method}`);
    }
  };

  return useOptimizedFetch({
    service: 'teacher',
    method,
    params: { teacherId },
    fetchFunction,
    cacheType: options.cacheType || CacheType.MEDIUM_PRIORITY,
    autoRefresh: options.autoRefresh ?? true,
    refreshInterval: options.refreshInterval || 300000
  });
};
