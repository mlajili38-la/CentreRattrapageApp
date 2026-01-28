// screens/student/StudentPaymentsScreen.js - VERSION CARTES GRANDES
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { StudentService } from '../../services/studentService';
import Card from '../../components/common/Card/Card';
import Badge from '../../components/common/Badge/Badge';
import Button from '../../components/common/Button/Button';

const StudentPaymentsScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalAmount: 0,
    pendingCount: 0
  });
  
  // État pour le modal de paiement
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    amount: '',
    notes: ''
  });
  const [processingPayment, setProcessingPayment] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('💰 Chargement des paiements pour:', user?.email);
      
      if (!user?.email) {
        throw new Error('Utilisateur non connecté');
      }

      // 1. Charger les informations de l'étudiant
      const student = await StudentService.getStudentByEmail(user.email);
      
      if (!student) {
        throw new Error('Élève non trouvé');
      }

      setStudentInfo(student);
      console.log('✅ Étudiant trouvé:', student.name);

      // 2. Charger les paiements
      const paymentsData = await StudentService.getStudentPayments(student.id);
      console.log('📊 Paiements chargés:', paymentsData.length);
      
      // Trier par date (plus récent en premier)
      const sortedPayments = paymentsData.sort((a, b) => {
        const dateA = a.paymentDate || a.dueDate || new Date(0);
        const dateB = b.paymentDate || b.dueDate || new Date(0);
        return new Date(dateB) - new Date(dateA);
      });
      
      setPayments(sortedPayments);

      // 3. Calculer les statistiques
      const paidPayments = sortedPayments.filter(p => p.status === 'paid');
      const pendingPayments = sortedPayments.filter(p => p.status === 'pending');
      
      const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalAmount = sortedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      setStats({
        totalPaid,
        totalPending,
        totalAmount,
        pendingCount: pendingPayments.length
      });
      
    } catch (error) {
      console.error('❌ Erreur chargement paiements:', error);
      
      // Données de secours pour le développement
      const fallbackPayments = [
        {
          id: 'pay-1',
          month: 'Janvier 2024',
          amount: 280,
          status: 'paid',
          method: 'Carte bancaire',
          description: 'Mensualité de janvier',
          paymentDate: new Date(2024, 0, 10),
          dueDate: new Date(2024, 0, 5),
          type: 'Mensualité',
          invoiceNumber: 'INV-2024-001',
          notes: 'Paiement effectué en ligne'
        },
        {
          id: 'pay-2',
          month: 'Février 2024',
          amount: 280,
          status: 'pending',
          method: null,
          description: 'Mensualité de février',
          paymentDate: null,
          dueDate: new Date(2024, 1, 5),
          type: 'Mensualité',
          invoiceNumber: 'INV-2024-002',
          notes: 'En attente de paiement'
        },
        {
          id: 'pay-3',
          month: 'Mars 2024',
          amount: 280,
          status: 'paid',
          method: 'Espèces',
          description: 'Mensualité de mars',
          paymentDate: new Date(2024, 2, 8),
          dueDate: new Date(2024, 2, 5),
          type: 'Mensualité',
          invoiceNumber: 'INV-2024-003',
          notes: 'Paiement en espèces à l\'accueil'
        },
        {
          id: 'pay-4',
          month: 'Avril 2024',
          amount: 300,
          status: 'paid',
          method: 'Virement bancaire',
          description: 'Mensualité avec frais de retard',
          paymentDate: new Date(2024, 3, 12),
          dueDate: new Date(2024, 3, 5),
          type: 'Mensualité',
          invoiceNumber: 'INV-2024-004',
          notes: 'Frais de retard inclus'
        }
      ];
      
      setPayments(fallbackPayments);
      setStats({
        totalPaid: 860,
        totalPending: 280,
        totalAmount: 1140,
        pendingCount: 1
      });
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatCurrency = (amount) => {
    return `${amount?.toFixed(0) || '0'} TND`;
  };

  const formatDate = (date) => {
    if (!date) return '--/--/----';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString('fr-FR');
    } catch {
      return '--/--/----';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'paid': return 'Payé';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  const getMethodIcon = (method) => {
    switch(method?.toLowerCase()) {
      case 'carte bancaire': return 'card-outline';
      case 'espèces': return 'cash-outline';
      case 'virement bancaire': return 'bank-outline';
      case 'chèque': return 'document-text-outline';
      default: return 'card-outline';
    }
  };

  const getMethodColor = (method) => {
    switch(method?.toLowerCase()) {
      case 'carte bancaire': return '#2196F3';
      case 'espèces': return '#4CAF50';
      case 'virement bancaire': return '#9C27B0';
      case 'chèque': return '#FF9800';
      default: return '#6B7280';
    }
  };

  // Gestion du formulaire de paiement
  const handlePaymentFormChange = (field, value) => {
    setPaymentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePayNow = () => {
    // Montant minimum pour le prochain paiement en attente
    const nextPendingPayment = payments.find(p => p.status === 'pending');
    if (nextPendingPayment) {
      setPaymentForm(prev => ({
        ...prev,
        amount: nextPendingPayment.amount.toString()
      }));
    }
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    // Validation
    if (!paymentForm.cardNumber.trim() || paymentForm.cardNumber.length !== 16) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de carte valide (16 chiffres)');
      return;
    }
    
    if (!paymentForm.expiryDate.match(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)) {
      Alert.alert('Erreur', 'Format de date d\'expiration invalide (MM/AA)');
      return;
    }
    
    if (!paymentForm.cvv.trim() || paymentForm.cvv.length !== 3) {
      Alert.alert('Erreur', 'Code CVV invalide (3 chiffres)');
      return;
    }
    
    if (!paymentForm.amount.trim() || parseFloat(paymentForm.amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    setProcessingPayment(true);
    
    // Simuler un traitement de paiement
    setTimeout(() => {
      setProcessingPayment(false);
      setShowPaymentModal(false);
      
      Alert.alert(
        'Paiement réussi !',
        `Votre paiement de ${formatCurrency(parseFloat(paymentForm.amount))} a été traité avec succès.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Réinitialiser le formulaire
              setPaymentForm({
                cardNumber: '',
                expiryDate: '',
                cvv: '',
                amount: '',
                notes: ''
              });
              // Recharger les données
              loadData();
            }
          }
        ]
      );
    }, 2000);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Paiements</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec bouton + */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Paiements</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handlePayNow}
          >
            <Ionicons name="add-circle" size={28} color="#000000" />
          </TouchableOpacity>
        </View>
        {studentInfo && (
          <Text style={styles.studentName}>{studentInfo.name}</Text>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Statistiques rapides - CARTE PLUS GRANDE */}
        <View style={styles.statsSection}>
          <Card style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <View style={styles.statsTitleContainer}>
                <View style={styles.statsIconContainer}>
                  <Ionicons name="stats-chart" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.statsTitle}>Statistiques des paiements</Text>
              </View>
             
            </View>
            
            {/* Statistiques principales - PLUS GRANDES */}
            <View style={styles.mainStats}>
              <View style={styles.statColumn}>
                <Text style={styles.statNumber}>{formatCurrency(stats.totalAmount)}</Text>
                <Text style={styles.statLabel}>TOTAL GÉNÉRAL</Text>
              </View>
              
              <View style={styles.statColumn}>
                <Text style={[styles.statNumber, { color: '#10B981' }]}>{formatCurrency(stats.totalPaid)}</Text>
                <Text style={styles.statLabel}>PAYÉ</Text>
              </View>
              
              <View style={styles.statColumn}>
                <Text style={[styles.statNumber, { color: '#f07d0a' }]}>{formatCurrency(stats.totalPending)}</Text>
                <Text style={styles.statLabel}>EN ATTENTE</Text>
              </View>
            </View>
            
            {/* Barre de progression - PLUS GRANDE */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>Taux de paiement</Text>
                <Text style={styles.progressPercent}>
                  {stats.totalAmount > 0 ? Math.round((stats.totalPaid / stats.totalAmount) * 100) : 0}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${stats.totalAmount > 0 ? (stats.totalPaid / stats.totalAmount) * 100 : 0}%`,
                      backgroundColor: stats.totalAmount > 0 && (stats.totalPaid / stats.totalAmount) >= 0.8 ? '#10B981' : 
                                     stats.totalAmount > 0 && (stats.totalPaid / stats.totalAmount) >= 0.6 ? '#F59E0B' : '#08bd14'
                    }
                  ]} 
                />
              </View>
            </View>
          </Card>
        </View>

        {/* Bouton Payer maintenant si paiements en attente */}
        {stats.pendingCount > 0 && (
          <TouchableOpacity 
            style={styles.payNowButton}
            onPress={handlePayNow}
          >
            <View style={styles.payNowContent}>
              <View style={styles.payNowIcon}>
                <Ionicons name="flash" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.payNowText}>
                <Text style={styles.payNowTitle}>
                  {stats.pendingCount} paiement{stats.pendingCount > 1 ? 's' : ''} en attente
                </Text>
                <Text style={styles.payNowSubtitle}>
                  Total: {formatCurrency(stats.totalPending)} • Payer maintenant
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}

        {/* Historique des paiements */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historique des paiements</Text>
          <Badge 
            text={`${payments.length} paiements`}
            backgroundColor="#EDE9FE"
            textColor="#000000"
            size="medium"
          />
        </View>
        
        {payments.length > 0 ? (
          payments.map((payment, index) => (
            <Card key={payment.id || index} style={styles.paymentCard}>
              {/* En-tête avec statut - PLUS GRAND */}
              <View style={styles.paymentHeader}>
                <View style={styles.paymentTitleRow}>
                  <View style={[
                    styles.paymentStatusIndicator,
                    { backgroundColor: getStatusColor(payment.status) }
                  ]} />
                  <Text style={styles.paymentMonth}>{payment.month}</Text>
                  <View style={styles.paymentType}>
                    <Badge 
                      text={payment.type || 'Mensualité'}
                      backgroundColor="#E0F2FE"
                      textColor="#0EA5E9"
                      size="medium"
                    />
                  </View>
                </View>
                
                <View style={styles.paymentAmountRow}>
                  <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                  <Badge 
                    text={getStatusText(payment.status)}
                    backgroundColor={payment.status === 'paid' ? '#D1FAE5' : '#FEF3C7'}
                    textColor={payment.status === 'paid' ? '#065F46' : '#92400E'}
                    size="medium"
                  />
                </View>
              </View>
              
              {/* Détails en grille - PLUS GRANDS */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailColumn}>
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons name="calendar-outline" size={18} color="#000000" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>DATE</Text>
                      <Text style={styles.detailValue}>
                        {payment.status === 'paid' 
                          ? `Payé le ${formatDate(payment.paymentDate)}`
                          : `Dû le ${formatDate(payment.dueDate)}`
                        }
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons name="card-outline" size={18} color="#070708" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>MÉTHODE</Text>
                      <Text style={styles.detailValue}>
                        {payment.method || 'Non spécifiée'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.detailColumn}>
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons name="document-text-outline" size={18} color="#0a090a" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>FACTURE</Text>
                      <Text style={styles.detailValue}>
                        {payment.invoiceNumber || `INV-${index + 1}`}
                      </Text>
                    </View>
                  </View>
                  
                  {payment.notes && (
                    <View style={styles.detailItem}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="chatbubble-outline" size={18} color="#000000" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>NOTES</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>
                          {payment.notes}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
              
              {/* Bouton d'action - PLUS GRAND */}
              {payment.status === 'pending' && (
                <TouchableOpacity 
                  style={styles.payButton}
                  onPress={() => {
                    setPaymentForm(prev => ({
                      ...prev,
                      amount: payment.amount.toString()
                    }));
                    setShowPaymentModal(true);
                  }}
                >
                  <View style={styles.payButtonContent}>
                    <Ionicons name="card" size={20} color="#FFFFFF" />
                    <Text style={styles.payButtonText}>Payer maintenant</Text>
                  </View>
                </TouchableOpacity>
              )}
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="receipt-outline" size={60} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>Aucun paiement enregistré</Text>
              <Text style={styles.emptyText}>
                Votre historique de paiements apparaîtra ici.
              </Text>
            </View>
          </Card>
        )}

        
      </ScrollView>

      {/* Modal de paiement par carte */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {/* En-tête du modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Paiement par carte</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {/* Montant */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Montant à payer (TND)</Text>
                <View style={styles.amountInput}>
                  <TextInput
                    style={styles.input}
                    value={paymentForm.amount}
                    onChangeText={(text) => handlePaymentFormChange('amount', text)}
                    placeholder="280"
                    keyboardType="numeric"
                    editable={!processingPayment}
                  />
                  <Text style={styles.currency}>TND</Text>
                </View>
              </View>

              {/* Numéro de carte */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Numéro de carte</Text>
                <View style={styles.cardInput}>
                  <Ionicons name="card" size={20} color="#6366F1" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.cardNumberInput]}
                    value={paymentForm.cardNumber}
                    onChangeText={(text) => handlePaymentFormChange('cardNumber', text.replace(/\D/g, '').slice(0, 16))}
                    placeholder="1234 5678 9012 3456"
                    keyboardType="numeric"
                    maxLength={16}
                    editable={!processingPayment}
                  />
                </View>
              </View>

              {/* Date d'expiration et CVV */}
              <View style={styles.rowGroup}>
                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.formLabel}>Date d'expiration (MM/AA)</Text>
                  <TextInput
                    style={styles.input}
                    value={paymentForm.expiryDate}
                    onChangeText={(text) => handlePaymentFormChange('expiryDate', text)}
                    placeholder="12/25"
                    maxLength={5}
                    editable={!processingPayment}
                  />
                </View>

                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={styles.formLabel}>Code CVV</Text>
                  <TextInput
                    style={styles.input}
                    value={paymentForm.cvv}
                    onChangeText={(text) => handlePaymentFormChange('cvv', text.replace(/\D/g, '').slice(0, 3))}
                    placeholder="123"
                    keyboardType="numeric"
                    maxLength={3}
                    secureTextEntry
                    editable={!processingPayment}
                  />
                </View>
              </View>

              {/* Notes */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes (optionnel)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={paymentForm.notes}
                  onChangeText={(text) => handlePaymentFormChange('notes', text)}
                  placeholder="Ajouter une note..."
                  multiline
                  numberOfLines={3}
                  editable={!processingPayment}
                />
              </View>

              {/* Sécurité */}
              <View style={styles.securityInfo}>
                <Ionicons name="shield-checkmark" size={20} color="#000000" />
                <Text style={styles.securityText}>
                  Paiement sécurisé par cryptage SSL
                </Text>
              </View>
            </ScrollView>

            {/* Boutons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowPaymentModal(false)}
                disabled={processingPayment}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.confirmButton, processingPayment && styles.disabledButton]}
                onPress={processPayment}
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
                    <Text style={styles.confirmButtonText}>
                      Payer {formatCurrency(parseFloat(paymentForm.amount) || 0)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  addButton: {
    width: 36,
    height: 36,
    padding: 4,
  },
  studentName: {
    fontSize: 16,
    color: '#6B7280',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  // Carte des statistiques - PLUS GRANDE
  statsSection: {
    padding: 20,
  },
  statsCard: {
    padding: 24,
    borderRadius: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  statsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  mainStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  payNowButton: {
    backgroundColor: '#000000',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    padding: 20,
  },
  payNowContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payNowIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  payNowText: {
    flex: 1,
  },
  payNowTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  payNowSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  // Cartes de paiement - PLUS GRANDES
  paymentCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  paymentHeader: {
    marginBottom: 20,
  },
  paymentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentStatusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  paymentMonth: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  paymentType: {
    marginLeft: 8,
  },
  paymentAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  detailsGrid: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  detailColumn: {
    flex: 1,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  payButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 8,
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  emptyCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 40,
    alignItems: 'center',
    borderRadius: 16,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 32,
    padding: 24,
    borderRadius: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Styles pour le modal
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modalScrollView: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  amountInput: {
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
  },
  currency: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
  cardInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    marginRight: 8, 
  },
  cardNumberInput: {
    flex: 1,  
  },
  input: {
    flex: 1,  
    height: 44,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fafcff',
    borderColor: '#565658',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,

  },
  rowGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: (width - 72) / 2,
  },
  textArea: {
    height: 80, 
    textAlignVertical: 'top',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#10B981',
    marginLeft: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',

    color: '#6B7280',
  },
  confirmButton: {
    backgroundColor: '#000000',
    marginLeft: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#A5B4FC',
  },
});
export default StudentPaymentsScreen;
