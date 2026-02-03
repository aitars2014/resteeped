import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Plus, X, Thermometer, Clock, Zap } from 'lucide-react-native';
import { colors, typography, spacing, getTeaTypeColor, getPlaceholderImage } from '../constants';
import { StarRating, TeaTypeBadge, CaffeineIndicator, TeaPickerModal } from '../components';

const ComparisonRow = ({ label, values, highlight = false }) => (
  <View style={[styles.comparisonRow, highlight && styles.highlightRow]}>
    <Text style={styles.rowLabel}>{label}</Text>
    <View style={styles.rowValues}>
      {values.map((value, index) => (
        <View key={index} style={styles.rowValueCell}>
          {typeof value === 'string' || typeof value === 'number' ? (
            <Text style={styles.rowValue}>{value || '—'}</Text>
          ) : (
            value
          )}
        </View>
      ))}
    </View>
  </View>
);

export const CompareTeasScreen = ({ route, navigation }) => {
  const { initialTeas = [] } = route.params || {};
  const [teas, setTeas] = useState(initialTeas.slice(0, 3));
  const [showPicker, setShowPicker] = useState(false);
  
  const removeTea = (index) => {
    setTeas(prev => prev.filter((_, i) => i !== index));
  };
  
  const addTea = () => {
    setShowPicker(true);
  };
  
  const handleSelectTea = (tea) => {
    if (!teas.find(t => t.id === tea.id)) {
      setTeas(prev => [...prev, tea].slice(0, 3));
    }
  };
  
  const renderTeaHeader = (tea, index) => {
    if (!tea) {
      return (
        <TouchableOpacity style={styles.addTeaCard} onPress={addTea}>
          <Plus size={32} color={colors.text.secondary} />
          <Text style={styles.addTeaText}>Add Tea</Text>
        </TouchableOpacity>
      );
    }
    
    const teaColor = getTeaTypeColor(tea.teaType);
    
    return (
      <View style={styles.teaHeaderCard}>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeTea(index)}
        >
          <X size={16} color={colors.text.secondary} />
        </TouchableOpacity>
        
        <View style={styles.teaImageContainer}>
          <Image 
            source={tea.imageUrl ? { uri: tea.imageUrl } : getPlaceholderImage(tea.teaType)} 
            style={styles.teaImage} 
          />
        </View>
        
        <Text style={styles.teaName} numberOfLines={2}>{tea.name}</Text>
        <Text style={styles.teaBrand} numberOfLines={1}>{tea.brandName}</Text>
      </View>
    );
  };
  
  const slots = [teas[0] || null, teas[1] || null, teas[2] || null];
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Compare Teas</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Tea Headers */}
        <View style={styles.teaHeaders}>
          {slots.map((tea, index) => (
            <View key={index} style={styles.teaHeaderWrapper}>
              {renderTeaHeader(tea, index)}
            </View>
          ))}
        </View>
        
        {teas.length >= 2 && (
          <View style={styles.comparisonTable}>
            {/* Type */}
            <ComparisonRow
              label="Type"
              values={slots.map(tea => tea ? (
                <TeaTypeBadge teaType={tea.teaType} size="small" />
              ) : null)}
            />
            
            {/* Rating */}
            <ComparisonRow
              label="Rating"
              highlight
              values={slots.map(tea => tea ? (
                <View style={styles.ratingCell}>
                  <StarRating rating={tea.avgRating || 0} size={12} />
                  <Text style={styles.ratingNumber}>
                    {(tea.avgRating || 0).toFixed(1)}
                  </Text>
                </View>
              ) : null)}
            />
            
            {/* Temperature */}
            <ComparisonRow
              label="Steep Temp"
              values={slots.map(tea => 
                tea?.steepTempF ? `${tea.steepTempF}°F` : null
              )}
            />
            
            {/* Steep Time */}
            <ComparisonRow
              label="Steep Time"
              values={slots.map(tea => {
                if (!tea?.steepTimeMin) return null;
                if (tea.steepTimeMax) return `${tea.steepTimeMin}-${tea.steepTimeMax} min`;
                return `${tea.steepTimeMin} min`;
              })}
            />
            
            {/* Caffeine */}
            <ComparisonRow
              label="Caffeine"
              highlight
              values={slots.map(tea => tea ? (
                <CaffeineIndicator teaType={tea.teaType} size="small" showLabel={false} />
              ) : null)}
            />
            
            {/* Origin */}
            <ComparisonRow
              label="Origin"
              values={slots.map(tea => tea?.origin || null)}
            />
            
            {/* Flavor Notes */}
            <ComparisonRow
              label="Flavors"
              values={slots.map(tea => 
                tea?.flavorNotes?.slice(0, 3).join(', ') || null
              )}
            />
          </View>
        )}
        
        {teas.length < 2 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Select teas to compare</Text>
            <Text style={styles.emptySubtitle}>
              Add at least 2 teas to see a side-by-side comparison
            </Text>
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
      
      {/* Tea Picker Modal */}
      <TeaPickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleSelectTea}
        excludeIds={teas.map(t => t.id)}
        title="Add Tea to Compare"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    ...typography.headingSmall,
    color: colors.text.primary,
  },
  teaHeaders: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  teaHeaderWrapper: {
    flex: 1,
  },
  teaHeaderCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 160,
  },
  addTeaCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
  },
  addTeaText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  teaImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  teaImage: {
    width: '100%',
    height: '100%',
  },
  teaImagePlaceholder: {
    width: '100%',
    height: '100%',
  },
  teaName: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  teaBrand: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  comparisonTable: {
    marginHorizontal: spacing.screenHorizontal,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardBorderRadius,
    overflow: 'hidden',
  },
  comparisonRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    minHeight: 48,
  },
  highlightRow: {
    backgroundColor: colors.accent.primary + '08',
  },
  rowLabel: {
    width: 80,
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
    padding: spacing.sm,
    alignSelf: 'center',
  },
  rowValues: {
    flex: 1,
    flexDirection: 'row',
  },
  rowValueCell: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border.light,
  },
  rowValue: {
    ...typography.bodySmall,
    color: colors.text.primary,
    textAlign: 'center',
  },
  ratingCell: {
    alignItems: 'center',
    gap: 4,
  },
  ratingNumber: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.headingSmall,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default CompareTeasScreen;
