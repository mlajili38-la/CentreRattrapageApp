// screens/student/StudentGroupsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const StudentGroupsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState({});
  const [teachers, setTeachers] = useState({});

  useEffect(() => {
    loadGroups();
  }, [user]);

  const loadGroups = async () => {
    try {
      if (user?.uid) {
        // Récupérer l'étudiant pour avoir ses groupes
        const studentDoc = await getDoc(doc(db, 'students', user.uid));
        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          const groupIds = studentData.groupIds || [];
          
          // Charger chaque groupe
          const groupsPromises = groupIds.map(async (groupId) => {
            const groupDoc = await getDoc(doc(db, 'groups', groupId));
            if (groupDoc.exists()) {
              const groupData = groupDoc.data();
              
              // Charger la matière
              let subjectName = 'Matière non spécifiée';
              if (groupData.subjectId) {
                const subjectDoc = await getDoc(doc(db, 'subjects', groupData.subjectId));
                if (subjectDoc.exists()) {
                  subjectName = subjectDoc.data().name;
                }
              }
              
              // Charger l'enseignant
              let teacherName = 'Enseignant non spécifié';
              if (groupData.teacherId) {
                const teacherDoc = await getDoc(doc(db, 'teachers', groupData.teacherId));
                if (teacherDoc.exists()) {
                  teacherName = teacherDoc.data().name;
                }
              }
              
              // Charger le niveau
              let levelName = 'Niveau non spécifié';
              if (groupData.levelId) {
                const levelDoc = await getDoc(doc(db, 'levels', groupData.levelId));
                if (levelDoc.exists()) {
                  levelName = levelDoc.data().name;
                }
              }
              
              return {
                id: groupId,
                ...groupData,
                subjectName,
                teacherName,
                levelName,
              };
            }
            return null;
          });
          
          const groupsResult = (await Promise.all(groupsPromises)).filter(g => g !== null);
          setGroups(groupsResult);
        }
      }
    } catch (error) {
      console.error('Erreur chargement groupes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour formater l'horaire
  const formatSchedule = (schedule) => {
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return 'Horaire non défini';
    }
    
    const firstSchedule = schedule[0];
    const days = schedule.map(s => s.dayName).join(', ');
    return `${days} - ${firstSchedule.startTime || '--:--'} à ${firstSchedule.endTime || '--:--'}`;
  };

  // Fonction pour obtenir l'emoji du jour
  const getDayEmoji = (dayName) => {
    const emojis = {
      'Lundi': '📅',
      'Mardi': '📅',
      'Mercredi': '📅',
      'Jeudi': '📅',
      'Vendredi': '📅',
      'Samedi': '📅',
      'Dimanche': '📅',
    };
    return emojis[dayName] || '📅';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons name="people-outline" size={50} color="#0014eb" />
        <Text style={styles.loadingText}>Chargement des groupes...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes groupes</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{groups.length}</Text>
            <Text style={styles.statLabel}>Groupes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {groups.reduce((sum, group) => sum + (group.schedule?.length || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Séances/semaine</Text>
          </View>
        </View>

        {/* Liste des groupes */}
        <View style={styles.groupsList}>
          {groups.map((group, index) => (
            <View key={index} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupName}>{group.name}</Text>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>{group.levelName}</Text>
                </View>
              </View>
              
              <View style={styles.groupDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="book-outline" size={18} color="#666" />
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Matière: </Text>
                    {group.subjectName}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={18} color="#666" />
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Enseignant: </Text>
                    {group.teacherName}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={18} color="#666" />
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Horaire: </Text>
                    {formatSchedule(group.schedule)}
                  </Text>
                </View>
                
                {group.roomId && (
                  <View style={styles.detailRow}>
                    <Ionicons name="business-outline" size={18} color="#666" />
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Salle: </Text>
                      {group.roomId}
                    </Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Ionicons name="people-outline" size={18} color="#666" />
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Élèves: </Text>
                    {group.currentCount || 0}/{group.capacity || 0}
                  </Text>
                </View>
                
                {group.monthlyFee && (
                  <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={18} color="#666" />
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Frais mensuels: </Text>
                      {group.monthlyFee} DH
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Détail des horaires */}
              {group.schedule && group.schedule.length > 0 && (
                <View style={styles.scheduleSection}>
                  <Text style={styles.scheduleTitle}>Détail des horaires:</Text>
                  {group.schedule.map((sched, schedIndex) => (
                    <View key={schedIndex} style={styles.scheduleItem}>
                      <View style={styles.scheduleDay}>
                        <Text style={styles.dayEmoji}>{getDayEmoji(sched.dayName)}</Text>
                        <Text style={styles.dayName}>{sched.dayName}</Text>
                      </View>
                      <Text style={styles.scheduleTime}>
                        {sched.startTime || '--:--'} - {sched.endTime || '--:--'}
                      </Text>
                      {sched.roomId && (
                        <Text style={styles.scheduleRoom}>{sched.roomId}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.sessionsButton}
                onPress={() => navigation.navigate('GroupSessions', { groupId: group.id })}
              >
                <Text style={styles.sessionsButtonText}>Voir les séances</Text>
                <Ionicons name="chevron-forward" size={20} color="#0014eb" />
              </TouchableOpacity>
            </View>
          ))}
          
          {groups.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>Aucun groupe</Text>
              <Text style={styles.emptyText}>
                Vous n'êtes inscrit dans aucun groupe pour le moment.
              </Text>
            </View>
          )}
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
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0014eb',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  groupsList: {
    marginBottom: 20,
  },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  levelBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0014eb',
  },
  groupDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 10,
    flex: 1,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#334155',
  },
  scheduleSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 10,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  scheduleDay: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dayEmoji: {
    marginRight: 8,
  },
  dayName: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  scheduleTime: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 10,
    width: 120,
  },
  scheduleRoom: {
    fontSize: 12,
    color: '#94a3b8',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sessionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  sessionsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0014eb',
    marginRight: 5,
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
});

export default StudentGroupsScreen;