// screens/teacher/TeacherScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Text,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import  TeacherService  from '../../services/TeacherService';
import TeacherDashboard from './TeacherDashboard';
import TeacherCalendarScreen from './TeacherCalendarScreen';
import TeacherAttendanceScreen from './TeacherAttendanceScreen';
import TeacherGroupsScreen from './TeacherGroupsScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TeacherScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teacherData, setTeacherData] = useState(null);
  const [error, setError] = useState(null);
  
  // Référence pour le FlatList des tabs
  const tabsRef = useRef(null);

  // Les 4 tabs pour enseignant (comme dans la demande)
  const tabs = [
    { id: 'dashboard', label: 'Vue', icon: 'eye-outline' },
    { id: 'calendar', label: 'Calendrier', icon: 'calendar-outline' },
    { id: 'attendance', label: 'Présences', icon: 'checkmark-circle-outline' },
    { id: 'groups', label: 'Groupes', icon: 'people-outline' },
  ];

  const loadTeacherData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.email) {
        throw new Error('Utilisateur non connecté');
      }
      
      // 1. Charger les informations de l'enseignant
      const teacherInfo = await TeacherService.getTeacherByEmail(user.email);
      
      if (!teacherInfo) {
        throw new Error('Enseignant non trouvé dans la base de données');
      }
      
      // 2. Charger les données séparément
      const groups = await TeacherService.getTeacherGroups(teacherInfo.id);
      const upcomingSessions = await TeacherService.getUpcomingSessions(teacherInfo.id);
      const attendanceStats = await TeacherService.getAttendanceStats(teacherInfo.id);
      
      // 3. Construire l'objet complet
      const fullData = {
        teacherInfo,
        groups,
        upcomingSessions,
        attendanceStats
      };
      
      setTeacherData(fullData);
      
    } catch (err) {
      console.error('Erreur chargement:', err);
      setError(err.message);
      
      // Données de secours (similaires à l'étudiant)
      setTeacherData({
        teacherInfo: {
          name: user?.name || user?.displayName || "Ahmed Bennani",
          email: user?.email || "prof.math@centre.ma",
          specialization: "Mathématiques",
          phone: "+216 73 452 100",
          hireDate: new Date("2023-09-01"),
        },
        groups: [
          {
            id: "1",
            name: "Maths 2BAC - A",
            subject: "Mathématiques",
            level: "2BAC Sciences",
            studentCount: 24,
            schedule: "Lun/Mer 14h-16h",
            room: "Salle 201"
          },
          {
            id: "2",
            name: "Physique 2BAC - A",
            subject: "Physique",
            level: "2BAC Sciences",
            studentCount: 20,
            schedule: "Mar/Jeu 16h-18h",
            room: "Labo Physique"
          }
        ],
        upcomingSessions: [
          {
            id: "1",
            date: new Date().toISOString().split('T')[0],
            time: "14:00",
            duration: "2h",
            group: "Maths 2BAC - A",
            room: "Salle 201",
            topic: "Calcul intégral"
          },
          {
            id: "2",
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            time: "14:00",
            duration: "2h",
            group: "Physique 2BAC - A",
            room: "Labo Physique",
            topic: "Électricité"
          }
        ],
        attendanceStats: {
          totalStudents: 44,
          averageAttendance: 92,
          sessionsThisMonth: 8,
          completedSessions: 45
        }
      });
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadTeacherData();
    }
  }, [user]);

  // Scroll vers la tab active lors du changement
  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (tabsRef.current && activeIndex >= 0) {
      tabsRef.current.scrollToIndex({
        index: activeIndex,
        animated: true,
        viewPosition: 0.5, // Centre la tab
      });
    }
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTeacherData();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Navigation depuis le dashboard
  const handleDashboardNavigation = (tabId) => {
    setActiveTab(tabId);
  };

  // Rendu du contenu selon l'onglet actif
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <TeacherDashboard
            teacherData={teacherData}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onNavigate={handleDashboardNavigation}
            formatDate={formatDate}
          />
        );
      case 'calendar':
        return <TeacherCalendarScreen teacherData={teacherData} />;
      case 'attendance':
        return <TeacherAttendanceScreen teacherData={teacherData} />;
      case 'groups':
        return <TeacherGroupsScreen teacherData={teacherData} />;
      default:
        return (
          <TeacherDashboard
            teacherData={teacherData}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onNavigate={handleDashboardNavigation}
            formatDate={formatDate}
          />
        );
    }
  };

  // Rendu d'un item de tab
  const renderTabItem = ({ item }) => {
    const isActive = activeTab === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.tabItem,
          isActive && styles.tabItemActive,
        ]}
        onPress={() => setActiveTab(item.id)}
      >
        {item.icon && (
          <Ionicons 
            name={item.icon} 
            size={16} 
            color={isActive ? '#fff' : '#000'} 
            style={styles.tabIcon}
          />
        )}
        <Text style={[
          styles.tabText,
          isActive && styles.tabTextActive
        ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  if (loading && !teacherData) {
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

      {/* Header principal - similaire à StudentHeader */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Enseignant</Text>
            <Text style={styles.headerSubtitle}>
              {teacherData?.teacherInfo?.name || 'Enseignant'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs avec scroll horizontal */}
      <View style={styles.tabsWrapper}>
        <FlatList
          ref={tabsRef}
          data={tabs}
          renderItem={renderTabItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsListContent}
          snapToAlignment="center"
          decelerationRate="fast"
          getItemLayout={(data, index) => ({
            length: 120, // Largeur estimée par item
            offset: 120 * index,
            index,
          })}
        />
        
        {/* Indicateur visuel pour le scroll */}
        
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
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
    marginLeft: 16,
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
    paddingTop: 8,
  },
  tabsListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 6,
    minWidth: 100,
    justifyContent: 'center',
  },
  tabItemActive: {
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  scrollIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  scrollIndicatorLine: {
    width: 30,
    height: 3,
    backgroundColor: '#ddd',
    borderRadius: 1.5,
    marginRight: 8,
  },
  scrollIndicatorText: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default TeacherScreen;