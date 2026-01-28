// screens/admin/GroupsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import Card from '../../components/common/Card/Card';
import Badge from '../../components/common/Badge/Badge';
import Checkbox from 'expo-checkbox';

const { width } = Dimensions.get('window');

const GroupsScreen = () => {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [levels, setLevels] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  
  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    levelId: '',
    subjectId: '',
    teacherId: '',
    studentIds: [],
    capacity: '',
  });

  // États pour les dropdowns
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Charger les niveaux
      const levelsQuery = query(collection(db, 'levels'), orderBy('order', 'asc'));
      const levelsSnapshot = await getDocs(levelsQuery);
      const levelsList = levelsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLevels(levelsList);
      
      // Charger les matières
      const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
      const subjectsList = subjectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubjects(subjectsList);
      
      // Charger les enseignants
      const teachersQuery = query(collection(db, 'teachers'), orderBy('name', 'asc'));
      const teachersSnapshot = await getDocs(teachersQuery);
      const teachersList = teachersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeachers(teachersList);
      
      // Charger les étudiants
      const studentsQuery = query(collection(db, 'students'), orderBy('name', 'asc'));
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsList = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsList);
      
      // Charger les groupes
      const groupsQuery = query(collection(db, 'groups'), orderBy('name', 'asc'));
      const groupsSnapshot = await getDocs(groupsQuery);
      const groupsList = groupsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroups(groupsList);
      setFilteredGroups(groupsList);
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrer les groupes
  useEffect(() => {
    let filtered = [...groups];
    
    // Filtre par recherche
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(group => 
        group.name?.toLowerCase().includes(query) ||
        (group.subjectId && getSubjectName(group.subjectId)?.toLowerCase().includes(query)) ||
        (group.teacherId && getTeacherName(group.teacherId)?.toLowerCase().includes(query))
      );
    }
    
    // Filtre par niveau
    if (levelFilter !== 'all') {
      filtered = filtered.filter(group => 
        group.levelId === levelFilter
      );
    }
    
    setFilteredGroups(filtered);
  }, [searchQuery, levelFilter, groups]);

  // Fonction de rafraîchissement
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Fonctions utilitaires
  const getLevelName = (levelId) => {
    const level = levels.find(l => l.id === levelId);
    return level ? level.name : 'N/A';
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'Matière inconnue';
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Enseignant inconnu';
  };

  const getStudentCount = (studentIds) => {
    return studentIds?.length || 0;
  };

  // Fermer tous les dropdowns
  const closeAllDropdowns = () => {
    setShowLevelDropdown(false);
    setShowSubjectDropdown(false);
    setShowTeacherDropdown(false);
    setShowStudentDropdown(false);
  };

  // Ajouter un groupe
  const handleAddGroup = () => {
    setEditMode(false);
    setCurrentGroup(null);
    setFormData({
      name: '',
      levelId: '',
      subjectId: '',
      teacherId: '',
      studentIds: [],
      capacity: '',
    });
    closeAllDropdowns();
    setModalVisible(true);
  };

  // Modifier un groupe
  const handleEditGroup = (group) => {
    setEditMode(true);
    setCurrentGroup(group);
    setFormData({
      name: group.name || '',
      levelId: group.levelId || '',
      subjectId: group.subjectId || '',
      teacherId: group.teacherId || '',
      studentIds: group.studentIds || [],
      capacity: group.capacity?.toString() || '',
    });
    closeAllDropdowns();
    setModalVisible(true);
  };

  // Gérer la sélection des étudiants
  const handleStudentToggle = (studentId) => {
    const currentStudentIds = [...formData.studentIds];
    
    if (currentStudentIds.includes(studentId)) {
      const updatedIds = currentStudentIds.filter(id => id !== studentId);
      setFormData({ ...formData, studentIds: updatedIds });
    } else {
      // Vérifier la capacité
      const capacity = parseInt(formData.capacity) || 0;
      if (capacity > 0 && currentStudentIds.length >= capacity) {
        Alert.alert('Capacité maximale', `Ce groupe a une capacité de ${capacity} élèves maximum`);
        return;
      }
      setFormData({ ...formData, studentIds: [...currentStudentIds, studentId] });
    }
  };

  // Vérifier si un étudiant est sélectionné
  const isStudentSelected = (studentId) => {
    return formData.studentIds.includes(studentId);
  };

  // Gérer le changement de niveau
  const handleLevelChange = (levelId) => {
    setFormData({ 
      ...formData, 
      levelId,
      subjectId: '', // Réinitialiser la matière
      teacherId: '', // Réinitialiser l'enseignant
      studentIds: [], // Réinitialiser les étudiants
    });
    setShowLevelDropdown(false);
  };

  // Gérer le changement de matière
  const handleSubjectChange = (subjectId) => {
    setFormData({ 
      ...formData, 
      subjectId,
      teacherId: '', // Réinitialiser l'enseignant
    });
    setShowSubjectDropdown(false);
  };

  // Gérer le changement d'enseignant
  const handleTeacherChange = (teacherId) => {
    setFormData({ ...formData, teacherId });
    setShowTeacherDropdown(false);
  };

  // Supprimer un groupe
  const handleDeleteGroup = (group) => {
    Alert.alert(
      'Supprimer le groupe',
      `Êtes-vous sûr de vouloir supprimer ${group.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'groups', group.id));
              Alert.alert('Succès', 'Groupe supprimé avec succès');
              loadData();
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le groupe');
            }
          }
        }
      ]
    );
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom du groupe est obligatoire');
      return;
    }
    
    if (!formData.levelId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un niveau');
      return;
    }
    
    if (!formData.subjectId) {
      Alert.alert('Erreur', 'Veuillez sélectionner une matière');
      return;
    }
    
    if (!formData.teacherId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un enseignant');
      return;
    }
    
    const capacity = parseInt(formData.capacity) || 0;
    if (capacity <= 0) {
      Alert.alert('Erreur', 'La capacité doit être supérieure à 0');
      return;
    }
    
    if (formData.studentIds.length > capacity) {
      Alert.alert('Erreur', `Le nombre d'élèves (${formData.studentIds.length}) dépasse la capacité (${capacity})`);
      return;
    }

    try {
      const groupData = {
        name: formData.name.trim(),
        levelId: formData.levelId,
        subjectId: formData.subjectId,
        teacherId: formData.teacherId,
        studentIds: formData.studentIds,
        capacity: capacity,
        currentCount: formData.studentIds.length,
        status: 'active',
        updatedAt: new Date().toISOString()
      };

      if (editMode && currentGroup) {
        await updateDoc(doc(db, 'groups', currentGroup.id), groupData);
        Alert.alert('Succès', 'Groupe modifié avec succès');
      } else {
        await addDoc(collection(db, 'groups'), {
          ...groupData,
          createdAt: new Date().toISOString()
        });
        Alert.alert('Succès', 'Groupe créé avec succès');
      }

      setModalVisible(false);
      loadData();
      
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  // Effacer la recherche
  const clearSearch = () => {
    setSearchQuery('');
  };

  // Effacer tous les filtres
  const clearFilters = () => {
    setSearchQuery('');
    setLevelFilter('all');
  };

  // Composant Dropdown amélioré
  const Dropdown = ({ 
    label, 
    value, 
    options, 
    onSelect, 
    isOpen, 
    onToggle,
    placeholder,
    disabled,
    error,
    dropdownKey
  }) => {
    const selectedOption = options.find(opt => opt.id === value);
    
    return (
      <View style={styles.dropdownWrapper}>
        <Text style={styles.formLabel}>{label}</Text>
        <TouchableOpacity
          style={[
            styles.dropdownButton,
            disabled && styles.dropdownButtonDisabled,
            error && styles.dropdownButtonError
          ]}
          onPress={onToggle}
          disabled={disabled}
        >
          <Text style={[
            styles.dropdownButtonText,
            !selectedOption && styles.dropdownPlaceholder
          ]}>
            {selectedOption ? selectedOption.name : placeholder}
          </Text>
          <Ionicons 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#64748b" 
          />
        </TouchableOpacity>
        
        {isOpen && !disabled && (
          <View style={styles.dropdownListContainer}>
            <View style={styles.dropdownList}>
              <ScrollView 
                style={styles.dropdownScroll} 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {options.length === 0 ? (
                  <Text style={styles.noOptionsText}>Aucune option disponible</Text>
                ) : (
                  options.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.dropdownItem,
                        value === option.id && styles.dropdownItemSelected
                      ]}
                      onPress={() => onSelect(option.id)}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        value === option.id && styles.dropdownItemTextSelected
                      ]}>
                        {option.name}
                      </Text>
                      {value === option.id && (
                        <Ionicons name="checkmark" size={16} color="#000000" />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  };

  // Obtenir les étudiants filtrés par niveau
  const getFilteredStudents = () => {
    if (!formData.levelId) return [];
    return students.filter(student => student.levelId === formData.levelId);
  };

  // Rendu d'une carte de groupe
  const GroupCard = ({ group }) => (
    <Card key={group.id} style={styles.groupCard}>
      {/* En-tête de la carte avec nom et actions */}
      <View style={styles.cardHeader}>
        <Text style={styles.groupName}>{group.name}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditGroup(group)}
          >
            <Ionicons name="create-outline" size={18} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteGroup(group)}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Détails du groupe en tableau */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Niveau</Text>
          <Badge 
            text={getLevelName(group.levelId)}
            type="success"
            size="small"
          />
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Matière</Text>
          <Badge 
            text={getSubjectName(group.subjectId)}
            type="info"
            size="small"
          />
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Enseignant</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {getTeacherName(group.teacherId)}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Élèves</Text>
          <Text style={styles.detailValue}>
            {getStudentCount(group.studentIds)}/{group.capacity}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Liste des Groupes ({filteredGroups.length})</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddGroup}>
          <Ionicons name="add-circle" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* BARRE DE RECHERCHE */}
      <Card style={styles.searchCard}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un groupe, matière ou enseignant..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* FILTRES */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filtrer par niveau:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            <TouchableOpacity
              style={[
                styles.filterButton,
                levelFilter === 'all' && styles.filterButtonActive
              ]}
              onPress={() => setLevelFilter('all')}
            >
              <Text style={[
                styles.filterButtonText,
                levelFilter === 'all' && styles.filterButtonTextActive
              ]}>
                Tous
              </Text>
            </TouchableOpacity>
            {levels.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.filterButton,
                  levelFilter === level.id && styles.filterButtonActive
                ]}
                onPress={() => setLevelFilter(level.id)}
              >
                <Text style={[
                  styles.filterButtonText,
                  levelFilter === level.id && styles.filterButtonTextActive
                ]}>
                  {level.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Card>

      {/* LISTE DES GROUPES */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : filteredGroups.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={60} color="#cbd5e1" />
          <Text style={styles.emptyText}>
            {searchQuery || levelFilter !== 'all' 
              ? 'Aucun groupe ne correspond aux critères' 
              : 'Aucun groupe enregistré'}
          </Text>
          {(searchQuery || levelFilter !== 'all') && (
            <TouchableOpacity 
              style={styles.clearFiltersButton}
              onPress={clearFilters}
            >
              <Text style={styles.clearFiltersText}>Effacer les filtres</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        >
          {filteredGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </ScrollView>
      )}

      {/* MODAL POUR AJOUTER/MODIFIER UN GROUPE */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          closeAllDropdowns();
          setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              closeAllDropdowns();
              setModalVisible(false);
            }}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? 'Modifier le groupe' : 'Créer un groupe'}
              </Text>
              <TouchableOpacity onPress={() => {
                closeAllDropdowns();
                setModalVisible(false);
              }}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* NOM DU GROUPE */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nom du groupe *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                  placeholder="Ex: Maths 2BAC - Groupe A"
                />
              </View>

              {/* NIVEAU - Dropdown */}
              <Dropdown
                label="Niveau *"
                value={formData.levelId}
                options={levels}
                onSelect={handleLevelChange}
                isOpen={showLevelDropdown}
                onToggle={() => {
                  closeAllDropdowns();
                  setShowLevelDropdown(!showLevelDropdown);
                }}
                placeholder="Sélectionner un niveau"
                error={!formData.levelId && formData.name ? "Ce champ est requis" : null}
                dropdownKey="level"
              />

              {/* MATIÈRE - Dropdown */}
              <Dropdown
                label="Matière *"
                value={formData.subjectId}
                options={subjects.filter(subject => 
                  formData.levelId ? subject.levelIds.includes(formData.levelId) : true
                )}
                onSelect={handleSubjectChange}
                isOpen={showSubjectDropdown}
                onToggle={() => {
                  closeAllDropdowns();
                  setShowSubjectDropdown(!showSubjectDropdown);
                }}
                placeholder={formData.levelId ? "Sélectionner une matière" : "Sélectionnez d'abord un niveau"}
                disabled={!formData.levelId}
                error={formData.levelId && !formData.subjectId ? "Ce champ est requis" : null}
                dropdownKey="subject"
              />

              {/* ENSEIGNANT - Dropdown */}
              <Dropdown
                label="Enseignant *"
                value={formData.teacherId}
                options={teachers.filter(teacher => 
                  formData.subjectId ? teacher.subjectIds.includes(formData.subjectId) : true
                )}
                onSelect={handleTeacherChange}
                isOpen={showTeacherDropdown}
                onToggle={() => {
                  closeAllDropdowns();
                  setShowTeacherDropdown(!showTeacherDropdown);
                }}
                placeholder={formData.subjectId ? "Sélectionner un enseignant" : "Sélectionnez d'abord une matière"}
                disabled={!formData.subjectId}
                error={formData.subjectId && !formData.teacherId ? "Ce champ est requis" : null}
                dropdownKey="teacher"
              />

              {/* CAPACITÉ */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Capacité *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.capacity}
                  onChangeText={(text) => setFormData({...formData, capacity: text.replace(/[^0-9]/g, '')})}
                  placeholder="Nombre maximum d'élèves"
                  keyboardType="numeric"
                />
              </View>

              {/* SÉLECTION DES ÉLÈVES - MODIFIÉ AVEC CASES À COCHER VISIBLES */}
              {formData.levelId && (
                <View style={styles.formGroup}>
                  <View style={styles.studentHeader}>
                    <Text style={styles.formLabel}>
                      Élèves ({formData.studentIds.length} sélectionné{formData.studentIds.length !== 1 ? 's' : ''})
                    </Text>
                    {formData.capacity && (
                      <Text style={styles.capacityInfo}>
                        {formData.studentIds.length}/{formData.capacity}
                      </Text>
                    )}
                  </View>
                  
                  <Text style={styles.studentInfoText}>
                    {getFilteredStudents().length} élève{getFilteredStudents().length !== 1 ? 's' : ''} disponible{getFilteredStudents().length !== 1 ? 's' : ''} en {getLevelName(formData.levelId)}
                  </Text>

                  {/* Section de sélection des élèves avec cases à cocher visibles */}
                  <View style={styles.studentSelectionContainer}>
                    {getFilteredStudents().length === 0 ? (
                      <Text style={styles.noStudentsText}>Aucun élève inscrit dans ce niveau</Text>
                    ) : (
                      getFilteredStudents().map((student) => (
                        <TouchableOpacity
                          key={student.id}
                          style={[
                            styles.studentItem,
                            isStudentSelected(student.id) && styles.studentItemSelected
                          ]}
                          onPress={() => handleStudentToggle(student.id)}
                        >
                          <Checkbox
                            value={isStudentSelected(student.id)}
                            onValueChange={() => handleStudentToggle(student.id)}
                            color={isStudentSelected(student.id) ? '#000000' : undefined}
                            style={styles.checkbox}
                          />
                          <View style={styles.studentInfo}>
                            <Text style={styles.studentName}>{student.name}</Text>
                            <Text style={styles.studentDetails}>
                              {student.phone} • {student.email || 'Pas d\'email'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* BOUTONS DU MODAL */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  closeAllDropdowns();
                  setModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {editMode ? 'Modifier' : 'Créer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 14,
  },
  searchCard: {
    margin: 16,
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
  filterContainer: {
    marginTop: 12,
  },
  filterLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '500',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  groupCard: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
    marginRight: 12,
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
    gap: 12,
  },
  detailItem: {
    width: '48%',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    marginTop: 'auto',
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
    maxHeight: 500,
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
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
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
  // DROPDOWN STYLES
  dropdownWrapper: {
    marginBottom: 20,
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
    minHeight: 48,
    zIndex: 100,
  },
  dropdownButtonDisabled: {
    backgroundColor: '#f1f5f9',
    opacity: 0.7,
  },
  dropdownButtonError: {
    borderColor: '#ef4444',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  dropdownPlaceholder: {
    color: '#94a3b8',
  },
  dropdownListContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownList: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0f9ff',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },
  noOptionsText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  // STUDENT SELECTION STYLES - MODIFIÉ
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  capacityInfo: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  studentInfoText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  studentSelectionContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    maxHeight: 300,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  studentItemSelected: {
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
  },
  checkbox: {
    marginRight: 12,
    width: 20,
    height: 20,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    marginBottom: 2,
  },
  studentDetails: {
    fontSize: 12,
    color: '#64748b',
  },
  noStudentsText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
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
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default GroupsScreen;