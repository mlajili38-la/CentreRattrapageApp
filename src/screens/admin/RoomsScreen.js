// screens/admin/RoomsScreen.js
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

const RoomsScreen = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    equipment: '',
  });

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les salles depuis Firestore
      const roomsSnapshot = await getDocs(collection(db, 'rooms'));
      const roomsList = roomsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          capacity: data.capacity || 0,
          equipment: data.equipment || '', // Assure une valeur par défaut
          status: data.status || 'available',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || null,
        };
      });
      
      // Trier les salles par nom
      roomsList.sort((a, b) => a.name.localeCompare(b.name));
      
      setRooms(roomsList);
      setFilteredRooms(roomsList);
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger les salles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrer les salles
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRooms(rooms);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = rooms.filter(room => {
        const roomName = room.name || '';
        const roomEquipment = room.equipment || '';
        return (
          roomName.toLowerCase().includes(query) ||
          roomEquipment.toLowerCase().includes(query)
        );
      });
      setFilteredRooms(filtered);
    }
  }, [searchQuery, rooms]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Ajouter une salle
  const handleAddRoom = () => {
    setEditMode(false);
    setCurrentRoom(null);
    setFormData({
      name: '',
      capacity: '',
      equipment: '',
    });
    setModalVisible(true);
  };

  // Modifier une salle
  const handleEditRoom = (room) => {
    setEditMode(true);
    setCurrentRoom(room);
    setFormData({
      name: room.name || '',
      capacity: room.capacity ? room.capacity.toString() : '',
      equipment: room.equipment || '', // Assure une valeur par défaut
    });
    setModalVisible(true);
  };

  // Supprimer une salle
  const handleDeleteRoom = (room) => {
    Alert.alert(
      'Supprimer la salle',
      `Êtes-vous sûr de vouloir supprimer "${room.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'rooms', room.id));
              Alert.alert('Succès', 'Salle supprimée avec succès');
              loadData();
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la salle');
            }
          }
        }
      ]
    );
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    const name = formData.name?.trim() || '';
    const capacityStr = formData.capacity?.trim() || '';
    const equipment = formData.equipment?.trim() || '';

    if (!name) {
      Alert.alert('Erreur', 'Veuillez saisir le nom de la salle');
      return;
    }

    if (!capacityStr) {
      Alert.alert('Erreur', 'Veuillez saisir la capacité');
      return;
    }

    // Valider la capacité
    const capacity = parseInt(capacityStr);
    if (isNaN(capacity) || capacity <= 0) {
      Alert.alert('Erreur', 'La capacité doit être un nombre positif');
      return;
    }

    try {
      const roomData = {
        name: name,
        capacity: capacity,
        equipment: equipment,
        updatedAt: new Date().toISOString()
      };

      if (editMode && currentRoom) {
        await updateDoc(doc(db, 'rooms', currentRoom.id), roomData);
        Alert.alert('Succès', 'Salle modifiée avec succès');
      } else {
        await addDoc(collection(db, 'rooms'), {
          ...roomData,
          createdAt: new Date().toISOString(),
          status: 'available'
        });
        Alert.alert('Succès', 'Salle ajoutée avec succès');
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

  // Formater l'affichage des équipements
  const formatEquipment = (equipment) => {
    // Vérifier si equipment est défini et est une string
    if (!equipment || typeof equipment !== 'string' || equipment.trim() === '') {
      return 'Aucun équipement';
    }
    
    // Séparer par virgules et limiter à 3 éléments
    const items = equipment.split(',').map(item => item.trim()).filter(item => item);
    if (items.length === 0) return 'Aucun équipement';
    
    if (items.length <= 3) {
      return items.join(', ');
    }
    
    return `${items.slice(0, 3).join(', ')}...`;
  };

  return (
    <View style={styles.container}>
      {/* HEADER AVEC TITRE ET BOUTON AJOUTER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}> Listes des Salles ({filteredRooms.length})</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddRoom}>
          <Ionicons name="add-circle" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* BARRE DE RECHERCHE SIMPLE */}
      <Card style={styles.searchCard}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une salle ou équipement..."
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

      {/* LISTE DES SALLES EN CARTES */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : filteredRooms.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={60} color="#cbd5e1" />
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'Aucune salle ne correspond à votre recherche' 
              : 'Aucune salle enregistrée'}
          </Text>
          {searchQuery && (
            <TouchableOpacity 
              style={styles.clearSearchButton}
              onPress={clearSearch}
            >
              <Text style={styles.clearSearchText}>Effacer la recherche</Text>
            </TouchableOpacity>
          )}
          {rooms.length === 0 && (
            <TouchableOpacity 
              style={styles.addFirstButton}
              onPress={handleAddRoom}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text style={styles.addFirstButtonText}>Ajouter la première salle</Text>
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
          {filteredRooms.map((room) => (
            <Card key={room.id} style={styles.roomCard}>
              {/* EN-TÊTE DE LA CARTE */}
              <View style={styles.cardHeader}>
                <View style={styles.roomInfo}>
                  <Text style={styles.roomName}>{room.name || 'Salle sans nom'}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.capacityBadge}>
                      <Ionicons name="people-outline" size={14} color="#3b82f6" />
                      <Text style={styles.capacityText}>
                        {room.capacity || 0} places
                      </Text>
                    </View>
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: (room.status || 'available') === 'available' ? '#10b981' : '#ef4444' }
                    ]} />
                    <Text style={[
                      styles.statusText,
                      { color: (room.status || 'available') === 'available' ? '#10b981' : '#ef4444' }
                    ]}>
                      {(room.status || 'available') === 'available' ? 'Disponible' : 'Occupée'}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleEditRoom(room)}
                  >
                    <Ionicons name="create-outline" size={18} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteRoom(room)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ÉQUIPEMENTS */}
              <View style={styles.equipmentSection}>
                <View style={styles.equipmentHeader}>
                  <Ionicons name="hardware-chip-outline" size={16} color="#64748b" />
                  <Text style={styles.equipmentTitle}>Équipements:</Text>
                </View>
                <Text style={styles.equipmentText}>
                  {formatEquipment(room.equipment)}
                </Text>
              </View>

              {/* INFORMATIONS SUPPLÉMENTAIRES */}
              <View style={styles.detailsSection}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
                    <Text style={styles.detailText}>
                      Créée le {room.createdAt ? new Date(room.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                    </Text>
                  </View>
                  {room.updatedAt && room.updatedAt !== room.createdAt && (
                    <View style={styles.detailItem}>
                      <Ionicons name="refresh-outline" size={14} color="#94a3b8" />
                      <Text style={styles.detailText}>
                        Modifiée le {new Date(room.updatedAt).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* MODAL POUR AJOUTER/MODIFIER UNE SALLE */}
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
                {editMode ? 'Modifier la salle' : 'Nouvelle salle'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* NOM DE LA SALLE */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nom de la salle *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                  placeholder="Ex: Salle 101, Amphithéâtre A, Labo Informatique"
                  autoCapitalize="words"
                  maxLength={50}
                />
              </View>

              {/* CAPACITÉ */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Capacité *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.capacity}
                  onChangeText={(text) => setFormData({...formData, capacity: text.replace(/[^0-9]/g, '')})}
                  placeholder="Nombre de places"
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <Text style={styles.hintText}>
                  Nombre maximum de personnes
                </Text>
              </View>

              {/* ÉQUIPEMENTS */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Équipements</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.equipment || ''}
                  onChangeText={(text) => setFormData({...formData, equipment: text})}
                  placeholder="Ex: Projecteur, Tableaux, Ordinateurs, Micros..."
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                />
                <Text style={styles.hintText}>
                  Séparez les équipements par des virgules
                </Text>
              </View>

              {/* INDICATEUR DE PRÉVISUALISATION */}
              {(formData.name || formData.capacity || formData.equipment) && (
                <Card style={styles.previewCard}>
                  <Text style={styles.previewTitle}>Aperçu:</Text>
                  <View style={styles.previewContent}>
                    {formData.name ? (
                      <Text style={styles.previewName}>{formData.name}</Text>
                    ) : (
                      <Text style={styles.previewPlaceholder}>Nom de la salle</Text>
                    )}
                    
                    <View style={styles.previewDetails}>
                      {formData.capacity ? (
                        <View style={styles.previewBadge}>
                          <Ionicons name="people-outline" size={14} color="#3b82f6" />
                          <Text style={styles.previewBadgeText}>
                            {formData.capacity} places
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.previewPlaceholder}>Capacité</Text>
                      )}
                    </View>
                    
                    {formData.equipment ? (
                      <View style={styles.previewEquipment}>
                        <Text style={styles.previewEquipmentText} numberOfLines={2}>
                          {formatEquipment(formData.equipment)}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.previewPlaceholder}>Équipements</Text>
                    )}
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
                  (!formData.name || !formData.capacity) && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={!formData.name || !formData.capacity}
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
  roomCard: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  capacityText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  equipmentSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  equipmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  equipmentTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  equipmentText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  detailsSection: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
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
  previewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  previewBadgeText: {
    fontSize: 13,
    color: '#1e40af',
    fontWeight: '600',
  },
  previewEquipment: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  previewEquipmentText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
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

export default RoomsScreen;