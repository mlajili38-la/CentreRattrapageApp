// screens/teacher/TeacherAttendanceScreen.js - VERSION CORRIGÉE
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import TeacherService from '../../services/TeacherService';
import Card from '../../components/common/Card/Card';
import Badge from '../../components/common/Badge/Badge';

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit,
  updateDoc,
  setDoc,
  Timestamp  // <-- AJOUTEZ CELUI-CI
} from 'firebase/firestore';
import { db } from '../../services/firebase';

const TeacherAttendanceScreen = ({ teacherData }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [studentsAttendance, setStudentsAttendance] = useState([]);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Options de filtre
  const [filter, setFilter] = useState('today'); // today, upcoming, all
  const [showCompleted, setShowCompleted] = useState(false);

  // Noms des mois en français
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  // Fonction pour vérifier si une date est aujourd'hui - CORRIGÉE
  const isToday = (date) => {
    if (!date) return false;
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      const today = new Date();
      
      return (
        dateObj.getDate() === today.getDate() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear()
      );
    } catch {
      return false;
    }
  };

  // Vérifier si une date est demain
  const isTomorrow = (date) => {
    if (!date) return false;
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return (
        dateObj.getDate() === tomorrow.getDate() &&
        dateObj.getMonth() === tomorrow.getMonth() &&
        dateObj.getFullYear() === tomorrow.getFullYear()
      );
    } catch {
      return false;
    }
  };

  // Charger les sessions avec présence à gérer - VERSION CORRIGÉE
  const loadSessions = async () => {
    try {
      setLoading(true);
      
      if (!user?.email) {
        throw new Error('Utilisateur non connecté');
      }

      console.log('👨‍🏫 Chargement des sessions pour enseignant:', user.email);

      // 1. Trouver l'enseignant
      const teacherInfo = await TeacherService.getTeacherByEmail(user.email);
      
      if (!teacherInfo) {
        throw new Error('Enseignant non trouvé');
      }

      console.log('✅ Enseignant trouvé:', teacherInfo.name);

      // 2. Charger les sessions de l'enseignant - OPTIMISÉ
      let teacherSessions = [];
      
      try {
        // Essayer d'abord avec le service
        teacherSessions = await TeacherService.getTeacherSessions(teacherInfo.id);
        console.log(`📅 ${teacherSessions.length} sessions récupérées via service`);
      } catch (serviceError) {
        console.log('⚠️ Erreur service, tentative directe Firestore:', serviceError);
        
        // Fallback: Chargement direct depuis Firestore
        const sessionsQuery = query(
          collection(db, 'sessions'),
          where('teacherId', '==', teacherInfo.id),
          orderBy('date', 'desc'),
          limit(50)
        );
        
        const sessionsSnapshot = await getDocs(sessionsQuery);
        teacherSessions = sessionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`📅 ${teacherSessions.length} sessions récupérées directement`);
      }

      // 3. Traiter et enrichir les sessions
      const processedSessions = await Promise.all(
        teacherSessions.map(async (session) => {
          try {
            // Convertir la date
            let sessionDate;
            if (session.date) {
              if (session.date.toDate) {
                sessionDate = session.date.toDate();
              } else if (session.date.seconds) {
                sessionDate = new Date(session.date.seconds * 1000);
              } else if (typeof session.date === 'string') {
                sessionDate = new Date(session.date);
              } else if (session.date instanceof Date) {
                sessionDate = session.date;
              }
            }
            
            // Charger les infos du groupe
            let groupName = 'Groupe';
            let subject = 'Matière';
            let level = 'Niveau';
            let room = 'Salle';
            let totalStudents = 0;
            
            if (session.groupId) {
              try {
                const groupDoc = await getDoc(doc(db, 'groups', session.groupId));
                if (groupDoc.exists()) {
                  const groupData = groupDoc.data();
                  groupName = groupData.name || 'Groupe';
                  subject = groupData.subject || 'Matière';
                  level = groupData.level || 'Niveau';
                  room = groupData.room || 'Salle';
                  totalStudents = Array.isArray(groupData.studentIds) ? groupData.studentIds.length : 0;
                }
              } catch (groupError) {
                console.log('⚠️ Erreur chargement groupe:', groupError);
              }
            }

            // Déterminer le statut
            const now = new Date();
            const isTodaySession = sessionDate ? isToday(sessionDate) : false;
            const isPast = sessionDate ? sessionDate < now : false;
            
            let status = 'scheduled';
            if (session.status) {
              status = session.status;
            } else if (isPast) {
              status = 'completed';
            }

            // Vérifier si on peut marquer la présence
            let canMarkAttendance = false;
            if (isTodaySession && status === 'scheduled') {
              // Vérifier si la session est dans les prochaines heures
              const sessionStart = session.startTime ? parseTime(session.startTime) : null;
              const sessionEnd = session.endTime ? parseTime(session.endTime) : null;
              const currentTime = now.getHours() * 60 + now.getMinutes();
              
              if (sessionStart && sessionEnd) {
                // On peut marquer la présence 30 min avant jusqu'à 2h après le début
                canMarkAttendance = (
                  currentTime >= (sessionStart - 30) && 
                  currentTime <= (sessionStart + 120)
                );
              } else {
                // Si pas d'horaire, on autorise toute la journée
                canMarkAttendance = true;
              }
            }

            return {
              id: session.id,
              ...session,
              date: sessionDate,
              groupName,
              subject,
              level,
              room,
              totalStudents,
              attendanceCount: session.attendanceCount || 0,
              isToday: isTodaySession,
              isPast,
              status,
              canMarkAttendance,
              attendanceData: session.attendance || {}
            };
          } catch (sessionError) {
            console.log('⚠️ Erreur traitement session:', sessionError);
            return null;
          }
        })
      );

      // Filtrer les sessions nulles
      const validSessions = processedSessions.filter(session => session !== null);
      
      // Trier: sessions d'aujourd'hui en premier, puis par date
      validSessions.sort((a, b) => {
        if (a.isToday && !b.isToday) return -1;
        if (!a.isToday && b.isToday) return 1;
        if (!a.date || !b.date) return 0;
        return a.date.getTime() - b.date.getTime();
      });

      console.log(`✅ ${validSessions.length} sessions traitées`);
      console.log(`   • Aujourd'hui: ${validSessions.filter(s => s.isToday).length}`);
      console.log(`   • À marquer: ${validSessions.filter(s => s.canMarkAttendance).length}`);

      setSessions(validSessions);
      
    } catch (error) {
      console.error('❌ Erreur chargement sessions:', error);
      Alert.alert('Erreur', 'Impossible de charger les sessions');
      setSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fonction pour parser l'heure (ex: "14:30")
  const parseTime = (timeString) => {
    if (!timeString) return null;
    
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + minutes;
    } catch {
      return null;
    }
  };

  // Formater la date pour l'affichage
  const formatDate = (date) => {
    if (!date) return 'Date inconnue';
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      
      if (isToday(dateObj)) return "Aujourd'hui";
      if (isTomorrow(dateObj)) return 'Demain';
      
      return dateObj.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return 'Date inconnue';
    }
  };

  // Formater l'heure
  const formatTime = (time) => {
    if (!time) return '--:--';
    if (/^\d{1,2}:\d{2}$/.test(time)) {
      const [hours, minutes] = time.split(':').map(Number);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return time;
  };

  // Obtenir le statut de la session
  const getSessionStatus = (session) => {
    if (!session) return 'Inconnu';
    
    if (session.status === 'completed') return 'Terminée';
    if (session.status === 'cancelled') return 'Annulée';
    
    if (session.isPast) return 'Passée';
    if (session.isToday) return "Aujourd'hui";
    
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
      case 'Passée': return '#757575';
      default: return '#9E9E9E';
    }
  };

  // Filtrer les sessions selon les options
  const getFilteredSessions = () => {
    const now = new Date();
    
    return sessions.filter(session => {
      // Filtrer par statut terminé
      if (!showCompleted && session.status === 'completed') return false;
      
      // Filtrer par date
      switch (filter) {
        case 'today':
          return session.isToday;
        case 'upcoming':
          return !session.isPast && !session.isToday;
        case 'past':
          return session.isPast || session.status === 'completed';
        default:
          return true;
      }
    });
  };

  // Charger les élèves d'une session
  const loadStudentsForSession = async (session) => {
    try {
      console.log(`👥 Chargement élèves pour session ${session.id}`);
      
      if (!session.groupId) {
        throw new Error('Session sans groupe');
      }

      // 1. Récupérer le groupe
      const groupDoc = await getDoc(doc(db, 'groups', session.groupId));
      if (!groupDoc.exists()) {
        throw new Error('Groupe non trouvé');
      }
      
      const groupData = groupDoc.data();
      const studentIds = groupData.studentIds || [];
      
      console.log(`📋 ${studentIds.length} élèves dans le groupe`);
      
      // 2. Charger les élèves en parallèle
      const studentPromises = studentIds.map(async (studentId) => {
        try {
          const studentDoc = await getDoc(doc(db, 'students', studentId));
          if (studentDoc.exists()) {
            const studentData = studentDoc.data();
            
            // Vérifier la présence existante
            const isPresent = session.attendanceData?.[studentId] === true;
            
            return {
              id: studentId,
              name: studentData.name || `Élève ${studentId.substring(0, 8)}`,
              email: studentData.email || '',
              isPresent: isPresent,
              attendanceStatus: isPresent ? 'present' : 'absent'
            };
          }
        } catch (error) {
          console.log(`⚠️ Erreur élève ${studentId}:`, error);
          return null;
        }
        return null;
      });

      const students = (await Promise.all(studentPromises)).filter(s => s !== null);
      
      // 3. Si pas d'élèves trouvés, créer une liste basique
      if (students.length === 0) {
        console.log('⚠️ Aucun élève trouvé, création liste basique');
        return [{
          id: 'demo1',
          name: 'Élève 1',
          email: '',
          isPresent: true,
          attendanceStatus: 'present'
        }, {
          id: 'demo2',
          name: 'Élève 2',
          email: '',
          isPresent: true,
          attendanceStatus: 'present'
        }];
      }

      console.log(`✅ ${students.length} élèves chargés`);
      return students;
      
    } catch (error) {
      console.error('❌ Erreur chargement élèves:', error);
      return [];
    }
  };

  // Ouvrir le modal de présence
  const openAttendanceModal = async (session) => {
    try {
      setSelectedSession(session);
      
      // Charger les élèves
      const students = await loadStudentsForSession(session);
      setStudentsAttendance(students);
      
      setAttendanceModalVisible(true);
      
    } catch (error) {
      console.error('❌ Erreur ouverture modal:', error);
      Alert.alert('Erreur', 'Impossible de charger la liste des élèves');
    }
  };

  // Basculer la présence d'un élève
  const toggleStudentAttendance = (studentId) => {
    setStudentsAttendance(prev => 
      prev.map(student => 
        student.id === studentId 
          ? { 
              ...student, 
              isPresent: !student.isPresent,
              attendanceStatus: !student.isPresent ? 'present' : 'absent'
            } 
          : student
      )
    );
  };

  // Sauvegarder les présences
 const saveAttendance = async () => {
  try {
    if (!selectedSession) return;
    
    setSavingAttendance(true);
    
    // Préparer les données de présence
    const attendanceData = {};
    let presentCount = 0;
    
    // 1. Mettre à jour les présences dans la session
    studentsAttendance.forEach(student => {
      attendanceData[student.id] = student.isPresent;
      if (student.isPresent) presentCount++;
    });
    
    // 2. Mettre à jour la session dans Firestore
    await updateDoc(doc(db, 'sessions', selectedSession.id), {
      attendance: attendanceData,
      attendanceCount: presentCount,
      status: 'completed',
      updatedAt: new Date()
    });
    
    // 3. 🔥 CRITIQUE : Créer les documents dans la collection `attendances`
    // Dans la fonction saveAttendance(), remplacez cette partie :
const attendancePromises = studentsAttendance.map(async (student) => {
  try {
    const attendanceDocRef = doc(collection(db, 'attendances'));
    
    // CONVERTIR LA DATE EN TIMESTAMP FIREBASE
    let sessionDate = selectedSession.date;
    let firestoreDate;
    
    // Conversion sécurisée de la date
    if (sessionDate instanceof Date) {
      firestoreDate = Timestamp.fromDate(sessionDate);
    } else if (sessionDate?.toDate) {
      firestoreDate = sessionDate;
      sessionDate = sessionDate.toDate();
    } else if (sessionDate?.seconds) {
      firestoreDate = Timestamp.fromMillis(sessionDate.seconds * 1000);
      sessionDate = new Date(sessionDate.seconds * 1000);
    } else if (typeof sessionDate === 'string') {
      sessionDate = new Date(sessionDate);
      firestoreDate = Timestamp.fromDate(sessionDate);
    } else {
      // Date par défaut (maintenant)
      sessionDate = new Date();
      firestoreDate = Timestamp.now();
    }
    
    // CRÉATION DU DOCUMENT AVEC LE BON FORMAT
    await setDoc(attendanceDocRef, {
      // Identifiants
      id: attendanceDocRef.id,
      studentId: student.id,
      sessionId: selectedSession.id,
      groupId: selectedSession.groupId,
      teacherId: selectedSession.teacherId || user?.uid,
      
      // 🔥 TRÈS IMPORTANT : Date au format Firestore Timestamp
      date: firestoreDate, // Format REQUIS pour les requêtes
      markedAt: Timestamp.now(),
      
      // Données de présence
      status: student.isPresent ? 'present' : 'absent',
      markedBy: user?.email || 'teacher_unknown',
      
      // Données de référence
      studentName: student.name,
      groupName: selectedSession.groupName || 'Groupe inconnu',
      teacherName: selectedSession.teacherName || teacherData?.name || 'Enseignant',
      sessionDate: sessionDate, // Garder aussi en Date pour affichage
      subject: selectedSession.subject || 'Matière inconnue',
      level: selectedSession.level || 'Niveau inconnu',
      room: selectedSession.room || 'Salle inconnue',
      
      // Métadonnées
      isExcused: false,
      notes: student.isPresent ? 'Présent' : 'Absent non justifié',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      
      // Champs pour faciliter les requêtes
      studentId_lower: student.id.toLowerCase(),
      studentName_lower: student.name.toLowerCase(),
      groupName_lower: (selectedSession.groupName || '').toLowerCase(),
      teacherName_lower: (selectedSession.teacherName || '').toLowerCase(),
      status_lower: (student.isPresent ? 'present' : 'absent')
    });
    
    console.log(`✅ Présence enregistrée pour ${student.name}: ${student.isPresent ? 'Présent' : 'Absent'}`);
    
  } catch (studentError) {
    console.error(`❌ Erreur pour ${student.name}:`, studentError);
  }
});
    
    // Exécuter toutes les créations d'attendance en parallèle
    await Promise.all(attendancePromises);
    
    // 4. Mettre à jour localement
    setSessions(prev => 
      prev.map(session => 
        session.id === selectedSession.id 
          ? { 
              ...session, 
              attendanceCount: presentCount,
              status: 'completed',
              attendanceData: attendanceData
            } 
          : session
      )
    );
    
    Alert.alert(
      '✅ Succès',
      `Présences enregistrées : ${presentCount} présents, ${studentsAttendance.length - presentCount} absents`,
      [{ text: 'OK', onPress: () => setAttendanceModalVisible(false) }]
    );
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde présence:', error);
    Alert.alert('Erreur', 'Impossible d\'enregistrer les présences');
  } finally {
    setSavingAttendance(false);
  }
};

  // Rendre un élève dans la liste de présence
  const renderStudentItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.studentItem}
      onPress={() => toggleStudentAttendance(item.id)}
    >
      <View style={styles.studentInfo}>
        <View style={styles.studentAvatar}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.studentDetails}>
          <Text style={styles.studentName}>{item.name}</Text>
          {item.email && (
            <Text style={styles.studentEmail}>{item.email}</Text>
          )}
        </View>
      </View>
      
      <Switch
        value={item.isPresent}
        onValueChange={() => toggleStudentAttendance(item.id)}
        trackColor={{ false: '#ffcdd2', true: '#c8e6c9' }}
        thumbColor={item.isPresent ? '#4CAF50' : '#f44336'}
      />
    </TouchableOpacity>
  );

  // Rendu d'une carte de session
  const renderSessionCard = ({ item }) => {
    const status = getSessionStatus(item);
    const statusColor = getStatusColor(status);
    const canMarkAttendance = item.canMarkAttendance;
    
    return (
      <Card style={styles.sessionCard}>
        {/* En-tête avec date et statut */}
        <View style={styles.sessionHeader}>
          <View style={styles.dateColumn}>
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
            <Text style={styles.timeText}>
              {formatTime(item.startTime)} - {formatTime(item.endTime)}
            </Text>
          </View>
          
          <Badge 
            text={status}
            backgroundColor={`${statusColor}20`}
            textColor={statusColor}
            size="small"
          />
        </View>
        
        {/* Détails du groupe */}
        <View style={styles.sessionDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{item.groupName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="school-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{item.subject} - {item.level}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{item.room}</Text>
          </View>
          
          {item.topic && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.topic}</Text>
            </View>
          )}
        </View>
        
        {/* Statistiques et actions */}
        <View style={styles.sessionFooter}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="person-outline" size={12} color="#666" />
              <Text style={styles.statText}>
                {item.attendanceCount || 0}/{item.totalStudents || 0}
              </Text>
            </View>
            <Text style={styles.statLabel}>Présents</Text>
          </View>
          
          {canMarkAttendance ? (
            <TouchableOpacity 
              style={styles.attendanceButton}
              onPress={() => openAttendanceModal(item)}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={styles.attendanceButtonText}>Marquer présences</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.attendanceButton, styles.viewButton]}
              onPress={() => openAttendanceModal(item)}
              disabled={!item.attendanceData}
            >
              <Ionicons name="eye-outline" size={16} color="#1976D2" />
              <Text style={[styles.attendanceButtonText, { color: '#1976D2' }]}>
                {item.status === 'completed' ? 'Voir présences' : 'À venir'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  // Rafraîchir les données
  const onRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  useEffect(() => {
    loadSessions();
  }, [user]);

  if (loading && sessions.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Chargement des séances...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredSessions = getFilteredSessions();
  const todaySessions = sessions.filter(s => s.isToday);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec filtres */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion des présences</Text>
        
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={[styles.filterButton, filter === 'today' && styles.filterButtonActive]}
              onPress={() => setFilter('today')}
            >
              <Text style={[styles.filterText, filter === 'today' && styles.filterTextActive]}>
                Aujourd'hui ({todaySessions.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterButton, filter === 'upcoming' && styles.filterButtonActive]}
              onPress={() => setFilter('upcoming')}
            >
              <Text style={[styles.filterText, filter === 'upcoming' && styles.filterTextActive]}>
                À venir
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                Toutes ({sessions.length})
              </Text>
            </TouchableOpacity>
          </ScrollView>
          
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>Terminées</Text>
            <Switch
              value={showCompleted}
              onValueChange={setShowCompleted}
              trackColor={{ false: '#e0e0e0', true: '#bbdefb' }}
              thumbColor={showCompleted ? '#2196F3' : '#f5f5f5'}
            />
          </View>
        </View>
        
        <View style={styles.statsHeader}>
          <Badge 
            text={`${filteredSessions.length} séances`}
            backgroundColor="#e3f2fd"
            textColor="#1976D2"
            size="small"
          />
          <Badge 
            text={`${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}`}
            backgroundColor="#fff3e0"
            textColor="#f57c00"
            size="small"
          />
        </View>
      </View>

      {/* Liste des séances */}
      <FlatList
        data={filteredSessions}
        renderItem={renderSessionCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Ionicons name="calendar-outline" size={50} color="#e0e0e0" />
              <Text style={styles.emptyTitle}>Aucune séance</Text>
              <Text style={styles.emptyText}>
                {filter === 'today' 
                  ? "Aucune séance programmée pour aujourd'hui"
                  : filter === 'upcoming'
                  ? "Aucune séance à venir"
                  : "Aucune séance trouvée"}
              </Text>
            </View>
          </Card>
        }
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#2196F3"
          />
        }
      />

      {/* Modal de présence */}
      <Modal
        visible={attendanceModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAttendanceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header modal */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Présences</Text>
                {selectedSession && (
                  <>
                    <Text style={styles.modalSubtitle}>{selectedSession.groupName}</Text>
                    <Text style={styles.modalDate}>
                      {formatDate(selectedSession.date)} • {formatTime(selectedSession.startTime)}
                    </Text>
                  </>
                )}
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setAttendanceModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {/* Statistiques */}
            {studentsAttendance.length > 0 && (
              <View style={styles.modalStats}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {studentsAttendance.filter(s => s.isPresent).length}
                  </Text>
                  <Text style={styles.statLabel}>Présents</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {studentsAttendance.filter(s => !s.isPresent).length}
                  </Text>
                  <Text style={styles.statLabel}>Absents</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {studentsAttendance.length}
                  </Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
              </View>
            )}
            
            {/* Liste des élèves */}
            <FlatList
              data={studentsAttendance}
              renderItem={renderStudentItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.studentsList}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View style={styles.listHeader}>
                  <Text style={styles.listHeaderTitle}>
                    Liste des élèves ({studentsAttendance.length})
                  </Text>
                  <Text style={styles.listHeaderHint}>
                    Cliquez sur un élève ou utilisez le switch
                  </Text>
                </View>
              }
              ListEmptyComponent={
                <View style={styles.noStudents}>
                  <Ionicons name="people-outline" size={40} color="#e0e0e0" />
                  <Text style={styles.noStudentsText}>Aucun élève trouvé</Text>
                </View>
              }
            />
            
            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setAttendanceModalVisible(false)}
                disabled={savingAttendance}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton]}
                onPress={saveAttendance}
                disabled={savingAttendance}
              >
                {savingAttendance ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#fff" />
                    <Text style={styles.saveButtonText}>
                      Enregistrer ({studentsAttendance.filter(s => s.isPresent).length}/{studentsAttendance.length})
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Les styles restent exactement les mêmes...

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
  centerContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  toggleText: {
    fontSize: 13,
    color: '#666',
  },
  statsHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  listContent: {
    padding: 16,
  },
  sessionCard: {
    marginBottom: 12,
    padding: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateColumn: {
    flex: 1,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 13,
    color: '#666',
  },
  sessionDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  statsContainer: {
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  attendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  viewButton: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  attendanceButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  modalDate: {
    fontSize: 12,
    color: '#999',
  },
  closeButton: {
    padding: 4,
  },
  modalStats: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  studentsList: {
    padding: 16,
  },
  listHeader: {
    marginBottom: 16,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  listHeaderHint: {
    fontSize: 12,
    color: '#999',
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 12,
    color: '#999',
  },
  noStudents: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noStudentsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default TeacherAttendanceScreen;