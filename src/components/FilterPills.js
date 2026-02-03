import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, getTeaTypeColor } from '../constants';
import { teaTypes } from '../data/teas';

export const FilterPills = ({ selectedType, onSelectType }) => {
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
                <Text style={[styles.pillText, styles.selectedText]}>
                  {type.label}
                </Text>
              </LinearGradient>
            ) : isSelected ? (
              <View style={[styles.pill, styles.selectedAll]}>
                <Text style={[styles.pillText, styles.selectedText]}>
                  {type.label}
                </Text>
              </View>
            ) : (
              <View style={[styles.pill, styles.unselected]}>
                <Text style={[styles.pillText, styles.unselectedText]}>
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
  },
  selectedAll: {
    backgroundColor: colors.accent.primary,
  },
  unselected: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  pillText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  selectedText: {
    color: colors.text.inverse,
  },
  unselectedText: {
    color: colors.text.primary,
  },
});
