// screens/admin/SessionsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SessionsScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="calendar" size={80} color="#f59e0b" />
        <Text style={styles.title}>Gestion des Séances</Text>
        <Text style={styles.subtitle}>
          Écran de gestion des séances
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: 600,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default SessionsScreen;