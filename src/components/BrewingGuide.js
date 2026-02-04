import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { 
  Thermometer, 
  Clock, 
  Scale, 
  Repeat, 
  Droplets,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Sun,
  Zap,
} from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { getBrewingGuide } from '../constants/brewingGuides';
import { useTheme } from '../context';

export const BrewingGuide = ({ tea }) => {
  const { theme, getTeaTypeColor } = useTheme();
  const [showAllTips, setShowAllTips] = useState(false);
  
  const guide = getBrewingGuide(tea);
  const teaColor = getTeaTypeColor(tea.teaType);
  
  const formatSteepTime = () => {
    const { min, max } = guide.steepTime;
    if (min === max) {
      return min < 1 ? `${Math.round(min * 60)} sec` : `${min} min`;
    }
    const minStr = min < 1 ? `${Math.round(min * 60)} sec` : `${min} min`;
    const maxStr = `${max} min`;
    return `${minStr} - ${maxStr}`;
  };
  
  const displayedTips = showAllTips ? guide.tips : guide.tips.slice(0, 2);
  
  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
        Brewing Guide
      </Text>
      
      {/* Parameter Cards */}
      <View style={styles.parametersGrid}>
        {/* Water Temperature */}
        <View style={[styles.paramCard, { 
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.light,
        }]}>
          <View style={[styles.paramIconContainer, { backgroundColor: teaColor.primary + '20' }]}>
            <Thermometer size={20} color={teaColor.primary} />
          </View>
          <Text style={[styles.paramLabel, { color: theme.text.secondary }]}>Water Temp</Text>
          <Text style={[styles.paramValue, { color: theme.text.primary }]}>
            {guide.waterTemp.fahrenheit}°F
          </Text>
          <Text style={[styles.paramSubvalue, { color: theme.text.tertiary }]}>
            {guide.waterTemp.celsius}°C
          </Text>
        </View>
        
        {/* Steep Time */}
        <View style={[styles.paramCard, { 
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.light,
        }]}>
          <View style={[styles.paramIconContainer, { backgroundColor: teaColor.primary + '20' }]}>
            <Clock size={20} color={teaColor.primary} />
          </View>
          <Text style={[styles.paramLabel, { color: theme.text.secondary }]}>Steep Time</Text>
          <Text style={[styles.paramValue, { color: theme.text.primary }]}>
            {formatSteepTime()}
          </Text>
        </View>
        
        {/* Leaf Amount */}
        <View style={[styles.paramCard, { 
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.light,
        }]}>
          <View style={[styles.paramIconContainer, { backgroundColor: teaColor.primary + '20' }]}>
            <Scale size={20} color={teaColor.primary} />
          </View>
          <Text style={[styles.paramLabel, { color: theme.text.secondary }]}>Leaf Amount</Text>
          <Text style={[styles.paramValue, { color: theme.text.primary }]} numberOfLines={2}>
            {guide.leafAmount}
          </Text>
        </View>
        
        {/* Infusions */}
        <View style={[styles.paramCard, { 
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.light,
        }]}>
          <View style={[styles.paramIconContainer, { backgroundColor: teaColor.primary + '20' }]}>
            <Repeat size={20} color={teaColor.primary} />
          </View>
          <Text style={[styles.paramLabel, { color: theme.text.secondary }]}>Infusions</Text>
          <Text style={[styles.paramValue, { color: theme.text.primary }]}>
            {guide.infusions === 1 ? '1 steep' : `Up to ${guide.infusions}`}
          </Text>
        </View>
      </View>
      
      {/* Water Type Recommendation */}
      <View style={[styles.waterNote, { 
        backgroundColor: theme.background.secondary,
        borderColor: theme.border.light,
      }]}>
        <Droplets size={16} color={theme.accent.primary} />
        <Text style={[styles.waterNoteText, { color: theme.text.secondary }]}>
          {guide.waterType}
        </Text>
      </View>
      
      {/* Best Time of Day & Caffeine */}
      <View style={styles.contextRow}>
        <View style={[styles.contextCard, { 
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.light,
        }]}>
          <Sun size={14} color={theme.accent.primary} />
          <Text style={[styles.contextText, { color: theme.text.secondary }]}>
            {guide.bestTimeOfDay}
          </Text>
        </View>
        <View style={[styles.contextCard, { 
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.light,
        }]}>
          <Zap size={14} color={theme.accent.primary} />
          <Text style={[styles.contextText, { color: theme.text.secondary }]} numberOfLines={2}>
            {guide.caffeineNote}
          </Text>
        </View>
      </View>
      
      {/* Pro Tips */}
      <View style={styles.tipsSection}>
        <View style={styles.tipsHeader}>
          <Lightbulb size={18} color={theme.accent.primary} />
          <Text style={[styles.tipsTitle, { color: theme.text.primary }]}>Pro Tips</Text>
        </View>
        
        <View style={styles.tipsList}>
          {displayedTips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <View style={[styles.tipBullet, { backgroundColor: teaColor.primary }]} />
              <Text style={[styles.tipText, { color: theme.text.secondary }]}>{tip}</Text>
            </View>
          ))}
        </View>
        
        {guide.tips.length > 2 && (
          <TouchableOpacity 
            style={styles.showMoreButton}
            onPress={() => setShowAllTips(!showAllTips)}
          >
            <Text style={[styles.showMoreText, { color: theme.accent.primary }]}>
              {showAllTips ? 'Show less' : `Show ${guide.tips.length - 2} more tips`}
            </Text>
            {showAllTips ? (
              <ChevronUp size={16} color={theme.accent.primary} />
            ) : (
              <ChevronDown size={16} color={theme.accent.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sectionSpacing,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 12,
  },
  parametersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  paramCard: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  paramIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  paramLabel: {
    ...typography.caption,
    marginBottom: 4,
  },
  paramValue: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  paramSubvalue: {
    ...typography.caption,
    marginTop: 2,
  },
  waterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  waterNoteText: {
    ...typography.bodySmall,
    flex: 1,
  },
  contextRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  contextCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  contextText: {
    ...typography.caption,
    flex: 1,
  },
  tipsSection: {
    marginTop: 4,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  tipsList: {
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  tipText: {
    ...typography.bodySmall,
    flex: 1,
    lineHeight: 20,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    marginTop: 8,
  },
  showMoreText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
});

export default BrewingGuide;
