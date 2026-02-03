import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { typography, spacing } from '../constants';
import { useTheme } from '../context';
import { teaTypes } from '../data/teas';

export const FilterPills = ({ selectedType, onSelectType }) => {
  const { theme, getTeaTypeColor } = useTheme();
  
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {teaTypes.map((type) => {
        const isSelected = selectedType === type.id;
        const teaColor = type.id !== 'all' ? getTeaTypeColor(type.id) : null;
        
        return (
          <TouchableOpacity
            key={type.id}
            onPress={() => onSelectType(type.id)}
            activeOpacity={0.7}
          >
            {isSelected && teaColor ? (
              <LinearGradient
                colors={[teaColor.primary, teaColor.gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pill}
              >
                <Text style={[styles.pillText, { color: theme.text.inverse }]}>
                  {type.label}
                </Text>
              </LinearGradient>
            ) : isSelected ? (
              <View style={[styles.pill, { backgroundColor: theme.accent.primary }]}>
                <Text style={[styles.pillText, { color: theme.text.inverse }]}>
                  {type.label}
                </Text>
              </View>
            ) : (
              <View style={[styles.pill, { 
                backgroundColor: theme.background.secondary,
                borderColor: theme.border.medium,
              }]}>
                <Text style={[styles.pillText, { color: theme.text.primary }]}>
                  {type.label}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.screenHorizontal,
    gap: spacing.filterPillGap,
  },
  pill: {
    height: spacing.filterPillHeight,
    paddingHorizontal: spacing.filterPillPaddingH,
    borderRadius: spacing.filterPillBorderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.filterPillGap,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
});
