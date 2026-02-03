import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing } from '../constants';
import { useTheme } from '../context';

export const FactCard = ({ icon, value, label }) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.card, { 
      backgroundColor: theme.background.secondary,
      shadowColor: theme.shadow.card,
    }]}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.value, { color: theme.text.primary }]}>{value}</Text>
        <Text style={[styles.label, { color: theme.text.secondary }]}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.cardPadding,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  value: {
    ...typography.body,
    fontWeight: '600',
  },
  label: {
    ...typography.caption,
    marginTop: 2,
  },
});
