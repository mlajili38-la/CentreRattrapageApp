// hooks/useCalendar.js - VERSION SIMPLIFIÉE
import { useState, useEffect, useCallback } from 'react';
import { CalendarService } from '../services/calendarService';

export const useCalendar = (userId, role) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const loadCalendar = useCallback(async () => {
    if (!userId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Charger les sessions
      const calendarSessions = await CalendarService.getStudentCalendar(userId, {
        daysBack: 7, // Inclure 7 derniers jours
        daysForward: 90, // 3 mois dans le futur
        limit: 50
      });
      
      setSessions(calendarSessions);
      
      // Charger les statistiques
      const calendarStats = await CalendarService.getCalendarStats(userId, role);
      setStats(calendarStats);
      
    } catch (err) {
      console.error('❌ Erreur chargement calendrier:', err);
      setError(err.message);
      
      // En cas d'erreur, afficher des données de démo
      const demoSessions = CalendarService.createDemoSessions(userId, 'G1');
      setSessions(demoSessions);
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  const refresh = useCallback(() => {
    loadCalendar();
  }, [loadCalendar]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  return {
    sessions,
    loading,
    error,
    stats,
    refresh,
    isEmpty: sessions.length === 0,
    futureSessions: sessions.filter(s => new Date(s.date) >= new Date())
  };
};