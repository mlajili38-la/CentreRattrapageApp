// components/common/Button/Button.jsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

const Button = ({ 
  title, 
  onPress, 
  loading = false, 
  disabled = false,
  size = 'medium',
  variant = 'primary',
  style,
  textStyle 
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    // Size
    if (size === 'small') baseStyle.push(styles.small);
    if (size === 'large') baseStyle.push(styles.large);
    
    // Variant
    if (variant === 'secondary') baseStyle.push(styles.secondary);
    if (variant === 'outline') baseStyle.push(styles.outline);
    
    // State
    if (disabled) baseStyle.push(styles.disabled);
    
    // Custom style
    if (style) baseStyle.push(style);
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text];
    
    if (size === 'small') baseStyle.push(styles.smallText);
    if (size === 'large') baseStyle.push(styles.largeText);
    
    if (variant === 'secondary') baseStyle.push(styles.secondaryText);
    if (variant === 'outline') baseStyle.push(styles.outlineText);
    
    if (disabled) baseStyle.push(styles.disabledText);
    
    if (textStyle) baseStyle.push(textStyle);
    
    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? '#0014eb' : '#fff'} 
          size="small" 
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#02020c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 40,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  secondary: {
    backgroundColor: '#f1f5f9',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0014eb',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 18,
  },
  secondaryText: {
    color: '#0f172a',
  },
  outlineText: {
    color: '#0014eb',
  },
  disabledText: {
    color: '#94a3b8',
  },
});

export default Button;