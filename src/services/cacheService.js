// services/cacheService.js - VERSION SIMPLIFIÉE
class CacheService {
  constructor() {
    this.memoryCache = new Map();
  }

  generateKey(service, method, params) {
    return `${service}_${method}_${JSON.stringify(params || {})}`;
  }

  async getDataWithCache({ service, method, params = {}, fetchFunction }) {
    const key = this.generateKey(service, method, params);
    
    console.log(`🔍 Cache request: ${key}`);
    
    // Essayez le cache mémoire d'abord
    if (this.memoryCache.has(key)) {
      const cached = this.memoryCache.get(key);
      // Cache valide 5 minutes
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        console.log(`✅ Cache hit: ${key}`);
        return cached.data;
      }
    }
    
    // Sinon fetch
    console.log(`🌐 Fetching: ${key}`);
    try {
      const data = await fetchFunction();
      
      // Mettre en cache
      this.memoryCache.set(key, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error(`❌ Fetch error: ${key}`, error);
      throw error;
    }
  }

  invalidateCache(pattern = null) {
    if (pattern) {
      for (const key of this.memoryCache.keys()) {
        if (key.includes(pattern)) {
          this.memoryCache.delete(key);
        }
      }
    } else {
      this.memoryCache.clear();
    }
  }
}

// Constantes simplifiées
export const CacheType = {
  HIGH_PRIORITY: 'high',
  MEDIUM_PRIORITY: 'medium',
  LOW_PRIORITY: 'low',
  NO_CACHE: 'no_cache'
};

export const cacheService = new CacheService();