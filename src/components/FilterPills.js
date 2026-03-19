import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { typography, spacing } from '../constants';
import { useTheme } from '../context';
import { teaTypes } from '../data/teas';

export const FilterPills = ({ selectedType, onSelectType, options, selected, onSelect }) => {
  const { theme, getTeaTypeColor } = useTheme();
  
  // Support both prop interfaces:
  // - Tea type mode: selectedType + onSelectType (uses teaTypes data)
  // - Generic mode: options + selected + onSelect (uses custom options)
  const isGenericMode = !!options;
  const items = isGenericMode ? options : teaTypes;
  const currentSelection = isGenericMode ? selected : selectedType;
  const handleSelect = isGenericMode ? onSelect : onSelectType;
  
  // Handle tap on a filter pill - toggle if already selected
  const handlePillPress = (typeId) => {
    if (!handleSelect) return;
    // If tapping the already-selected type, toggle back to 'all'
    // Exception: if 'all' is selected, tapping it does nothing
    if (currentSelection === typeId && typeId !== 'all') {
      handleSelect('all');
    } else {
      handleSelect(typeId);
    }
  };
  
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {items.map((type) => {
        const isSelected = currentSelection === type.id;
        const teaColor = type.id !== 'all' ? getTeaTypeColor(type.id) : null;
        
        const displayLabel = type.label || type.name;
        
        return (
          <TouchableOpacity
            key={type.id}
            onPress={() => handlePillPress(type.id)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${displayLabel} filter${isSelected ? ', selected' : ''}`}
            accessibilityHint={isSelected && type.id !== 'all' ? 'Double tap to deselect' : 'Double tap to filter by this type'}
            accessibilityState={{ selected: isSelected }}
          >
            {isSelected && teaColor ? (
              <LinearGradient
                colors={[teaColor.primary, teaColor.gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pill}
              >
                <Text style={[styles.pillText, { color: theme.text.inverse }]}>
                  {displayLabel}
                </Text>
              </LinearGradient>
            ) : isSelected ? (
              <View style={[styles.pill, { backgroundColor: theme.accent.primary }]}>
                <Text style={[styles.pillText, { color: theme.text.inverse }]}>
                  {displayLabel}
                </Text>
              </View>
            ) : (
              <View style={[styles.pill, { 
                backgroundColor: theme.background.secondary,
                borderColor: theme.border.medium,
              }]}>
                <Text style={[styles.pillText, { color: theme.text.primary }]}>
                  {displayLabel}
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
