import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../constants';

const Card = ({ title, children, style, titleStyle, contentStyle, ...props }) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {title && (
        <View style={styles.header}>
          <Text style={[styles.title, titleStyle]}>{title}</Text>
        </View>
      )}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.spacing.borderRadius.lg,
    ...theme.shadows.medium,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  content: {
    padding: theme.spacing.lg,
  },
});

export default Card;