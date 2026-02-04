import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { X, Check, Star } from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { useTheme } from '../context';
import { Button } from './Button';
import { useCompanies } from '../hooks';

const TEA_TYPES = [
  { id: 'all', label: 'All Types' },
  { id: 'black', label: 'Black' },
  { id: 'green', label: 'Green' },
  { id: 'oolong', label: 'Oolong' },
  { id: 'white', label: 'White' },
  { id: 'puerh', label: "Pu'erh" },
  { id: 'herbal', label: 'Herbal' },
];

const RATING_OPTIONS = [
  { id: 'all', label: 'Any Rating' },
  { id: '4', label: '4+ Stars', min: 4 },
  { id: '3', label: '3+ Stars', min: 3 },
  { id: '2', label: '2+ Stars', min: 2 },
];

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Best Match' },
  { id: 'rating', label: 'Highest Rated' },
  { id: 'reviews', label: 'Most Reviewed' },
  { id: 'name', label: 'Name (A-Z)' },
  { id: 'newest', label: 'Newest First' },
];

export const FilterModal = ({ 
  visible, 
  onClose, 
  filters, 
  onApplyFilters 
}) => {
  const { theme, getTeaTypeColor } = useTheme();
  const { companies } = useCompanies();
  
  const [localFilters, setLocalFilters] = useState({
    teaType: 'all',
    company: 'all',
    minRating: 'all',
    sortBy: 'relevance',
    ...filters,
  });

  useEffect(() => {
    if (visible) {
      setLocalFilters({
        teaType: 'all',
        company: 'all',
        minRating: 'all',
        sortBy: 'relevance',
        ...filters,
      });
    }
  }, [visible, filters]);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({
      teaType: 'all',
      company: 'all',
      minRating: 'all',
      sortBy: 'relevance',
    });
  };

  const updateFilter = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const activeFilterCount = [
    localFilters.teaType !== 'all',
    localFilters.company !== 'all',
    localFilters.minRating !== 'all',
  ].filter(Boolean).length;

  const renderOption = (id, label, selectedId, onSelect, showCheck = true) => {
    const isSelected = selectedId === id;
    return (
      <TouchableOpacity
        key={id}
        style={styles.option}
        onPress={() => onSelect(id)}
      >
        <Text style={[
          styles.optionText, 
          { color: isSelected ? theme.accent.primary : theme.text.primary },
          isSelected && { fontWeight: '600' }
        ]}>
          {label}
        </Text>
        {showCheck && isSelected && (
          <Check size={18} color={theme.accent.primary} />
        )}
      </TouchableOpacity>
    );
  };

  // Toggle filter value - tap selected to deselect (back to 'all')
  const toggleFilter = (key, value) => {
    if (localFilters[key] === value && value !== 'all') {
      updateFilter(key, 'all');
    } else {
      updateFilter(key, value);
    }
  };

  const renderTeaTypeOption = (type) => {
    const isSelected = localFilters.teaType === type.id;
    const teaColor = type.id !== 'all' ? getTeaTypeColor(type.id) : null;
    
    return (
      <TouchableOpacity
        key={type.id}
        style={[
          styles.teaTypeOption,
          { 
            backgroundColor: isSelected 
              ? (teaColor?.primary || theme.accent.primary)
              : theme.background.secondary,
            borderColor: isSelected 
              ? (teaColor?.primary || theme.accent.primary)
              : theme.border.light,
          },
        ]}
        onPress={() => toggleFilter('teaType', type.id)}
      >
        <Text style={[
          styles.teaTypeText,
          { color: isSelected ? theme.text.inverse : theme.text.primary },
          isSelected && { fontWeight: '600' },
        ]}>
          {type.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable 
          style={[styles.container, { backgroundColor: theme.background.primary }]} 
          onPress={e => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border.light }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text.primary }]}>Filters</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={[styles.resetText, { color: theme.accent.primary }]}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Tea Type */}
            <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
              <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Tea Type</Text>
              <View style={styles.teaTypeGrid}>
                {TEA_TYPES.map(renderTeaTypeOption)}
              </View>
            </View>

            {/* Company */}
            <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
              <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Brand / Shop</Text>
              <View style={styles.optionsList}>
                {renderOption('all', 'All Brands', localFilters.company, 
                  (v) => toggleFilter('company', v))}
                {companies.map(company => 
                  renderOption(
                    company.id, 
                    company.name, 
                    localFilters.company,
                    (v) => toggleFilter('company', v)
                  )
                )}
              </View>
            </View>

            {/* Rating */}
            <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
              <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Minimum Rating</Text>
              <View style={styles.ratingOptions}>
                {RATING_OPTIONS.map(option => {
                  const isSelected = localFilters.minRating === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.ratingOption,
                        { 
                          backgroundColor: isSelected ? theme.accent.primary : theme.background.secondary,
                          borderColor: isSelected ? theme.accent.primary : theme.border.light,
                        },
                      ]}
                      onPress={() => toggleFilter('minRating', option.id)}
                    >
                      {option.min && (
                        <Star 
                          size={14} 
                          color={isSelected ? theme.text.inverse : theme.rating.star}
                          fill={isSelected ? theme.text.inverse : theme.rating.star}
                        />
                      )}
                      <Text style={[
                        styles.ratingOptionText,
                        { color: isSelected ? theme.text.inverse : theme.text.primary },
                        isSelected && { fontWeight: '600' },
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Sort By */}
            <View style={[styles.section, { borderBottomColor: theme.border.light }]}>
              <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Sort By</Text>
              <View style={styles.optionsList}>
                {SORT_OPTIONS.map(option => 
                  renderOption(
                    option.id, 
                    option.label, 
                    localFilters.sortBy,
                    (v) => updateFilter('sortBy', v)
                  )
                )}
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Apply Button */}
          <View style={[styles.footer, { 
            backgroundColor: theme.background.primary,
            borderTopColor: theme.border.light,
          }]}>
            <Button
              title={activeFilterCount > 0 
                ? `Apply Filters (${activeFilterCount})` 
                : 'Apply Filters'}
              onPress={handleApply}
              variant="primary"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    ...typography.headingSmall,
  },
  resetText: {
    ...typography.body,
  },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
  },
  section: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  teaTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teaTypeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  teaTypeText: {
    ...typography.bodySmall,
  },
  optionsList: {
    gap: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  optionText: {
    ...typography.body,
  },
  ratingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  ratingOptionText: {
    ...typography.bodySmall,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.screenHorizontal,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
});

export default FilterModal;
