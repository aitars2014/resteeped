import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, getTeaTypeColor } from '../constants';

export const TeaTypeBadge = ({ teaType, size = 'small' }) => {
  const teaColor = getTeaTypeColor(teaType);
  const isSmall = size === 'small';
  
  const label = teaType?.charAt(0).toUpperCase() + teaType?.slice(1);
  
  return (
    <LinearGradient
      colors={[teaColor.primary, teaColor.gradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.badge, isSmall ? styles.small : styles.large]}
    >
      <Text style={[styles.text, isSmall ? styles.smallText : styles.largeText]}>
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
    color: colors.text.inverse,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 10,
  },
  largeText: {
    ...typography.bodySmall,
  },
});
