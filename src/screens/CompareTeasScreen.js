import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, X } from 'lucide-react-native';
import { typography, spacing, getPlaceholderImage } from '../constants';
import { StarRating, TeaTypeBadge, CaffeineIndicator, TeaPickerModal } from '../components';
import { useTheme } from '../context';

export const CompareTeasScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
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
  
  const ComparisonRow = ({ label, values, highlight = false }) => (
    <View style={[
      styles.comparisonRow, 
      { borderBottomColor: theme.border.light },
      highlight && { backgroundColor: theme.accent.primary + '10' }
    ]}>
      <Text style={[styles.rowLabel, { color: theme.text.secondary }]}>{label}</Text>
      <View style={styles.rowValues}>
        {values.map((value, index) => (
          <View key={index} style={[styles.rowValueCell, { borderLeftColor: theme.border.light }]}>
            {typeof value === 'string' || typeof value === 'number' ? (
              <Text style={[styles.rowValue, { color: theme.text.primary }]}>{value || '—'}</Text>
            ) : (
              value
            )}
          </View>
        ))}
      </View>
    </View>
  );
  
  const renderTeaHeader = (tea, index) => {
    if (!tea) {
      return (
        <TouchableOpacity 
          style={[styles.addTeaCard, { 
            backgroundColor: theme.background.secondary,
            borderColor: theme.border.medium,
          }]} 
          onPress={addTea}
        >
          <Plus size={32} color={theme.text.secondary} />
          <Text style={[styles.addTeaText, { color: theme.text.secondary }]}>Add Tea</Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <View style={[styles.teaHeaderCard, { backgroundColor: theme.background.secondary }]}>
        <TouchableOpacity 
          style={[styles.removeButton, { backgroundColor: theme.background.primary }]}
          onPress={() => removeTea(index)}
        >
          <X size={16} color={theme.text.secondary} />
        </TouchableOpacity>
        
        <View style={styles.teaImageContainer}>
          <Image 
            source={tea.imageUrl ? { uri: tea.imageUrl } : getPlaceholderImage(tea.teaType)} 
            style={styles.teaImage} 
          />
        </View>
        
        <Text style={[styles.teaName, { color: theme.text.primary }]} numberOfLines={2}>{tea.name}</Text>
        <Text style={[styles.teaBrand, { color: theme.text.secondary }]} numberOfLines={1}>{tea.brandName}</Text>
      </View>
    );
  };
  
  const slots = [teas[0] || null, teas[1] || null, teas[2] || null];
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border.light }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text.primary }]}>Compare Teas</Text>
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
          <View style={[styles.comparisonTable, { backgroundColor: theme.background.secondary }]}>
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
                  <Text style={[styles.ratingNumber, { color: theme.text.secondary }]}>
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
            <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>Select teas to compare</Text>
            <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
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

const styles = {
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    ...typography.headingSmall,
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
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 160,
  },
  addTeaCard: {
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addTeaText: {
    ...typography.bodySmall,
    marginTop: spacing.sm,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
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
  teaName: {
    ...typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  teaBrand: {
    ...typography.caption,
    textAlign: 'center',
  },
  comparisonTable: {
    marginHorizontal: spacing.screenHorizontal,
    borderRadius: spacing.cardBorderRadius,
    overflow: 'hidden',
  },
  comparisonRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    minHeight: 48,
  },
  rowLabel: {
    width: 80,
    ...typography.caption,
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
  },
  rowValue: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  ratingCell: {
    alignItems: 'center',
    gap: 4,
  },
  ratingNumber: {
    ...typography.caption,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.headingSmall,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
  },
};

export default CompareTeasScreen;
