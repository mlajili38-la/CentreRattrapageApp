// services/TeacherService.js - VERSION OPTIMISÉE AVEC CACHE
import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where,
  limit,
  getDoc,
  doc,
  Timestamp,
  getCountFromServer
} from 'firebase/firestore';
import { cacheService, CacheType } from './cacheService';

const TeacherService = {
  
  // Récupérer un enseignant par email (cache: 15min)
  getTeacherByEmail: async (email) => {
    return cacheService.getDataWithCache({
      service: 'teacher',
      method: 'getTeacherByEmail',
      params: { email },
      cacheType: CacheType.LOW_PRIORITY,
      fetchFunction: async () => {
        // ... votre code existant ...
      }
    });
  },

  // Récupérer les groupes (cache: 5min)
  getTeacherGroups: async (teacherId) => {
    return cacheService.getDataWithCache({
      service: 'teacher',
      method: 'getTeacherGroups',
      params: { teacherId },
      cacheType: CacheType.MEDIUM_PRIORITY,
      fetchFunction: async () => {
        // ... votre code existant ...
      }
    });
  },

  // Récupérer TOUTES les sessions (cache: 1min)
  getAllTeacherSessions: async (teacherId) => {
    return cacheService.getDataWithCache({
      service: 'teacher',
      method: 'getAllTeacherSessions',
      params: { teacherId },
      cacheType: CacheType.HIGH_PRIORITY,
      fetchFunction: async () => {
        // ... votre code existant ...
      }
    });
  },

  // Récupérer les sessions futures (cache: 1min)
  getUpcomingSessions: async (teacherId) => {
    return cacheService.getDataWithCache({
      service: 'teacher',
      method: 'getUpcomingSessions',
      params: { teacherId },
      cacheType: CacheType.HIGH_PRIORITY,
      fetchFunction: async () => {
        // ... votre code existant ...
      }
    });
  },

  // Calculer les statistiques (cache: 5min)
  getAttendanceStats: async (teacherId) => {
    return cacheService.getDataWithCache({
      service: 'teacher',
      method: 'getAttendanceStats',
      params: { teacherId },
      cacheType: CacheType.MEDIUM_PRIORITY,
      fetchFunction: async () => {
        // ... votre code existant ...
      }
    });
  },

  // Récupérer les étudiants d'un groupe (cache: 5min)
  getGroupStudents: async (groupId) => {
    return cacheService.getDataWithCache({
      service: 'teacher',
      method: 'getGroupStudents',
      params: { groupId },
      cacheType: CacheType.MEDIUM_PRIORITY,
      fetchFunction: async () => {
        // ... votre code existant ...
      }
    });
  },

  // Récupérer les stats rapides
  getQuickStats: async (teacherId) => {
    return cacheService.getDataWithCache({
      service: 'teacher',
      method: 'getQuickStats',
      params: { teacherId },
      cacheType: CacheType.MEDIUM_PRIORITY,
      fetchFunction: async () => {
        const [groups, upcoming, students] = await Promise.all([
          this.getTeacherGroups(teacherId),
          this.getUpcomingSessions(teacherId),
          getCountFromServer(query(
            collection(db, 'attendances'),
            where('teacherId', '==', teacherId),
            where('date', '>=', Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
          ))
        ]);
        
        return {
          groupCount: groups.length,
          upcomingCount: upcoming.length,
          weeklyAttendance: students.data().count
        };
      }
    });
  },

  // Forcer le rafraîchissement
  refreshTeacherData: async (teacherId) => {
    const patterns = [
      `teacher_getTeacherGroups_${JSON.stringify({teacherId})}`,
      `teacher_getAllTeacherSessions_${JSON.stringify({teacherId})}`,
      `teacher_getUpcomingSessions_${JSON.stringify({teacherId})}`
    ];
    
    patterns.forEach(pattern => {
      cacheService.invalidateCache(pattern);
    });
  }
};

export default TeacherService;