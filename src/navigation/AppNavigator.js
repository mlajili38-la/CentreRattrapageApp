// navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';

// Écran Login
import LoginScreen from '../screens/LoginScreen';

// Écrans Admin
import AdminScreen from '../screens/AdminScreen';
import DashboardScreen from '../screens/admin/DashboardScreen';
import TeachersScreen from '../screens/admin/TeachersScreen';
import StudentsScreen from '../screens/admin/StudentsScreen';
import GroupsScreen from '../screens/admin/GroupsScreen';
import SessionsScreen from '../screens/admin/SessionsScreen';
import RoomsScreen from '../screens/admin/RoomsScreen';
import AttendancesScreen from '../screens/admin/AttendancesScreen';
import PaymentsScreen from '../screens/admin/PaymentsScreen';
import SubjectsScreen from '../screens/admin/SubjectsScreen';

// Navigation Étudiant
import StudentNavigator from './StudentNavigator';

// Écrans Enseignant - AJOUTEZ CES IMPORTS
import TeacherScreen from '../screens/teacher/TeacherScreen';
import TeacherCalendarScreen from '../screens/teacher/TeacherCalendarScreen';
import TeacherAttendanceScreen from '../screens/teacher/TeacherAttendanceScreen';
import TeacherGroupsScreen from '../screens/teacher/TeacherGroupsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* TOUJOURS avoir Login disponible */}
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* Si connecté, afficher l'écran correspondant */}
        {isAuthenticated && user?.role === 'admin' && (
          <>
            <Stack.Screen name="Admin" component={AdminScreen} />
            {/* Écrans admin détaillés */}
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ 
                headerShown: true, 
                title: 'Tableau de bord',
                headerBackTitle: 'Retour'
              }}
            />
            <Stack.Screen 
              name="Teachers" 
              component={TeachersScreen}
              options={{ headerShown: true, title: 'Enseignants' }}
            />
            <Stack.Screen 
              name="Students" 
              component={StudentsScreen}
              options={{ headerShown: true, title: 'Élèves' }}
            />
            <Stack.Screen 
              name="Groups" 
              component={GroupsScreen}
              options={{ headerShown: true, title: 'Groupes' }}
            />
            <Stack.Screen 
              name="Sessions" 
              component={SessionsScreen}
              options={{ headerShown: true, title: 'Sessions' }}
            />
            <Stack.Screen 
              name="Rooms" 
              component={RoomsScreen}
              options={{ headerShown: true, title: 'Salles' }}
            />
            <Stack.Screen 
              name="Attendances" 
              component={AttendancesScreen}
              options={{ headerShown: true, title: 'Présences' }}
            />
            <Stack.Screen 
              name="Payments" 
              component={PaymentsScreen}
              options={{ headerShown: true, title: 'Paiements' }}
            />
            <Stack.Screen 
              name="Subjects" 
              component={SubjectsScreen}
              options={{ headerShown: true, title: 'Matières' }}
            />
          </>
        )}
        
        {isAuthenticated && user?.role === 'student' && (
          <>
            <Stack.Screen 
              name="Student" 
              component={StudentNavigator}
              options={{ headerShown: false }}
            />
          </>
        )}
        
        {/* AJOUTEZ CETTE SECTION POUR LES ENSEIGNANTS */}
        {isAuthenticated && user?.role === 'teacher' && (
          <>
            <Stack.Screen 
              name="Teacher" 
              component={TeacherScreen}
              options={{ headerShown: false }}
            />
            {/* Optionnel: Écrans détaillés pour enseignants */}
            <Stack.Screen 
              name="TeacherCalendar" 
              component={TeacherCalendarScreen}
              options={{ 
                headerShown: true, 
                title: 'Calendrier',
                headerBackTitle: 'Retour'
              }}
            />
            <Stack.Screen 
              name="TeacherAttendance" 
              component={TeacherAttendanceScreen}
              options={{ 
                headerShown: true, 
                title: 'Présences',
                headerBackTitle: 'Retour'
              }}
            />
            <Stack.Screen 
              name="TeacherGroups" 
              component={TeacherGroupsScreen}
              options={{ 
                headerShown: true, 
                title: 'Mes Groupes',
                headerBackTitle: 'Retour'
              }}
            />
          </>
        )}
        
        {/* Fallback pour éviter les erreurs */}
        {!isAuthenticated && (
          <Stack.Screen name="LoginFallback" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;