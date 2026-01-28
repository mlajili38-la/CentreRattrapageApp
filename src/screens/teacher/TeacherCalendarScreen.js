// screens/teacher/TeacherCalendarScreen.js - VERSION DONNÉES RÉELLES
import React, { useState, useEffect } from 'react';
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
import  TeacherService  from '../../services/TeacherService';
import Card from '../../components/common/Card/Card';
import Badge from '../../components/common/Badge/Badge';

const TeacherCalendarScreen = ({ teacherData }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  // Noms des mois en français
  const monthNames = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  // Noms des jours en français
  const dayNames = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

  // Fonction pour vérifier si une date est aujourd'hui ou future
  const isTodayOrFuture = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate >= today;
  };

  // Charger les sessions depuis la base de données
  // Dans TeacherCalendarScreen.js, modifiez la fonction loadSessions :

const loadSessions = async () => {
  try {
    setLoading(true);
    
    if (!user?.email) {
      console.log('❌ Utilisateur non connecté');
      return;
    }

    console.log('📅 Chargement calendrier pour enseignant:', user.email);

    // 1. Trouver l'enseignant par email
    const teacherInfo = await TeacherService.getTeacherByEmail(user.email);
    
    if (!teacherInfo) {
      console.log('❌ Aucun enseignant trouvé');
      setSessions([]);
      return;
    }

    console.log('👨‍🏫 Enseignant trouvé:', teacherInfo.name);
    console.log('📋 Teacher ID:', teacherInfo.id);

    // 2. DEBUG: Vérifier ce que TeacherService retourne
    const debugResult = await TeacherService.debugTeacherSessions(teacherInfo.id);
    console.log('🔍 Debug result:', debugResult);

    // 3. Charger les sessions futures
    const allSessions = await TeacherService.getUpcomingSessions(teacherInfo.id);
    
    console.log(`✅ ${allSessions.length} sessions chargées depuis Firestore`);
    
    // 4. Formater les sessions
    const formattedSessions = allSessions.map(session => {
      return {
        id: session.id,
        groupName: session.groupName || 'Groupe',
        subject: session.subject || 'Matière',
        startTime: session.startTime || '14:00',
        endTime: session.endTime || '16:00',
        date: session.date || new Date(),
        room: session.room || 'Salle',
        topic: session.topic || 'Sujet',
        status: session.status || 'scheduled',
        color: session.status === 'completed' ? '#4CAF50' : 
               session.status === 'cancelled' ? '#F44336' : '#2196F3',
        attendanceCount: session.attendanceCount || 0,
        totalStudents: session.totalStudents || 0
      };
    });
    
    console.log(`📊 ${formattedSessions.length} sessions formatées`);
    setSessions(formattedSessions);
    
  } catch (error) {
    console.error('❌ Erreur chargement calendrier:', error);
    console.error('Stack:', error.stack);
    setSessions([]);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  // Générer les jours du calendrier - UNIQUEMENT les points pour sessions FUTURES
  const generateCalendar = () => {
    try {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lundi = 0
      
      const days = [];
      
      // Jours du mois précédent
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startingDay - 1; i >= 0; i--) {
        days.push({
          date: new Date(year, month - 1, prevMonthLastDay - i),
          isCurrentMonth: false,
          hasFutureSession: false
        });
      }
      
      // Jours du mois courant
      for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(year, month, i);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);
        
        // Vérifier si la date est aujourd'hui ou future
        const isFutureOrToday = currentDate >= today;
        
        // Chercher si une session FUTURE existe pour cette date
        let hasFutureSession = false;
        let sessionCount = 0;
        
        if (isFutureOrToday) {
          sessions.forEach(session => {
            try {
              const sessionDate = new Date(session.date);
              sessionDate.setHours(0, 0, 0, 0);
              
              if (sessionDate.getDate() === i && 
                  sessionDate.getMonth() === month && 
                  sessionDate.getFullYear() === year) {
                hasFutureSession = true;
                sessionCount++;
              }
            } catch (e) {
              // Ignorer les erreurs de date
            }
          });
        }
        
        days.push({
          date: new Date(year, month, i),
          isCurrentMonth: true,
          hasFutureSession,
          sessionCount,
          isToday: i === new Date().getDate() && 
                   month === new Date().getMonth() && 
                   year === new Date().getFullYear(),
          isSelected: i === selectedDate.getDate() && 
                      month === selectedDate.getMonth() && 
                      year === selectedDate.getFullYear(),
          isPast: currentDate < today
        });
      }
      
      // Jours du mois suivant
      const totalCells = 42; // 6 semaines × 7 jours
      const nextMonthDays = totalCells - days.length;
      for (let i = 1; i <= nextMonthDays; i++) {
        days.push({
          date: new Date(year, month + 1, i),
          isCurrentMonth: false,
          hasFutureSession: false
        });
      }
      
      setCalendarDays(days);
      
    } catch (error) {
      console.error('❌ Erreur génération calendrier:', error);
      setCalendarDays([]);
    }
  };

  // Sessions FUTURES pour la date sélectionnée
  const getSessionsForDate = (date) => {
    try {
      return sessions.filter(session => {
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        
        return sessionDate.getDate() === checkDate.getDate() &&
               sessionDate.getMonth() === checkDate.getMonth() &&
               sessionDate.getFullYear() === checkDate.getFullYear();
      });
    } catch (error) {
      return [];
    }
  };

  // Changer de mois
  const changeMonth = (direction) => {
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
  };

  // Formater la date pour l'affichage
  const formatDate = (date) => {
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
  };

  // Formater l'heure pour l'affichage
  const formatTimeDisplay = (timeString) => {
    if (!timeString) return '--:--';
    
    // Si c'est déjà au format HH:MM
    if (/^\d{1,2}:\d{2}$/.test(timeString)) {
      const [hours, minutes] = timeString.split(':').map(Number);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    return timeString;
  };

  // Obtenir le statut de la session
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

  // Obtenir la couleur du statut
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

  // Obtenir l'icône pour le sujet
  const getSubjectIcon = (subject) => {
    if (!subject) return 'school-outline';
    
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('math')) return 'calculator-outline';
    if (subjectLower.includes('physique') || subjectLower.includes('science')) return 'flask-outline';
    if (subjectLower.includes('chimie')) return 'water-outline';
    if (subjectLower.includes('français') || subjectLower.includes('anglais') || subjectLower.includes('langue')) 
      return 'language-outline';
    if (subjectLower.includes('histoire') || subjectLower.includes('géographie')) 
      return 'globe-outline';
    
    return 'school-outline';
  };

  // Rafraîchir les données
  const onRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  useEffect(() => {
    loadSessions();
  }, [user]);

  useEffect(() => {
    generateCalendar();
  }, [month, year, sessions]);

  // Sessions pour la date sélectionnée
  const selectedDateSessions = getSessionsForDate(selectedDate);

  if (loading) {
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
          <Text style={styles.headerTitle}>Calendrier des séances</Text>
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
            {teacherData?.teacherInfo && (
              <Badge 
                text={teacherData.teacherInfo.specialization}
                backgroundColor="#f3e5f5"
                textColor="#7b1fa2"
                size="small"
              />
            )}
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
                <Text key={index} style={styles.weekDay}>
                  {day}
                </Text>
              ))}
            </View>
          </View>

          {/* Grille des jours */}
          <View style={styles.daysGrid}>
            {calendarDays.map((day, index) => {
              const isSelectable = day.isCurrentMonth && !day.isPast;
              
              return (
                <TouchableOpacity
                  key={index}
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
                  
                  {day.isPast && (
                    <View style={styles.pastOverlay} />
                  )}
                </TouchableOpacity>
              );
            })}
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
          selectedDateSessions.map((session, index) => {
            const status = getSessionStatus(session);
            const statusColor = getStatusColor(status);
            const subjectIcon = getSubjectIcon(session.subject);
            
            return (
              <Card key={index} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={[styles.sessionIcon, { backgroundColor: `${session.color}20` }]}>
                    <Ionicons name={subjectIcon} size={20} color={session.color} />
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionGroup}>{session.groupName}</Text>
                    <View style={styles.sessionBadges}>
                      <Badge 
                        text={session.subject}
                        backgroundColor={`${session.color}15`}
                        textColor={session.color}
                        size="small"
                      />
                      <Badge 
                        text={status}
                        backgroundColor={`${statusColor}20`}
                        textColor={statusColor}
                        size="small"
                      />
                      {session.attendanceCount > 0 && (
                        <Badge 
                          text={`${session.attendanceCount}/${session.totalStudents}`}
                          backgroundColor="#e8f5e8"
                          textColor="#2e7d32"
                          size="small"
                        />
                      )}
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
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.sessionRoom}>{session.room}</Text>
                  </View>
                  
                  {session.topic && (
                    <View style={styles.sessionDetailRow}>
                      <Ionicons name="document-text-outline" size={14} color="#666" />
                      <Text style={styles.sessionTopic}>{session.topic}</Text>
                    </View>
                  )}
                </View>
                
                {/* Actions pour l'enseignant */}
                {status === "Aujourd'hui" && session.status === 'scheduled' && (
                  <View style={styles.sessionActions}>
                    <TouchableOpacity style={[styles.actionButton, styles.attendanceButton]}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Prendre présence</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styles.actionButton, styles.detailsButton]}>
                      <Ionicons name="information-circle-outline" size={16} color="#2196F3" />
                      <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>Détails</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            );
          })
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
        {sessions.length > 0 && (
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
            
            {sessions.slice(0, 5).map((session, index) => {
              const status = getSessionStatus(session);
              const statusColor = getStatusColor(status);
              const subjectIcon = getSubjectIcon(session.subject);
              
              return (
                <Card key={index} style={styles.upcomingSessionCard}>
                  <View style={styles.upcomingSessionHeader}>
                    <View style={styles.upcomingDate}>
                      <Text style={styles.upcomingDay}>{session.date.getDate()}</Text>
                      <Text style={styles.upcomingMonth}>
                        {monthNames[session.date.getMonth()].substring(0, 3)}
                      </Text>
                    </View>
                    
                    <View style={styles.upcomingInfo}>
                      <View style={styles.upcomingSubjectRow}>
                        <Ionicons name={subjectIcon} size={14} color={session.color} />
                        <Text style={styles.upcomingGroup}>{session.groupName}</Text>
                      </View>
                      <Text style={styles.upcomingSubject}>{session.subject}</Text>
                      <View style={styles.upcomingTimeRow}>
                        <Ionicons name="time-outline" size={12} color="#666" />
                        <Text style={styles.upcomingTime}>
                          {formatTimeDisplay(session.startTime)} - {formatTimeDisplay(session.endTime)}
                        </Text>
                        <Text style={styles.upcomingRoom}>• {session.room}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.upcomingStatus}>
                      <Badge 
                        text={status}
                        backgroundColor={`${statusColor}20`}
                        textColor={statusColor}
                        size="small"
                      />
                    </View>
                  </View>
                </Card>
              );
            })}
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
                Contactez l'administration pour planifier vos prochaines séances.
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
    flexWrap: 'wrap',
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
  unselectableDay: {},
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
  pastOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: daySize / 2,
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
    flexWrap: 'wrap',
  },
  sessionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginBottom: 12,
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
  sessionRoom: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  sessionTopic: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  attendanceButton: {
    backgroundColor: '#4CAF50',
  },
  detailsButton: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
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
  upcomingSubjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  upcomingGroup: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
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
  upcomingRoom: {
    fontSize: 11,
    color: '#999',
  },
  upcomingStatus: {
    marginLeft: 8,
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

export default TeacherCalendarScreen;