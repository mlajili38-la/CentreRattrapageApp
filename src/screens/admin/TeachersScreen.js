// screens/admin/TeachersScreen.js
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
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import Checkbox from 'expo-checkbox';
import Card from '../../components/common/Card/Card';
import Badge from '../../components/common/Badge/Badge';

const { width } = Dimensions.get('window');

const TeachersScreen = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all'); 
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subjectIds: [],
    paymentType: 'per_hour',
    rate: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les matières depuis la BD
      const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
      const subjectsList = subjectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubjects(subjectsList);
      
      // Charger les enseignants depuis la BD
      const teachersSnapshot = await getDocs(collection(db, 'teachers'));
      const teachersList = teachersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeachers(teachersList);
      setFilteredTeachers(teachersList);
      
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

  // Filtrer les enseignants
  useEffect(() => {
    let filtered = [...teachers];
    
    // Filtre par recherche
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(teacher => 
        teacher.name.toLowerCase().includes(query) ||
        teacher.email.toLowerCase().includes(query) ||
        teacher.phone.includes(query)
      );
    }
    
    // Filtre par type de paiement
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(teacher => 
        teacher.paymentType === paymentFilter
      );
    }
    
    setFilteredTeachers(filtered);
  }, [searchQuery, paymentFilter, teachers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Fonction pour obtenir le nom de la matière à partir de son ID
  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'Matière inconnue';
  };

  // Ajouter un enseignant
  const handleAddTeacher = () => {
    setEditMode(false);
    setCurrentTeacher(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      subjectIds: [],
      paymentType: 'per_hour',
      rate: '',
    });
    setModalVisible(true);
  };

  // Modifier un enseignant
  const handleEditTeacher = (teacher) => {
    setEditMode(true);
    setCurrentTeacher(teacher);
    setFormData({
      name: teacher.name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      subjectIds: teacher.subjectIds || [],
      paymentType: teacher.paymentType || 'per_hour',
      rate: teacher.rate?.toString() || '',
    });
    setModalVisible(true);
  };

  // Gérer les checkboxes de matières
  const handleSubjectToggle = (subjectId) => {
    const currentSubjectIds = [...formData.subjectIds];
    
    if (currentSubjectIds.includes(subjectId)) {
      const updatedIds = currentSubjectIds.filter(id => id !== subjectId);
      setFormData({ ...formData, subjectIds: updatedIds });
    } else {
      setFormData({ ...formData, subjectIds: [...currentSubjectIds, subjectId] });
    }
  };

  // Vérifier si une matière est sélectionnée
  const isSubjectSelected = (subjectId) => {
    return formData.subjectIds.includes(subjectId);
  };

  // Supprimer un enseignant
  const handleDeleteTeacher = (teacher) => {
    Alert.alert(
      'Supprimer l\'enseignant',
      `Êtes-vous sûr de vouloir supprimer ${teacher.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'teachers', teacher.id));
              Alert.alert('Succès', 'Enseignant supprimé avec succès');
              loadData();
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'enseignant');
            }
          }
        }
      ]
    );
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.rate || formData.subjectIds.length === 0) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const teacherData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subjectIds: formData.subjectIds,
        paymentType: formData.paymentType,
        rate: parseFloat(formData.rate) || 0,
        updatedAt: new Date().toISOString()
      };

      if (editMode && currentTeacher) {
        await updateDoc(doc(db, 'teachers', currentTeacher.id), teacherData);
        Alert.alert('Succès', 'Enseignant modifié avec succès');
      } else {
        await addDoc(collection(db, 'teachers'), {
          ...teacherData,
          createdAt: new Date().toISOString()
        });
        Alert.alert('Succès', 'Enseignant ajouté avec succès');
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
      {/* HEADER AVEC TITRE ET BOUTON AJOUTER EN HAUT */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Liste des enseignants ({filteredTeachers.length})</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddTeacher}>
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
          <Text style={styles.filterLabel}>Filtrer par paiement:</Text>
          <View style={styles.filterOptions}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                paymentFilter === 'all' && styles.filterButtonActive
              ]}
              onPress={() => setPaymentFilter('all')}
            >
              <Text style={[
                styles.filterButtonText,
                paymentFilter === 'all' && styles.filterButtonTextActive
              ]}>
                Tous
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                paymentFilter === 'per_hour' && styles.filterButtonActive
              ]}
              onPress={() => setPaymentFilter('per_hour')}
            >
              <Text style={[
                styles.filterButtonText,
                paymentFilter === 'per_hour' && styles.filterButtonTextActive
              ]}>
                Par heure
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                paymentFilter === 'per_session' && styles.filterButtonActive
              ]}
              onPress={() => setPaymentFilter('per_session')}
            >
              <Text style={[
                styles.filterButtonText,
                paymentFilter === 'per_session' && styles.filterButtonTextActive
              ]}>
                Par séance
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* LISTE DES ENSEIGNANTS EN CARTES */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : filteredTeachers.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={60} color="#cbd5e1" />
          <Text style={styles.emptyText}>
            {searchQuery || paymentFilter !== 'all' 
              ? 'Aucun enseignant ne correspond aux critères' 
              : 'Aucun enseignant enregistré'}
          </Text>
          {(searchQuery || paymentFilter !== 'all') && (
            <TouchableOpacity 
              style={styles.clearFiltersButton}
              onPress={() => {
                setSearchQuery('');
                setPaymentFilter('all');
              }}
            >
              <Text style={styles.clearFiltersText}>Effacer les filtres</Text>
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
          {filteredTeachers.map((teacher) => (
            <Card key={teacher.id} style={styles.teacherCard}>
              {/* EN-TÊTE DE LA CARTE */}
              <View style={styles.cardHeader}>
                <View style={styles.teacherInfo}>
                  <Text style={styles.teacherName}>{teacher.name}</Text>
                  <View style={styles.badgeRow}>
                    <Badge 
                      text={teacher.paymentType === 'per_hour' ? 'Par heure' : 'Par séance'}
                      type="info"
                      size="small"
                    />
                    <View style={styles.paymentBadge}>
                      <Text style={styles.paymentAmount}>{teacher.rate} DT</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleEditTeacher(teacher)}
                  >
                    <Ionicons name="create-outline" size={18} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteTeacher(teacher)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* CONTACT */}
              <View style={styles.contactSection}>
                <View style={styles.contactItem}>
                  <Ionicons name="mail-outline" size={16} color="#64748b" />
                  <Text style={styles.contactText} numberOfLines={1}>
                    {teacher.email}
                  </Text>
                </View>
                <View style={styles.contactItem}>
                  <Ionicons name="call-outline" size={16} color="#64748b" />
                  <Text style={styles.contactText}>{teacher.phone}</Text>
                </View>
              </View>

              {/* MATIÈRES */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Matières enseignées</Text>
                <View style={styles.subjectsList}>
                  {teacher.subjectIds && teacher.subjectIds.length > 0 ? (
                    teacher.subjectIds.map((subjectId, index) => {
                      const subjectName = getSubjectName(subjectId);
                      return (
                        <Badge 
                          key={index}
                          text={subjectName}
                          type="default"
                          size="small"
                          style={styles.subjectBadge}
                        />
                      );
                    })
                  ) : (
                    <Text style={styles.noSubjectsText}>Aucune matière</Text>
                  )}
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* MODAL POUR AJOUTER/MODIFIER UN ENSEIGNANT */}
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
                {editMode ? 'Modifier l\'enseignant' : 'Ajouter un enseignant'}
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
                  placeholder="Ex: Ahmed Bennani"
                />
              </View>

              {/* EMAIL */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                  placeholder="exemple@centre.ma"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* TÉLÉPHONE */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Téléphone *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({...formData, phone: text})}
                  placeholder="06 XX XX XX XX"
                  keyboardType="phone-pad"
                />
              </View>

              {/* MATIÈRES ENSEIGNÉES */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Matières enseignées *</Text>
                {subjects.length === 0 ? (
                  <Text style={styles.noSubjectsText}>Aucune matière disponible</Text>
                ) : (
                  <View style={styles.checkboxGrid}>
                    {subjects.map((subject) => (
                      <View key={subject.id} style={styles.checkboxContainer}>
                        <Checkbox
                          value={isSubjectSelected(subject.id)}
                          onValueChange={() => handleSubjectToggle(subject.id)}
                          color={isSubjectSelected(subject.id) ? '#000000' : undefined}
                          style={styles.checkbox}
                        />
                        <Text style={styles.checkboxLabel}>
                          {subject.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                {formData.subjectIds.length === 0 && (
                  <Text style={styles.errorText}>Sélectionnez au moins une matière</Text>
                )}
              </View>

              {/* TYPE DE PAIEMENT */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Type de paiement *</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setFormData({...formData, paymentType: 'per_hour'})}
                  >
                    <View style={[
                      styles.radioCircle,
                      formData.paymentType === 'per_hour' && styles.radioCircleSelected
                    ]}>
                      {formData.paymentType === 'per_hour' && (
                        <View style={styles.radioInnerCircle} />
                      )}
                    </View>
                    <Text style={styles.radioText}>Par heure</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setFormData({...formData, paymentType: 'per_session'})}
                  >
                    <View style={[
                      styles.radioCircle,
                      formData.paymentType === 'per_session' && styles.radioCircleSelected
                    ]}>
                      {formData.paymentType === 'per_session' && (
                        <View style={styles.radioInnerCircle} />
                      )}
                    </View>
                    <Text style={styles.radioText}>Par séance</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* TARIF */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tarif (DT) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.rate}
                  onChangeText={(text) => setFormData({...formData, rate: text})}
                  placeholder={formData.paymentType === 'per_hour' ? '150' : '200'}
                  keyboardType="numeric"
                />
                <Text style={styles.formHint}>
                  {formData.paymentType === 'per_hour' ? 'Montant par heure' : 'Montant par séance'}
                </Text>
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
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
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
  teacherCard: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
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
  paymentBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentAmount: {
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
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactText: {
    marginLeft: 8,
    color: '#475569',
    fontSize: 14,
    flex: 1,
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
  subjectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subjectBadge: {
    backgroundColor: '#f1f5f9',
  },
  noSubjectsText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
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
  formHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
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
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#000000',
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000000',
  },
  radioText: {
    fontSize: 14,
    color: '#000000',
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

export default TeachersScreen;