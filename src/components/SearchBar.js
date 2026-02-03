import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { colors, spacing } from '../constants';

export const SearchBar = ({ 
  value, 
  onChangeText, 
  placeholder = 'Search teas, types, or shops...',
  onFilterPress,
}) => {
  return (
    <View style={styles.container}>
      <Search 
        size={20} 
        color={colors.text.secondary} 
        style={styles.searchIcon} 
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.secondary}
      />
      {onFilterPress && (
        <TouchableOpacity onPress={onFilterPress} style={styles.filterButton}>
          <SlidersHorizontal size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    height: spacing.searchBarHeight,
    borderRadius: spacing.searchBarBorderRadius,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 16,
    shadowColor: colors.shadow.searchBar,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  filterButton: {
    marginLeft: 12,
    padding: 4,
  },
});
