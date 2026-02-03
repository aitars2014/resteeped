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
import { X, Check, ChevronDown, Star } from 'lucide-react-native';
import { colors, typography, spacing, getTeaTypeColor } from '../constants';
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
  { id: 'rating', label: 'Highest Rated' },
  { id: 'name', label: 'Name (A-Z)' },
  { id: 'newest', label: 'Newest First' },
  { id: 'reviews', label: 'Most Reviewed' },
];

export const FilterModal = ({ 
  visible, 
  onClose, 
  filters, 
  onApplyFilters 
}) => {
  const { companies } = useCompanies();
  
  // Local state for editing filters
  const [localFilters, setLocalFilters] = useState({
    teaType: 'all',
    company: 'all',
    minRating: 'all',
    sortBy: 'rating',
    ...filters,
  });

  // Sync with external filters when modal opens
  useEffect(() => {
    if (visible) {
      setLocalFilters({
        teaType: 'all',
        company: 'all',
        minRating: 'all',
        sortBy: 'rating',
        ...filters,
      });
    }
  }, [visible, filters]);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      teaType: 'all',
      company: 'all',
      minRating: 'all',
      sortBy: 'rating',
    };
    setLocalFilters(resetFilters);
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
        style={[styles.option, isSelected && styles.optionSelected]}
        onPress={() => onSelect(id)}
      >
        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
          {label}
        </Text>
        {showCheck && isSelected && (
          <Check size={18} color={colors.accent.primary} />
        )}
      </TouchableOpacity>
    );
  };

  const renderTeaTypeOption = (type) => {
    const isSelected = localFilters.teaType === type.id;
    const teaColor = type.id !== 'all' ? getTeaTypeColor(type.id) : null;
    
    return (
      <TouchableOpacity
        key={type.id}
        style={[
          styles.teaTypeOption,
          isSelected && styles.teaTypeOptionSelected,
          isSelected && teaColor && { backgroundColor: teaColor.primary },
        ]}
        onPress={() => updateFilter('teaType', type.id)}
      >
        <Text style={[
          styles.teaTypeText,
          isSelected && styles.teaTypeTextSelected,
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
        <Pressable style={styles.container} onPress={e => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Tea Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tea Type</Text>
              <View style={styles.teaTypeGrid}>
                {TEA_TYPES.map(renderTeaTypeOption)}
              </View>
            </View>

            {/* Company */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Brand / Shop</Text>
              <View style={styles.optionsList}>
                {renderOption('all', 'All Brands', localFilters.company, 
                  (v) => updateFilter('company', v))}
                {companies.map(company => 
                  renderOption(
                    company.id, 
                    company.name, 
                    localFilters.company,
                    (v) => updateFilter('company', v)
                  )
                )}
              </View>
            </View>

            {/* Rating */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Minimum Rating</Text>
              <View style={styles.ratingOptions}>
                {RATING_OPTIONS.map(option => {
                  const isSelected = localFilters.minRating === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.ratingOption,
                        isSelected && styles.ratingOptionSelected,
                      ]}
                      onPress={() => updateFilter('minRating', option.id)}
                    >
                      {option.min && (
                        <Star 
                          size={14} 
                          color={isSelected ? colors.text.inverse : colors.rating.star}
                          fill={isSelected ? colors.text.inverse : colors.rating.star}
                        />
                      )}
                      <Text style={[
                        styles.ratingOptionText,
                        isSelected && styles.ratingOptionTextSelected,
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Sort By */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort By</Text>
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
          <View style={styles.footer}>
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
    backgroundColor: colors.background.primary,
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
    borderBottomColor: colors.border.light,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    ...typography.headingSmall,
    color: colors.text.primary,
  },
  resetText: {
    ...typography.body,
    color: colors.accent.primary,
  },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
  },
  section: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sectionTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.secondary,
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
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  teaTypeOptionSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  teaTypeText: {
    ...typography.bodySmall,
    color: colors.text.primary,
  },
  teaTypeTextSelected: {
    color: colors.text.inverse,
    fontWeight: '600',
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
  optionSelected: {
    // backgroundColor: colors.background.secondary,
  },
  optionText: {
    ...typography.body,
    color: colors.text.primary,
  },
  optionTextSelected: {
    color: colors.accent.primary,
    fontWeight: '600',
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
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  ratingOptionSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  ratingOptionText: {
    ...typography.bodySmall,
    color: colors.text.primary,
  },
  ratingOptionTextSelected: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.screenHorizontal,
    paddingBottom: 34,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});

export default FilterModal;
