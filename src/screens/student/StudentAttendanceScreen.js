// screens/student/StudentAttendanceScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';

const StudentAttendanceScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    percentage: 0,
  });

  useEffect(() => {
    loadAttendances();
  }, [user]);

  const loadAttendances = async () => {
    try {
      if (user?.uid) {
        // Récupérer les présences de l'étudiant
        const attendancesQuery = query(
          collection(db, 'attendances'),
          where('studentId', '==', user.uid),
          orderBy('date', 'desc')
        );
        
        const attendancesSnapshot = await getDocs(attendancesQuery);
        const attendancesList = [];
        
        for (const attendanceDoc of attendancesSnapshot.docs) {
          const attendanceData = attendanceDoc.data();
          
          // Charger les détails de la session
          let sessionDetails = {};
          if (attendanceData.sessionId) {
            const sessionDoc = await getDoc(doc(db, 'sessions', attendanceData.sessionId));
            if (sessionDoc.exists()) {
              sessionDetails = sessionDoc.data();
            }
          }
          
          // Charger les détails du groupe
          let groupName = 'Groupe inconnu';
          if (sessionDetails.groupId) {
            const groupDoc = await getDoc(doc(db, 'groups', sessionDetails.groupId));
            if (groupDoc.exists()) {
              groupName = groupDoc.data().name;
            }
          }
          
          attendancesList.push({
            id: attendanceDoc.id,
            ...attendanceData,
            sessionDetails,
            groupName,
          });
        }
        
        setAttendances(attendancesList);
        
        // Calculer les statistiques
        const total = attendancesList.length;
        const present = attendancesList.filter(a => a.status === 'present').length;
        const absent = attendancesList.filter(a => a.status === 'absent').length;
        const late = attendancesList.filter(a => a.status === 'late').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        
        setStats({
          total,
          present,
          absent,
          late,
          percentage,
        });
      }
    } catch (error) {
      console.error('Erreur chargement présences:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAttendances();
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      weekday: 'short'
    });
  };

  // Fonction pour formater l'heure
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fonction pour obtenir la couleur selon le statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#10b981';
      case 'absent': return '#ef4444';
      case 'late': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  // Fonction pour obtenir l'icône selon le statut
  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return 'checkmark-circle-outline';
      case 'absent': return 'close-circle-outline';
      case 'late': return 'time-outline';
      default: return 'help-circle-outline';
    }
  };

  // Fonction pour obtenir le libellé du statut
  const getStatusLabel = (status) => {
    switch (status) {
      case 'present': return 'Présent';
      case 'absent': return 'Absent';
      case 'late': return 'En retard';
      default: return 'Inconnu';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons name="checkmark-circle-outline" size={50} color="#0014eb" />
        <Text style={styles.loadingText}>Chargement des présences...</Text>
      </SafeAreaView>
    );
  }

  // Grouper les présences par mois
  const attendancesByMonth = {};
  attendances.forEach(attendance => {
    const date = attendance.date ? new Date(attendance.date) : new Date();
    const monthYear = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    
    if (!attendancesByMonth[monthYear]) {
      attendancesByMonth[monthYear] = [];
    }
    attendancesByMonth[monthYear].push(attendance);
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes présences</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.percentage}%</Text>
            <Text style={styles.statLabel}>Taux de présence</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>
              {stats.present}
            </Text>
            <Text style={styles.statLabel}>Présents</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#ef4444' }]}>
              {stats.absent}
            </Text>
            <Text style={styles.statLabel}>Absents</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
              {stats.late}
            </Text>
            <Text style={styles.statLabel}>Retards</Text>
          </View>
        </View>

        {/* Graphique de présence (simplifié) */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Statistiques de présence</Text>
          <View style={styles.chart}>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { 
                backgroundColor: '#10b981',
                width: `${stats.present > 0 ? (stats.present / stats.total) * 100 : 0}%`
              }]}>
                <Text style={styles.chartBarText}>{stats.present}</Text>
              </View>
            </View>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { 
                backgroundColor: '#f59e0b',
                width: `${stats.late > 0 ? (stats.late / stats.total) * 100 : 0}%`
              }]}>
                <Text style={styles.chartBarText}>{stats.late}</Text>
              </View>
            </View>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { 
                backgroundColor: '#ef4444',
                width: `${stats.absent > 0 ? (stats.absent / stats.total) * 100 : 0}%`
              }]}>
                <Text style={styles.chartBarText}>{stats.absent}</Text>
              </View>
            </View>
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>Présent ({stats.present})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}>En retard ({stats.late})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}>Absent ({stats.absent})</Text>
            </View>
          </View>
        </View>

        {/* Historique des présences */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historique des présences</Text>
          
          {Object.keys(attendancesByMonth).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={50} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucune présence enregistrée</Text>
              <Text style={styles.emptyText}>
                Vos présences seront affichées ici après vos premières séances.
              </Text>
            </View>
          ) : (
            Object.entries(attendancesByMonth).map(([monthYear, monthAttendances]) => (
              <View key={monthYear} style={styles.monthSection}>
                <Text style={styles.monthTitle}>{monthYear}</Text>
                
                {monthAttendances.map((attendance, index) => (
                  <View key={index} style={styles.attendanceCard}>
                    <View style={styles.attendanceHeader}>
                      <View style={styles.dateSection}>
                        <Text style={styles.attendanceDate}>
                          {formatDate(attendance.date)}
                        </Text>
                        {attendance.sessionDetails?.startTime && (
                          <Text style={styles.attendanceTime}>
                            {attendance.sessionDetails.startTime} - {attendance.sessionDetails.endTime}
                          </Text>
                        )}
                      </View>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(attendance.status) + '20' }
                      ]}>
                        <Ionicons 
                          name={getStatusIcon(attendance.status)} 
                          size={16} 
                          color={getStatusColor(attendance.status)} 
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[
                          styles.statusText,
                          { color: getStatusColor(attendance.status) }
                        ]}>
                          {getStatusLabel(attendance.status)}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.groupName}>
                      {attendance.groupName}
                    </Text>
                    
                    {attendance.arrivalTime && (
                      <View style={styles.timeInfo}>
                        <Ionicons name="time-outline" size={14} color="#64748b" />
                        <Text style={styles.timeText}>
                          Arrivée: {formatTime(attendance.arrivalTime)}
                        </Text>
                      </View>
                    )}
                    
                    {attendance.departureTime && (
                      <View style={styles.timeInfo}>
                        <Ionicons name="exit-outline" size={14} color="#64748b" />
                        <Text style={styles.timeText}>
                          Départ: {formatTime(attendance.departureTime)}
                        </Text>
                      </View>
                    )}
                    
                    {attendance.sessionDetails?.roomId && (
                      <View style={styles.timeInfo}>
                        <Ionicons name="business-outline" size={14} color="#64748b" />
                        <Text style={styles.timeText}>
                          Salle: {attendance.sessionDetails.roomId}
                        </Text>
                      </View>
                    )}
                    
                    {attendance.notes && (
                      <Text style={styles.attendanceNotes}>
                        Note: {attendance.notes}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        {/* Informations importantes */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#0014eb" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Règles de présence</Text>
            <Text style={styles.infoText}>
              • La ponctualité est exigée.{'\n'}
              • Les absences doivent être justifiées.{'\n'}
              • 3 retards = 1 absence.{'\n'}
              • Taux de présence minimum requis: 80%.{'\n'}
              • Contactez l'administration pour les absences.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#0014eb',
    paddingHorizontal: 15,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0014eb',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 15,
  },
  chart: {
    marginBottom: 15,
  },
  chartBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartBar: {
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    minWidth: 40,
  },
  chartBarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginRight: 15,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#475569',
  },
  historySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 15,
  },
  monthSection: {
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
    paddingLeft: 5,
  },
  attendanceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  dateSection: {
    flex: 1,
  },
  attendanceDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  attendanceTime: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  groupName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 10,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  timeText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 6,
  },
  attendanceNotes: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
});

export default StudentAttendanceScreen;