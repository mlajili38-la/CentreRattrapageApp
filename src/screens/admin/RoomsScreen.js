// screens/admin/RoomsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RoomsScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="business" size={80} color="#8b5cf6" />
        <Text style={styles.title}>Gestion des Salles</Text>
        <Text style={styles.subtitle}>
          Écran de gestion des salles
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

export default RoomsScreen;