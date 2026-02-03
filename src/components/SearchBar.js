import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { spacing } from '../constants';
import { useTheme } from '../context';

export const SearchBar = ({ 
  value, 
  onChangeText, 
  placeholder = 'Search teas, types, or shops...',
  onFilterPress,
  onFocus,
  onBlur,
  onSubmitEditing,
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, {
      backgroundColor: theme.background.secondary,
      borderColor: theme.border.light,
      shadowColor: theme.shadow?.searchBar || '#000',
    }]}>
      <Search 
        size={20} 
        color={theme.text.secondary} 
        style={styles.searchIcon} 
      />
      <TextInput
        style={[styles.input, { color: theme.text.primary }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.text.secondary}
        onFocus={onFocus}
        onBlur={onBlur}
        onSubmitEditing={onSubmitEditing}
        returnKeyType="search"
      />
      {onFilterPress && (
        <TouchableOpacity onPress={onFilterPress} style={styles.filterButton}>
          <SlidersHorizontal size={20} color={theme.text.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: spacing.searchBarHeight,
    borderRadius: spacing.searchBarBorderRadius,
    borderWidth: 1,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 12,
    padding: 4,
  },
});
