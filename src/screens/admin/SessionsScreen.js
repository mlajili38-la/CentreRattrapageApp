import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 🔥 CORRECTION DES IMPORTS FIRESTORE
import { 
  collection, 
  doc, 
  getDoc,      // Ajouté
  getDocs,     // Ajouté - C'EST ÇA QUI MANQUAIT
  setDoc,      // Ajouté
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  Timestamp    // Ajouté pour les dates
} from 'firebase/firestore';

import { db } from '../../services/firebase';  // Assurez-vous que ce chemin est correct
import Card from '../../components/common/Card/Card';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');
const SESSIONS_PER_PAGE = 20;

const SessionsScreen = () => {
  // États principaux
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [groups, setGroups] = useState({}); // Changement: objet au lieu d'array pour recherche O(1)
  const [rooms, setRooms] = useState({});
  const [teachers, setTeachers] = useState({});
  
  // États de chargement
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  
  // États UI
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // États pour les dropdowns
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  // États pour les datepickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // État du formulaire
  const [formData, setFormData] = useState({
    groupId: '',
    teacherId: '',
    roomId: '',
    date: new Date(),
    startTime: new Date(),
    endTime: new Date(new Date().setHours(new Date().getHours() + 2)),
    status: 'planned',
  });

  // Charger les données de référence (groupes, salles, enseignants) une seule fois
  useEffect(() => {
    loadReferenceData();
  }, []);

  // Charger les sessions avec pagination
  useEffect(() => {
    loadSessions();
  }, []);

  // Charger les données de référence (optimisé)
  // Charger les données de référence (optimisé)
const loadReferenceData = async () => {
  try {
    console.log('📚 Chargement des données de référence...');
    
    // 🔥 CORRECTION: Utiliser getDocs correctement
    // Charger en parallèle
    const [groupsSnapshot, roomsSnapshot, teachersSnapshot] = await Promise.all([
      getDocs(collection(db, 'groups')),      // ✅
      getDocs(collection(db, 'rooms')),       // ✅
      getDocs(collection(db, 'teachers'))     // ✅
    ]);

    // Convertir en objets pour recherche rapide O(1)
    const groupsObj = {};
    const roomsObj = {};
    const teachersObj = {};

    groupsSnapshot.forEach(doc => {
      groupsObj[doc.id] = doc.data();
    });

    roomsSnapshot.forEach(doc => {
      roomsObj[doc.id] = doc.data();
    });

    teachersSnapshot.forEach(doc => {
      teachersObj[doc.id] = doc.data();
    });

    console.log('✅ Données de référence chargées:');
    console.log(`   - Groupes: ${Object.keys(groupsObj).length}`);
    console.log(`   - Salles: ${Object.keys(roomsObj).length}`);
    console.log(`   - Enseignants: ${Object.keys(teachersObj).length}`);

    setGroups(groupsObj);
    setRooms(roomsObj);
    setTeachers(teachersObj);

  } catch (error) {
    console.error('❌ Erreur lors du chargement des données de référence:', error);
    Alert.alert('Erreur', 'Impossible de charger les données');
  }
};

  // Charger les sessions avec pagination
  // Charger les sessions avec pagination (CORRIGÉ)
const loadSessions = async (loadMore = false) => {
  try {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setSessions([]);
      setHasMore(true);
      setLastVisible(null);
    }

    // SIMPLIFIER LA REQUÊTE : utiliser seulement un orderBy
    let sessionsQuery = query(
      collection(db, 'sessions'),
      orderBy('date', 'desc'),
      limit(SESSIONS_PER_PAGE)
    );

    if (loadMore && lastVisible) {
      sessionsQuery = query(
        collection(db, 'sessions'),
        orderBy('date', 'desc'),
        startAfter(lastVisible),
        limit(SESSIONS_PER_PAGE)
      );
    }

    const sessionsSnapshot = await getDocs(sessionsQuery);
    
    if (sessionsSnapshot.empty) {
      setHasMore(false);
      if (!loadMore) {
        setSessions([]);
      }
      return;
    }

    const lastDoc = sessionsSnapshot.docs[sessionsSnapshot.docs.length - 1];
    setLastVisible(lastDoc);

    const sessionsList = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Si besoin de tri supplémentaire, faites-le localement
    sessionsList.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      
      // Si même date, trier par createdAt
      if (dateA === dateB) {
        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return createdB - createdA;
      }
      
      return dateB - dateA;
    });

    if (loadMore) {
      setSessions(prev => [...prev, ...sessionsList]);
    } else {
      setSessions(sessionsList);
    }

    if (sessionsSnapshot.docs.length < SESSIONS_PER_PAGE) {
      setHasMore(false);
    }

  } catch (error) {
    console.error('Erreur lors du chargement des séances:', error);
    
    // Vérifier si c'est l'erreur d'index
    if (error.code === 'failed-precondition') {
      Alert.alert(
        'Index en cours de création',
        "L'index Firestore est en cours de création. Veuillez réessayer dans quelques minutes.",
        [{ text: 'OK', onPress: () => {
          // Charger sans pagination en attendant
          loadSessionsWithoutPagination();
        }}]
      );
    } else {
      Alert.alert('Erreur', 'Impossible de charger les séances');
    }
  } finally {
    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  }
};

// Fallback sans pagination
const loadSessionsWithoutPagination = async () => {
  try {
    const sessionsSnapshot = await getDocs(collection(db, 'sessions'));
    
    const sessionsList = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Trier localement
    sessionsList.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      
      if (dateA === dateB) {
        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return createdB - createdA;
      }
      
      return dateB - dateA;
    });

    setSessions(sessionsList);
    setHasMore(false); // Désactiver la pagination
    
  } catch (error) {
    console.error('Erreur du fallback:', error);
    Alert.alert('Erreur', 'Impossible de charger les séances');
  }
};
  // Filtrer les séances (optimisé avec useMemo)
  const filteredSessionsMemo = useMemo(() => {
    if (!searchQuery.trim()) {
      return sessions;
    }

    const queryLower = searchQuery.toLowerCase();
    return sessions.filter(session => {
      const groupName = (groups[session.groupId]?.name || '').toLowerCase();
      const teacherName = (teachers[session.teacherId]?.name || '').toLowerCase();
      const roomName = (rooms[session.roomId]?.name || '').toLowerCase();
      
      return (
        groupName.includes(queryLower) ||
        teacherName.includes(queryLower) ||
        roomName.includes(queryLower) ||
        session.status?.toLowerCase().includes(queryLower)
      );
    });
  }, [sessions, searchQuery, groups, teachers, rooms]);

  useEffect(() => {
    setFilteredSessions(filteredSessionsMemo);
  }, [filteredSessionsMemo]);

  // Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReferenceData().then(() => loadSessions());
  }, []);

  // Charger plus de données
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      loadSessions(true);
    }
  }, [hasMore, loadingMore]);

  // Fonctions helper optimisées
  const getGroupName = useCallback((groupId) => {
    return groups[groupId]?.name || 'Groupe inconnu';
  }, [groups]);

  const getTeacherName = useCallback((teacherId) => {
    return teachers[teacherId]?.name || 'Enseignant inconnu';
  }, [teachers]);

  const getRoomName = useCallback((roomId) => {
    return rooms[roomId]?.name || 'Salle inconnue';
  }, [rooms]);

  // Formater la date (memoïsé)
  const formatDate = useMemo(() => {
    return (dateString) => {
      if (!dateString) return 'Date inconnue';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      } catch {
        return 'Date invalide';
      }
    };
  }, []);

  // Formater l'heure (memoïsé)
  const formatTime = useMemo(() => {
    return (timeString) => {
      if (!timeString) return 'Heure inconnue';
      try {
        const time = new Date(timeString);
        return time.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return 'Heure invalide';
      }
    };
  }, []);

  // Gestion des statuts (pré-calculé)
  const statusConfig = useMemo(() => ({
    planned: { color: '#3b82f6', text: 'Planifiée' },
    completed: { color: '#10b981', text: 'Complétée' },
    cancelled: { color: '#ef4444', text: 'Annulée' }
  }), []);

  const getStatusColor = useCallback((status) => {
    return statusConfig[status]?.color || '#64748b';
  }, [statusConfig]);

  const getStatusText = useCallback((status) => {
    return statusConfig[status]?.text || 'Inconnu';
  }, [statusConfig]);

  // Ajouter une séance
  const handleAddSession = () => {
    setEditMode(false);
    setCurrentSession(null);
    setFormData({
      groupId: '',
      teacherId: '',
      roomId: '',
      date: new Date(),
      startTime: new Date(),
      endTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000),
      status: 'planned',
    });
    setModalVisible(true);
  };

  // Modifier une séance
  const handleEditSession = (session) => {
    setEditMode(true);
    setCurrentSession(session);
    setFormData({
      groupId: session.groupId || '',
      teacherId: session.teacherId || '',
      roomId: session.roomId || '',
      date: session.date ? new Date(session.date) : new Date(),
      startTime: session.startTime ? new Date(session.startTime) : new Date(),
      endTime: session.endTime ? new Date(session.endTime) : new Date(new Date().getTime() + 2 * 60 * 60 * 1000),
      status: session.status || 'planned',
    });
    setModalVisible(true);
  };

  // Gérer la sélection des dropdowns
  const handleSelectGroup = (groupId) => {
    setFormData(prev => ({ ...prev, groupId }));
    setShowGroupDropdown(false);
  };

  const handleSelectTeacher = (teacherId) => {
    setFormData(prev => ({ ...prev, teacherId }));
    setShowTeacherDropdown(false);
  };

  const handleSelectRoom = (roomId) => {
    setFormData(prev => ({ ...prev, roomId }));
    setShowRoomDropdown(false);
  };

  const handleSelectStatus = (status) => {
    setFormData(prev => ({ ...prev, status }));
    setShowStatusDropdown(false);
  };

  // Gérer les datepickers
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  };

  const handleStartTimeChange = (event, selectedTime) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setFormData(prev => ({ ...prev, startTime: selectedTime }));
    }
  };

  const handleEndTimeChange = (event, selectedTime) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setFormData(prev => ({ ...prev, endTime: selectedTime }));
    }
  };

  // Fermer tous les dropdowns
  const closeAllDropdowns = () => {
    setShowGroupDropdown(false);
    setShowTeacherDropdown(false);
    setShowRoomDropdown(false);
    setShowStatusDropdown(false);
  };

  // Supprimer une séance (optimisé)
  const handleDeleteSession = useCallback((session) => {
    Alert.alert(
      'Supprimer la séance',
      `Êtes-vous sûr de vouloir supprimer cette séance ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'sessions', session.id));
              
              // Mise à jour optimiste de l'UI
              setSessions(prev => prev.filter(s => s.id !== session.id));
              Alert.alert('Succès', 'Séance supprimée avec succès');
              
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la séance');
              // Recharger en cas d'erreur
              loadSessions();
            }
          }
        }
      ]
    );
  }, []);

  // Soumettre le formulaire (optimisé)
 const handleSubmit = async () => {
  // Validation (gardez les validations existantes)
  if (!formData.groupId) {
    Alert.alert('Erreur', 'Veuillez sélectionner un groupe');
    return;
  }

  if (!formData.teacherId) {
    Alert.alert('Erreur', 'Veuillez sélectionner un enseignant');
    return;
  }

  if (!formData.roomId) {
    Alert.alert('Erreur', 'Veuillez sélectionner une salle');
    return;
  }

  // Vérifier que l'heure de fin est après l'heure de début
  if (formData.endTime <= formData.startTime) {
    Alert.alert('Erreur', 'L\'heure de fin doit être après l\'heure de début');
    return;
  }

  try {
    // 🔥 CORRECTION POUR PERMETTRE LES SESSIONS PASSÉES
    const today = new Date();
    
    // Prendre la date sélectionnée
    const selectedDate = new Date(formData.date);
    selectedDate.setHours(0, 0, 0, 0);
    
    // Extraire l'heure
    const startHours = formData.startTime.getHours();
    const startMinutes = formData.startTime.getMinutes();
    
    const endHours = formData.endTime.getHours();
    const endMinutes = formData.endTime.getMinutes();
    
    // Créer les dates
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(startHours, startMinutes, 0, 0);
    
    const endDateTime = new Date(selectedDate);
    endDateTime.setHours(endHours, endMinutes, 0, 0);
    
    // 🔥 SUPPRIMEZ CETTE VALIDATION POUR PERMETTRE LES SESSIONS PASSÉES
    // if (startDateTime < now) {
    //   Alert.alert('Erreur', 'Vous ne pouvez pas créer une session dans le passé');
    //   return;
    // }

    console.log('🔍 DATES CRÉÉES:');
    console.log('   Date sélectionnée:', selectedDate.toISOString());
    console.log('   Start DateTime:', startDateTime.toISOString());
    console.log('   End DateTime:', endDateTime.toISOString());
    console.log('   Heure start:', `${startHours}:${startMinutes}`);
    console.log('   Heure end:', `${endHours}:${endMinutes}`);
    console.log('   Est dans le passé?:', startDateTime < new Date() ? 'OUI' : 'NON');

    const sessionData = {
      groupId: formData.groupId,
      teacherId: formData.teacherId,
      roomId: formData.roomId,
      date: startDateTime.toISOString(),
      startTime: `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`,
      endTime: `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`,
      status: formData.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      groupName: getGroupName(formData.groupId),
      teacherName: getTeacherName(formData.teacherId),
      roomName: getRoomName(formData.roomId)
    };

    console.log('📋 DONNÉES SESSION:');
    console.log('   Teacher ID:', sessionData.teacherId);
    console.log('   Group ID:', sessionData.groupId);
    console.log('   Date:', sessionData.date);
    console.log('   Start Time:', sessionData.startTime);
    console.log('   End Time:', sessionData.endTime);
    console.log('   Status:', sessionData.status);

    let sessionId;

    if (editMode && currentSession) {
      await updateDoc(doc(db, 'sessions', currentSession.id), sessionData);
      sessionId = currentSession.id;
      Alert.alert('Succès', 'Séance modifiée avec succès');
      
      setSessions(prev => prev.map(s => 
        s.id === currentSession.id 
          ? { ...s, ...sessionData }
          : s
      ));
    } else {
      const newDocRef = await addDoc(collection(db, 'sessions'), sessionData);
      sessionId = newDocRef.id;
      Alert.alert('Succès', 'Séance ajoutée avec succès');
      
      setSessions(prev => [{
        id: sessionId,
        ...sessionData
      }, ...prev]);
    }

    // Créer les présences
    if (!editMode) {
      await createAttendancesForSession(sessionId, formData.groupId, sessionData);
    }

    setModalVisible(false);
    closeAllDropdowns();
    
  } catch (error) {
    console.error('❌ Erreur création session:', error);
    Alert.alert('Erreur', 'Une erreur est survenue lors de la création');
  }
};
// 🔥 NOUVELLE FONCTION : Créer les présences pour une session
const createAttendancesForSession = async (sessionId, groupId, sessionData) => {
  try {
    console.log('👥 Création des présences pour session:', sessionId);
    
    // 1. Récupérer les étudiants du groupe
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    
    if (!groupDoc.exists()) {
      console.log('❌ Groupe non trouvé:', groupId);
      return;
    }
    
    const groupData = groupDoc.data();
    const studentIds = groupData.studentIds || [];
    
    console.log(`📊 ${studentIds.length} étudiants dans le groupe`);
    
    if (studentIds.length === 0) {
      console.log('⚠️ Aucun étudiant dans ce groupe');
      return;
    }
    
    // 2. Récupérer les noms des étudiants
    const studentsPromises = studentIds.map(async (studentId) => {
      try {
        const studentDoc = await getDoc(doc(db, 'students', studentId));
        if (studentDoc.exists()) {
          return {
            id: studentId,
            name: studentDoc.data().name || `Élève ${studentId}`
          };
        }
        return { id: studentId, name: `Élève ${studentId}` };
      } catch (error) {
        return { id: studentId, name: `Élève ${studentId}` };
      }
    });
    
    const students = await Promise.all(studentsPromises);
    
    // 3. Créer les enregistrements de présence
    const attendancePromises = students.map(async (student) => {
      try {
        // ID unique pour la présence
        const attendanceId = `ATT_${sessionId}_${student.id}`;
        
        // Données de présence
        const attendanceData = {
          id: attendanceId,
          sessionId: sessionId,
          groupId: groupId,
          groupName: groupData.name || `Groupe ${groupId}`,
          studentId: student.id,
          studentName: student.name,
          teacherId: sessionData.teacherId,
          date: sessionData.date,
          startTime: sessionData.startTime,
          endTime: sessionData.endTime,
          status: 'pending', // 'present', 'absent', 'late', 'excused'
          markedBy: null,
          markedAt: null,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: null,
          roomId: sessionData.roomId,
          subjectId: groupData.subjectId || 'SUB1',
          subjectName: getSubjectNameFromId(groupData.subjectId)
        };
        
        // Créer le document
        await setDoc(doc(db, 'attendances', attendanceId), attendanceData);
        
        return attendanceId;
      } catch (error) {
        console.log(`⚠️ Erreur création présence ${student.id}:`, error.message);
        return null;
      }
    });
    
    const results = await Promise.all(attendancePromises);
    const successful = results.filter(r => r !== null).length;
    
    console.log(`✅ ${successful}/${studentIds.length} présences créées`);
    
    // 4. Mettre à jour la session avec le compte d'étudiants
    await updateDoc(doc(db, 'sessions', sessionId), {
      totalStudents: studentIds.length,
      studentCount: studentIds.length,
      studentIds: studentIds // Optionnel: stocker les IDs dans la session
    });
    
  } catch (error) {
    console.error('❌ Erreur création présences:', error);
  }
};

// Fonction helper pour le nom de la matière
const getSubjectNameFromId = (subjectId) => {
  const subjects = {
    'SUB1': 'Mathématiques',
    'SUB2': 'Physique',
    'SUB3': 'Chimie',
    'SUB4': 'Anglais',
    'SUB5': 'Informatique',
    'SUB6': 'SVT',
    'SUB7': 'Arabe',
    'SUB8': 'Français'
  };
  return subjects[subjectId] || 'Matière';
};
  // Effacer la recherche
  const clearSearch = () => {
    setSearchQuery('');
  };

  // Convertir les objets en arrays pour les dropdowns
  const groupsArray = useMemo(() => Object.entries(groups).map(([id, data]) => ({ id, ...data })), [groups]);
  const teachersArray = useMemo(() => Object.entries(teachers).map(([id, data]) => ({ id, ...data })), [teachers]);
  const roomsArray = useMemo(() => Object.entries(rooms).map(([id, data]) => ({ id, ...data })), [rooms]);

  // Fonction pour détecter la fin du scroll
  const handleScroll = ({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const paddingToBottom = 20;
    
    if (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom &&
      hasMore &&
      !loadingMore
    ) {
      handleLoadMore();
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER AVEC TITRE ET BOUTON AJOUTER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Séances ({filteredSessions.length} {hasMore ? '+' : ''})
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddSession}>
          <Ionicons name="add-circle" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* BARRE DE RECHERCHE */}
      <Card style={styles.searchCard}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par groupe, enseignant ou salle..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </Card>

      {/* LISTE DES SÉANCES EN CARTES */}
      {loading && sessions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Chargement des séances...</Text>
        </View>
      ) : filteredSessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={60} color="#cbd5e1" />
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'Aucune séance ne correspond à votre recherche' 
              : 'Aucune séance planifiée'}
          </Text>
          {searchQuery && (
            <TouchableOpacity 
              style={styles.clearSearchButton}
              onPress={clearSearch}
            >
              <Text style={styles.clearSearchText}>Effacer la recherche</Text>
            </TouchableOpacity>
          )}
          {sessions.length === 0 && (
            <TouchableOpacity 
              style={styles.addFirstButton}
              onPress={handleAddSession}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text style={styles.addFirstButtonText}>Planifier la première séance</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {filteredSessions.map((session) => (
            <Card key={session.id} style={styles.sessionCard}>
              {/* EN-TÊTE DE LA CARTE */}
              <View style={styles.cardHeader}>
                <View style={styles.sessionInfo}>
                  <View style={styles.dateTimeSection}>
                    <View style={styles.dateBadge}>
                      <Ionicons name="calendar-outline" size={14} color="#ffffff" />
                      <Text style={styles.dateText}>
                        {formatDate(session.date)}
                      </Text>
                    </View>
                    <View style={styles.timeBadge}>
                      <Ionicons name="time-outline" size={14} color="#3b82f6" />
                      <Text style={styles.timeText}>
                        {formatTime(session.startTime)} - {formatTime(session.endTime)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statusBadgeContainer}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(session.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(session.status) }
                      ]}>
                        {getStatusText(session.status)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleEditSession(session)}
                  >
                    <Ionicons name="create-outline" size={18} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteSession(session)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* DÉTAILS DE LA SÉANCE */}
              <View style={styles.detailsGrid}>
                {/* GROUPE */}
                <View style={styles.detailItem}>
                  <View style={styles.detailHeader}>
                    <Ionicons name="people-outline" size={16} color="#64748b" />
                    <Text style={styles.detailLabel}>Groupe</Text>
                  </View>
                  <Text style={styles.detailValue}>
                    {getGroupName(session.groupId)}
                  </Text>
                </View>

                {/* ENSEIGNANT */}
                <View style={styles.detailItem}>
                  <View style={styles.detailHeader}>
                    <Ionicons name="person-outline" size={16} color="#64748b" />
                    <Text style={styles.detailLabel}>Enseignant</Text>
                  </View>
                  <Text style={styles.detailValue}>
                    {getTeacherName(session.teacherId)}
                  </Text>
                </View>

                {/* SALLE */}
                <View style={styles.detailItem}>
                  <View style={styles.detailHeader}>
                    <Ionicons name="business-outline" size={16} color="#64748b" />
                    <Text style={styles.detailLabel}>Salle</Text>
                  </View>
                  <Text style={styles.detailValue}>
                    {getRoomName(session.roomId)}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
          
          {/* LOAD MORE INDICATOR */}
          {loadingMore && (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text style={styles.loadMoreText}>Chargement...</Text>
            </View>
          )}
          
          {/* NO MORE DATA */}
          {!hasMore && sessions.length > 0 && (
            <View style={styles.noMoreContainer}>
              <Text style={styles.noMoreText}>
                {sessions.length} séance{sessions.length > 1 ? 's' : ''} chargée{sessions.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* MODAL (garder le même code mais avec les arrays convertis) */}
      {/* MODAL POUR AJOUTER/MODIFIER UNE SÉANCE */}
<Modal
  animationType="slide"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => {
    setModalVisible(false);
    closeAllDropdowns();
  }}
>
  <TouchableOpacity 
    style={styles.modalOverlay}
    activeOpacity={1}
    onPress={() => {
      setModalVisible(false);
      closeAllDropdowns();
    }}
  >
    <TouchableOpacity 
      style={styles.modalContent}
      activeOpacity={1}
      onPress={(e) => e.stopPropagation()}
    >
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>
          {editMode ? 'Modifier la séance' : 'Nouvelle séance'}
        </Text>
        <TouchableOpacity onPress={() => {
          setModalVisible(false);
          closeAllDropdowns();
        }}>
          <Ionicons name="close" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.modalBody}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {/* GROUPE - Dropdown */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Groupe *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              closeAllDropdowns();
              setShowGroupDropdown(!showGroupDropdown);
            }}
          >
            <Text style={[
              styles.dropdownButtonText,
              !formData.groupId && styles.placeholderText
            ]}>
              {formData.groupId ? getGroupName(formData.groupId) : 'Sélectionnez un groupe'}
            </Text>
            <Ionicons 
              name={showGroupDropdown ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#64748b" 
            />
          </TouchableOpacity>
          
          {showGroupDropdown && (
            <View style={styles.dropdownList}>
              <ScrollView 
                style={styles.dropdownScroll}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {groupsArray.length === 0 ? (
                  <Text style={styles.noItemsText}>Aucun groupe disponible</Text>
                ) : (
                  groupsArray.map((group) => (
                    <TouchableOpacity
                      key={group.id}
                      style={[
                        styles.dropdownItem,
                        formData.groupId === group.id && styles.dropdownItemSelected
                      ]}
                      onPress={() => handleSelectGroup(group.id)}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        formData.groupId === group.id && styles.dropdownItemTextSelected
                      ]}>
                        {group.name}
                      </Text>
                      {formData.groupId === group.id && (
                        <Ionicons name="checkmark" size={18} color="#000000" />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* ENSEIGNANT - Dropdown */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Enseignant *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              closeAllDropdowns();
              setShowTeacherDropdown(!showTeacherDropdown);
            }}
          >
            <Text style={[
              styles.dropdownButtonText,
              !formData.teacherId && styles.placeholderText
            ]}>
              {formData.teacherId ? getTeacherName(formData.teacherId) : 'Sélectionnez un enseignant'}
            </Text>
            <Ionicons 
              name={showTeacherDropdown ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#64748b" 
            />
          </TouchableOpacity>
          
          {showTeacherDropdown && (
            <View style={styles.dropdownList}>
              <ScrollView 
                style={styles.dropdownScroll}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {teachersArray.length === 0 ? (
                  <Text style={styles.noItemsText}>Aucun enseignant disponible</Text>
                ) : (
                  teachersArray.map((teacher) => (
                    <TouchableOpacity
                      key={teacher.id}
                      style={[
                        styles.dropdownItem,
                        formData.teacherId === teacher.id && styles.dropdownItemSelected
                      ]}
                      onPress={() => handleSelectTeacher(teacher.id)}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        formData.teacherId === teacher.id && styles.dropdownItemTextSelected
                      ]}>
                        {teacher.name}
                      </Text>
                      {formData.teacherId === teacher.id && (
                        <Ionicons name="checkmark" size={18} color="#000000" />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* SALLE - Dropdown */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Salle *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              closeAllDropdowns();
              setShowRoomDropdown(!showRoomDropdown);
            }}
          >
            <Text style={[
              styles.dropdownButtonText,
              !formData.roomId && styles.placeholderText
            ]}>
              {formData.roomId ? getRoomName(formData.roomId) : 'Sélectionnez une salle'}
            </Text>
            <Ionicons 
              name={showRoomDropdown ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#64748b" 
            />
          </TouchableOpacity>
          
          {showRoomDropdown && (
            <View style={styles.dropdownList}>
              <ScrollView 
                style={styles.dropdownScroll}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {roomsArray.length === 0 ? (
                  <Text style={styles.noItemsText}>Aucune salle disponible</Text>
                ) : (
                  roomsArray.map((room) => (
                    <TouchableOpacity
                      key={room.id}
                      style={[
                        styles.dropdownItem,
                        formData.roomId === room.id && styles.dropdownItemSelected
                      ]}
                      onPress={() => handleSelectRoom(room.id)}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        formData.roomId === room.id && styles.dropdownItemTextSelected
                      ]}>
                        {room.name} ({room.capacity || 0} places)
                      </Text>
                      {formData.roomId === room.id && (
                        <Ionicons name="checkmark" size={18} color="#000000" />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* DATE */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Date *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              closeAllDropdowns();
              setShowDatePicker(true);
            }}
          >
            <Text style={styles.dropdownButtonText}>
              {formData.date.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#64748b" />
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={formData.date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* HEURE DE DÉBUT */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Heure de début *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              closeAllDropdowns();
              setShowStartTimePicker(true);
            }}
          >
            <Text style={styles.dropdownButtonText}>
              {formData.startTime.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            <Ionicons name="time-outline" size={20} color="#64748b" />
          </TouchableOpacity>
          
          {showStartTimePicker && (
            <DateTimePicker
              value={formData.startTime}
              mode="time"
              display="default"
              onChange={handleStartTimeChange}
            />
          )}
        </View>

        {/* HEURE DE FIN */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Heure de fin *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              closeAllDropdowns();
              setShowEndTimePicker(true);
            }}
          >
            <Text style={styles.dropdownButtonText}>
              {formData.endTime.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            <Ionicons name="time-outline" size={20} color="#64748b" />
          </TouchableOpacity>
          
          {showEndTimePicker && (
            <DateTimePicker
              value={formData.endTime}
              mode="time"
              display="default"
              onChange={handleEndTimeChange}
            />
          )}
        </View>

        {/* STATUT - Dropdown */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Statut</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              closeAllDropdowns();
              setShowStatusDropdown(!showStatusDropdown);
            }}
          >
            <Text style={[
              styles.dropdownButtonText,
              { color: getStatusColor(formData.status) }
            ]}>
              {getStatusText(formData.status)}
            </Text>
            <Ionicons 
              name={showStatusDropdown ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#64748b" 
            />
          </TouchableOpacity>
          
          {showStatusDropdown && (
            <View style={styles.dropdownList}>
              <ScrollView 
                style={styles.dropdownScroll}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {['planned', 'completed', 'cancelled'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.dropdownItem,
                      formData.status === status && styles.dropdownItemSelected
                    ]}
                    onPress={() => handleSelectStatus(status)}
                  >
                    <View style={styles.statusOption}>
                      <View style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(status) }
                      ]} />
                      <Text style={[
                        styles.dropdownItemText,
                        formData.status === status && styles.dropdownItemTextSelected
                      ]}>
                        {getStatusText(status)}
                      </Text>
                    </View>
                    {formData.status === status && (
                      <Ionicons name="checkmark" size={18} color="#000000" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* NOTES (optionnel) */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Notes (optionnel)</Text>
          <TextInput
            style={[styles.formInput, styles.textArea]}
            value={formData.notes || ''}
            onChangeText={(text) => setFormData({...formData, notes: text})}
            placeholder="Notes additionnelles..."
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        </View>

        {/* PRÉVISUALISATION */}
        {(formData.groupId || formData.teacherId || formData.roomId) && (
          <Card style={styles.previewCard}>
            <Text style={styles.previewTitle}>Aperçu de la séance:</Text>
            <View style={styles.previewContent}>
              {formData.groupId && (
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Groupe:</Text>
                  <Text style={styles.previewValue}>{getGroupName(formData.groupId)}</Text>
                </View>
              )}
              
              {formData.teacherId && (
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Enseignant:</Text>
                  <Text style={styles.previewValue}>{getTeacherName(formData.teacherId)}</Text>
                </View>
              )}
              
              {formData.roomId && (
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Salle:</Text>
                  <Text style={styles.previewValue}>{getRoomName(formData.roomId)}</Text>
                </View>
              )}
              
              <View style={styles.previewItem}>
                <Text style={styles.previewLabel}>Date et heure:</Text>
                <Text style={styles.previewValue}>
                  {formData.date.toLocaleDateString('fr-FR')} • {formData.startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {formData.endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              
              <View style={styles.previewItem}>
                <Text style={styles.previewLabel}>Statut:</Text>
                <View style={[
                  styles.previewStatus,
                  { backgroundColor: getStatusColor(formData.status) + '20' }
                ]}>
                  <Text style={[
                    styles.previewStatusText,
                    { color: getStatusColor(formData.status) }
                  ]}>
                    {getStatusText(formData.status)}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* BOUTONS DU MODAL */}
      <View style={styles.modalFooter}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => {
            setModalVisible(false);
            closeAllDropdowns();
          }}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.submitButton,
            (!formData.groupId || !formData.teacherId || !formData.roomId) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!formData.groupId || !formData.teacherId || !formData.roomId}
        >
          <Text style={styles.submitButtonText}>
            {editMode ? 'Modifier' : 'Planifier'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </TouchableOpacity>
</Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
  },
  loadMoreContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadMoreText: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 12,
  },
  noMoreContainer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
  },
  noMoreText: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  clearSearchText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 14,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#000000',
    borderRadius: 8,
    gap: 8,
  },
  addFirstButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  searchCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#000000',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  sessionCard: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sessionInfo: {
    flex: 1,
  },
  dateTimeSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
  },
  statusBadgeContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  // ... rest of the styles remain the sam
 notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  createdAtSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  createdAtText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
  },
  
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  modalBody: {
    padding: 20,
    maxHeight: height * 0.6,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  formGroup: {
    marginBottom: 20,
    position: 'relative',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#000000',
  },
  placeholderText: {
    color: '#94a3b8',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 1000,
  },
  dropdownScroll: {
    maxHeight: 150,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemSelected: {
    backgroundColor: '#f8fafc',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
  },
  dropdownItemTextSelected: {
    fontWeight: '600',
  },
  noItemsText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    padding: 12,
    textAlign: 'center',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  
  // PREVIEW CARD
  previewCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  previewContent: {
    gap: 8,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  previewStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#000000',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default SessionsScreen;