// Service centralisé pour la gestion des données avec cache et rafraîchissement intelligent
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const CACHE_PREFIX = '@cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class ApiService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  async getData(key, fetchFunction, forceRefresh = false) {
    // Vérifier si une requête est déjà en cours pour cette clé
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Essayer d'abord le cache en mémoire
    if (!forceRefresh && this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }

    // Ensuite le cache AsyncStorage
    if (!forceRefresh) {
      const stored = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < CACHE_DURATION) {
          this.cache.set(key, { data, timestamp });
          return data;
        }
      }
    }

    // Sinon, fetch depuis l'API
    const promise = (async () => {
      try {
        const data = await fetchFunction();
        
        // Mettre en cache
        const cacheItem = {
          data,
          timestamp: Date.now()
        };
        
        this.cache.set(key, cacheItem);
        await AsyncStorage.setItem(
          CACHE_PREFIX + key,
          JSON.stringify(cacheItem)
        );
        
        this.pendingRequests.delete(key);
        return data;
      } catch (error) {
        this.pendingRequests.delete(key);
        throw error;
      }
    })();

    this.pendingRequests.set(key, promise);
    return promise;
  }

  invalidateCache(key) {
    this.cache.delete(key);
    AsyncStorage.removeItem(CACHE_PREFIX + key);
  }

  invalidateAll() {
    this.cache.clear();
    // Supprimer tous les éléments du cache AsyncStorage
    AsyncStorage.getAllKeys()
      .then(keys => {
        const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
        AsyncStorage.multiRemove(cacheKeys);
      });
  }
}

export const apiService = new ApiService();