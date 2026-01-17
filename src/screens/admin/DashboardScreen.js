// screens/admin/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import Card from '../../components/common/Card/Card';
import StatCard from '../../components/common/StatCard/StatCard';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ setActiveTab }) => { // Ajouter setActiveTab en paramètre
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    groups: 0,
    sessions: 0,
    rooms: 0,
    attendances: 0,
    payments: 0,
    subjects: 0,
  });

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const [
        teachersSnapshot,
        studentsSnapshot,
        groupsSnapshot,
        sessionsSnapshot,
        roomsSnapshot,
        attendancesSnapshot,
        paymentsSnapshot,
        subjectsSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'teachers')),
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'groups')),
        getDocs(collection(db, 'sessions')),
        getDocs(collection(db, 'rooms')),
        getDocs(collection(db, 'attendances')),
        getDocs(collection(db, 'payments')),
        getDocs(collection(db, 'subjects'))
      ]);

      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const thisMonthPayments = paymentsSnapshot.docs.filter(doc => {
        const payment = doc.data();
        const paymentDate = new Date(payment.date);
        return paymentDate >= startOfMonth && payment.status === 'completed';
      }).length;

      const thisMonthSessions = sessionsSnapshot.docs.filter(doc => {
        const session = doc.data();
        const sessionDate = new Date(session.date);
        return sessionDate >= startOfMonth;
      }).length;

      const todayAttendances = attendancesSnapshot.docs.filter(doc => {
        const attendance = doc.data();
        const attendanceDate = new Date(attendance.markedAt);
        return attendanceDate.toDateString() === today.toDateString();
      }).length;

      setStats({
        teachers: teachersSnapshot.size,
        students: studentsSnapshot.size,
        groups: groupsSnapshot.size,
        sessions: thisMonthSessions,
        rooms: roomsSnapshot.size,
        attendances: todayAttendances,
        payments: thisMonthPayments,
        subjects: subjectsSnapshot.size,
      });
      
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
      setStats({
        teachers: 4,
        students: 7,
        groups: 6,
        sessions: 8,
        rooms: 5,
        attendances: 7,
        payments: 8,
        subjects: 8,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  // Fonctions pour changer d'onglet
  const switchToTab = (tabId) => {
    if (setActiveTab) {
      setActiveTab(tabId);
    }
  };

  return (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* STATISTIQUES PRINCIPALES */}
      <View style={styles.section}>
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            activeOpacity={0.7} 
            style={styles.statCardWrapper}
            onPress={() => switchToTab('teachers')}
          >
            <StatCard
              title="Enseignants"
              value={stats.teachers.toString()}
              subtitle="Actifs"
              icon="person"
              color="#4f46e5"
              clickable={true}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.7} 
            style={styles.statCardWrapper}
            onPress={() => switchToTab('students')}
          >
            <StatCard
              title="Élèves"
              value={stats.students.toString()}
              subtitle="Inscrits"
              icon="school"
              color="#0ea5e9"
              clickable={true}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.7} 
            style={styles.statCardWrapper}
            onPress={() => switchToTab('groups')}
          >
            <StatCard
              title="Groupes"
              value={stats.groups.toString()}
              subtitle="Actifs"
              icon="people"
              color="#10b981"
              clickable={true}
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.7} 
            style={styles.statCardWrapper}
            onPress={() => switchToTab('sessions')}
          >
            <StatCard
              title="Séances"
              value={stats.sessions.toString()}
              subtitle="Ce mois"
              icon="calendar"
              color="#f59e0b"
              clickable={true}
            />
          </TouchableOpacity>
        </View>
      </View>

      

      {/* ACTIVITÉS RÉCENTES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activités récentes</Text>
        <Card>
          {loading ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <>
              <TouchableOpacity 
                style={styles.activityItem}
                onPress={() => switchToTab('students')}
              >
                <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityText}>
                    {stats.students} élèves actuellement inscrits
                  </Text>
                  <Text style={styles.activityTime}>Effectif total</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748b" />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity 
                style={styles.activityItem}
                onPress={() => switchToTab('teachers')}
              >
                <View style={[styles.dot, { backgroundColor: '#3b82f6' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityText}>
                    {stats.teachers} enseignants actifs
                  </Text>
                  <Text style={styles.activityTime}>Équipe pédagogique</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748b" />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity 
                style={styles.activityItem}
                onPress={() => switchToTab('sessions')}
              >
                <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityText}>
                    {stats.sessions} séances programmées
                  </Text>
                  <Text style={styles.activityTime}>Ce mois</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748b" />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity 
                style={styles.activityItem}
                onPress={() => switchToTab('payments')}
              >
                <View style={[styles.dot, { backgroundColor: '#8b5cf6' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityText}>
                    {stats.payments} paiements traités
                  </Text>
                  <Text style={styles.activityTime}>Ce mois</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748b" />
              </TouchableOpacity>
            </>
          )}
        </Card>
      </View>

      {/* ALERTES EN ROUGE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alertes importantes</Text>
        <Card>
          <TouchableOpacity 
            style={[styles.alertBox, { backgroundColor: '#fee2e2' }]}
            onPress={() => switchToTab('payments')}
          >
            <Ionicons name="alert-circle" size={20} color="#dc2626" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.alertText, { color: '#dc2626' }]}>
                3 paiements en retard ce mois
              </Text>
              <Text style={styles.alertSubtext}>Sara Alami, Omar Kettani, Yassin El Fassi</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#dc2626" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.alertBox, { backgroundColor: '#fee2e2' }]}
            onPress={() => switchToTab('attendances')}
          >
            <Ionicons name="alert-circle" size={20} color="#dc2626" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.alertText, { color: '#dc2626' }]}>
                {stats.sessions} séances nécessitent un marquage de présences
              </Text>
              <Text style={styles.alertSubtext}>À faire cette semaine</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#dc2626" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.alertBox, { backgroundColor: '#fee2e2' }]}
            onPress={() => switchToTab('rooms')}
          >
            <Ionicons name="alert-circle" size={20} color="#dc2626" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.alertText, { color: '#dc2626' }]}>
                2 salles en maintenance cette semaine
              </Text>
              <Text style={styles.alertSubtext}>Salle B et Salle D</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#dc2626" />
          </TouchableOpacity>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000000',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCardWrapper: {
    width: '48%',
    marginBottom: 8,
  },
  secondaryStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricCard: {
    width: (width - 48) / 4,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  activityText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  alertText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  alertSubtext: {
    fontSize: 12,
    color: '#b91c1c',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: -8,
  },
});

export default DashboardScreen;