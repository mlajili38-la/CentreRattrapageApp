// screens/teacher/TeacherGroupsScreen.js - VERSION SIMPLIFIÉE DONNÉES RÉELLES
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import TeacherService  from '../../services/TeacherService';
import Card from '../../components/common/Card/Card';
import Badge from '../../components/common/Badge/Badge';

// Import Firestore
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../services/firebase';

const TeacherGroupsScreen = ({ teacherData }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState([]);
  const [groupDetails, setGroupDetails] = useState({}); // Pour stocker les détails supplémentaires

  const loadGroups = async () => {
    try {
      setLoading(true);
      
      if (!user?.email) {
        throw new Error('Utilisateur non connecté');
      }

      // 1. Trouver l'enseignant
      const teacherInfo = await TeacherService.getTeacherByEmail(user.email);
      
      if (!teacherInfo) {
        throw new Error('Enseignant non trouvé');
      }

      console.log('👤 Enseignant trouvé:', teacherInfo.id);

      // 2. Charger les groupes depuis Firestore
      const groupsData = await TeacherService.getTeacherGroups(teacherInfo.id);
      
      console.log(`✅ ${groupsData.length} groupes chargés`);

      // 3. Charger les sessions pour calculer les statistiques
      const groupStats = {};
      
      // Pour chaque groupe, charger les sessions
      for (const group of groupsData) {
        try {
          // Récupérer les sessions de ce groupe
          const sessionsRef = collection(db, 'sessions');
          const q = query(
            sessionsRef,
            where('groupId', '==', group.id),
            where('teacherId', '==', teacherInfo.id)
          );
          
          const snapshot = await getDocs(q);
          const sessions = [];
          
          if (!snapshot.empty) {
            snapshot.forEach((doc) => {
              const data = doc.data();
              sessions.push({
                id: doc.id,
                ...data,
                date: data.date?.toDate?.() || null
              });
            });
          }
          
          // Calculer les statistiques
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          let sessionsThisMonth = 0;
          let completedSessions = 0;
          let totalAttendance = 0;
          let totalPossible = 0;
          
          sessions.forEach(session => {
            // Sessions ce mois-ci
            if (session.date) {
              const sessionDate = session.date;
              if (sessionDate.getMonth() === currentMonth && 
                  sessionDate.getFullYear() === currentYear) {
                sessionsThisMonth++;
              }
            }
            
            // Sessions terminées
            if (session.status === 'completed') {
              completedSessions++;
            }
            
            // Présences
            if (session.attendanceCount !== undefined) {
              totalAttendance += session.attendanceCount;
            }
            if (session.totalStudents !== undefined) {
              totalPossible += session.totalStudents;
            }
          });
          
          // Taux de présence
          const attendanceRate = totalPossible > 0 
            ? Math.round((totalAttendance / totalPossible) * 100) 
            : 0;
          
          // Prochaine session
          const futureSessions = sessions
            .filter(s => s.status === 'scheduled' && s.date > now)
            .sort((a, b) => a.date - b.date);
          
          const nextSession = futureSessions.length > 0 ? futureSessions[0].date : null;
          
          // Dernière session
          const pastSessions = sessions
            .filter(s => s.status === 'completed')
            .sort((a, b) => b.date - a.date);
          
          const lastSession = pastSessions.length > 0 ? pastSessions[0].date : null;
          
          groupStats[group.id] = {
            attendanceRate,
            sessionsThisMonth,
            completedSessions,
            nextSession,
            lastSession,
            totalSessions: sessions.length
          };
          
        } catch (error) {
          console.error(`❌ Erreur calcul stats groupe ${group.id}:`, error);
          groupStats[group.id] = {
            attendanceRate: 0,
            sessionsThisMonth: 0,
            completedSessions: 0,
            nextSession: null,
            lastSession: null,
            totalSessions: 0
          };
        }
      }

      setGroups(groupsData);
      setGroupDetails(groupStats);
      
    } catch (error) {
      console.error('❌ Erreur chargement groupes:', error);
      setGroups([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadGroups();
  };

  // Obtenir la couleur basée sur le taux de présence
  const getAttendanceColor = (rate) => {
    if (rate >= 90) return '#10B981'; // Vert
    if (rate >= 75) return '#F59E0B'; // Orange
    return '#EF4444'; // Rouge
  };

  // Formater la date
  const formatDate = (date) => {
    if (!date) return '--';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dateCopy = new Date(date);
    dateCopy.setHours(0, 0, 0, 0);
    
    if (dateCopy.getTime() === today.getTime()) return "Aujourd'hui";
    
    const diffTime = Math.abs(today.getTime() - dateCopy.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Demain';
    if (diffDays <= 7) return `${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short'
    });
  };

  if (loading && groups.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes groupes</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Chargement des groupes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes groupes</Text>
        {groups.length > 0 && (
          <Text style={styles.headerSubtitle}>
            {groups.length} groupes • {groups.reduce((sum, g) => sum + (g.studentCount || 0), 0)} élèves
          </Text>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#2196F3"
          />
        }
      >
        {/* Statistiques globales */}
        <Card style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>Vue d'ensemble</Text>
            {groups.length > 0 && (
              <Badge 
                text={`${groups.length} groupes`}
                backgroundColor="#e3f2fd"
                textColor="#1976D2"
              />
            )}
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={24} color="#2196F3" />
              <Text style={styles.statNumber}>
                {groups.reduce((sum, g) => sum + (g.studentCount || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Élèves totaux</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="calendar" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>
                {Object.values(groupDetails).reduce((sum, stats) => sum + (stats.sessionsThisMonth || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Séances/mois</Text>
            </View>
          </View>
        </Card>

        {/* Liste des groupes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tous les groupes</Text>
          {groups.length > 0 && (
            <Badge 
              text={`${groups.length} trouvés`}
              backgroundColor="#fff3e0"
              textColor="#f57c00"
              size="small"
            />
          )}
        </View>

        {groups.length > 0 ? (
          groups.map((group) => {
            const stats = groupDetails[group.id] || {};
            const attendanceColor = getAttendanceColor(stats.attendanceRate || 0);
            
            return (
              <Card key={group.id} style={styles.groupCard}>
                {/* En-tête du groupe */}
                <View style={styles.groupHeader}>
                  <View style={styles.groupTitleSection}>
                    <View style={styles.groupIcon}>
                      <Ionicons 
                        name="people-outline" 
                        size={20} 
                        color="#2196F3" 
                      />
                    </View>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <Text style={styles.groupSubject}>
                        {group.subject} • {group.level}
                      </Text>
                    </View>
                  </View>
                  
                  <Badge 
                    text={`${stats.attendanceRate || 0}%`}
                    backgroundColor={`${attendanceColor}20`}
                    textColor={attendanceColor}
                    size="small"
                  />
                </View>
                
                {/* Statistiques principales */}
                <View style={styles.groupStats}>
                  <View style={styles.statRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statNumberSmall}>{group.studentCount || 0}</Text>
                      <Text style={styles.statLabelSmall}>Élèves</Text>
                    </View>
                    
                    <View style={styles.statBox}>
                      <Text style={styles.statNumberSmall}>{stats.sessionsThisMonth || 0}</Text>
                      <Text style={styles.statLabelSmall}>Séances</Text>
                    </View>
                    
                    <View style={styles.statBox}>
                      <Text style={styles.statNumberSmall}>{stats.attendanceRate || 0}%</Text>
                      <Text style={styles.statLabelSmall}>Taux présence</Text>
                    </View>
                    
                    <View style={styles.statBox}>
                      <Text style={styles.statNumberSmall}>{stats.completedSessions || 0}</Text>
                      <Text style={styles.statLabelSmall}>Terminées</Text>
                    </View>
                  </View>
                </View>
                
                {/* Horaires */}
                <View style={styles.scheduleSection}>
                  <View style={styles.scheduleHeader}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.scheduleTitle}>Horaires</Text>
                  </View>
                  <Text style={styles.scheduleText}>
                    {group.schedule || 'Non défini'}
                  </Text>
                </View>
                
                {/* Informations supplémentaires */}
                <View style={styles.extraInfo}>
                  <View style={styles.infoItem}>
                    <Ionicons name="location-outline" size={12} color="#666" />
                    <Text style={styles.infoText}>{group.room || 'Salle'}</Text>
                  </View>
                  
                  {stats.nextSession && (
                    <View style={styles.infoItem}>
                      <Ionicons name="calendar-outline" size={12} color="#666" />
                      <Text style={styles.infoText}>
                        Prochaine: {formatDate(stats.nextSession)}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            );
          })
        ) : (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Ionicons name="people-outline" size={50} color="#e0e0e0" />
              <Text style={styles.emptyTitle}>Aucun groupe trouvé</Text>
              <Text style={styles.emptyText}>
                Vous n'êtes actuellement assigné à aucun groupe.
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
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
  // Statistiques
  statsCard: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  // Carte de groupe
  groupCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  groupTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  groupSubject: {
    fontSize: 13,
    color: '#666',
  },
  // Statistiques du groupe
  groupStats: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumberSmall: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabelSmall: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  // Horaires
  scheduleSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  scheduleTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  scheduleText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  // Informations supplémentaires
  extraInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  // État vide
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TeacherGroupsScreen;