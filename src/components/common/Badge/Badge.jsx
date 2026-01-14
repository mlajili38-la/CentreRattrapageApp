// src/components/common/Badge/Badge.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../constants';

const Badge = ({
  text,
  type = 'default',
  size = 'medium',
  style,
  textStyle,
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: theme.colors.accent + '20',
          borderColor: theme.colors.accent,
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.danger + '20',
          borderColor: theme.colors.danger,
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.warning + '20',
          borderColor: theme.colors.warning,
        };
      case 'info':
        return {
          backgroundColor: theme.colors.info + '20',
          borderColor: theme.colors.info,
        };
      default:
        return {
          backgroundColor: theme.colors.lightGray,
          borderColor: theme.colors.border,
        };
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success': return theme.colors.accent;
      case 'danger': return theme.colors.danger;
      case 'warning': return theme.colors.warning;
      case 'info': return theme.colors.info;
      default: return theme.colors.textSecondary;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
        };
      case 'large':
        return {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
        };
      default:
        return {
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.md,
        };
    }
  };

  const typeStyles = getTypeStyles();
  const sizeStyles = getSizeStyles();
  const textColor = getTextColor();

  return (
    <View style={[
      styles.badge,
      typeStyles,
      sizeStyles,
      style,
    ]}>
      <Text style={[
        styles.text,
        { color: textColor },
        textStyle,
      ]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: theme.spacing.borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
});

export default Badge;