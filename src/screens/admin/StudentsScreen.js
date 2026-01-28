// screens/admin/StudentsScreen.js
import React, { useState, useEffect } from 'react';
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
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import Card from '../../components/common/Card/Card';
import Badge from '../../components/common/Badge/Badge';

const { width } = Dimensions.get('window');

const StudentsScreen = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [levels, setLevels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  
  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    parentPhone: '',
    levelId: '',
    groupIds: [],
    address: '',
  });

  // États pour les dropdowns
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [showGroupsDropdown, setShowGroupsDropdown] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les niveaux
      const levelsSnapshot = await getDocs(collection(db, 'levels'));
      const levelsList = levelsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLevels(levelsList);
      
      // Charger les groupes
      const groupsSnapshot = await getDocs(collection(db, 'groups'));
      const groupsList = groupsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroups(groupsList);
      
      // Charger les étudiants
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsList = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsList);
      setFilteredStudents(studentsList);
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrer les étudiants
  useEffect(() => {
    let filtered = [...students];
    
    // Filtre par recherche
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(query) ||
        (student.email && student.email.toLowerCase().includes(query)) ||
        student.phone.includes(query) ||
        (student.parentPhone && student.parentPhone.includes(query))
      );
    }
    
    // Filtre par niveau
    if (levelFilter !== 'all') {
      filtered = filtered.filter(student => 
        student.levelId === levelFilter
      );
    }
    
    // Filtre par groupe
    if (groupFilter !== 'all') {
      filtered = filtered.filter(student => 
        student.groupIds && student.groupIds.includes(groupFilter)
      );
    }
    
    setFilteredStudents(filtered);
  }, [searchQuery, levelFilter, groupFilter, students]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Fonction pour obtenir le nom du niveau
  const getLevelName = (levelId) => {
    const level = levels.find(l => l.id === levelId);
    return level ? level.name : 'Niveau inconnu';
  };

  // Fonction pour obtenir le nom du groupe
  const getGroupName = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : 'Groupe inconnu';
  };

  // Ajouter un étudiant
  const handleAddStudent = () => {
    setEditMode(false);
    setCurrentStudent(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      parentPhone: '',
      levelId: '',
      groupIds: [],
      address: '',
    });
    setSelectedGroups([]);
    setModalVisible(true);
  };

  // Modifier un étudiant
  const handleEditStudent = (student) => {
    setEditMode(true);
    setCurrentStudent(student);
    setFormData({
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      parentPhone: student.parentPhone || '',
      levelId: student.levelId || '',
      groupIds: student.groupIds || [],
      address: student.address || '',
    });
    setSelectedGroups(student.groupIds || []);
    setModalVisible(true);
  };

  // Sélectionner un niveau
  const handleLevelSelect = (levelId) => {
    setFormData({ ...formData, levelId });
    setShowLevelDropdown(false);
  };

  // Sélectionner/désélectionner un groupe
  const handleGroupToggle = (groupId) => {
    let updatedGroups = [...selectedGroups];
    
    if (updatedGroups.includes(groupId)) {
      updatedGroups = updatedGroups.filter(id => id !== groupId);
    } else {
      updatedGroups.push(groupId);
    }
    
    setSelectedGroups(updatedGroups);
    setFormData({ ...formData, groupIds: updatedGroups });
  };

  // Vérifier si un groupe est sélectionné
  const isGroupSelected = (groupId) => {
    return selectedGroups.includes(groupId);
  };

  // Sélectionner tous les groupes
  const handleSelectAllGroups = () => {
    const allGroupIds = groups.map(g => g.id);
    setSelectedGroups(allGroupIds);
    setFormData({ ...formData, groupIds: allGroupIds });
  };

  // Désélectionner tous les groupes
  const handleDeselectAllGroups = () => {
    setSelectedGroups([]);
    setFormData({ ...formData, groupIds: [] });
  };

  // Supprimer un étudiant
  const handleDeleteStudent = (student) => {
    Alert.alert(
      'Supprimer l\'étudiant',
      `Êtes-vous sûr de vouloir supprimer ${student.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'students', student.id));
              Alert.alert('Succès', 'Étudiant supprimé avec succès');
              loadData();
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'étudiant');
            }
          }
        }
      ]
    );
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.levelId) {
      Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires (Nom, Téléphone, Niveau)');
      return;
    }

    try {
      const studentData = {
        name: formData.name,
        email: formData.email || '',
        phone: formData.phone,
        parentPhone: formData.parentPhone || '',
        levelId: formData.levelId,
        groupIds: formData.groupIds,
        address: formData.address || '',
        updatedAt: new Date().toISOString()
      };

      if (editMode && currentStudent) {
        await updateDoc(doc(db, 'students', currentStudent.id), studentData);
        Alert.alert('Succès', 'Étudiant modifié avec succès');
      } else {
        await addDoc(collection(db, 'students'), {
          ...studentData,
          createdAt: new Date().toISOString(),
          status: 'active'
        });
        Alert.alert('Succès', 'Étudiant ajouté avec succès');
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
    setGroupFilter('all');
  };

  return (
    <View style={styles.container}>
      {/* HEADER AVEC TITRE ET BOUTON AJOUTER EN HAUT */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Liste des élèves ({filteredStudents.length})</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddStudent}>
          <Ionicons name="add-circle" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* BARRE DE RECHERCHE */}
      <Card style={styles.searchCard}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par nom, email ou téléphone..."
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
          <Text style={styles.filterLabel}>Filtrer par:</Text>
          
          {/* Filtre par niveau */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            <View style={styles.filterRow}>
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
                  Tous les niveaux
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
            </View>
          </ScrollView>

          {/* Filtre par groupe */}
          {groups.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    groupFilter === 'all' && styles.filterButtonActive
                  ]}
                  onPress={() => setGroupFilter('all')}
                >
                  <Text style={[
                    styles.filterButtonText,
                    groupFilter === 'all' && styles.filterButtonTextActive
                  ]}>
                    Tous les groupes
                  </Text>
                </TouchableOpacity>
                {groups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    style={[
                      styles.filterButton,
                      groupFilter === group.id && styles.filterButtonActive
                    ]}
                    onPress={() => setGroupFilter(group.id)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      groupFilter === group.id && styles.filterButtonTextActive
                    ]}>
                      {group.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </Card>

      {/* LISTE DES ÉLÈVES EN CARTES */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : filteredStudents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={60} color="#cbd5e1" />
          <Text style={styles.emptyText}>
            {searchQuery || levelFilter !== 'all' || groupFilter !== 'all'
              ? 'Aucun élève ne correspond aux critères' 
              : 'Aucun élève enregistré'}
          </Text>
          {(searchQuery || levelFilter !== 'all' || groupFilter !== 'all') && (
            <TouchableOpacity 
              style={styles.clearFiltersButton}
              onPress={clearFilters}
            >
              <Text style={styles.clearFiltersText}>Effacer tous les filtres</Text>
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
        >
          {filteredStudents.map((student) => (
            <Card key={student.id} style={styles.studentCard}>
              {/* EN-TÊTE DE LA CARTE */}
              <View style={styles.cardHeader}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <View style={styles.badgeRow}>
                    <Badge 
                      text={getLevelName(student.levelId)}
                      type="success"
                      size="small"
                    />
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>
                        {student.status === 'active' ? 'Actif' : 'Inactif'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleEditStudent(student)}
                  >
                    <Ionicons name="create-outline" size={18} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteStudent(student)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* CONTACT */}
              <View style={styles.contactSection}>
                <View style={styles.contactItem}>
                  <Ionicons name="person-outline" size={16} color="#64748b" />
                  <Text style={styles.contactLabel}>Élève:</Text>
                  <Text style={styles.contactText}>{student.phone}</Text>
                </View>
                {student.parentPhone ? (
                  <View style={styles.contactItem}>
                    <Ionicons name="people-outline" size={16} color="#64748b" />
                    <Text style={styles.contactLabel}>Parent:</Text>
                    <Text style={styles.contactText}>{student.parentPhone}</Text>
                  </View>
                ) : (
                  <View style={styles.contactItem}>
                    <Ionicons name="people-outline" size={16} color="#94a3b8" />
                    <Text style={[styles.contactLabel, styles.noParentText]}>Parent:</Text>
                    <Text style={[styles.contactText, styles.noParentText]}>Non renseigné</Text>
                  </View>
                )}
                {student.email && (
                  <View style={styles.contactItem}>
                    <Ionicons name="mail-outline" size={16} color="#64748b" />
                    <Text style={styles.contactLabel}>Email:</Text>
                    <Text style={[styles.contactText, styles.emailText]} numberOfLines={1}>
                      {student.email}
                    </Text>
                  </View>
                )}
              </View>

              {/* GROUPES */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Groupes</Text>
                <View style={styles.groupsList}>
                  {student.groupIds && student.groupIds.length > 0 ? (
                    student.groupIds.map((groupId, index) => {
                      const groupName = getGroupName(groupId);
                      return (
                        <Badge 
                          key={index}
                          text={groupName}
                          type="info"
                          size="small"
                          style={styles.groupBadge}
                        />
                      );
                    })
                  ) : (
                    <Text style={styles.noGroupsText}>Aucun groupe</Text>
                  )}
                </View>
              </View>

              {/* ADRESSE (si disponible) */}
              {student.address && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Adresse</Text>
                  <View style={styles.addressContainer}>
                    <Ionicons name="location-outline" size={14} color="#64748b" />
                    <Text style={styles.addressText} numberOfLines={2}>
                      {student.address}
                    </Text>
                  </View>
                </View>
              )}
            </Card>
          ))}
        </ScrollView>
      )}

      {/* MODAL POUR AJOUTER/MODIFIER UN ÉLÈVE AVEC DROPDOWNS */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? 'Modifier l\'élève' : 'Ajouter un élève'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* NOM */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nom complet *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                  placeholder="Ex: Mohamed Ali"
                />
              </View>

              {/* EMAIL */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                  placeholder="exemple@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* TÉLÉPHONE ÉLÈVE */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Téléphone élève *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({...formData, phone: text})}
                  placeholder="06 XX XX XX XX"
                  keyboardType="phone-pad"
                />
              </View>

              {/* TÉLÉPHONE PARENT */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Téléphone parent</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.parentPhone}
                  onChangeText={(text) => setFormData({...formData, parentPhone: text})}
                  placeholder="06 XX XX XX XX"
                  keyboardType="phone-pad"
                />
              </View>

              {/* NIVEAU - Dropdown */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Niveau *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowLevelDropdown(!showLevelDropdown)}
                >
                  <Text style={[
                    styles.dropdownButtonText,
                    !formData.levelId && styles.placeholderText
                  ]}>
                    {formData.levelId 
                      ? getLevelName(formData.levelId)
                      : 'Sélectionnez un niveau'
                    }
                  </Text>
                  <Ionicons 
                    name={showLevelDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#64748b" 
                  />
                </TouchableOpacity>
                
                {showLevelDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScroll}>
                      {levels.length === 0 ? (
                        <Text style={styles.noLevelsText}>Aucun niveau disponible</Text>
                      ) : (
                        levels.map((level) => (
                          <TouchableOpacity
                            key={level.id}
                            style={[
                              styles.dropdownItem,
                              formData.levelId === level.id && styles.dropdownItemSelected
                            ]}
                            onPress={() => handleLevelSelect(level.id)}
                          >
                            <Text style={[
                              styles.dropdownItemText,
                              formData.levelId === level.id && styles.dropdownItemTextSelected
                            ]}>
                              {level.name}
                            </Text>
                            {formData.levelId === level.id && (
                              <Ionicons name="checkmark" size={18} color="#000000" />
                            )}
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
                
                {!formData.levelId && (
                  <Text style={styles.errorText}>Sélectionnez un niveau</Text>
                )}
              </View>

              {/* GROUPES - Multi-select Dropdown */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Groupes</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowGroupsDropdown(!showGroupsDropdown)}
                >
                  <Text style={[
                    styles.dropdownButtonText,
                    selectedGroups.length === 0 && styles.placeholderText
                  ]}>
                    {selectedGroups.length === 0
                      ? 'Sélectionnez des groupes'
                      : `${selectedGroups.length} groupe(s) sélectionné(s)`
                    }
                  </Text>
                  <Ionicons 
                    name={showGroupsDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#64748b" 
                  />
                </TouchableOpacity>
                
                {showGroupsDropdown && (
                  <View style={styles.dropdownList}>
                    <View style={styles.dropdownHeader}>
                      <TouchableOpacity 
                        style={styles.selectAllButton}
                        onPress={handleSelectAllGroups}
                      >
                        <Text style={styles.selectAllText}>Tout sélectionner</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.selectAllButton}
                        onPress={handleDeselectAllGroups}
                      >
                        <Text style={styles.selectAllText}>Tout désélectionner</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.dropdownScroll}>
                      {groups.length === 0 ? (
                        <Text style={styles.noGroupsText}>Aucun groupe disponible</Text>
                      ) : (
                        groups.map((group) => (
                          <TouchableOpacity
                            key={group.id}
                            style={[
                              styles.dropdownItem,
                              isGroupSelected(group.id) && styles.dropdownItemSelected
                            ]}
                            onPress={() => handleGroupToggle(group.id)}
                          >
                            <View style={styles.checkboxWrapper}>
                              <View style={[
                                styles.customCheckbox,
                                isGroupSelected(group.id) && styles.customCheckboxSelected
                              ]}>
                                {isGroupSelected(group.id) && (
                                  <Ionicons name="checkmark" size={14} color="#ffffff" />
                                )}
                              </View>
                              <Text style={[
                                styles.dropdownItemText,
                                isGroupSelected(group.id) && styles.dropdownItemTextSelected
                              ]}>
                                {group.name}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* ADRESSE */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Adresse</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.address}
                  onChangeText={(text) => setFormData({...formData, address: text})}
                  placeholder="Adresse complète"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            {/* BOUTONS DU MODAL */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {editMode ? 'Modifier' : 'Ajouter'}
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
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  studentCard: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
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
  contactSection: {
    marginBottom: 12,
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    minWidth: 50,
  },
  contactText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    flex: 1,
  },
  emailText: {
    color: '#3b82f6',
  },
  noParentText: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  groupBadge: {
    backgroundColor: '#e0f2fe',
  },
  noGroupsText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
    lineHeight: 18,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  // DROPDOWN STYLES
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
    marginTop: 4,
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
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  selectAllText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
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
  },
  dropdownItemTextSelected: {
    fontWeight: '600',
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCheckboxSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 8,
  },
  noLevelsText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    padding: 12,
    textAlign: 'center',
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

export default StudentsScreen;