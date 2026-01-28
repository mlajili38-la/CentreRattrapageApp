// navigation/StudentNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import des écrans étudiants
import StudentScreen from '../screens/student/StudentScreen'; // Ajouté
import StudentDashboard from '../screens/student/StudentDashboard';
import StudentGroupsScreen from '../screens/student/StudentGroupsScreen';
import StudentPaymentsScreen from '../screens/student/StudentPaymentsScreen';
import StudentAttendanceScreen from '../screens/student/StudentAttendanceScreen';
import StudentCalendarScreen from '../screens/student/StudentCalendarScreen';
import StudentGradesScreen from '../screens/student/StudentGradesScreen';

const Stack = createStackNavigator();

const StudentNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="StudentDashboard" // Définir l'écran initial
      screenOptions={{
        headerStyle: {
          backgroundColor: '#010107',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitle: 'Retour',
      }}
    >
      <Stack.Screen 
        name="StudentDashboard" 
        component={StudentScreen} // Utiliser StudentScreen comme dashboard
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="StudentGroups" 
        component={StudentGroupsScreen}
        options={{ title: 'Mes groupes' }}
      />
      <Stack.Screen 
        name="StudentPayments" 
        component={StudentPaymentsScreen}
        options={{ title: 'Mes paiements' }}
      />
      <Stack.Screen 
        name="StudentAttendance" 
        component={StudentAttendanceScreen}
        options={{ title: 'Mes présences' }}
      />
      <Stack.Screen 
        name="StudentCalendar" 
        component={StudentCalendarScreen}
        options={{ title: 'Calendrier' }}
      />
      <Stack.Screen 
        name="StudentGrades" 
        component={StudentGradesScreen}
        options={{ title: 'Mes notes' }}
      />
    </Stack.Navigator>
  );
};

export default StudentNavigator;