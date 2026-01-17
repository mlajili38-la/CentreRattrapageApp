// components/common/StatCard/StatCard.jsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, subtitle, icon, color = '#4f46e5', clickable = false }) => {
  return (
    <View style={[
      styles.container,
      clickable && styles.clickable,
      { width: '100%' } // Force 100% width du wrapper
    ]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
      </View>
      
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      
      {subtitle && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12, // Réduit de 16 à 12
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    width: '100%', // Prend toute la largeur disponible
  },
  clickable: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  iconContainer: {
    width: 28, // Réduit de 32 à 28
    height: 28, // Réduit de 32 à 28
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 11, // Réduit de 12 à 11
    fontWeight: '600',
    color: '#64748b',
    flex: 1,
    flexWrap: 'nowrap',
  },
  value: {
    fontSize: 22, // Réduit de 28 à 22
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10, // Réduit de 12 à 10
    color: '#10b981',
    fontWeight: '500',
  },
});

export default StatCard;