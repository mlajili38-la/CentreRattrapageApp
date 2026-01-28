// screens/admin/PresencesScreen.js - VERSION AVEC DONNÉES RÉELLES
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  limit,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import Card from '../../components/common/Card/Card';
import Badge from '../../components/common/Badge/Badge';

const { width } = Dimensions.get('window');

const PresencesScreen = () => {
  // États de chargement
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // États de données
  const [attendances, setAttendances] = useState([]);
  const [filteredAttendances, setFilteredAttendances] = useState([]);
  const [students, setStudents] = useState({});
  const [groups, setGroups] = useState({});
  const [teachers, setTeachers] = useState({});
  const [levels, setLevels] = useState({});
  const [subjects, setSubjects] = useState({});
  
  // États de recherche et filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  
  // États UI
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    presentPercentage: 0
  });

  // Types de statut
  const statusTypes = [
    { id: 'all', label: 'Tous', value: 'all', color: '#6b7280', icon: 'list' },
    { id: 'present', label: 'Présent', value: 'present', color: '#10b981', icon: 'checkmark-circle' },
    { id: 'absent', label: 'Absent', value: 'absent', color: '#ef4444', icon: 'close-circle' },
    { id: 'late', label: 'Retard', value: 'late', color: '#f59e0b', icon: 'time' },
    { id: 'excused', label: 'Excusé', value: 'excused', color: '#8b5cf6', icon: 'alert-circle' },
  ];

  // Charger les élèves
  const loadStudents = async () => {
    try {
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsObj = {};
      studentsSnapshot.docs.forEach(doc => {
        studentsObj[doc.id] = { id: doc.id, ...doc.data() };
      });
      return studentsObj;
    } catch (error) {
      console.error('Erreur chargement élèves:', error);
      return {};
    }
  };

  // Charger les groupes
  const loadGroups = async () => {
    try {
      const groupsSnapshot = await getDocs(collection(db, 'groups'));
      const groupsObj = {};
      groupsSnapshot.docs.forEach(doc => {
        groupsObj[doc.id] = { id: doc.id, ...doc.data() };
      });
      return groupsObj;
    } catch (error) {
      console.error('Erreur chargement groupes:', error);
      return {};
    }
  };

  // Charger les enseignants
  const loadTeachers = async () => {
    try {
      const teachersSnapshot = await getDocs(collection(db, 'teachers'));
      const teachersObj = {};
      teachersSnapshot.docs.forEach(doc => {
        teachersObj[doc.id] = { id: doc.id, ...doc.data() };
      });
      return teachersObj;
    } catch (error) {
      console.error('Erreur chargement enseignants:', error);
      return {};
    }
  };

  // Charger les niveaux
  const loadLevels = async () => {
    try {
      const levelsSnapshot = await getDocs(collection(db, 'levels'));
      const levelsObj = {};
      levelsSnapshot.docs.forEach(doc => {
        levelsObj[doc.id] = { id: doc.id, ...doc.data() };
      });
      return levelsObj;
    } catch (error) {
      console.error('Erreur chargement niveaux:', error);
      return {};
    }
  };

  // Charger les matières
  const loadSubjects = async () => {
    try {
      const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
      const subjectsObj = {};
      subjectsSnapshot.docs.forEach(doc => {
        subjectsObj[doc.id] = { id: doc.id, ...doc.data() };
      });
      return subjectsObj;
    } catch (error) {
      console.error('Erreur chargement matières:', error);
      return {};
    }
  };

  // Charger les présences avec les 30 derniers jours
  const loadAttendances = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const attendancesQuery = query(
        collection(db, 'attendances'),
        where('date', '>=', Timestamp.fromDate(thirtyDaysAgo)),
        orderBy('date', 'desc'),
        limit(200)
      );
      
      const attendancesSnapshot = await getDocs(attendancesQuery);
      return attendancesSnapshot;
    } catch (error) {
      console.error('Erreur chargement présences:', error);
      return { docs: [] };
    }
  };

  // Charger toutes les données
  const loadAllData = async () => {
    try {
      setLoading(true);
      console.log('📊 Chargement des données depuis Firestore...');
      
      // Charger toutes les données en parallèle
      const [
        studentsData,
        groupsData,
        teachersData,
        levelsData,
        subjectsData,
        attendancesSnapshot
      ] = await Promise.all([
        loadStudents(),
        loadGroups(),
        loadTeachers(),
        loadLevels(),
        loadSubjects(),
        loadAttendances()
      ]);

      // Enrichir les données de présence
      const attendancesList = [];
      attendancesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Récupérer les données associées
        const student = studentsData[data.studentId];
        const group = groupsData[data.groupId];
        const teacher = teachersData[data.teacherId];
        const level = student ? levelsData[student.levelId] : null;
        const subject = group ? subjectsData[group.subjectId] : null;

        // Convertir les dates
        const date = data.date ? parseFirestoreDate(data.date) : new Date();
        const markingTime = data.markedAt || data.createdAt || date;

        attendancesList.push({
          id: doc.id,
          ...data,
          // Données enrichies
          studentName: student?.name || data.studentName || 'Élève non trouvé',
          studentEmail: student?.email || '',
          studentPhone: student?.phone || '',
          studentLevelId: student?.levelId,
          studentLevel: level?.name || student?.levelCode || 'Niveau non spécifié',
          studentParentPhone: student?.parentPhone || '',
          
          groupName: group?.name || data.groupName || 'Groupe non trouvé',
          groupSubject: subject?.name || group?.subject || 'Matière non spécifiée',
          
          teacherName: teacher?.name || data.teacherName || 'Enseignant non trouvé',
          teacherEmail: teacher?.email || '',
          
          // Dates formatées
          date: date,
          markingTime: parseFirestoreDate(markingTime),
          dateDisplay: formatDateForDisplay(date),
          timeDisplay: formatTimeForDisplay(date),
          
          // Métadonnées
          room: data.room || group?.room || 'Salle non spécifiée',
          notes: data.notes || '',
          markedBy: data.markedBy || teacher?.name || 'Non spécifié',
          
          // IDs réels (mais pas affichés dans l'UI)
          studentId: data.studentId,
          groupId: data.groupId,
          teacherId: data.teacherId
        });
      });

      console.log(`✅ ${attendancesList.length} présences chargées`);
      console.log(`   • ${Object.keys(studentsData).length} élèves`);
      console.log(`   • ${Object.keys(groupsData).length} groupes`);
      console.log(`   • ${Object.keys(teachersData).length} enseignants`);
      console.log(`   • ${Object.keys(levelsData).length} niveaux`);
      console.log(`   • ${Object.keys(subjectsData).length} matières`);

      // Mettre à jour les états
      setStudents(studentsData);
      setGroups(groupsData);
      setTeachers(teachersData);
      setLevels(levelsData);
      setSubjects(subjectsData);
      setAttendances(attendancesList);
      
      // Calculer les statistiques initiales
      const initialStats = calculateStats(attendancesList);
      setStats(initialStats);

    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données des présences');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Parser les dates Firestore
  const parseFirestoreDate = (dateObj) => {
    try {
      if (dateObj?.toDate && typeof dateObj.toDate === 'function') {
        return dateObj.toDate();
      }
      if (dateObj?.seconds) {
        return new Date(dateObj.seconds * 1000);
      }
      if (typeof dateObj === 'string') {
        return new Date(dateObj);
      }
      return new Date();
    } catch {
      return new Date();
    }
  };

  // Calculer les statistiques
  const calculateStats = (attendanceList) => {
    const total = attendanceList.length;
    const present = attendanceList.filter(a => a.status === 'present').length;
    const absent = attendanceList.filter(a => a.status === 'absent').length;
    const late = attendanceList.filter(a => a.status === 'late').length;
    const excused = attendanceList.filter(a => a.status === 'excused').length;
    const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return {
      total,
      present,
      absent,
      late,
      excused,
      presentPercentage
    };
  };

  // Formater la date pour l'affichage
  const formatDateForDisplay = (date) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      });
    } catch {
      return 'Date invalide';
    }
  };

  // Formater l'heure pour l'affichage
  const formatTimeForDisplay = (date) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '--:--';
    }
  };

  // Filtrer les présences
  const filterAttendances = useCallback(() => {
    console.log('🔍 Application des filtres...');

    let filtered = [...attendances];

    // Filtre par statut
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(a => a.status === selectedStatus);
    }

    // Filtre par niveau
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(a => a.studentLevelId === selectedLevel);
    }

    // Filtre par groupe
    if (selectedGroup !== 'all') {
      filtered = filtered.filter(a => a.groupId === selectedGroup);
    }

    // Filtre par recherche texte
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => {
        return (
          (a.studentName && a.studentName.toLowerCase().includes(query)) ||
          (a.groupName && a.groupName.toLowerCase().includes(query)) ||
          (a.teacherName && a.teacherName.toLowerCase().includes(query)) ||
          (a.studentLevel && a.studentLevel.toLowerCase().includes(query)) ||
          (a.notes && a.notes.toLowerCase().includes(query))
        );
      });
    }

    console.log('  - Résultat:', filtered.length, 'présences filtrées');
    setFilteredAttendances(filtered);
    
    // Mettre à jour les statistiques avec les données filtrées
    const newStats = calculateStats(filtered);
    setStats(newStats);
  }, [attendances, searchQuery, selectedStatus, selectedLevel, selectedGroup]);

  // Appliquer les filtres
  useEffect(() => {
    if (attendances.length > 0) {
      filterAttendances();
    }
  }, [filterAttendances]);

  // Charger les données initiales
  useEffect(() => {
    loadAllData();
  }, []);

  // Rafraîchir
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAllData();
  }, []);

  // Obtenir les informations de statut
  const getStatusInfo = (status) => {
    return statusTypes.find(s => s.value === status) || statusTypes[0];
  };

  // Générer les options de filtres à partir des données réelles
  const levelOptions = useMemo(() => {
    const options = [{ id: 'all', name: 'Tous les niveaux' }];
    Object.values(levels).forEach(level => {
      if (level.name) {
        options.push({ id: level.id, name: level.name });
      }
    });
    return options;
  }, [levels]);

  const groupOptions = useMemo(() => {
    const options = [{ id: 'all', name: 'Tous les groupes' }];
    Object.values(groups).forEach(group => {
      if (group.name) {
        options.push({ id: group.id, name: group.name });
      }
    });
    return options;
  }, [groups]);

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedLevel('all');
    setSelectedGroup('all');
  };

  // Rendu du loading
  if (loading && attendances.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Chargement des présences...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Historique des Présences</Text>
          <Text style={styles.headerSubtitle}>
            Données réelles - 30 derniers jours
          </Text>
        </View>
      </View>

      {/* STATISTIQUES GLOBALES */}
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#10b98120' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
            <Text style={styles.statNumber}>{stats.present}</Text>
            <Text style={styles.statLabel}>Présents</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#ef444420' }]}>
              <Ionicons name="close-circle" size={20} color="#ef4444" />
            </View>
            <Text style={styles.statNumber}>{stats.absent}</Text>
            <Text style={styles.statLabel}>Absents</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#f59e0b20' }]}>
              <Ionicons name="time" size={20} color="#f59e0b" />
            </View>
            <Text style={styles.statNumber}>{stats.late}</Text>
            <Text style={styles.statLabel}>Retards</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#8b5cf620' }]}>
              <Ionicons name="bar-chart" size={20} color="#8b5cf6" />
            </View>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
        
        {/* Indicateur de taux de présence */}
        {stats.total > 0 && (
          <View style={styles.percentageContainer}>
            <View style={styles.percentageBar}>
              <View 
                style={[
                  styles.percentageFill,
                  { width: `${stats.presentPercentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.percentageText}>
              Taux de présence: {stats.presentPercentage}%
            </Text>
          </View>
        )}
      </View>

      {/* BARRE DE RECHERCHE ET FILTRES */}
      <Card style={styles.filterCard}>
        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher élève, groupe, professeur..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Bouton filtres */}
        <TouchableOpacity 
          style={styles.filterToggleButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={18} color="#64748b" />
          <Text style={styles.filterToggleText}>
            Filtres {showFilters ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {/* Panneau des filtres */}
        {showFilters && (
          <View style={styles.filtersPanel}>
            {/* Filtres par statut */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Statut</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.statusFilterContainer}>
                  {statusTypes.map(status => (
                    <TouchableOpacity
                      key={status.id}
                      style={[
                        styles.statusFilterButton,
                        selectedStatus === status.value && {
                          backgroundColor: status.color,
                          borderColor: status.color,
                        }
                      ]}
                      onPress={() => setSelectedStatus(status.value)}
                    >
                      <Ionicons 
                        name={status.icon} 
                        size={16} 
                        color={selectedStatus === status.value ? '#fff' : status.color} 
                      />
                      <Text style={[
                        styles.statusFilterText,
                        selectedStatus === status.value && styles.statusFilterTextActive
                      ]}>
                        {status.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Filtres par niveau et groupe */}
            <View style={styles.filterRow}>
              <View style={styles.filterColumn}>
                <Text style={styles.filterLabel}>Niveau</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterScrollView}
                >
                  <View style={styles.dropdownContainer}>
                    {levelOptions.map(level => (
                      <TouchableOpacity
                        key={level.id}
                        style={[
                          styles.dropdownButton,
                          selectedLevel === level.id && styles.dropdownButtonActive
                        ]}
                        onPress={() => setSelectedLevel(level.id)}
                      >
                        <Text style={[
                          styles.dropdownButtonText,
                          selectedLevel === level.id && styles.dropdownButtonTextActive
                        ]}>
                          {level.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.filterColumn}>
                <Text style={styles.filterLabel}>Groupe</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterScrollView}
                >
                  <View style={styles.dropdownContainer}>
                    {groupOptions.map(group => (
                      <TouchableOpacity
                        key={group.id}
                        style={[
                          styles.dropdownButton,
                          selectedGroup === group.id && styles.dropdownButtonActive
                        ]}
                        onPress={() => setSelectedGroup(group.id)}
                      >
                        <Text style={[
                          styles.dropdownButtonText,
                          selectedGroup === group.id && styles.dropdownButtonTextActive
                        ]}>
                          {group.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            {/* Bouton réinitialiser */}
            <TouchableOpacity 
              style={styles.resetFiltersButton}
              onPress={resetFilters}
            >
              <Ionicons name="refresh" size={16} color="#64748b" />
              <Text style={styles.resetFiltersText}>Réinitialiser les filtres</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* LISTE DES PRÉSENCES */}
      <ScrollView 
        style={styles.mainScrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      >
        {filteredAttendances.length === 0 ? (
          <Card style={styles.emptyStateCard}>
            <Ionicons name="search-outline" size={60} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>
              Aucune présence trouvée
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || selectedStatus !== 'all' || selectedLevel !== 'all' || selectedGroup !== 'all'
                ? 'Aucune présence ne correspond à vos critères'
                : 'Aucune présence enregistrée'
              }
            </Text>
            {(searchQuery || selectedStatus !== 'all' || selectedLevel !== 'all' || selectedGroup !== 'all') && (
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Réinitialiser les filtres</Text>
              </TouchableOpacity>
            )}
          </Card>
        ) : (
          filteredAttendances.map((attendance, index) => {
            const statusInfo = getStatusInfo(attendance.status);
            
            return (
              <Card key={attendance.id} style={styles.attendanceCard}>
                {/* En-tête avec date et statut */}
                <View style={styles.cardHeader}>
                  <View style={styles.dateTimeContainer}>
                    <View style={styles.dateBadge}>
                      <Ionicons name="calendar-outline" size={14} color="#fff" />
                      <Text style={styles.dateText}>
                        {attendance.dateDisplay}
                      </Text>
                    </View>
                    <View style={styles.timeBadge}>
                      <Ionicons name="time-outline" size={14} color="#3b82f6" />
                      <Text style={styles.timeText}>
                        {attendance.timeDisplay}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.statusHeaderBadge}>
                    <Badge 
                      text={statusInfo.label}
                      backgroundColor={`${statusInfo.color}20`}
                      textColor={statusInfo.color}
                      size="small"
                      icon={statusInfo.icon}
                    />
                  </View>
                </View>

                {/* Informations principales */}
                <View style={styles.mainInfo}>
                  <View style={styles.studentSection}>
                    <View style={styles.infoRow}>
                      <Ionicons name="person-outline" size={16} color="#64748b" />
                      <Text style={styles.studentName}>{attendance.studentName}</Text>
                    </View>
                    
                    <View style={styles.metaInfoRow}>
                      <View style={styles.metaBadge}>
                        <Ionicons name="school-outline" size={12} color="#64748b" />
                        <Text style={styles.metaText}>{attendance.studentLevel}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.separator} />

                  <View style={styles.groupSection}>
                    <View style={styles.infoRow}>
                      <Ionicons name="people-outline" size={16} color="#64748b" />
                      <Text style={styles.groupName}>{attendance.groupName}</Text>
                    </View>
                    
                    <View style={styles.metaInfoRow}>
                      <View style={styles.metaBadge}>
                        <Ionicons name="book-outline" size={12} color="#64748b" />
                        <Text style={styles.metaText}>{attendance.groupSubject}</Text>
                      </View>
                      
                      {attendance.room && (
                        <View style={styles.metaBadge}>
                          <Ionicons name="business-outline" size={12} color="#64748b" />
                          <Text style={styles.metaText}>{attendance.room}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.separator} />

                  <View style={styles.teacherSection}>
                    <View style={styles.infoRow}>
                      <Ionicons name="person-circle-outline" size={16} color="#64748b" />
                      <Text style={styles.teacherName}>{attendance.teacherName}</Text>
                    </View>
                    
                    <View style={styles.markingInfo}>
                      <Ionicons name="person-outline" size={12} color="#94a3b8" />
                      <Text style={styles.markingText}>
                        Marquée par {attendance.markedBy}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Notes si présentes */}
                {attendance.notes && (
                  <View style={styles.notesContainer}>
                    <View style={styles.notesHeader}>
                      <Ionicons name="document-text-outline" size={14} color="#64748b" />
                      <Text style={styles.notesTitle}>Notes</Text>
                    </View>
                    <Text style={styles.notesText}>{attendance.notes}</Text>
                  </View>
                )}
              </Card>
            );
          })
        )}

        {/* Résumé */}
        {filteredAttendances.length > 0 && (
          <View style={styles.resultsFooter}>
            <Text style={styles.resultsText}>
              Affichage de {filteredAttendances.length} présence{filteredAttendances.length !== 1 ? 's' : ''}
              {stats.presentPercentage > 0 && ` • Taux de présence: ${stats.presentPercentage}%`}
            </Text>
            {selectedStatus !== 'all' && (
              <Text style={styles.filterInfoText}>
                Filtré par: {getStatusInfo(selectedStatus).label}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
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
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  percentageContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  percentageBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  percentageFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  filterCard: {
    marginHorizontal: 16,
    marginVertical: 8,
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
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#000000',
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  filterToggleText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  filtersPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statusFilterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
  },
  statusFilterText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statusFilterTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterColumn: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  filterScrollView: {
    maxHeight: 100,
  },
  dropdownContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dropdownButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 4,
  },
  dropdownButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  dropdownButtonText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  dropdownButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  resetFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  resetFiltersText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  mainScrollView: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyStateCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  resetButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  attendanceCard: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dateTimeContainer: {
    flex: 1,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
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
    alignSelf: 'flex-start',
  },
  timeText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
  },
  statusHeaderBadge: {
    marginLeft: 8,
  },
  mainInfo: {
    marginBottom: 16,
  },
  studentSection: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  metaInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  groupSection: {
    marginBottom: 12,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  teacherSection: {
    marginBottom: 8,
  },
  teacherName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  markingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  markingText: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  notesContainer: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  resultsFooter: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  resultsText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'center',
  },
  filterInfoText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
});

export default PresencesScreen;