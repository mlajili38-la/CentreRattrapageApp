// screens/teacher/TeacherDashboard.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/Card/Card';
import Badge from '../../components/common/Badge/Badge';

const TeacherDashboard = ({ 
  teacherData, 
  refreshing, 
  onRefresh, 
  onNavigate,
  formatDate 
}) => {
  if (!teacherData) return null;

  // Fonction pour formater l'horaire
  const formatSchedule = (schedule) => {
    if (!schedule) return 'Non défini';
    
    if (typeof schedule === 'string') {
      return schedule;
    }
    
    if (typeof schedule === 'object') {
      if (schedule.dayName && schedule.startTime) {
        return `${schedule.dayName} ${schedule.startTime}-${schedule.endTime || ''}`;
      }
      
      return 'Horaires définis';
    }
    
    return String(schedule);
  };

  // Fonction pour formater l'heure des sessions
  const formatSessionTime = (session) => {
    if (!session) return '--:--';
    
    // Si la session a directement une propriété time
    if (session.time) {
      return session.time;
    }
    
    // Si la session a des propriétés startTime et endTime
    if (session.startTime) {
      const endTime = session.endTime || '';
      return `${session.startTime}${endTime ? ` - ${endTime}` : ''}`;
    }
    
    // Si la session a une date complète
    if (session.date) {
      try {
        const dateObj = new Date(session.date);
        if (!isNaN(dateObj)) {
          return dateObj.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
        }
      } catch (error) {
        // Ignorer l'erreur
      }
    }
    
    return '--:--';
  };

  // Fonction pour formater la date de session
  const formatSessionDate = (session) => {
    if (!session) return 'Date non définie';
    
    if (session.date) {
      try {
        // Si c'est une string, la convertir en Date
        const date = typeof session.date === 'string' 
          ? new Date(session.date) 
          : session.date;
        
        if (date instanceof Date && !isNaN(date)) {
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          if (date.toDateString() === today.toDateString()) {
            return "Aujourd'hui";
          } else if (date.toDateString() === tomorrow.toDateString()) {
            return "Demain";
          } else {
            return date.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            });
          }
        }
      } catch (error) {
        console.error('Erreur format date:', error);
      }
    }
    
    return 'Date non définie';
  };

  // Cartes de navigation
  const dashboardCards = [
    {
      id: 'calendar',
      title: 'Séances',
      count: teacherData?.upcomingSessions?.length || 0,
      icon: 'calendar-outline',
      color: '#2196F3',
      tabId: 'calendar'
    },
    {
      id: 'attendance',
      title: 'Présence',
      count: `${teacherData?.attendanceStats?.averageAttendance || 0}%`,
      icon: 'checkmark-circle-outline',
      color: '#FF9800',
      tabId: 'attendance'
    },
    {
      id: 'groups',
      title: 'Groupes',
      count: teacherData?.groups?.length || 0,
      icon: 'people-outline',
      color: '#4CAF50',
      tabId: 'groups'
    },
    {
      id: 'students',
      title: 'Élèves',
      count: teacherData?.attendanceStats?.totalStudents || 0,
      icon: 'person-outline',
      color: '#9C27B0',
      tabId: 'groups'
    },
  ];

  // Récupérer les prochaines séances avec une structure garantie
  const upcomingSessions = React.useMemo(() => {
    if (!teacherData?.upcomingSessions || !Array.isArray(teacherData.upcomingSessions)) {
      return [];
    }
    
    return teacherData.upcomingSessions.map((session, index) => ({
      id: session.id || `session-${index}`,
      date: session.date || session.sessionDate || new Date(),
      time: formatSessionTime(session),
      group: session.group || session.groupName || session.class || 'Groupe non défini',
      topic: session.topic || session.subject || session.title || 'Séance',
      room: session.room || session.classroom || 'Salle non attribuée',
      status: session.status || 'scheduled'
    }));
  }, [teacherData?.upcomingSessions]);

  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Teacher Info Card */}
      <Card style={styles.teacherInfoCard}>
        <View style={styles.teacherHeader}>
          <View style={[styles.avatar, { backgroundColor: '#e8f5e9' }]}>
            <Ionicons name="person" size={32} color="#4CAF50" />
          </View>
          <View style={styles.teacherInfo}>
            <Text style={styles.teacherName}>
              {teacherData?.teacherInfo?.name || 'Enseignant'}
            </Text>
            <Text style={styles.teacherEmail}>
              {teacherData?.teacherInfo?.email || 'Email non disponible'}
            </Text>
            <View style={styles.levelBadge}>
              <Badge 
                text={teacherData?.teacherInfo?.specialization || 'Enseignant'}
                backgroundColor="#e3f2fd"
                textColor="#1976D2"
                size="small"
              />
            </View>
          </View>
        </View>

        <View style={styles.teacherDetails}>
          <Text style={styles.welcomeText}>
            Bonjour Professeur 👨‍🏫 Suivez vos groupes et activités
          </Text>
        </View>
      </Card>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {dashboardCards.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={styles.statCard}
            onPress={() => onNavigate(card.tabId)}
          >
            <View style={[styles.statIconContainer, { backgroundColor: `${card.color}15` }]}>
              <Ionicons name={card.icon} size={24} color={card.color} />
            </View>
            <Text style={styles.statNumber}>
              {card.count}
            </Text>
            <Text style={styles.statLabel}>{card.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Prochaines séances */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Prochaines séances</Text>
        <View style={styles.sectionRight}>
          <Badge 
            text={`${upcomingSessions.length} séance${upcomingSessions.length !== 1 ? 's' : ''}`}
            backgroundColor="#f3e5f5"
            textColor="#7b1fa2"
            size="small"
          />
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => onNavigate('calendar')}
          >
            <Text style={styles.seeAllText}>Voir calendrier</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {upcomingSessions.length > 0 ? (
        upcomingSessions.slice(0, 3).map((session) => (
          <TouchableOpacity 
            key={session.id}
            onPress={() => onNavigate('calendar')}
            activeOpacity={0.7}
          >
            <Card style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View>
                  <Text style={styles.sessionDate}>
                    {formatSessionDate(session)}
                  </Text>
                  <Text style={styles.sessionTime}>
                    {session.time}
                  </Text>
                </View>
                <Badge 
                  text={session.room}
                  backgroundColor="#FFF3CD"
                  textColor="#856404"
                  size="small"
                />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionGroup}>{session.group}</Text>
                <Text style={styles.sessionTopic}>{session.topic}</Text>
              </View>
              <View style={styles.sessionFooter}>
                <View style={styles.sessionStatus}>
                  <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.statusText}>À venir</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={40} color="#e0e0e0" />
          <Text style={styles.emptyText}>Aucune séance à venir</Text>
          <Text style={styles.emptySubtext}>
            Vos prochaines séances apparaîtront ici
          </Text>
        </Card>
      )}

      {/* Mes groupes */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mes groupes</Text>
        <Badge 
          text={`${teacherData?.groups?.length || 0} groupes`}
          backgroundColor="#f3e5f5"
          textColor="#7b1fa2"
        />
      </View>
      
      {teacherData?.groups && teacherData.groups.length > 0 ? (
        teacherData.groups.slice(0, 2).map((group, index) => (
          <Card key={group.id || index} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupIcon, { backgroundColor: '#e3f2fd' }]}>
                <Ionicons name="school-outline" size={20} color="#1976D2" />
              </View>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.name}</Text>
                <View style={styles.groupBadges}>
                  <Badge 
                    text={group.subject || 'Matière'}
                    backgroundColor="#e3f2fd"
                    textColor="#1976D2"
                    size="small"
                  />
                  <Badge 
                    text={`${group.studentCount || 0} élèves`}
                    backgroundColor="#f0f9ff"
                    textColor="#0369a1"
                    size="small"
                  />
                </View>
              </View>
            </View>
            
            <View style={styles.groupDetails}>
              <View style={styles.groupDetailRow}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.detailValue}>
                  {formatSchedule(group.schedule)}
                </Text>
              </View>
              <View style={styles.groupDetailRow}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.detailValue}>
                  {group.room || 'Salle non attribuée'}
                </Text>
              </View>
            </View>
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Ionicons name="people-outline" size={40} color="#e0e0e0" />
          <Text style={styles.emptyText}>Aucun groupe assigné</Text>
        </Card>
      )}

      {/* Statistiques de présence */}
      {teacherData?.attendanceStats && (
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="stats-chart" size={24} color="#6366F1" />
            <Text style={styles.summaryTitle}>Statistiques de présence</Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${teacherData.attendanceStats.averageAttendance || 0}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {teacherData.attendanceStats.averageAttendance || 0}%
            </Text>
          </View>
          
          <View style={styles.statsDetails}>
            <View style={styles.statDetail}>
              <Text style={styles.statDetailText}>
                Total élèves: {teacherData.attendanceStats.totalStudents || 0}
              </Text>
            </View>
            <View style={styles.statDetail}>
              <Text style={styles.statDetailText}>
                Séances ce mois: {teacherData.attendanceStats.sessionsThisMonth || 0}
              </Text>
            </View>
          </View>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  teacherInfoCard: {
    marginBottom: 20,
    padding: 20,
  },
  teacherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  teacherEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  levelBadge: {
    alignSelf: 'flex-start',
  },
  teacherDetails: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  seeAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  sessionCard: {
    marginBottom: 12,
    padding: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 13,
    color: '#666',
  },
  sessionInfo: {
    marginBottom: 12,
  },
  sessionGroup: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sessionTopic: {
    fontSize: 14,
    color: '#6B7280',
  },
  sessionFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  sessionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  groupCard: {
    marginBottom: 12,
    padding: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  groupBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  groupDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  groupDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  summaryCard: {
    marginBottom: 20,
    padding: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  statsDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDetailText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default TeacherDashboard;