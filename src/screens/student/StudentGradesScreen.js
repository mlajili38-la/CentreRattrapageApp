// screens/student/StudentGradesScreen.js - VERSION HISTORIQUE DES PRÉSENCES PASSÉES
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { StudentService } from '../../services/studentService';
import Card from '../../components/common/Card/Card';
import Badge from '../../components/common/Badge/Badge';

const StudentGradesScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendances, setAttendances] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    percentage: 0
  });
  const [studentInfo, setStudentInfo] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('📊 Chargement des présences passées pour:', user?.email);
      
      if (!user?.email) {
        throw new Error('Utilisateur non connecté');
      }

      // 1. Charger les informations de l'étudiant
      const student = await StudentService.getStudentByEmail(user.email);
      
      if (!student) {
        throw new Error('Élève non trouvé');
      }

      setStudentInfo(student);
      console.log('✅ Étudiant trouvé:', student.name);

      // 2. Charger les présences
      const attendanceData = await StudentService.getStudentAttendance(student.id);
      
      console.log('✅ Présences chargées:', attendanceData.attendances?.length || 0);
      
      // 3. FILTRER UNIQUEMENT LES PRÉSENCES PASSÉES (pas les futures)
      const now = new Date();
      const pastAttendances = (attendanceData.attendances || []).filter(attendance => {
        try {
          // Parser la date de la présence
          let attendanceDate;
          if (attendance.date && attendance.date.toDate) {
            attendanceDate = attendance.date.toDate();
          } else if (attendance.date instanceof Date) {
            attendanceDate = attendance.date;
          } else if (typeof attendance.date === 'string') {
            attendanceDate = new Date(attendance.date);
          } else {
            return false; // Date invalide
          }
          
          // Vérifier si c'est une date passée (avant aujourd'hui)
          const today = new Date(now);
          today.setHours(0, 0, 0, 0);
          attendanceDate.setHours(0, 0, 0, 0);
          
          return attendanceDate < today;
        } catch (error) {
          console.log('⚠️ Erreur de parsing date:', error);
          return false;
        }
      });

      console.log(`📅 ${pastAttendances.length} présences PASSÉES (futures exclues)`);
      
      // Afficher le détail pour débogage
      if (pastAttendances.length > 0) {
        pastAttendances.slice(0, 3).forEach((att, i) => {
          try {
            let date;
            if (att.date && att.date.toDate) {
              date = att.date.toDate();
            } else {
              date = new Date(att.date);
            }
            console.log(`   ${i+1}. ${date.toLocaleDateString('fr-FR')} - ${att.status}`);
          } catch (e) {
            console.log(`   ${i+1}. Date invalide`);
          }
        });
      }

      // 4. Recalculer les statistiques uniquement sur les présences passées
      const totalPast = pastAttendances.length;
      const presentPast = pastAttendances.filter(a => 
        a.status === 'present' || a.status === 'excused'
      ).length;
      const absentPast = pastAttendances.filter(a => a.status === 'absent').length;
      const latePast = pastAttendances.filter(a => a.status === 'late').length;
      const percentagePast = totalPast > 0 ? Math.round((presentPast / totalPast) * 100) : 0;

      console.log('📊 Statistiques PASSÉES:', {
        total: totalPast,
        present: presentPast,
        absent: absentPast,
        late: latePast,
        percentage: percentagePast
      });

      // Trier par date (plus récent en premier)
      const sortedAttendances = pastAttendances.sort((a, b) => {
        try {
          const dateA = a.date ? (a.date.toDate ? a.date.toDate() : new Date(a.date)) : new Date(0);
          const dateB = b.date ? (b.date.toDate ? b.date.toDate() : new Date(b.date)) : new Date(0);
          return dateB.getTime() - dateA.getTime();
        } catch (error) {
          return 0;
        }
      });

      setAttendances(sortedAttendances);
      setStats({
        total: totalPast,
        present: presentPast,
        absent: absentPast,
        late: latePast,
        percentage: percentagePast
      });
      
    } catch (error) {
      console.error('❌ Erreur chargement présences:', error);
      
      // Données de secours pour le développement (uniquement passées)
      const fallbackAttendances = [
        {
          id: 'att-1',
          date: new Date(2024, 0, 15, 14, 0, 0),
          subject: 'Mathématiques',
          groupName: 'Maths 2BAC - A',
          startTime: '14:00',
          endTime: '16:00',
          status: 'present',
          notes: 'À l\'heure'
        },
        {
          id: 'att-2',
          date: new Date(2024, 0, 16, 16, 0, 0),
          subject: 'Physique',
          groupName: 'Physique 2BAC - A',
          startTime: '16:00',
          endTime: '18:00',
          status: 'late',
          notes: 'Arrivé 10 minutes en retard'
        },
        {
          id: 'att-3',
          date: new Date(2024, 0, 17, 10, 0, 0),
          subject: 'Anglais',
          groupName: 'Anglais 2BAC',
          startTime: '10:00',
          endTime: '12:00',
          status: 'absent',
          notes: 'Absence justifiée'
        },
        {
          id: 'att-4',
          date: new Date(2024, 0, 18, 14, 0, 0),
          subject: 'Mathématiques',
          groupName: 'Maths 2BAC - A',
          startTime: '14:00',
          endTime: '16:00',
          status: 'present',
          notes: 'À l\'heure'
        }
      ];
      
      setAttendances(fallbackAttendances);
      setStats({
        total: 4,
        present: 2,
        absent: 1,
        late: 1,
        percentage: 75
      });
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'present': return '#10B981';
      case 'absent': return '#EF4444';
      case 'late': return '#F59E0B';
      case 'pending': return '#6B7280'; // Pour les sessions futures
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch(status?.toLowerCase()) {
      case 'present': return 'Présent';
      case 'absent': return 'Absent';
      case 'late': return 'En retard';
      case 'pending': return 'À venir';
      default: return status || 'Non défini';
    }
  };

  const formatDate = (date) => {
    if (!date) return '--/--/----';
    
    try {
      let dateObj;
      if (date.toDate) {
        dateObj = date.toDate();
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        dateObj = new Date(date);
      }
      
      if (isNaN(dateObj.getTime())) {
        return '--/--/----';
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateObj.setHours(0, 0, 0, 0);
      
      if (dateObj.getTime() === today.getTime()) {
        return "Aujourd'hui";
      }
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (dateObj.getTime() === yesterday.getTime()) {
        return 'Hier';
      }
      
      return dateObj.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return '--/--/----';
    }
  };

  const formatTime = (time) => {
    if (!time) return '--:--';
    return time;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Historique des présences</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Chargement de l'historique...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historique des présences</Text>
        <Text style={styles.headerSubtitle}>Séances passées uniquement</Text>
        {studentInfo && (
          <Text style={styles.studentInfo}>
            {studentInfo.name} • {studentInfo.levelCode || 'Niveau non spécifié'}
          </Text>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Carte des statistiques */}
        <Card style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <View style={styles.statsTitleContainer}>
              <View style={styles.statsIconContainer}>
                <Ionicons name="stats-chart" size={15} color="#FFFFFF" />
              </View>
              <Text style={styles.statsTitle}>Statistiques des présences</Text>
            </View>
            <Badge 
              text={`${stats.percentage}%`}
              backgroundColor={stats.percentage >= 80 ? '#DCFCE7' : '#FEE2E2'}
              textColor={stats.percentage >= 80 ? '#10B981' : '#EF4444'}
              size="small"
            />
          </View>
          
          {/* Statistiques principales */}
          <View style={styles.mainStats}>
            <View style={styles.statColumn}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>SÉANCES PASSÉES</Text>
            </View>
            
            <View style={styles.statColumn}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.present}</Text>
              <Text style={styles.statLabel}>PRÉSENCES</Text>
            </View>
            
            <View style={styles.statColumn}>
              <Text style={[styles.statNumber, { color: '#EF4444' }]}>{stats.absent}</Text>
              <Text style={styles.statLabel}>ABSENCES</Text>
            </View>
            
            <View style={styles.statColumn}>
              <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{stats.late}</Text>
              <Text style={styles.statLabel}>RETARDS</Text>
            </View>
          </View>
          
          {/* Barre de progression */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>Taux de présence global</Text>
              <Text style={styles.progressPercent}>{stats.percentage}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${stats.percentage}%`,
                    backgroundColor: stats.percentage >= 80 ? '#10B981' : 
                                   stats.percentage >= 60 ? '#F59E0B' : '#EF4444'
                  }
                ]} 
              />
            </View>
          </View>
        </Card>

        {/* Historique des présences */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="time" size={20} color="#7C3AED" />
            <Text style={styles.sectionTitle}>Historique des séances </Text>
          </View>
          <Badge 
            text={`${attendances.length} séances`}
            backgroundColor="#EDE9FE"
            textColor="#7C3AED"
            size="medium"
          />
        </View>
        
        {attendances.length > 0 ? (
          attendances.map((attendance, index) => (
            <Card key={attendance.id || index} style={styles.attendanceCard}>
              {/* En-tête avec date et statut */}
              <View style={styles.attendanceHeader}>
                <View style={styles.dateSection}>
                  <Text style={styles.attendanceDate}>{formatDate(attendance.date)}</Text>
                </View>
                
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor(attendance.status)}15` }
                ]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(attendance.status) }]} />
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(attendance.status) }
                  ]}>
                    {getStatusText(attendance.status)}
                  </Text>
                </View>
              </View>
              
              {/* Détails de la séance */}
              <View style={styles.attendanceDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailColumn}>
                    <View style={styles.detailItem}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="school-outline" size={16} color="#7C3AED" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>GROUPE</Text>
                        <Text style={styles.detailValue}>{attendance.groupName || 'Non spécifié'}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="book-outline" size={16} color="#7C3AED" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>MATIÈRE</Text>
                        <Text style={styles.detailValue}>{attendance.subject || 'Non spécifié'}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.detailColumn}>
                    <View style={styles.timeContainer}>
                      <View style={styles.timeIconContainer}>
                        <Ionicons name="time-outline" size={16} color="#7C3AED" />
                      </View>
                      <View style={styles.timeContent}>
                        <Text style={styles.timeLabel}>HORAIRE</Text>
                        <Text style={styles.timeValue}>
                          {formatTime(attendance.startTime)} - {formatTime(attendance.endTime)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Notes masquées - montrées seulement si cliqué */}
              {attendance.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>NOTE</Text>
                  <Text style={styles.notesText} numberOfLines={2}>{attendance.notes}</Text>
                </View>
              )}
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>Aucune présence passée enregistrée</Text>
              <Text style={styles.emptyText}>
                Votre historique de présence apparaîtra ici après vos premières séances.
              </Text>
              <View style={styles.infoNote}>
                <Ionicons name="information-circle-outline" size={16} color="#6366F1" />
                <Text style={styles.infoNoteText}>
                  Les séances futures sont visibles dans la section "Calendrier"
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Note d'information */}
        {attendances.length > 0 && (
          <Card style={styles.infoCard}>
            <View style={styles.infoContent}>
              <Ionicons name="information-circle" size={20} color="#6366F1" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Information</Text>
                <Text style={styles.infoDescription}>
                  Cet écran affiche uniquement l'historique des présences passées.
                  Pour voir vos séances à venir, consultez la section "Calendrier".
                </Text>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  studentInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  // Carte des statistiques
  statsCard: {
    padding: 24,
    marginBottom: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  statsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsIconContainer: {
    width: 25,
    height: 25,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  mainStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginLeft: 8,
  },
  // Cartes de présence
  attendanceCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateSection: {
    flex: 1,
  },
  attendanceDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  attendanceDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
  },
  detailColumn: {
    flex: 1,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timeContent: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 16,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoNoteText: {
    fontSize: 12,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
  },
  infoCard: {
    padding: 20,
    marginTop: 16,
    marginBottom: 32,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#DBEAFE',
    borderRadius: 16,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
});

export default StudentGradesScreen;