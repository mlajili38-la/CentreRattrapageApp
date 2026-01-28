// Service d'actualisation en arrière-plan
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { cacheService, CacheType } from './cacheService';

class RefreshService {
  constructor() {
    this.refreshCallbacks = new Map();
    this.isOnline = true;
    this.isAppActive = true;
    this.intervals = new Map();
    
    this.setupNetworkListener();
    this.setupAppStateListener();
  }

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected;
      
      if (!wasOnline && this.isOnline) {
        console.log('📶 Connexion rétablie - Rafraîchissement des données');
        this.refreshAll();
      }
    });
  }

  setupAppStateListener() {
    AppState.addEventListener('change', (nextAppState) => {
      const wasActive = this.isAppActive;
      this.isAppActive = nextAppState === 'active';
      
      if (!wasActive && this.isAppActive) {
        console.log('📱 Application active - Rafraîchissement doux');
        this.refreshHighPriority();
      }
    });
  }

  registerRefreshCallback(key, callback, interval = 300000) { // 5 minutes par défaut
    this.refreshCallbacks.set(key, callback);
    
    // Démarrer l'intervalle d'actualisation
    if (interval > 0) {
      const intervalId = setInterval(() => {
        if (this.isAppActive && this.isOnline) {
          console.log(`🔄 Rafraîchissement périodique: ${key}`);
          callback();
        }
      }, interval);
      
      this.intervals.set(key, intervalId);
    }
    
    return () => {
      this.unregisterRefreshCallback(key);
    };
  }

  unregisterRefreshCallback(key) {
    this.refreshCallbacks.delete(key);
    
    const intervalId = this.intervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(key);
    }
  }

  async refreshAll() {
    console.log('🔄 Rafraîchissement complet des données');
    
    // Invalider tous les caches
    cacheService.invalidateCache();
    
    // Exécuter tous les callbacks
    const promises = Array.from(this.refreshCallbacks.values()).map(callback => {
      try {
        return callback();
      } catch (error) {
        console.error('❌ Erreur rafraîchissement:', error);
        return Promise.resolve();
      }
    });
    
    return Promise.allSettled(promises);
  }

  async refreshHighPriority() {
    console.log('⚡ Rafraîchissement haute priorité');
    
    // Invalider seulement les caches haute priorité
    const keysToRefresh = [];
    
    // Ici vous pouvez spécifier quelles données rafraîchir
    const highPriorityPatterns = [
      'dashboard_',
      'student_dashboard',
      'teacher_dashboard',
      'attendances_',
      'sessions_'
    ];
    
    highPriorityPatterns.forEach(pattern => {
      cacheService.invalidateCache(pattern);
      keysToRefresh.push(pattern);
    });
    
    return Promise.allSettled(
      keysToRefresh.map(pattern => {
        const callback = this.refreshCallbacks.get(pattern);
        return callback ? callback() : Promise.resolve();
      })
    );
  }

  refreshByPattern(pattern) {
    console.log(`🔄 Rafraîchissement pattern: ${pattern}`);
    cacheService.invalidateCache(pattern);
    
    // Trouver et exécuter les callbacks correspondants
    Array.from(this.refreshCallbacks.keys()).forEach(key => {
      if (key.includes(pattern)) {
        const callback = this.refreshCallbacks.get(key);
        if (callback) callback();
      }
    });
  }

  cleanup() {
    // Nettoyer tous les intervals
    this.intervals.forEach(intervalId => clearInterval(intervalId));
    this.intervals.clear();
    this.refreshCallbacks.clear();
  }
}

export const refreshService = new RefreshService();