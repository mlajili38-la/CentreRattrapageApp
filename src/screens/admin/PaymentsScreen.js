// screens/admin/PaymentsScreen.js
import React, { useState, useEffect, useRef } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import Card from '../../components/common/Card/Card';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

const PaymentsScreen = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [studentPayments, setStudentPayments] = useState([]);
  const [teacherPayments, setTeacherPayments] = useState([]);
  const [filteredStudentPayments, setFilteredStudentPayments] = useState([]);
  const [filteredTeacherPayments, setFilteredTeacherPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // États pour les dropdowns
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  
  // États pour les datepickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPeriodStartPicker, setShowPeriodStartPicker] = useState(false);
  const [showPeriodEndPicker, setShowPeriodEndPicker] = useState(false);

  // Recherche dans les dropdowns
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');

  // Références pour le scrolling
  const scrollViewRef = useRef(null);
  const modalBodyRef = useRef(null);
  const studentDropdownRef = useRef(null);

  // État du formulaire pour les paiements étudiants
  const [studentFormData, setStudentFormData] = useState({
    studentId: '',
    amount: '',
    date: new Date(),
    type: 'monthly',
    method: 'cash',
    status: 'pending',
    notes: '',
  });

  // État du formulaire pour les honoraires enseignants
  const [teacherFormData, setTeacherFormData] = useState({
    teacherId: '',
    amount: '',
    periodStart: new Date(),
    periodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    sessionsCount: '',
    hoursCount: '',
    status: 'pending',
    notes: '',
  });

  // Types et méthodes prédéfinis
  const paymentTypes = [
    { id: 'monthly', label: 'Mensuel' },
    { id: 'session', label: 'Séance' },
    { id: 'registration', label: 'Inscription' },
  ];

  const paymentMethods = [
    { id: 'cash', label: 'Espèces' },
    { id: 'transfer', label: 'Virement' },
    { id: 'card', label: 'Carte' },
    { id: 'check', label: 'Chèque' },
  ];

  const paymentStatuses = [
    { id: 'pending', label: 'En attente' },
    { id: 'paid', label: 'Payé' },
    { id: 'cancelled', label: 'Annulé' },
  ];

  const teacherPaymentStatuses = [
    { id: 'pending', label: 'En attente' },
    { id: 'paid', label: 'Payé' },
  ];

  const periods = [
    { id: 'monthly', label: 'Mensuel' },
    { id: 'quarterly', label: 'Trimestriel' },
    { id: 'semester', label: 'Semestriel' },
    { id: 'annual', label: 'Annuel' },
  ];

  // Filtrer les étudiants pour la recherche
  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Filtrer les enseignants pour la recherche
  const filteredTeachers = teachers.filter(teacher => 
    teacher.name?.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les étudiants
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsList = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsList);
      
      // Charger les enseignants
      const teachersSnapshot = await getDocs(collection(db, 'teachers'));
      const teachersList = teachersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeachers(teachersList);
      
      // Charger les paiements étudiants
      const studentPaymentsSnapshot = await getDocs(collection(db, 'student_payments'));
      const studentPaymentsList = studentPaymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Trier par date (plus récent en premier)
      studentPaymentsList.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB - dateA;
      });
      
      setStudentPayments(studentPaymentsList);
      setFilteredStudentPayments(studentPaymentsList);
      
      // Charger les honoraires enseignants
      const teacherPaymentsSnapshot = await getDocs(collection(db, 'teacher_payments'));
      const teacherPaymentsList = teacherPaymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Trier par date (plus récent en premier)
      teacherPaymentsList.sort((a, b) => {
        const dateA = new Date(a.periodStart || 0);
        const dateB = new Date(b.periodStart || 0);
        return dateB - dateA;
      });
      
      setTeacherPayments(teacherPaymentsList);
      setFilteredTeacherPayments(teacherPaymentsList);
      
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

  // Filtrer les paiements
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudentPayments(studentPayments);
      setFilteredTeacherPayments(teacherPayments);
    } else {
      const query = searchQuery.toLowerCase();
      
      // Filtrer les paiements étudiants
      const filteredStudents = studentPayments.filter(payment => {
        const studentName = getStudentName(payment.studentId) || '';
        return (
          studentName.toLowerCase().includes(query) ||
          payment.type?.toLowerCase().includes(query) ||
          payment.method?.toLowerCase().includes(query) ||
          payment.status?.toLowerCase().includes(query)
        );
      });
      setFilteredStudentPayments(filteredStudents);
      
      // Filtrer les honoraires enseignants
      const filteredTeachers = teacherPayments.filter(payment => {
        const teacherName = getTeacherName(payment.teacherId) || '';
        return (
          teacherName.toLowerCase().includes(query) ||
          payment.status?.toLowerCase().includes(query)
        );
      });
      setFilteredTeacherPayments(filteredTeachers);
    }
  }, [searchQuery, studentPayments, teacherPayments]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Fonctions helper pour obtenir les noms
  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Élève inconnu';
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Enseignant inconnu';
  };

  const getTypeLabel = (typeId) => {
    const type = paymentTypes.find(t => t.id === typeId);
    return type ? type.label : 'Type inconnu';
  };

  const getMethodLabel = (methodId) => {
    const method = paymentMethods.find(m => m.id === methodId);
    return method ? method.label : 'Méthode inconnue';
  };

  const getStatusLabel = (statusId) => {
    const status = paymentStatuses.find(s => s.id === statusId);
    return status ? status.label : 'Statut inconnu';
  };

  const getTeacherStatusLabel = (statusId) => {
    const status = teacherPaymentStatuses.find(s => s.id === statusId);
    return status ? status.label : 'Statut inconnu';
  };

  const getPeriodLabel = (periodId) => {
    const period = periods.find(p => p.id === periodId);
    return period ? period.label : 'Période inconnue';
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formater le montant
  const formatAmount = (amount) => {
    const num = parseFloat(amount || 0);
    if (isNaN(num)) return '0 DT';
    return `${num.toFixed(3)} DT`;
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  // Obtenir la couleur de la méthode
  const getMethodColor = (method) => {
    switch (method) {
      case 'cash': return '#10b981';
      case 'transfer': return '#3b82f6';
      case 'card': return '#8b5cf6';
      case 'check': return '#f59e0b';
      default: return '#64748b';
    }
  };

  // Obtenir la couleur du type
  const getTypeColor = (type) => {
    switch (type) {
      case 'monthly': return '#3b82f6';
      case 'session': return '#8b5cf6';
      case 'registration': return '#10b981';
      default: return '#64748b';
    }
  };

  // Ajouter un paiement
  const handleAddPayment = () => {
    setEditMode(false);
    setCurrentPayment(null);
    setStudentSearch('');
    setTeacherSearch('');
    closeAllDropdowns();
    
    if (activeTab === 'students') {
      setStudentFormData({
        studentId: '',
        amount: '',
        date: new Date(),
        type: 'monthly',
        method: 'cash',
        status: 'pending',
        notes: '',
      });
    } else {
      setTeacherFormData({
        teacherId: '',
        amount: '',
        periodStart: new Date(),
        periodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        sessionsCount: '',
        hoursCount: '',
        status: 'pending',
        notes: '',
      });
    }
    
    setModalVisible(true);
  };

  // Modifier un paiement
  const handleEditPayment = (payment, type) => {
    setEditMode(true);
    setCurrentPayment(payment);
    setStudentSearch('');
    setTeacherSearch('');
    closeAllDropdowns();
    
    if (type === 'student') {
      setStudentFormData({
        studentId: payment.studentId || '',
        amount: payment.amount ? payment.amount.toString() : '',
        date: payment.date ? new Date(payment.date) : new Date(),
        type: payment.type || 'monthly',
        method: payment.method || 'cash',
        status: payment.status || 'pending',
        notes: payment.notes || '',
      });
    } else {
      setTeacherFormData({
        teacherId: payment.teacherId || '',
        amount: payment.amount ? payment.amount.toString() : '',
        periodStart: payment.periodStart ? new Date(payment.periodStart) : new Date(),
        periodEnd: payment.periodEnd ? new Date(payment.periodEnd) : new Date(new Date().setMonth(new Date().getMonth() + 1)),
        sessionsCount: payment.sessionsCount ? payment.sessionsCount.toString() : '',
        hoursCount: payment.hoursCount ? payment.hoursCount.toString() : '',
        status: payment.status || 'pending',
        notes: payment.notes || '',
      });
    }
    
    setModalVisible(true);
  };

  // Gérer les sélections des dropdowns (Étudiants)
  const handleSelectStudent = (studentId) => {
    setStudentFormData({ ...studentFormData, studentId });
    setShowStudentDropdown(false);
    setStudentSearch('');
  };

  const handleSelectType = (type) => {
    setStudentFormData({ ...studentFormData, type });
    setShowTypeDropdown(false);
  };

  const handleSelectMethod = (method) => {
    setStudentFormData({ ...studentFormData, method });
    setShowMethodDropdown(false);
  };

  const handleSelectStatus = (status) => {
    setStudentFormData({ ...studentFormData, status });
    setShowStatusDropdown(false);
  };

  // Gérer les sélections des dropdowns (Enseignants)
  const handleSelectTeacher = (teacherId) => {
    setTeacherFormData({ ...teacherFormData, teacherId });
    setShowTeacherDropdown(false);
    setTeacherSearch('');
  };

  const handleSelectTeacherStatus = (status) => {
    setTeacherFormData({ ...teacherFormData, status });
    setShowStatusDropdown(false);
  };

  const handleSelectPeriod = (period) => {
    setShowPeriodDropdown(false);
    const periodStart = new Date();
    let periodEnd = new Date();
    
    switch (period) {
      case 'monthly':
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        break;
      case 'quarterly':
        periodEnd.setMonth(periodEnd.getMonth() + 3);
        break;
      case 'semester':
        periodEnd.setMonth(periodEnd.getMonth() + 6);
        break;
      case 'annual':
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        break;
    }
    
    setTeacherFormData({ 
      ...teacherFormData, 
      periodStart,
      periodEnd
    });
  };

  // Gérer les datepickers
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setStudentFormData({ ...studentFormData, date: selectedDate });
    }
  };

  const handlePeriodStartChange = (event, selectedDate) => {
    setShowPeriodStartPicker(false);
    if (selectedDate) {
      setTeacherFormData({ ...teacherFormData, periodStart: selectedDate });
    }
  };

  const handlePeriodEndChange = (event, selectedDate) => {
    setShowPeriodEndPicker(false);
    if (selectedDate) {
      setTeacherFormData({ ...teacherFormData, periodEnd: selectedDate });
    }
  };

  // Supprimer un paiement
  const handleDeletePayment = (payment, type) => {
    const collectionName = type === 'student' ? 'student_payments' : 'teacher_payments';
    const label = type === 'student' ? 'ce paiement' : 'cet honoraire';
    
    Alert.alert(
      'Supprimer',
      `Êtes-vous sûr de vouloir supprimer ${label} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, collectionName, payment.id));
              Alert.alert('Succès', 'Suppression effectuée avec succès');
              loadData();
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer');
            }
          }
        }
      ]
    );
  };

  // Soumettre le formulaire
  const handleSubmitStudent = async () => {
    if (!studentFormData.studentId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un élève');
      return;
    }

    if (!studentFormData.amount || parseFloat(studentFormData.amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide');
      return;
    }

    try {
      const paymentData = {
        studentId: studentFormData.studentId,
        amount: parseFloat(studentFormData.amount),
        date: studentFormData.date.toISOString(),
        type: studentFormData.type,
        method: studentFormData.method,
        status: studentFormData.status,
        notes: studentFormData.notes?.trim() || '',
        updatedAt: new Date().toISOString()
      };

      if (editMode && currentPayment) {
        await updateDoc(doc(db, 'student_payments', currentPayment.id), paymentData);
        Alert.alert('Succès', 'Paiement modifié avec succès');
      } else {
        await addDoc(collection(db, 'student_payments'), {
          ...paymentData,
          createdAt: new Date().toISOString(),
        });
        Alert.alert('Succès', 'Paiement ajouté avec succès');
      }

      setModalVisible(false);
      loadData();
      
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handleSubmitTeacher = async () => {
    if (!teacherFormData.teacherId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un enseignant');
      return;
    }

    if (!teacherFormData.amount || parseFloat(teacherFormData.amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide');
      return;
    }

    if (teacherFormData.periodEnd <= teacherFormData.periodStart) {
      Alert.alert('Erreur', 'La date de fin doit être après la date de début');
      return;
    }

    try {
      const paymentData = {
        teacherId: teacherFormData.teacherId,
        amount: parseFloat(teacherFormData.amount),
        periodStart: teacherFormData.periodStart.toISOString(),
        periodEnd: teacherFormData.periodEnd.toISOString(),
        sessionsCount: teacherFormData.sessionsCount ? parseInt(teacherFormData.sessionsCount) : 0,
        hoursCount: teacherFormData.hoursCount ? parseFloat(teacherFormData.hoursCount) : 0,
        status: teacherFormData.status,
        notes: teacherFormData.notes?.trim() || '',
        updatedAt: new Date().toISOString()
      };

      if (editMode && currentPayment) {
        await updateDoc(doc(db, 'teacher_payments', currentPayment.id), paymentData);
        Alert.alert('Succès', 'Honoraire modifié avec succès');
      } else {
        await addDoc(collection(db, 'teacher_payments'), {
          ...paymentData,
          createdAt: new Date().toISOString(),
        });
        Alert.alert('Succès', 'Honoraire ajouté avec succès');
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

  // Fermer tous les dropdowns
  const closeAllDropdowns = () => {
    setShowStudentDropdown(false);
    setShowTeacherDropdown(false);
    setShowTypeDropdown(false);
    setShowMethodDropdown(false);
    setShowStatusDropdown(false);
    setShowPeriodDropdown(false);
    setShowDatePicker(false);
    setShowPeriodStartPicker(false);
    setShowPeriodEndPicker(false);
  };

  // Gérer le clic en dehors du modal
  const handleModalOverlayPress = () => {
    closeAllDropdowns();
    setModalVisible(false);
    setStudentSearch('');
    setTeacherSearch('');
  };

  // Render les items de paiement étudiants
  const renderStudentPaymentItem = ({ item: payment }) => (
    <Card key={payment.id} style={styles.paymentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.paymentInfo}>
          <View style={styles.paymentDate}>
            <Ionicons name="calendar-outline" size={14} color="#64748b" />
            <Text style={styles.dateText}>
              {formatDate(payment.date)}
            </Text>
          </View>
          <Text style={styles.studentName}>
            {getStudentName(payment.studentId)}
          </Text>
        </View>
        <View style={styles.paymentAmount}>
          <Text style={styles.amountText}>
            {formatAmount(payment.amount)}
          </Text>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Type:</Text>
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(payment.type) + '20' }]}>
              <Text style={[styles.typeText, { color: getTypeColor(payment.type) }]}>
                {getTypeLabel(payment.type)}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Méthode:</Text>
            <View style={[styles.methodBadge, { backgroundColor: getMethodColor(payment.method) + '20' }]}>
              <Text style={[styles.methodText, { color: getMethodColor(payment.method) }]}>
                {getMethodLabel(payment.method)}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Statut:</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                {getStatusLabel(payment.status)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* NOTES */}
      {payment.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText} numberOfLines={2}>
            {payment.notes}
          </Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.footerInfo}>
          <Text style={styles.createdAtText}>
            Créé le {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditPayment(payment, 'student')}
          >
            <Ionicons name="create-outline" size={18} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeletePayment(payment, 'student')}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  // Render les items d'honoraires enseignants
  const renderTeacherPaymentItem = ({ item: payment }) => (
    <Card key={payment.id} style={styles.paymentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.paymentInfo}>
          <View style={styles.paymentDate}>
            <Ionicons name="calendar-outline" size={14} color="#64748b" />
            <Text style={styles.dateText}>
              {formatDate(payment.periodStart)} - {formatDate(payment.periodEnd)}
            </Text>
          </View>
          <Text style={styles.teacherName}>
            {getTeacherName(payment.teacherId)}
          </Text>
        </View>
        <View style={styles.paymentAmount}>
          <Text style={styles.amountText}>
            {formatAmount(payment.amount)}
          </Text>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Période:</Text>
            <Text style={styles.detailValue}>
              {formatDate(payment.periodStart)} au {formatDate(payment.periodEnd)}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Séances:</Text>
            <Text style={styles.detailValue}>
              {payment.sessionsCount || 0} séances
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Heures:</Text>
            <Text style={styles.detailValue}>
              {payment.hoursCount || 0} heures
            </Text>
          </View>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.detailLabel}>Statut:</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
              {getTeacherStatusLabel(payment.status)}
            </Text>
          </View>
        </View>
      </View>

      {/* NOTES */}
      {payment.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText} numberOfLines={2}>
            {payment.notes}
          </Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.footerInfo}>
          <Text style={styles.createdAtText}>
            Créé le {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditPayment(payment, 'teacher')}
          >
            <Ionicons name="create-outline" size={18} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeletePayment(payment, 'teacher')}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  // Rendu de l'état vide
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={activeTab === 'students' ? "card-outline" : "cash-outline"} 
        size={60} 
        color="#cbd5e1" 
      />
      <Text style={styles.emptyText}>
        {searchQuery
          ? (activeTab === 'students' 
              ? 'Aucun paiement ne correspond à votre recherche' 
              : 'Aucun honoraire ne correspond à votre recherche')
          : (activeTab === 'students' 
              ? 'Aucun paiement enregistré' 
              : 'Aucun honoraire enregistré')
        }
      </Text>
      {searchQuery && (
        <TouchableOpacity 
          style={styles.clearSearchButton}
          onPress={clearSearch}
        >
          <Text style={styles.clearSearchText}>Effacer la recherche</Text>
        </TouchableOpacity>
      )}
      {(activeTab === 'students' ? studentPayments.length === 0 : teacherPayments.length === 0) && (
        <TouchableOpacity 
          style={styles.addFirstButton}
          onPress={handleAddPayment}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.addFirstButtonText}>
            {activeTab === 'students' 
              ? 'Ajouter le premier paiement' 
              : 'Ajouter le premier honoraire'
            }
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Rendu de la liste principale
  const renderList = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      );
    }

    return (
      <FlatList
        data={activeTab === 'students' ? filteredStudentPayments : filteredTeacherPayments}
        renderItem={activeTab === 'students' ? renderStudentPaymentItem : renderTeacherPaymentItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    );
  };

  // Rendu des options dropdown (remplace FlatList dans le modal)
  const renderDropdownOptions = (options, selectedId, onSelect) => (
    <ScrollView 
      style={styles.dropdownOptionsContainer}
      nestedScrollEnabled={true}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.dropdownItem,
            selectedId === item.id && styles.dropdownItemSelected
          ]}
          onPress={() => onSelect(item.id)}
        >
          <Text style={[
            styles.dropdownItemText,
            selectedId === item.id && styles.dropdownItemTextSelected
          ]}>
            {item.label}
          </Text>
          {selectedId === item.id && (
            <Ionicons name="checkmark" size={18} color="#000000" />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Rendu des options de statut avec couleur
  const renderStatusOptions = (options, selectedId, onSelect) => (
    <ScrollView 
      style={styles.dropdownOptionsContainer}
      nestedScrollEnabled={true}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.dropdownItem,
            selectedId === item.id && styles.dropdownItemSelected
          ]}
          onPress={() => onSelect(item.id)}
        >
          <View style={styles.statusOption}>
            <View style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(item.id) }
            ]} />
            <Text style={[
              styles.dropdownItemText,
              selectedId === item.id && styles.dropdownItemTextSelected
            ]}>
              {item.label}
            </Text>
          </View>
          {selectedId === item.id && (
            <Ionicons name="checkmark" size={18} color="#000000" />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Rendu des personnes (étudiants/enseignants)
  const renderPersonOptions = (persons, selectedId, onSelect, getName) => (
    <ScrollView 
      style={styles.dropdownOptionsContainer}
      nestedScrollEnabled={true}
      keyboardShouldPersistTaps="handled"
    >
      {persons.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.dropdownItem,
            selectedId === item.id && styles.dropdownItemSelected
          ]}
          onPress={() => onSelect(item.id)}
        >
          <Text style={[
            styles.dropdownItemText,
            selectedId === item.id && styles.dropdownItemTextSelected
          ]}>
            {getName(item.id)}
          </Text>
          {selectedId === item.id && (
            <Ionicons name="checkmark" size={18} color="#000000" />
          )}
        </TouchableOpacity>
      ))}
      {persons.length === 0 && (
        <View style={styles.noItemsContainer}>
          <Text style={styles.noItemsText}>Aucun résultat trouvé</Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {activeTab === 'students' ? 'Paiements Élèves' : 'Honoraires Enseignants'}
        </Text>
      </View>

      {/* BARRE DES ONGLETS */}
      <Card style={styles.tabsCard}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'students' && styles.tabButtonActive
            ]}
            onPress={() => setActiveTab('students')}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === 'students' && styles.tabButtonTextActive
            ]}>
              Paiements Élèves
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'teachers' && styles.tabButtonActive
            ]}
            onPress={() => setActiveTab('teachers')}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === 'teachers' && styles.tabButtonTextActive
            ]}>
              Honoraires Enseignants
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* BARRE DE RECHERCHE */}
      <Card style={styles.searchCard}>
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder={activeTab === 'students' ? "Rechercher par élève..." : "Rechercher par enseignant..."}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddPayment}>
            <Ionicons name="add-circle" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </Card>

      {/* LISTE DES PAIEMENTS */}
      {renderList()}

      {/* MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleModalOverlayPress}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleModalOverlayPress}
          >
            <TouchableOpacity 
              style={styles.modalContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editMode ? 'Modifier' : 'Nouveau'} {activeTab === 'students' ? 'paiement' : 'honoraire'}
                </Text>
                <TouchableOpacity onPress={handleModalOverlayPress}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                ref={modalBodyRef}
                style={styles.modalBody}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
                {activeTab === 'students' ? (
                  <>
                    {/* ÉLÈVE */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Élève *</Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => {
                          closeAllDropdowns();
                          setShowStudentDropdown(!showStudentDropdown);
                        }}
                      >
                        <Text 
                          style={[
                            styles.dropdownButtonText,
                            !studentFormData.studentId && styles.placeholderText
                          ]}
                          numberOfLines={1}
                        >
                          {studentFormData.studentId 
                            ? getStudentName(studentFormData.studentId)
                            : 'Sélectionnez un élève'
                          }
                        </Text>
                        <Ionicons 
                          name={showStudentDropdown ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#64748b" 
                        />
                      </TouchableOpacity>
                      
                      {showStudentDropdown && (
                        <View style={[styles.dropdownListContainer, { zIndex: 1000 }]}>
                          <View style={styles.dropdownSearchContainer}>
                            <Ionicons name="search" size={16} color="#64748b" />
                            <TextInput
                              style={styles.dropdownSearchInput}
                              placeholder="Rechercher un élève..."
                              value={studentSearch}
                              onChangeText={setStudentSearch}
                              autoFocus={true}
                            />
                            {studentSearch.length > 0 && (
                              <TouchableOpacity onPress={() => setStudentSearch('')}>
                                <Ionicons name="close-circle" size={16} color="#94a3b8" />
                              </TouchableOpacity>
                            )}
                          </View>
                          
                          {renderPersonOptions(
                            filteredStudents,
                            studentFormData.studentId,
                            handleSelectStudent,
                            getStudentName
                          )}
                        </View>
                      )}
                    </View>

                    {/* MONTANT */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Montant *</Text>
                      <TextInput
                        style={styles.formInput}
                        value={studentFormData.amount}
                        onChangeText={(text) => setStudentFormData({...studentFormData, amount: text.replace(/[^0-9.]/g, '')})}
                        placeholder="Ex: 500.000"
                        keyboardType="decimal-pad"
                      />
                      <Text style={styles.hintText}>Montant en DT (ex: 500.000)</Text>
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
                          {studentFormData.date.toLocaleDateString('fr-FR', {
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
                          value={studentFormData.date}
                          mode="date"
                          display="default"
                          onChange={handleDateChange}
                        />
                      )}
                    </View>

                    {/* TYPE */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Type</Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => {
                          closeAllDropdowns();
                          setShowTypeDropdown(!showTypeDropdown);
                        }}
                      >
                        <Text style={[
                          styles.dropdownButtonText,
                          { color: getTypeColor(studentFormData.type) }
                        ]}>
                          {getTypeLabel(studentFormData.type)}
                        </Text>
                        <Ionicons 
                          name={showTypeDropdown ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#64748b" 
                        />
                      </TouchableOpacity>
                      
                      {showTypeDropdown && (
                        <View style={[styles.dropdownListContainer, { zIndex: 999 }]}>
                          {renderDropdownOptions(
                            paymentTypes,
                            studentFormData.type,
                            handleSelectType
                          )}
                        </View>
                      )}
                    </View>

                    {/* MÉTHODE */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Méthode</Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => {
                          closeAllDropdowns();
                          setShowMethodDropdown(!showMethodDropdown);
                        }}
                      >
                        <Text style={[
                          styles.dropdownButtonText,
                          { color: getMethodColor(studentFormData.method) }
                        ]}>
                          {getMethodLabel(studentFormData.method)}
                        </Text>
                        <Ionicons 
                          name={showMethodDropdown ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#64748b" 
                        />
                      </TouchableOpacity>
                      
                      {showMethodDropdown && (
                        <View style={[styles.dropdownListContainer, { zIndex: 998 }]}>
                          {renderDropdownOptions(
                            paymentMethods,
                            studentFormData.method,
                            handleSelectMethod
                          )}
                        </View>
                      )}
                    </View>

                    {/* STATUT */}
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
                          { color: getStatusColor(studentFormData.status) }
                        ]}>
                          {getStatusLabel(studentFormData.status)}
                        </Text>
                        <Ionicons 
                          name={showStatusDropdown ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#64748b" 
                        />
                      </TouchableOpacity>
                      
                      {showStatusDropdown && (
                        <View style={[styles.dropdownListContainer, { zIndex: 997 }]}>
                          {renderStatusOptions(
                            paymentStatuses,
                            studentFormData.status,
                            handleSelectStatus
                          )}
                        </View>
                      )}
                    </View>

                    {/* NOTES */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Notes (optionnel)</Text>
                      <TextInput
                        style={[styles.formInput, styles.textArea]}
                        value={studentFormData.notes}
                        onChangeText={(text) => setStudentFormData({...studentFormData, notes: text})}
                        placeholder="Notes additionnelles..."
                        multiline
                        numberOfLines={3}
                        maxLength={200}
                      />
                    </View>
                  </>
                ) : (
                  <>
                    {/* ENSEIGNANT */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Enseignant *</Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => {
                          closeAllDropdowns();
                          setShowTeacherDropdown(!showTeacherDropdown);
                        }}
                      >
                        <Text 
                          style={[
                            styles.dropdownButtonText,
                            !teacherFormData.teacherId && styles.placeholderText
                          ]}
                          numberOfLines={1}
                        >
                          {teacherFormData.teacherId 
                            ? getTeacherName(teacherFormData.teacherId)
                            : 'Sélectionnez un enseignant'
                          }
                        </Text>
                        <Ionicons 
                          name={showTeacherDropdown ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#64748b" 
                        />
                      </TouchableOpacity>
                      
                      {showTeacherDropdown && (
                        <View style={[styles.dropdownListContainer, { zIndex: 1000 }]}>
                          <View style={styles.dropdownSearchContainer}>
                            <Ionicons name="search" size={16} color="#64748b" />
                            <TextInput
                              style={styles.dropdownSearchInput}
                              placeholder="Rechercher un enseignant..."
                              value={teacherSearch}
                              onChangeText={setTeacherSearch}
                              autoFocus={true}
                            />
                            {teacherSearch.length > 0 && (
                              <TouchableOpacity onPress={() => setTeacherSearch('')}>
                                <Ionicons name="close-circle" size={16} color="#94a3b8" />
                              </TouchableOpacity>
                            )}
                          </View>
                          
                          {renderPersonOptions(
                            filteredTeachers,
                            teacherFormData.teacherId,
                            handleSelectTeacher,
                            getTeacherName
                          )}
                        </View>
                      )}
                    </View>

                    {/* MONTANT */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Montant *</Text>
                      <TextInput
                        style={styles.formInput}
                        value={teacherFormData.amount}
                        onChangeText={(text) => setTeacherFormData({...teacherFormData, amount: text.replace(/[^0-9.]/g, '')})}
                        placeholder="Ex: 3000.000"
                        keyboardType="decimal-pad"
                      />
                      <Text style={styles.hintText}>Montant en DT (ex: 3000.000)</Text>
                    </View>

                    {/* PÉRIODE DE DÉBUT */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Période de début *</Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => {
                          closeAllDropdowns();
                          setShowPeriodStartPicker(true);
                        }}
                      >
                        <Text style={styles.dropdownButtonText}>
                          {teacherFormData.periodStart.toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color="#64748b" />
                      </TouchableOpacity>
                      
                      {showPeriodStartPicker && (
                        <DateTimePicker
                          value={teacherFormData.periodStart}
                          mode="date"
                          display="default"
                          onChange={handlePeriodStartChange}
                        />
                      )}
                    </View>

                    {/* PÉRIODE DE FIN */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Période de fin *</Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => {
                          closeAllDropdowns();
                          setShowPeriodEndPicker(true);
                        }}
                      >
                        <Text style={styles.dropdownButtonText}>
                          {teacherFormData.periodEnd.toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color="#64748b" />
                      </TouchableOpacity>
                      
                      {showPeriodEndPicker && (
                        <DateTimePicker
                          value={teacherFormData.periodEnd}
                          mode="date"
                          display="default"
                          onChange={handlePeriodEndChange}
                        />
                      )}
                    </View>

                    {/* SÉANCES */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Nombre de séances (optionnel)</Text>
                      <TextInput
                        style={styles.formInput}
                        value={teacherFormData.sessionsCount}
                        onChangeText={(text) => setTeacherFormData({...teacherFormData, sessionsCount: text.replace(/[^0-9]/g, '')})}
                        placeholder="Ex: 12"
                        keyboardType="number-pad"
                      />
                    </View>

                    {/* HEURES */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Nombre d'heures (optionnel)</Text>
                      <TextInput
                        style={styles.formInput}
                        value={teacherFormData.hoursCount}
                        onChangeText={(text) => setTeacherFormData({...teacherFormData, hoursCount: text.replace(/[^0-9.]/g, '')})}
                        placeholder="Ex: 24.5"
                        keyboardType="decimal-pad"
                      />
                    </View>

                    {/* STATUT */}
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
                          { color: getStatusColor(teacherFormData.status) }
                        ]}>
                          {getTeacherStatusLabel(teacherFormData.status)}
                        </Text>
                        <Ionicons 
                          name={showStatusDropdown ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#64748b" 
                        />
                      </TouchableOpacity>
                      
                      {showStatusDropdown && (
                        <View style={[styles.dropdownListContainer, { zIndex: 996 }]}>
                          {renderStatusOptions(
                            teacherPaymentStatuses,
                            teacherFormData.status,
                            handleSelectTeacherStatus
                          )}
                        </View>
                      )}
                    </View>

                    {/* NOTES */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Notes (optionnel)</Text>
                      <TextInput
                        style={[styles.formInput, styles.textArea]}
                        value={teacherFormData.notes}
                        onChangeText={(text) => setTeacherFormData({...teacherFormData, notes: text})}
                        placeholder="Notes additionnelles..."
                        multiline
                        numberOfLines={3}
                        maxLength={200}
                      />
                    </View>
                  </>
                )}
              </ScrollView>

              {/* BOUTONS DU MODAL */}
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleModalOverlayPress}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.submitButton,
                    (activeTab === 'students' 
                      ? (!studentFormData.studentId || !studentFormData.amount)
                      : (!teacherFormData.teacherId || !teacherFormData.amount)
                    ) && styles.submitButtonDisabled
                  ]}
                  onPress={activeTab === 'students' ? handleSubmitStudent : handleSubmitTeacher}
                  disabled={activeTab === 'students' 
                    ? (!studentFormData.studentId || !studentFormData.amount)
                    : (!teacherFormData.teacherId || !teacherFormData.amount)
                  }
                >
                  <Text style={styles.submitButtonText}>
                    {editMode ? 'Modifier' : 'Ajouter'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
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
  tabsCard: {
    margin: 16,
    marginBottom: 8,
    padding: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  tabButtonActive: {
    backgroundColor: '#000000',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  searchCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
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
  listContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  paymentCard: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  teacherName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  paymentAmount: {
    marginLeft: 12,
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  paymentDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
    minWidth: '30%',
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '500',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  methodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  methodText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notesSection: {
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerInfo: {
    flex: 1,
  },
  createdAtText: {
    fontSize: 10,
    color: '#94a3b8',
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
  emptyState: {
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
    minHeight: 50,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
    marginRight: 8,
  },
  placeholderText: {
    color: '#94a3b8',
  },
  dropdownListContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  dropdownSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#000000',
    minHeight: 30,
  },
  dropdownOptionsContainer: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    minHeight: 50,
  },
  dropdownItemSelected: {
    backgroundColor: '#f8fafc',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
    marginRight: 8,
  },
  dropdownItemTextSelected: {
    fontWeight: '600',
  },
  noItemsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noItemsText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
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

export default PaymentsScreen;