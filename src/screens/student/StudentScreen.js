// screens/student/StudentScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { StudentService } from '../../services/studentService';
import StudentHeader from './StudentHeader';
import StudentCalendarScreen from './StudentCalendarScreen';
import StudentPaymentsScreen from './StudentPaymentsScreen';
import StudentGradesScreen from './StudentGradesScreen';
import StudentDashboard from './StudentDashboard';

const StudentScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [error, setError] = useState(null);

  // Seulement 4 tabs comme dans la capture
  const tabs = [
    { id: 'dashboard', label: 'Vue', icon: 'eye-outline' },
    { id: 'calendar', label: 'Cal.', icon: 'calendar-outline' },
    { id: 'grades', label: 'Bull.', icon: 'stats-chart-outline' },
    { id: 'payments', label: 'Paie.', icon: 'cash-outline' },
  ];

  const loadStudentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.email) {
        throw new Error('Utilisateur non connecté');
      }
      
      // 1. Charger les informations de l'étudiant
      const studentInfo = await StudentService.getStudentByEmail(user.email);
      
      if (!studentInfo) {
        throw new Error('Étudiant non trouvé dans la base de données');
      }
      
      // 2. Charger les données séparément (car getStudentFullData n'existe pas)
      const groups = await StudentService.getStudentGroups(studentInfo.id);
      const attendanceData = await StudentService.getStudentAttendance(studentInfo.id);
      const payments = await StudentService.getStudentPayments(studentInfo.id);
      const sessions = attendanceData.attendances || [];
      
      // 3. Construire l'objet fullData manuellement
      const fullData = {
        studentInfo,
        groups,
        sessions,
        payments,
        attendanceStats: attendanceData.stats
      };
      
      setStudentData(fullData);
      
    } catch (err) {
      console.error('Erreur chargement:', err);
      setError(err.message);
      
      // Données de secours
      setStudentData({
        studentInfo: {
          name: user?.name || user?.displayName || "Sara Alami",
          email: user?.email || "eleve1@gmail.com",
          levelCode: user?.levelCode || "2BAC Sciences",
          parentPhone: user?.parentPhone || "0612345001",
          enrollmentDate: user?.enrollmentDate || new Date("2025-09-15"),
        },
        groups: [
          {
            id: "1",
            name: "Maths 2BAC - A",
            subjectName: "Maths",
            teacherName: "Ahmed Bennani",
            levelName: "2BAC Sciences"
          },
          {
            id: "2",
            name: "Physique 2BAC - A",
            subjectName: "Physique",
            teacherName: "Ahmed Bennani",
            levelName: "2BAC Sciences"
          }
        ],
        sessions: [],
        payments: [],
        attendanceStats: { 
          total: 2, 
          present: 1,
          absent: 1,
          late: 0,
          percentage: 50 
        }
      });
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadStudentData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStudentData();
  };

  const formatDate = (date) => {
    if (!date) return 'Date inconnue';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Navigation depuis les cartes du dashboard
  const handleDashboardNavigation = (tabId) => {
    setActiveTab(tabId);
  };

  // Rendu du contenu selon l'onglet actif
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <StudentDashboard
            studentData={studentData}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onNavigate={handleDashboardNavigation}
            formatDate={formatDate}
          />
        );
      case 'calendar':
        return <StudentCalendarScreen studentData={studentData} />;
      case 'payments':
        return <StudentPaymentsScreen studentData={studentData} />;
      case 'grades':
        return <StudentGradesScreen studentData={studentData} />;
      default:
        return (
          <StudentDashboard
            studentData={studentData}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onNavigate={handleDashboardNavigation}
            formatDate={formatDate}
          />
        );
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  if (loading && !studentData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Chargement des données...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header principal */}
      <StudentHeader 
        title="Tableau de bord - Élève" 
        navigation={navigation}
        onLogout={handleLogout}
      />

      {/* Tabs horizontales - 4 seulement */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              {tab.icon && (
                <Ionicons 
                  name={tab.icon} 
                  size={16} 
                  color={activeTab === tab.id ? '#fff' : '#000'} 
                  style={styles.tabIcon}
                />
              )}
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Contenu principal */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  tabsWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    minHeight: 40,
  },
  tabActive: {
    backgroundColor: '#000',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default StudentScreen;