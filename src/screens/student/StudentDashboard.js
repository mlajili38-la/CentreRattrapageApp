// screens/student/StudentDashboard.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/common/Card/Card';
import Badge from '../../components/common/Badge/Badge';

const StudentDashboard = ({ 
  studentData, 
  refreshing, 
  onRefresh, 
  onNavigate,
  formatDate 
}) => {
  if (!studentData) return null;

  // Calcul des statistiques
  const totalPaid = studentData?.payments
    ?.filter(p => p.status === 'paid')
    ?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  const pendingPayments = studentData?.payments?.filter(p => p.status === 'pending') || [];
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const formatCurrency = (amount) => {
    return `${amount?.toFixed(0) || '0'} TND`;
  };

  // Cartes de navigation
  const dashboardCards = [
    {
      id: 'calendar',
      title: 'Séances',
      count: studentData?.sessions?.length || studentData?.attendanceStats?.total || 0,
      icon: 'calendar-outline',
      color: '#2196F3', // Bleu
      tabId: 'calendar'
    },
    {
      id: 'grades',
      title: 'Présence',
      count: `${studentData?.attendanceStats?.percentage || 0}%`,
      icon: 'checkmark-circle-outline',
      color: '#FF9800', // Orange
      tabId: 'grades'
    },
    {
      id: 'payments',
      title: 'Paiements',
      count: studentData?.payments?.length || 0,
      icon: 'cash-outline',
      color: '#9C27B0', // Violet
      tabId: 'payments'
    },
    {
      id: 'groups',
      title: 'Groupes',
      count: studentData?.groups?.length || 0,
      icon: 'people-outline',
      color: '#4CAF50', // Vert
      tabId: 'dashboard' // Reste sur le dashboard pour l'instant
    },
  ];

  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Student Info Card */}
      <Card style={styles.studentInfoCard}>
        <View style={styles.studentHeader}>
          <View style={[styles.avatar, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="person" size={32} color="#1976D2" />
          </View>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>
              {studentData?.studentInfo?.name || 'Nom non disponible'}
            </Text>
            <Text style={styles.studentEmail}>
              {studentData?.studentInfo?.email || 'Email non disponible'}
            </Text>
            <View style={styles.levelBadge}>
              <Badge 
                text={studentData?.studentInfo?.levelCode || 'Niveau'}
                backgroundColor="#E8F5E9" // Vert clair
                textColor="#2E7D32" // Vert foncé
                size="small"
              />
            </View>
          </View>
        </View>

        <View style={styles.studentDetails}>
          <Text style={styles.welcomeText}>
            Bonjour 👋 Suivez votre progression et vos activités
          </Text>
        </View>
      </Card>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {dashboardCards.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={styles.statCard}
            onPress={() => onNavigate(card.tabId)}
          >
            <View style={[styles.statIconContainer, { backgroundColor: `${card.color}15` }]}>
              <Ionicons name={card.icon} size={24} color={card.color} />
            </View>
            <Text style={styles.statNumber}>
              {card.count}
            </Text>
            <Text style={styles.statLabel}>{card.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pending Payments Alert */}
      {pendingPayments.length > 0 && (
        <TouchableOpacity 
          style={styles.alertCard}
          onPress={() => onNavigate('payments')}
        >
          <View style={styles.alertHeader}>
            <Ionicons name="warning-outline" size={20} color="#8B4513" />
            <Text style={styles.alertTitle}>
              {pendingPayments.length} paiement(s) en attente
            </Text>
          </View>
          <Text style={styles.alertAmount}>
            Montant total: {formatCurrency(pendingAmount)}
          </Text>
        </TouchableOpacity>
      )}

      {/* Derniers paiements */}
      {studentData?.payments && studentData.payments.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Derniers paiements</Text>
            <TouchableOpacity onPress={() => onNavigate('payments')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {studentData.payments.slice(0, 2).map((payment, index) => (
            <Card key={payment.id || index} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentMonth}>
                  {payment.month || payment.description || 'Paiement'}
                </Text>
                <Badge 
                  text={payment.status === 'paid' ? 'Payé' : 'En attente'}
                  backgroundColor={payment.status === 'paid' ? '#D1FAE5' : '#FEF3C7'} // Vert clair / Jaune clair
                  textColor={payment.status === 'paid' ? '#065F46' : '#92400E'} // Vert foncé / Marron
                  size="small"
                />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                {payment.method && (
                  <Text style={styles.paymentMethod}>{payment.method}</Text>
                )}
              </View>
            </Card>
          ))}
        </>
      )}

      {/* Résumé de présence */}
      {studentData?.attendanceStats && (
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="stats-chart" size={24} color="#6366F1" />
            <Text style={styles.summaryTitle}>Résumé de présence</Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${studentData.attendanceStats.percentage || 0}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{studentData.attendanceStats.percentage || 0}%</Text>
          </View>
          
          <View style={styles.statsDetails}>
            <View style={styles.statDetail}>
              <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statDetailText}>
                Présent: {studentData.attendanceStats.present || 0}
              </Text>
            </View>
            <View style={styles.statDetail}>
              <View style={[styles.statusDot, { backgroundColor: '#6B7280' }]} />
              <Text style={styles.statDetailText}>
                Absent: {studentData.attendanceStats.absent || 0}
              </Text>
            </View>
            <View style={styles.statDetail}>
              <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.statDetailText}>
                Retard: {studentData.attendanceStats.late || 0}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Mes groupes */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mes groupes</Text>
        <Badge 
          text={`${studentData?.groups?.length || 0} groupes`}
          backgroundColor="#F3E5F5" // Violet clair
          textColor="#7B1FA2" // Violet
        />
      </View>
      
      {studentData?.groups && studentData.groups.length > 0 ? (
        studentData.groups.slice(0, 2).map((group, index) => (
          <Card key={group.id || index} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="school-outline" size={20} color="#4CAF50" />
              </View>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.name || 'Groupe'}</Text>
                <View style={styles.groupBadges}>
                  <Badge 
                    text="Mathématiques"
                    backgroundColor="#E3F2FD" // Bleu clair
                    textColor="#1976D2" // Bleu
                    size="small"
                  />
                </View>
              </View>
            </View>
            
            <View style={styles.groupDetails}>
              <View style={styles.groupDetailRow}>
                <Ionicons name="person-outline" size={14} color="#666" />
                <Text style={styles.detailValue}>
                  Enseignant: {group.teacherId || 'Non spécifié'}
                </Text>
              </View>
            </View>
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Ionicons name="people-outline" size={40} color="#E0E0E0" />
          <Text style={styles.emptyText}>Aucun groupe trouvé</Text>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  studentInfoCard: {
    marginBottom: 20,
    padding: 20,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  levelBadge: {
    alignSelf: 'flex-start',
  },
  studentDetails: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: '#FFF8E1', // Jaune clair
    borderWidth: 1,
    borderColor: '#FFD54F', // Jaune
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5D4037', // Marron
    marginLeft: 8,
  },
  alertAmount: {
    fontSize: 13,
    color: '#5D4037', // Marron
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366F1', // Violet
    fontWeight: '500',
  },
  paymentCard: {
    marginBottom: 12,
    padding: 16,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentMonth: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryCard: {
    marginBottom: 20,
    padding: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981', // Vert
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  statsDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statDetailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  groupCard: {
    marginBottom: 12,
    padding: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  groupBadges: {
    flexDirection: 'row',
  },
  groupDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  groupDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
});

export default StudentDashboard;