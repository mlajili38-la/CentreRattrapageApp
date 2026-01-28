// screens/student/StudentCalendarScreen.js - VERSION OPTIMISÉE
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { StudentService } from '../../services/studentService';
import Card from '../../components/common/Card/Card';
import Badge from '../../components/common/Badge/Badge';

// Composant SessionCard optimisé avec memo
const SessionCard = React.memo(({ session }) => {
  const formatTimeDisplay = (timeString) => {
    if (!timeString) return '--:--';
    if (/^\d{1,2}:\d{2}$/.test(timeString)) {
      const [hours, minutes] = timeString.split(':').map(Number);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return timeString;
  };

  const getSessionStatus = (session) => {
    const now = new Date();
    const sessionDate = new Date(session.date);
    
    if (session.status === 'completed') return 'Terminée';
    if (session.status === 'cancelled') return 'Annulée';
    
    if (sessionDate < now) return 'Passée';
    if (sessionDate.toDateString() === now.toDateString()) return "Aujourd'hui";
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (sessionDate.toDateString() === tomorrow.toDateString()) return 'Demain';
    
    return 'Planifiée';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Terminée': return '#4CAF50';
      case "Aujourd'hui": return '#2196F3';
      case 'Demain': return '#FF9800';
      case 'Planifiée': return '#9C27B0';
      case 'Annulée': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const status = getSessionStatus(session);
  const statusColor = getStatusColor(status);
  
  return (
    <Card style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={[styles.sessionIcon, { backgroundColor: `${session.color || '#2196F3'}20` }]}>
          <Ionicons name="calendar-outline" size={20} color={session.color || '#2196F3'} />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionGroup}>{session.groupName || 'Séance'}</Text>
          <View style={styles.sessionBadges}>
            <Badge 
              text={session.subject || 'Matière'}
              backgroundColor={`${session.color || '#2196F3'}15`}
              textColor={session.color || '#2196F3'}
              size="small"
            />
            <Badge 
              text={status}
              backgroundColor={`${statusColor}20`}
              textColor={statusColor}
              size="small"
            />
          </View>
        </View>
      </View>
      
      <View style={styles.sessionDetails}>
        <View style={styles.sessionDetailRow}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.sessionTime}>
            {formatTimeDisplay(session.startTime)} - {formatTimeDisplay(session.endTime)}
          </Text>
        </View>
        <View style={styles.sessionDetailRow}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.sessionDate}>
            {session.date.toLocaleDateString('fr-FR', { 
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </Text>
        </View>
      </View>
    </Card>
  );
});

const StudentCalendarScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  // Cache des données
  const cachedSessions = useRef(null);
  const lastUserId = useRef(null);
  const lastMonthYear = useRef('');

  // Noms des mois en français
  const monthNames = useMemo(() => [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ], []);

  // Noms des jours en français
  const dayNames = useMemo(() => ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'], []);

  // Formater la date pour l'affichage
  const formatDate = useCallback((date) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      if (checkDate.getTime() === today.getTime()) {
        return "Aujourd'hui";
      }
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (checkDate.getTime() === tomorrow.getTime()) {
        return "Demain";
      }
      
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  }, []);

  // Formater l'heure pour l'affichage
  const formatTimeDisplay = useCallback((timeString) => {
    if (!timeString) return '--:--';
    
    // Si c'est déjà au format HH:MM
    if (/^\d{1,2}:\d{2}$/.test(timeString)) {
      const [hours, minutes] = timeString.split(':').map(Number);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    return timeString;
  }, []);

  // Charger les sessions avec cache
  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user?.email) {
        console.log('❌ Utilisateur non connecté');
        return;
      }
      
      // OPTIMISATION: Vérifier le cache
      if (cachedSessions.current && lastUserId.current === user.email) {
        console.log('📅 Utilisation du cache pour:', user.email);
        setSessions(cachedSessions.current);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      console.log('📅 Chargement calendrier FUTUR pour:', user.email);

      // 1. Trouver l'étudiant par email
      const studentInfo = await StudentService.getStudentByEmail(user.email);
      
      if (!studentInfo) {
        console.log('❌ Aucun étudiant trouvé');
        setSessions([]);
        cachedSessions.current = [];
        lastUserId.current = user.email;
        return;
      }

      console.log('🎓 Étudiant trouvé:', studentInfo.name);

      // 2. Charger le calendrier depuis Firestore
      const calendarSessions = await StudentService.getStudentCalendar(studentInfo.id);
      
      console.log(`✅ ${calendarSessions.length} sessions chargées depuis Firestore`);
      
      // 3. Conversion optimisée des dates
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      
      const futureSessions = calendarSessions
        .map(session => {
          try {
            let date;
            // Conversion optimisée
            if (session.date instanceof Date) {
              date = session.date;
            } else if (session.date?.toDate) {
              date = session.date.toDate();
            } else if (session.date?.seconds) {
              date = new Date(session.date.seconds * 1000);
            } else if (typeof session.date === 'string') {
              date = new Date(session.date);
            } else {
              date = new Date();
            }
            
            return {
              ...session,
              date,
              dateKey: date.setHours(0, 0, 0, 0) // Pré-calculer la clé
            };
          } catch (error) {
            return null;
          }
        })
        .filter(session => session && session.date instanceof Date && !isNaN(session.date))
        .filter(session => {
          const sessionDate = new Date(session.date);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate >= today;
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      console.log(`✅ ${futureSessions.length} sessions FUTURES trouvées`);
      
      // Mettre en cache
      cachedSessions.current = futureSessions;
      lastUserId.current = user.email;
      
      setSessions(futureSessions);
      
    } catch (error) {
      console.error('❌ Erreur chargement calendrier:', error);
      setSessions([]);
      cachedSessions.current = [];
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Sessions FUTURES pour la date sélectionnée
  const getSessionsForDate = useCallback((date) => {
    try {
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      const dateKey = checkDate.getTime();
      
      return sessions.filter(session => {
        try {
          const sessionDate = new Date(session.date);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate.getTime() === dateKey;
        } catch (error) {
          return false;
        }
      });
    } catch (error) {
      return [];
    }
  }, [sessions]);

  // Générer les jours du calendrier - OPTIMISÉ
  const generateCalendar = useCallback(() => {
    try {
      const currentMonthYear = `${year}-${month}`;
      
      // Vérifier le cache du calendrier
      if (lastMonthYear.current === currentMonthYear && calendarDays.length > 0) {
        return; // Ne pas régénérer si même mois/année
      }
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
      
      const days = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // OPTIMISATION: Pré-calculer les dates de session pour comparaison rapide
      const sessionDates = new Map(); // Map<timestamp, count>
      
      sessions.forEach(session => {
        try {
          const sessionDate = new Date(session.date);
          sessionDate.setHours(0, 0, 0, 0);
          const timestamp = sessionDate.getTime();
          
          // Compter les sessions par date
          if (sessionDate.getMonth() === month && sessionDate.getFullYear() === year) {
            sessionDates.set(timestamp, (sessionDates.get(timestamp) || 0) + 1);
          }
        } catch (e) {
          // Ignorer les erreurs
        }
      });

      // Jours du mois précédent
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startingDay - 1; i >= 0; i--) {
        days.push({
          date: new Date(year, month - 1, prevMonthLastDay - i),
          isCurrentMonth: false,
          hasFutureSession: false
        });
      }
      
      // Jours du mois courant - OPTIMISÉ
      for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(year, month, i);
        currentDate.setHours(0, 0, 0, 0);
        
        const isFutureOrToday = currentDate >= today;
        const dateKey = currentDate.getTime();
        
        // OPTIMISATION: Recherche rapide avec Map
        const sessionCount = sessionDates.get(dateKey) || 0;
        const hasFutureSession = isFutureOrToday && sessionCount > 0;
        
        days.push({
          date: currentDate,
          isCurrentMonth: true,
          hasFutureSession,
          sessionCount,
          isToday: currentDate.getTime() === today.getTime(),
          isSelected: currentDate.getTime() === selectedDate.getTime(),
          isPast: currentDate < today
        });
      }
      
      // Jours du mois suivant
      const totalCells = 42;
      const nextMonthDays = totalCells - days.length;
      for (let i = 1; i <= nextMonthDays; i++) {
        days.push({
          date: new Date(year, month + 1, i),
          isCurrentMonth: false,
          hasFutureSession: false
        });
      }
      
      setCalendarDays(days);
      lastMonthYear.current = currentMonthYear;
      
    } catch (error) {
      console.error('❌ Erreur génération calendrier:', error);
      setCalendarDays([]);
    }
  }, [year, month, sessions, selectedDate]);

  // Changer de mois
  const changeMonth = useCallback((direction) => {
    try {
      if (direction === 'prev') {
        if (month === 0) {
          setMonth(11);
          setYear(year - 1);
        } else {
          setMonth(month - 1);
        }
      } else {
        if (month === 11) {
          setMonth(0);
          setYear(year + 1);
        } else {
          setMonth(month + 1);
        }
      }
    } catch (error) {
      console.error('❌ Erreur changement mois:', error);
    }
  }, [month, year]);

  // Rafraîchir les données
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Invalider le cache
    cachedSessions.current = null;
    loadSessions();
  }, [loadSessions]);

  // Événements useEffect
  useEffect(() => {
    if (user?.email) {
      loadSessions();
    }
  }, [user, loadSessions]);

  useEffect(() => {
    generateCalendar();
  }, [generateCalendar]);

  // Rendu optimisé d'un jour
  const renderDay = useCallback((day, index) => {
    const isSelectable = day.isCurrentMonth && !day.isPast;
    
    return (
      <TouchableOpacity
        key={`day-${index}-${day.date.getTime()}`}
        style={[
          styles.dayCell,
          !day.isCurrentMonth && styles.otherMonthDay,
          day.isToday && styles.todayDay,
          day.isSelected && styles.selectedDay,
          day.isPast && styles.pastDay,
          !isSelectable && styles.unselectableDay
        ]}
        onPress={() => {
          if (isSelectable) {
            setSelectedDate(day.date);
          }
        }}
        disabled={!isSelectable}
      >
        <Text style={[
          styles.dayNumber,
          !day.isCurrentMonth && styles.otherMonthText,
          day.isToday && styles.todayText,
          day.isSelected && styles.selectedText,
          day.isPast && styles.pastText
        ]}>
          {day.date.getDate()}
        </Text>
        
        {day.hasFutureSession && (
          <View style={styles.futureSessionIndicator}>
            {day.sessionCount > 1 && (
              <Text style={styles.sessionCount}>{day.sessionCount}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }, []);

  // Calculer les sessions pour la date sélectionnée
  const selectedDateSessions = useMemo(() => 
    getSessionsForDate(selectedDate), 
    [selectedDate, getSessionsForDate]
  );

  // Calculer les prochaines sessions (limit à 5)
  const upcomingSessions = useMemo(() => 
    sessions.slice(0, 5), 
    [sessions]
  );

  if (loading && sessions.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Chargement du calendrier...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#2196F3"
            title="Tiré pour rafraîchir"
            titleColor="#2196F3"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon calendrier futur</Text>
          <Text style={styles.headerSubtitle}>Séances à venir uniquement</Text>
          
          <View style={styles.statsRow}>
            <Badge 
              text={`${sessions.length} séances`}
              backgroundColor="#e3f2fd"
              textColor="#1976D2"
              size="small"
            />
            <Badge 
              text={`${monthNames[month]} ${year}`}
              backgroundColor="#fff3e0"
              textColor="#f57c00"
              size="small"
            />
          </View>
        </View>

        {/* Calendrier */}
        <Card style={styles.calendarCard}>
          {/* Navigation mois */}
          <View style={styles.calendarHeader}>
            <View style={styles.monthNav}>
              <TouchableOpacity 
                style={styles.navButton}
                onPress={() => changeMonth('prev')}
              >
                <Ionicons name="chevron-back" size={20} color="#2196F3" />
              </TouchableOpacity>
              
              <Text style={styles.monthYear}>
                {monthNames[month]} {year}
              </Text>
              
              <TouchableOpacity 
                style={styles.navButton}
                onPress={() => changeMonth('next')}
              >
                <Ionicons name="chevron-forward" size={20} color="#2196F3" />
              </TouchableOpacity>
            </View>

            {/* Jours de la semaine */}
            <View style={styles.weekDaysRow}>
              {dayNames.map((day, index) => (
                <Text key={`weekday-${index}`} style={styles.weekDay}>
                  {day}
                </Text>
              ))}
            </View>
          </View>

          {/* Grille des jours - OPTIMISÉ */}
          <View style={styles.daysGrid}>
            {calendarDays.map(renderDay)}
          </View>

          {/* Légende */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
              <Text style={styles.legendText}>Séance future</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#e3f2fd' }]} />
              <Text style={styles.legendText}>Aujourd'hui</Text>
            </View>
          </View>
        </Card>

        {/* Date sélectionnée */}
        <View style={styles.dateHeader}>
          <View>
            <Text style={styles.dateTitle}>{formatDate(selectedDate)}</Text>
            <Text style={styles.dateSubtitle}>
              {selectedDateSessions.length > 0 
                ? `${selectedDateSessions.length} séance${selectedDateSessions.length !== 1 ? 's' : ''} programmée${selectedDateSessions.length !== 1 ? 's' : ''}`
                : 'Aucune séance programmée'
              }
            </Text>
          </View>
          
          {selectedDateSessions.length > 0 && (
            <Badge 
              text={`${selectedDateSessions.length} séance${selectedDateSessions.length !== 1 ? 's' : ''}`}
              backgroundColor="#fff3e0"
              textColor="#f57c00"
            />
          )}
        </View>

        {/* Sessions du jour */}
        {selectedDateSessions.length > 0 ? (
          selectedDateSessions.map((session, index) => (
            <SessionCard 
              key={`selected-session-${session.id || index}`} 
              session={session} 
            />
          ))
        ) : (
          <Card style={styles.noSessionsCard}>
            <View style={styles.noSessionsContent}>
              <View style={styles.noSessionsIcon}>
                <Ionicons name="calendar-outline" size={40} color="#bdbdbd" />
              </View>
              <Text style={styles.noSessionsTitle}>
                {selectedDate < new Date() ? 'Date passée' : 'Aucune séance'}
              </Text>
              <Text style={styles.noSessionsText}>
                {selectedDate < new Date() 
                  ? "Les dates passées ne sont pas affichées dans ce calendrier."
                  : `Vous n'avez pas de séance programmée pour le ${formatDate(selectedDate)}`
                }
              </Text>
            </View>
          </Card>
        )}

        {/* Prochaines séances (toujours visibles) */}
        {upcomingSessions.length > 0 && (
          <View style={styles.upcomingSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="calendar" size={18} color="#7b1fa2" />
                <Text style={styles.sectionTitle}>Prochaines séances</Text>
              </View>
              <Badge 
                text={`${sessions.length} au total`}
                backgroundColor="#f3e5f5"
                textColor="#7b1fa2"
              />
            </View>
            
            {upcomingSessions.map((session, index) => (
              <Card key={`upcoming-${session.id || index}`} style={styles.upcomingSessionCard}>
                <View style={styles.upcomingSessionHeader}>
                  <View style={styles.upcomingDate}>
                    <Text style={styles.upcomingDay}>{session.date.getDate()}</Text>
                    <Text style={styles.upcomingMonth}>
                      {monthNames[session.date.getMonth()].substring(0, 3)}
                    </Text>
                  </View>
                  
                  <View style={styles.upcomingInfo}>
                    <Text style={styles.upcomingGroup}>{session.groupName}</Text>
                    <Text style={styles.upcomingSubject}>{session.subject}</Text>
                    <View style={styles.upcomingTimeRow}>
                      <Ionicons name="time-outline" size={12} color="#666" />
                      <Text style={styles.upcomingTime}>
                        {formatTimeDisplay(session.startTime)} - {formatTimeDisplay(session.endTime)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Message si aucune session future */}
        {sessions.length === 0 && !loading && (
          <Card style={styles.noFutureSessionsCard}>
            <View style={styles.noFutureContent}>
              <Ionicons name="calendar-outline" size={60} color="#e0e0e0" />
              <Text style={styles.noFutureTitle}>Aucune séance future</Text>
              <Text style={styles.noFutureText}>
                Vous n'avez pas de séance programmée pour l'avenir.
              </Text>
              <Text style={styles.noFutureHint}>
                Contactez votre professeur pour planifier vos prochaines séances.
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const daySize = (width - 64) / 7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  calendarCard: {
    padding: 16,
    marginBottom: 20,
  },
  calendarHeader: {
    marginBottom: 12,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthYear: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  weekDay: {
    width: daySize,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: daySize,
    height: daySize,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  todayDay: {
    backgroundColor: '#e3f2fd',
    borderRadius: daySize / 2,
  },
  selectedDay: {
    backgroundColor: '#2196F3',
    borderRadius: daySize / 2,
  },
  pastDay: {
    opacity: 0.5,
  },
  unselectableDay: {
    // Style pour les jours non sélectionnables
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  otherMonthText: {
    color: '#bdbdbd',
  },
  todayText: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pastText: {
    color: '#999',
  },
  futureSessionIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  sessionCount: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    backgroundColor: '#2196F3',
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
    minWidth: 12,
    height: 12,
    borderRadius: 6,
    textAlign: 'center',
    lineHeight: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  dateSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  sessionCard: {
    padding: 16,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionGroup: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  sessionBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  sessionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  sessionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTime: {
    fontSize: 13,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  sessionDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  noSessionsCard: {
    padding: 24,
    marginBottom: 20,
  },
  noSessionsContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSessionsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  noSessionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  noSessionsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  upcomingSection: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  upcomingSessionCard: {
    padding: 16,
    marginBottom: 12,
  },
  upcomingSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingDate: {
    width: 50,
    alignItems: 'center',
    marginRight: 16,
  },
  upcomingDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  upcomingMonth: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingGroup: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  upcomingSubject: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  upcomingTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upcomingTime: {
    fontSize: 11,
    color: '#999',
  },
  noFutureSessionsCard: {
    padding: 40,
    marginTop: 20,
    marginBottom: 20,
  },
  noFutureContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noFutureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    marginBottom: 12,
  },
  noFutureText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  noFutureHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default StudentCalendarScreen;