// services/dashboardService.js - VERSION OPTIMISÉE AVEC CACHE
import { db } from './firebase';
import { 
  collection, 
  getCountFromServer,
  query,
  where,
  Timestamp,
  getDocs,
  limit
} from 'firebase/firestore';
import { cacheService, CacheType } from './cacheService';

export const DashboardService = {
  
  // Récupérer les statistiques (cache: 1min)
  getDashboardStats: async () => {
    return cacheService.getDataWithCache({
      service: 'dashboard',
      method: 'getDashboardStats',
      params: {},
      cacheType: CacheType.HIGH_PRIORITY,
      fetchFunction: async () => {
        // ... votre code existant ...
      }
    });
  },

  // Récupérer les activités récentes (cache: 1min)
  getRecentActivities: async () => {
    return cacheService.getDataWithCache({
      service: 'dashboard',
      method: 'getRecentActivities',
      params: {},
      cacheType: CacheType.HIGH_PRIORITY,
      fetchFunction: async () => {
        // ... votre code existant ...
      }
    });
  },

  // Récupérer les alertes (cache: 1min)
  getAlerts: async () => {
    return cacheService.getDataWithCache({
      service: 'dashboard',
      method: 'getAlerts',
      params: {},
      cacheType: CacheType.HIGH_PRIORITY,
      fetchFunction: async () => {
        // ... votre code existant ...
      }
    });
  },

  // Récupérer les métriques en temps réel (pas de cache)
  getRealTimeMetrics: async () => {
    // Pas de cache pour les données temps réel
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const [todayAttendances, todaySessions, pendingPayments] = await Promise.all([
      getCountFromServer(query(
        collection(db, 'attendances'),
        where('markedAt', '>=', Timestamp.fromDate(startOfDay))
      )),
      getCountFromServer(query(
        collection(db, 'sessions'),
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<', Timestamp.fromDate(new Date(today.getTime() + 24 * 60 * 60 * 1000)))
      )),
      getCountFromServer(query(
        collection(db, 'payments'),
        where('status', '==', 'pending')
      ))
    ]);
    
    return {
      todayAttendances: todayAttendances.data().count,
      todaySessions: todaySessions.data().count,
      pendingPayments: pendingPayments.data().count
    };
  }
};

export default DashboardService;