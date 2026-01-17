// src/constants/colors.js - MISE À JOUR FINALE
export const colors = {
  // Palette principale (d'après les headers)
  primary: '#01040c',       // Bleu marine foncé
  primaryLight: '#010409',  // Bleu vif (boutons)
  primaryDark: '#010513',   // Bleu très foncé
  
  // Accents et états
  accent: '#10b981',        // Vert (présents, succès)
  accentLight: '#34d399',   // Vert clair
  danger: '#dc2626',        // Rouge (absents, erreurs)
  warning: '#f59e0b',       // Orange (non marqués)
  info: '#3b82f6',         // Bleu info (activer windows)
  
  // Neutres
  white: '#ffffff',
  lightGray: '#f8fafc',     // Fond très clair
  gray: '#94a3b8',          // Texte secondaire
  darkGray: '#64748b',      // Texte tertiaire
  black: '#0f172a',         // Texte principal
  
  // Backgrounds
  background: '#ffffff',    // Fond blanc (changement)
  cardBackground: '#ffffff',
  headerBg: '#01040a',      // Header bleu marine
  
  // Textes
  textPrimary: '#0f172a',   // Plus foncé
  textSecondary: '#475569',
  textLight: '#ffffff',
  textMuted: '#94a3b8',
  
  // Bordures
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  divider: '#cbd5e1',
  
  // États spéciaux
  statPresent: '#10b981',   // Présent
  statAbsent: '#dc2626',    // Absent
  statPending: '#f59e0b',   // Non marqué
  statTotal: '#1e3a8a',     // Total
  activateWindows: '#3b82f6', // Bleu "Activer Windows"
  
  // Interactif
  hover: '#f8fafc',
  active: '#f1f5f9',
  focusRing: '#60a5fa',
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  warning: {
    50: '#fefce8',
    100: '#fef9c3',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
  },
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  
  // Chart colors
  blue: {
    500: '#3b82f6',
  },
  green: {
    500: '#22c55e',
  },
  purple: {
    500: '#8b5cf6',
  },
  orange: {
    500: '#f97316',
  },
};

export default colors;