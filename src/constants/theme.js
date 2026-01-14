// src/constants/theme.js
import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';

export const theme = {
  colors,
  spacing,
  typography,
  
  // Styles globaux réutilisables
  shadows: {
    small: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  
  // Conteneurs
  containers: {
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: spacing.borderRadius.md,
      padding: spacing.cardPadding,
      ...spacing.shadow.sm,
    },
  },
  
  // Textes
  text: {
    heading: {
      fontSize: typography.sizes['2xl'],
      fontWeight: typography.weights.bold,
      color: colors.textPrimary,
    },
    subheading: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.semibold,
      color: colors.textPrimary,
    },
    body: {
      fontSize: typography.sizes.base,
      color: colors.textPrimary,
    },
    caption: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
    },
  },
  
  // Boutons
  buttons: {
    primary: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.buttonPadding,
      paddingHorizontal: spacing.lg,
      borderRadius: spacing.borderRadius.md,
    },
    touchable: {
      // Pour éviter le flash bleu sur iOS
      activeOpacity: 0.8,
      // Pour Android
      android_ripple: {
        color: colors.touchOverlay,
        borderless: false,
      },
    },
  },
};

export default theme;