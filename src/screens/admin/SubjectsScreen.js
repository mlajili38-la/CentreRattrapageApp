// screens/admin/SubjectsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SubjectsScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="book" size={80} color="#ef4444" />
        <Text style={styles.title}>Gestion des Matières</Text>
        <Text style={styles.subtitle}>
          Écran de gestion des matières
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

export default SubjectsScreen;