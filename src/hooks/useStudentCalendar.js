// src/hooks/useStudentCalendar.js - VERSION ULTRA OPTIMISÉE
import { useState, useEffect, useCallback, useRef } from 'react';
import { StudentService } from '../services/studentService';

// Cache global (persiste entre les re-rendus)
const globalCache = {
  sessions: new Map(),
  students: new Map(),
  lastUpdated: new Map()
};

export const useStudentCalendar = (studentEmail, options = {}) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  const getCacheKey = useCallback((email, futureOnly = true) => {
    return `${email}_${futureOnly}`;
  }, []);

  // Fonction pour charger les sessions rapidement
  const loadSessionsFast = useCallback(async (forceRefresh = false) => {
    if (!studentEmail) return;

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else if (!refreshing) {
        setLoading(true);
      }
      
      setError(null);
      
      const cacheKey = getCacheKey(studentEmail, options.futureOnly);
      const now = Date.now();
      const cacheDuration = 2 * 60 * 1000; // 2 minutes de cache
      
      // Vérifier le cache (rapide)
      if (!forceRefresh && globalCache.sessions.has(cacheKey)) {
        const cached = globalCache.sessions.get(cacheKey);
        if (now - globalCache.lastUpdated.get(cacheKey) < cacheDuration) {
          console.log('⚡ Utilisation cache ultra-rapide');
          if (isMountedRef.current) {
            setSessions(cached);
            setLoading(false);
            setRefreshing(false);
          }
          return;
        }
      }
      
      console.log('🚀 Chargement rapide calendrier...');
      
      // 1. Charger l'étudiant (avec cache)
      let studentInfo;
      if (globalCache.students.has(studentEmail)) {
        studentInfo = globalCache.students.get(studentEmail);
        console.log('🎓 Étudiant depuis cache');
      } else {
        studentInfo = await StudentService.getStudentByEmail(studentEmail);
        if (studentInfo) {
          globalCache.students.set(studentEmail, studentInfo);
        }
      }
      
      if (!studentInfo) {
        throw new Error('Étudiant non trouvé');
      }
      
      // 2. Charger les sessions
      const calendarSessions = await StudentService.getStudentCalendar(studentInfo.id);
      console.log(`✅ ${calendarSessions.length} sessions brutes chargées`);
      
      // 3. Préparation ULTRA rapide des sessions
      const nowDate = new Date();
      const today = new Date(nowDate);
      today.setHours(0, 0, 0, 0);
      
      const preparedSessions = [];
      
      // Traitement rapide sans map/filter lourds
      for (let i = 0; i < calendarSessions.length; i++) {
        const session = calendarSessions[i];
        
        // Conversion date rapide
        let sessionDate;
        try {
          if (session.date?.toDate) {
            sessionDate = session.date.toDate();
          } else if (session.date?.seconds) {
            sessionDate = new Date(session.date.seconds * 1000);
          } else {
            continue;
          }
        } catch {
          continue;
        }
        
        // Vérification date valide
        if (isNaN(sessionDate.getTime())) continue;
        
        // Filtrer seulement les sessions futures si demandé
        if (options.futureOnly !== false) {
          const sessionDay = new Date(sessionDate);
          sessionDay.setHours(0, 0, 0, 0);
          if (sessionDay < today) continue;
        }
        
        // Couleur rapide par matière
        const color = getSubjectColorFast(session.subject);
        
        preparedSessions.push({
          id: session.id || `session-${i}`,
          ...session,
          date: sessionDate,
          color,
          dateKey: sessionDate.setHours(0, 0, 0, 0)
        });
      }
      
      // Tri rapide (limité à 50 sessions max)
      preparedSessions.sort((a, b) => a.date.getTime() - b.date.getTime());
      const limitedSessions = preparedSessions.slice(0, 50);
      
      console.log(`📊 ${limitedSessions.length} sessions prêtes`);
      
      // Mettre en cache
      globalCache.sessions.set(cacheKey, limitedSessions);
      globalCache.lastUpdated.set(cacheKey, now);
      
      // Mettre à jour l'état seulement si le composant est monté
      if (isMountedRef.current) {
        setSessions(limitedSessions);
      }
      
    } catch (err) {
      if (err.name !== 'AbortError' && isMountedRef.current) {
        console.error('❌ Erreur chargement:', err);
        setError(err.message);
        
        // Données de démonstration en cas d'erreur
        const demoSessions = createDemoSessions();
        setSessions(demoSessions);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [studentEmail, options.futureOnly, getCacheKey, refreshing]);

  // Version encore plus rapide pour le premier chargement
  const loadInitialSessions = useCallback(async () => {
    if (!studentEmail) return;
    
    const cacheKey = getCacheKey(studentEmail, options.futureOnly);
    
    // Si déjà en cache, utiliser immédiatement
    if (globalCache.sessions.has(cacheKey)) {
      const cached = globalCache.sessions.get(cacheKey);
      setSessions(cached);
      return;
    }
    
    // Charger en arrière-plan
    loadSessionsFast();
  }, [studentEmail, options.futureOnly, getCacheKey, loadSessionsFast]);

  const refresh = useCallback(() => {
    loadSessionsFast(true);
  }, [loadSessionsFast]);

  const clearCache = useCallback(() => {
    const cacheKey = getCacheKey(studentEmail, options.futureOnly);
    globalCache.sessions.delete(cacheKey);
    globalCache.lastUpdated.delete(cacheKey);
  }, [studentEmail, options.futureOnly, getCacheKey]);

  // Nettoyage
  useEffect(() => {
    isMountedRef.current = true;
    
    // Chargement initial rapide
    if (studentEmail) {
      loadInitialSessions();
    }
    
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [studentEmail, loadInitialSessions]);

  return {
    sessions,
    loading,
    refreshing,
    error,
    refresh,
    clearCache,
    isEmpty: sessions.length === 0
  };
};

// Fonction ULTRA rapide pour couleur
const getSubjectColorFast = (subject) => {
  if (!subject) return '#2196F3';
  
  const firstChar = subject.charAt(0).toUpperCase();
  switch (firstChar) {
    case 'M': return '#FF6B6B'; // Mathématiques
    case 'P': return '#4ECDC4'; // Physique
    case 'C': return '#45B7D1'; // Chimie
    case 'S': return '#96CEB4'; // SVT
    case 'I': return '#FFEAA7'; // Informatique
    case 'A': return '#DDA0DD'; // Anglais/Arabe
    case 'F': return '#98D8C8'; // Français
    default: return '#2196F3';
  }
};

// Sessions de démonstration minimales
const createDemoSessions = () => {
  const sessions = [];
  const now = new Date();
  
  for (let i = 1; i <= 3; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i * 2);
    
    sessions.push({
      id: `demo-${i}`,
      date,
      groupName: 'Groupe de Mathématiques',
      subject: 'Mathématiques',
      startTime: '14:00',
      endTime: '16:00',
      room: 'Salle 101',
      color: '#FF6B6B',
      dateKey: date.setHours(0, 0, 0, 0)
    });
  }
  
  return sessions;
};