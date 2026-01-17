// screens/AdminScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

// Import des écrans
import DashboardScreen from './admin/DashboardScreen';
import TeachersScreen from './admin/TeachersScreen';
import StudentsScreen from './admin/StudentsScreen';
import GroupsScreen from './admin/GroupsScreen';
import RoomsScreen from './admin/RoomsScreen';
import SessionsScreen from './admin/SessionsScreen';
import PaymentsScreen from './admin/PaymentsScreen';
import SubjectsScreen from './admin/SubjectsScreen';
import AttendancesScreen from './admin/AttendancesScreen';

const AdminScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: 'grid' },
    { id: 'teachers', label: 'Professeurs', icon: 'person' },
    { id: 'students', label: 'Élèves', icon: 'school' },
    { id: 'groups', label: 'Groupes', icon: 'people' },
    { id: 'rooms', label: 'Salles', icon: 'business' },
    { id: 'sessions', label: 'Séances', icon: 'calendar' },
    { id: 'payments', label: 'Paiements', icon: 'cash' },
    { id: 'subjects', label: 'Matières', icon: 'book' },
    { id: 'attendances', label: 'Présences', icon: 'checkmark-circle' },
  ];

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };
  

  // Dans AdminScreen.js, modifiez la fonction renderContent
const renderContent = () => {
  switch (activeTab) {
    case 'dashboard':
      return <DashboardScreen setActiveTab={setActiveTab} />; // Passer setActiveTab
    case 'teachers':
      return <TeachersScreen />;
    case 'students':
      return <StudentsScreen />;
    case 'groups':
      return <GroupsScreen />;
    case 'rooms':
      return <RoomsScreen />;
    case 'sessions':
      return <SessionsScreen />;
    case 'payments':
      return <PaymentsScreen />;
    case 'subjects':
      return <SubjectsScreen />;
    case 'attendances':
      return <AttendancesScreen />;
    default:
      return <DashboardScreen setActiveTab={setActiveTab} />; // Ici aussi
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* HEADER PRINCIPAL */}
      <View style={styles.mainHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="school" size={28} color="#000000" />
          </View>
          <View style={styles.headerTitles}>
            <Text style={styles.headerSubTitle}>Tableau de bord - Administrateur</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* TABS HORIZONTALES */}
      <View style={styles.tabsWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.tabActive,
                tab.id === 'dashboard' && styles.dashboardTab
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              {tab.icon && (
                <Ionicons 
                  name={tab.icon} 
                  size={16} 
                  color={activeTab === tab.id ? '#fff' : '#0f172a'} 
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
        </ScrollView>
      </View>

      {/* CONTENU PRINCIPAL */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 46,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  headerSubTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  tabsWrapper: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabsScroll: {
    minHeight: 52,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    minHeight: 40,
  },
  dashboardTab: {
    backgroundColor: '#00000015',
    borderWidth: 1,
    borderColor: '#00000030',
  },
  tabActive: {
    backgroundColor: '#000000',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0f172a',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});

export default AdminScreen;