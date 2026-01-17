// navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import AdminScreen from '../screens/AdminScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
        />
        <Stack.Screen 
          name="Admin" 
          component={AdminScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
const AdminStack = createStackNavigator();

function AdminStackNavigator() {
  return (
    <AdminStack.Navigator>
      <AdminStack.Screen name="Dashboard" component={DashboardScreen} />
      <AdminStack.Screen name="Teachers" component={TeachersScreen} />
      <AdminStack.Screen name="Students" component={StudentsScreen} />
      <AdminStack.Screen name="Groups" component={GroupsScreen} />
      <AdminStack.Screen name="Sessions" component={SessionsScreen} />
      <AdminStack.Screen name="Rooms" component={RoomsScreen} />
      <AdminStack.Screen name="Attendances" component={AttendancesScreen} />
      <AdminStack.Screen name="Payments" component={PaymentsScreen} />
      <AdminStack.Screen name="Subjects" component={SubjectsScreen} />
    </AdminStack.Navigator>
  );
}

export default AppNavigator;