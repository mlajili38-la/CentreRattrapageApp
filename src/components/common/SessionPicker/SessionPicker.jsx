// src/components/common/SessionPicker/SessionPicker.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../../constants';

const SessionPicker = ({
  sessions = [],
  selectedSession,
  onSelect,
  placeholder = "Sélectionner une séance",
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>Sélectionner une séance</Text>
      
      {selectedSession ? (
        <TouchableOpacity
          style={styles.selectedSession}
          onPress={() => onSelect?.(selectedSession)}
        >
          <Text style={styles.sessionText}>{selectedSession}</Text>
          <Text style={styles.changeText}>Changer</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.placeholder}>
          <Text style={styles.placeholderText}>{placeholder}</Text>
        </TouchableOpacity>
      )}
      
      {sessions.length > 0 && !selectedSession && (
        <View style={styles.sessionsList}>
          {sessions.map((session, index) => (
            <TouchableOpacity
              key={index}
              style={styles.sessionItem}
              onPress={() => onSelect?.(session)}
            >
              <Text style={styles.sessionItemText}>{session}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  selectedSession: {
    backgroundColor: theme.colors.primary + '10',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionText: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.medium,
  },
  changeText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
  placeholder: {
    backgroundColor: theme.colors.lightGray,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.md,
  },
  placeholderText: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textMuted,
  },
  sessionsList: {
    marginTop: theme.spacing.sm,
  },
  sessionItem: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sessionItemText: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textPrimary,
  },
});

export default SessionPicker;