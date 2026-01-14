// src/components/common/Button/Button.jsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { theme } from '../../../constants';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  ...props
}) => {
  // Déterminer les styles selon la variante
  const getButtonStyles = () => {
    let baseStyle = styles.button;
    let variantStyle = {};
    let sizeStyle = {};
    let disabledStyle = disabled || loading ? styles.disabled : {};

    // Variante
    switch (variant) {
      case 'primary':
        variantStyle = styles.primary;
        break;
      case 'secondary':
        variantStyle = styles.secondary;
        break;
      case 'outline':
        variantStyle = styles.outline;
        break;
      case 'danger':
        variantStyle = styles.danger;
        break;
      case 'success':
        variantStyle = styles.success;
        break;
      default:
        variantStyle = styles.primary;
    }

    // Taille
    switch (size) {
      case 'small':
        sizeStyle = styles.small;
        break;
      case 'large':
        sizeStyle = styles.large;
        break;
      default:
        sizeStyle = styles.medium;
    }

    return [baseStyle, variantStyle, sizeStyle, disabledStyle, style];
  };

  const getTextStyles = () => {
    let baseStyle = styles.text;
    let variantStyle = {};
    let sizeStyle = {};
    let disabledStyle = disabled || loading ? styles.textDisabled : {};

    // Variante pour le texte
    switch (variant) {
      case 'outline':
        variantStyle = styles.textOutline;
        break;
      case 'secondary':
        variantStyle = styles.textSecondary;
        break;
      default:
        variantStyle = styles.textPrimary;
    }

    // Taille pour le texte
    switch (size) {
      case 'small':
        sizeStyle = styles.textSmall;
        break;
      case 'large':
        sizeStyle = styles.textLarge;
        break;
      default:
        sizeStyle = styles.textMedium;
    }

    return [baseStyle, variantStyle, sizeStyle, disabledStyle, textStyle];
  };

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'outline'
              ? theme.colors.primary
              : theme.colors.white
          }
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={getTextStyles()}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Variantes
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.lightGray,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  danger: {
    backgroundColor: theme.colors.error,
  },
  success: {
    backgroundColor: theme.colors.success,
  },
  
  // Tailles
  small: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    minHeight: 32,
  },
  medium: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 44,
  },
  large: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    minHeight: 52,
  },
  
  // États
  disabled: {
    opacity: 0.6,
  },
  
  // Contenu
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: theme.spacing.xs,
  },
  
  // Textes
  text: {
    textAlign: 'center',
    fontWeight: theme.typography.weights.semibold,
  },
  textPrimary: {
    color: theme.colors.white,
  },
  textSecondary: {
    color: theme.colors.textPrimary,
  },
  textOutline: {
    color: theme.colors.primary,
  },
  textDisabled: {
    color: theme.colors.textDisabled,
  },
  textSmall: {
    fontSize: theme.typography.sizes.sm,
  },
  textMedium: {
    fontSize: theme.typography.sizes.base,
  },
  textLarge: {
    fontSize: theme.typography.sizes.lg,
  },
});

export default Button;