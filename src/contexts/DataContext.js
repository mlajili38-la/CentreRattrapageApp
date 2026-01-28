// Contexte pour la gestion des données globales
import React, { createContext, useContext, useEffect } from 'react';
import { refreshService } from '../services/refreshService';
import { cacheService } from '../services/cacheService';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData doit être utilisé dans DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  
  const refreshAllData = () => {
    console.log('🔄 Rafraîchissement manuel toutes les données');
    return refreshService.refreshAll();
  };
  
  const refreshStudentData = (studentId) => {
    refreshService.refreshByPattern(`student_${studentId}`);
  };
  
  const refreshTeacherData = (teacherId) => {
    refreshService.refreshByPattern(`teacher_${teacherId}`);
  };
  
  const clearAllCache = () => {
    cacheService.invalidateCache();
    console.log('🧹 Tous les caches nettoyés');
  };
  
  const getCacheStats = () => {
    return cacheService.getMemoryCacheStats();
  };
  
  useEffect(() => {
    // Initialiser le service de rafraîchissement
    console.log('🚀 Initialisation DataProvider');
    
    return () => {
      // Nettoyer à la destruction
      refreshService.cleanup();
    };
  }, []);
  
  const value = {
    refreshAllData,
    refreshStudentData,
    refreshTeacherData,
    clearAllCache,
    getCacheStats
  };
  
  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};