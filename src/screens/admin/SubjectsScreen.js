// screens/admin/SubjectsScreen.js
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
import Checkbox from 'expo-checkbox';

const { width } = Dimensions.get('window');

const SubjectsScreen = () => {
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // États pour le dropdown
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  
  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    levelIds: [],
    description: '',
  });

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
      
      // Charger les matières
      const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
      const subjectsList = subjectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Trier les matières par nom
      subjectsList.sort((a, b) => a.name.localeCompare(b.name));
      
      setSubjects(subjectsList);
      setFilteredSubjects(subjectsList);
      
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

  // Filtrer les matières
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSubjects(subjects);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = subjects.filter(subject => 
        subject.name.toLowerCase().includes(query) ||
        (subject.description && subject.description.toLowerCase().includes(query))
      );
      setFilteredSubjects(filtered);
    }
  }, [searchQuery, subjects]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Fonction pour obtenir le nom du niveau
  const getLevelName = (levelId) => {
    const level = levels.find(l => l.id === levelId);
    return level ? level.name : 'Niveau inconnu';
  };

  // Formater la description pour l'affichage
  const formatDescription = (description) => {
    if (!description || description.trim() === '') return 'Aucune description';
    if (description.length > 100) return description.substring(0, 100) + '...';
    return description;
  };

  // Ajouter une matière
  const handleAddSubject = () => {
    setEditMode(false);
    setCurrentSubject(null);
    setFormData({
      name: '',
      levelIds: [],
      description: '',
    });
    setModalVisible(true);
  };

  // Modifier une matière
  const handleEditSubject = (subject) => {
    setEditMode(true);
    setCurrentSubject(subject);
    setFormData({
      name: subject.name || '',
      levelIds: subject.levelIds || [],
      description: subject.description || '',
    });
    setModalVisible(true);
  };

  // Gérer les checkboxes de niveaux
  const handleLevelToggle = (levelId) => {
    let updatedLevels = [...formData.levelIds];
    
    if (updatedLevels.includes(levelId)) {
      updatedLevels = updatedLevels.filter(id => id !== levelId);
    } else {
      updatedLevels.push(levelId);
    }
    
    setFormData({ ...formData, levelIds: updatedLevels });
  };

  // Sélectionner tous les niveaux
  const handleSelectAllLevels = () => {
    const allLevelIds = levels.map(l => l.id);
    setFormData({ ...formData, levelIds: allLevelIds });
  };

  // Désélectionner tous les niveaux
  const handleDeselectAllLevels = () => {
    setFormData({ ...formData, levelIds: [] });
  };

  // Vérifier si un niveau est sélectionné
  const isLevelSelected = (levelId) => {
    return formData.levelIds.includes(levelId);
  };

  // Supprimer une matière
  const handleDeleteSubject = (subject) => {
    Alert.alert(
      'Supprimer la matière',
      `Êtes-vous sûr de vouloir supprimer "${subject.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'subjects', subject.id));
              Alert.alert('Succès', 'Matière supprimée avec succès');
              loadData();
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la matière');
            }
          }
        }
      ]
    );
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    const name = formData.name?.trim() || '';

    if (!name) {
      Alert.alert('Erreur', 'Veuillez saisir le nom de la matière');
      return;
    }

    if (formData.levelIds.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un niveau');
      return;
    }

    try {
      const subjectData = {
        name: name,
        levelIds: formData.levelIds,
        description: formData.description?.trim() || '',
        updatedAt: new Date().toISOString()
      };

      if (editMode && currentSubject) {
        await updateDoc(doc(db, 'subjects', currentSubject.id), subjectData);
        Alert.alert('Succès', 'Matière modifiée avec succès');
      } else {
        await addDoc(collection(db, 'subjects'), {
          ...subjectData,
          createdAt: new Date().toISOString(),
        });
        Alert.alert('Succès', 'Matière ajoutée avec succès');
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

  return (
    <View style={styles.container}>
      {/* HEADER AVEC TITRE ET BOUTON AJOUTER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matières ({filteredSubjects.length})</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddSubject}>
          <Ionicons name="add-circle" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* BARRE DE RECHERCHE */}
      <Card style={styles.searchCard}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par nom ou description..."
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

      {/* LISTE DES MATIÈRES EN CARTES */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : filteredSubjects.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={60} color="#cbd5e1" />
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'Aucune matière ne correspond à votre recherche' 
              : 'Aucune matière enregistrée'}
          </Text>
          {searchQuery && (
            <TouchableOpacity 
              style={styles.clearSearchButton}
              onPress={clearSearch}
            >
              <Text style={styles.clearSearchText}>Effacer la recherche</Text>
            </TouchableOpacity>
          )}
          {subjects.length === 0 && (
            <TouchableOpacity 
              style={styles.addFirstButton}
              onPress={handleAddSubject}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text style={styles.addFirstButtonText}>Ajouter la première matière</Text>
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
          {filteredSubjects.map((subject) => (
            <Card key={subject.id} style={styles.subjectCard}>
              {/* EN-TÊTE DE LA CARTE */}
              <View style={styles.cardHeader}>
                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <View style={styles.levelBadges}>
                    {subject.levelIds && subject.levelIds.length > 0 ? (
                      subject.levelIds.map((levelId, index) => (
                        <Badge 
                          key={index}
                          text={getLevelName(levelId)}
                          type="success"
                          size="small"
                          style={styles.levelBadge}
                        />
                      ))
                    ) : (
                      <Text style={styles.noLevelsText}>Aucun niveau</Text>
                    )}
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleEditSubject(subject)}
                  >
                    <Ionicons name="create-outline" size={18} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteSubject(subject)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* DESCRIPTION */}
              <View style={styles.descriptionSection}>
                <View style={styles.descriptionHeader}>
                  <Ionicons name="document-text-outline" size={16} color="#64748b" />
                  <Text style={styles.descriptionLabel}>Description:</Text>
                </View>
                <Text style={styles.descriptionText}>
                  {formatDescription(subject.description)}
                </Text>
              </View>

              {/* STATISTIQUES */}
              <View style={styles.statsSection}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="layers-outline" size={14} color="#94a3b8" />
                    <Text style={styles.statText}>
                      {subject.levelIds?.length || 0} niveau{subject.levelIds?.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
                    <Text style={styles.statText}>
                      Créée le {subject.createdAt ? new Date(subject.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* MODAL POUR AJOUTER/MODIFIER UNE MATIÈRE */}
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
                {editMode ? 'Modifier la matière' : 'Nouvelle matière'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* NOM DE LA MATIÈRE */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nom de la matière *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                  placeholder="Ex: Mathématiques, Physique, Anglais..."
                  autoCapitalize="words"
                  maxLength={50}
                />
              </View>

              {/* NIVEAUX - Checkboxes */}
              <View style={styles.formGroup}>
                <View style={styles.checkboxHeader}>
                  <Text style={styles.formLabel}>Niveaux *</Text>
                  <View style={styles.checkboxActions}>
                    <TouchableOpacity 
                      style={styles.selectAllButton}
                      onPress={handleSelectAllLevels}
                    >
                      <Text style={styles.selectAllText}>Tout</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.selectAllButton}
                      onPress={handleDeselectAllLevels}
                    >
                      <Text style={styles.selectAllText}>Aucun</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {levels.length === 0 ? (
                  <Text style={styles.noItemsText}>Aucun niveau disponible</Text>
                ) : (
                  <View style={styles.checkboxGrid}>
                    {levels.map((level) => (
                      <TouchableOpacity
                        key={level.id}
                        style={styles.checkboxContainer}
                        onPress={() => handleLevelToggle(level.id)}
                      >
                        <Checkbox
                          value={isLevelSelected(level.id)}
                          onValueChange={() => handleLevelToggle(level.id)}
                          color={isLevelSelected(level.id) ? '#000000' : undefined}
                          style={styles.checkbox}
                        />
                        <Text style={styles.checkboxLabel}>
                          {level.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                
                {formData.levelIds.length === 0 && (
                  <Text style={styles.errorText}>Sélectionnez au moins un niveau</Text>
                )}
              </View>

              {/* DESCRIPTION (optionnel) */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description (optionnel)</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({...formData, description: text})}
                  placeholder="Description de la matière..."
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
                <Text style={styles.hintText}>
                  Maximum 500 caractères
                </Text>
              </View>

              {/* PRÉVISUALISATION */}
              {(formData.name || formData.levelIds.length > 0 || formData.description) && (
                <Card style={styles.previewCard}>
                  <Text style={styles.previewTitle}>Aperçu:</Text>
                  <View style={styles.previewContent}>
                    {formData.name ? (
                      <Text style={styles.previewName}>{formData.name}</Text>
                    ) : (
                      <Text style={styles.previewPlaceholder}>Nom de la matière</Text>
                    )}
                    
                    <View style={styles.previewLevels}>
                      <Text style={styles.previewLabel}>Niveaux:</Text>
                      <View style={styles.previewBadges}>
                        {formData.levelIds.length > 0 ? (
                          formData.levelIds.slice(0, 3).map((levelId, index) => {
                            const levelName = getLevelName(levelId);
                            return (
                              <View key={index} style={styles.previewBadge}>
                                <Text style={styles.previewBadgeText}>{levelName}</Text>
                              </View>
                            );
                          })
                        ) : (
                          <Text style={styles.previewPlaceholder}>Aucun niveau sélectionné</Text>
                        )}
                        {formData.levelIds.length > 3 && (
                          <Text style={styles.moreItemsText}>+{formData.levelIds.length - 3} autres</Text>
                        )}
                      </View>
                    </View>
                    
                    {formData.description ? (
                      <View style={styles.previewDescription}>
                        <Text style={styles.previewLabel}>Description:</Text>
                        <Text style={styles.previewDescriptionText} numberOfLines={2}>
                          {formatDescription(formData.description)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Card>
              )}
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
                style={[
                  styles.submitButton,
                  (!formData.name || formData.levelIds.length === 0) && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={!formData.name || formData.levelIds.length === 0}
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
  subjectCard: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  levelBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  levelBadge: {
    backgroundColor: '#d1fae5',
  },
  noLevelsText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
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
  descriptionSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  statsSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#94a3b8',
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hintText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  // CHECKBOX STYLES
  checkboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxActions: {
    flexDirection: 'row',
    gap: 12,
  },
  selectAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  selectAllText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
  },
  checkbox: {
    marginRight: 8,
    width: 20,
    height: 20,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
  },
  noItemsText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 8,
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
    gap: 12,
  },
  previewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  previewPlaceholder: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  previewLevels: {
    gap: 6,
  },
  previewLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  previewBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  previewBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewBadgeText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '500',
  },
  moreItemsText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
  previewDescription: {
    gap: 4,
  },
  previewDescriptionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
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

export default SubjectsScreen;