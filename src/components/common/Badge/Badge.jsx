// components/common/Badge/Badge.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Badge = ({ text, type = 'danger', style }) => {
  const getBgColor = () => {
    switch (type) {
      case 'danger': return '#000000';
      case 'success': return '#d1fae5';
      case 'warning': return '#fef3c7';
      case 'info': return '#e0f2fe';
      default: return '#f1f5f9';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'danger': return '#efe2e2';
      case 'success': return '#059669';
      case 'warning': return '#d97706';
      case 'info': return '#0369a1';
      default: return '#475569';
    }
  };

  return (
    <View style={[styles.badge, { backgroundColor: getBgColor() }, style]}>
      <Text style={[styles.text, { color: getTextColor() }]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default Badge;