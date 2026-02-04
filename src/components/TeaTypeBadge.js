import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { typography } from '../constants';
import { useTheme } from '../context';

export const TeaTypeBadge = ({ teaType, size = 'small' }) => {
  const { theme, getTeaTypeColor } = useTheme();
  const teaColor = getTeaTypeColor(teaType);
  const isSmall = size === 'small';
  
  const label = teaType?.charAt(0).toUpperCase() + teaType?.slice(1);
  
  return (
    <LinearGradient
      colors={[teaColor.primary, teaColor.gradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.badge, isSmall ? styles.small : styles.large]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${label} tea`}
    >
      <Text 
        style={[styles.text, { color: theme.text.inverse }, isSmall ? styles.smallText : styles.largeText]}
        accessibilityElementsHidden
      >
        {label}
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  large: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    fontWeight: '600',
  },
  smallText: {
    fontSize: 10,
  },
  largeText: {
    ...typography.bodySmall,
  },
});
