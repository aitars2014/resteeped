import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { 
  Heart, 
  Zap, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  Beaker,
} from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { getHealthBenefits, getCaffeineDescription, getAntioxidantColor } from '../constants/healthBenefits';
import { useTheme } from '../context';

export const HealthBenefits = ({ tea }) => {
  const { theme, getTeaTypeColor } = useTheme();
  const [showCompounds, setShowCompounds] = useState(false);
  
  const benefits = getHealthBenefits(tea);
  const teaColor = getTeaTypeColor(tea.teaType);
  
  // Caffeine level indicator
  const getCaffeineBars = () => {
    const levels = {
      none: 0,
      low: 1,
      moderate: 2,
      high: 3,
    };
    return levels[benefits.caffeineLevel] || 2;
  };
  
  const caffeineLevel = getCaffeineBars();
  
  // Antioxidant level indicator
  const getAntioxidantBars = () => {
    const levels = {
      low: 1,
      moderate: 2,
      high: 3,
      'very-high': 4,
      varies: 2,
    };
    return levels[benefits.antioxidants] || 2;
  };
  
  const antioxidantLevel = getAntioxidantBars();
  
  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
        Health & Wellness
      </Text>
      
      {/* Caffeine & Antioxidant Row */}
      <View style={styles.metricsRow}>
        {/* Caffeine Meter */}
        <View style={[styles.metricCard, { 
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.light,
        }]}>
          <View style={styles.metricHeader}>
            <Zap size={16} color={teaColor.primary} />
            <Text style={[styles.metricLabel, { color: theme.text.secondary }]}>Caffeine</Text>
          </View>
          <View style={styles.meterContainer}>
            {[1, 2, 3].map((bar) => (
              <View
                key={bar}
                style={[
                  styles.meterBar,
                  { backgroundColor: theme.border.light },
                  bar <= caffeineLevel && { backgroundColor: teaColor.primary },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.metricValue, { color: theme.text.primary }]}>
            {getCaffeineDescription(benefits.caffeineLevel)}
          </Text>
          <Text style={[styles.metricSubvalue, { color: theme.text.tertiary }]}>
            {benefits.caffeineRange} per cup
          </Text>
        </View>
        
        {/* Antioxidant Meter */}
        <View style={[styles.metricCard, { 
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.light,
        }]}>
          <View style={styles.metricHeader}>
            <Sparkles size={16} color={getAntioxidantColor(benefits.antioxidants, theme)} />
            <Text style={[styles.metricLabel, { color: theme.text.secondary }]}>Antioxidants</Text>
          </View>
          <View style={styles.meterContainer}>
            {[1, 2, 3, 4].map((bar) => (
              <View
                key={bar}
                style={[
                  styles.meterBarSmall,
                  { backgroundColor: theme.border.light },
                  bar <= antioxidantLevel && { backgroundColor: getAntioxidantColor(benefits.antioxidants, theme) },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.metricValue, { color: theme.text.primary }]}>
            {benefits.antioxidants === 'very-high' ? 'Very High' : 
             benefits.antioxidants.charAt(0).toUpperCase() + benefits.antioxidants.slice(1)}
          </Text>
          {benefits.antioxidantTypes.length > 0 && (
            <Text style={[styles.metricSubvalue, { color: theme.text.tertiary }]} numberOfLines={1}>
              {benefits.antioxidantTypes.slice(0, 2).join(', ')}
            </Text>
          )}
        </View>
      </View>
      
      {/* Benefits Grid */}
      <View style={styles.benefitsGrid}>
        {benefits.benefits.map((benefit, index) => (
          <View 
            key={index} 
            style={[styles.benefitCard, { 
              backgroundColor: theme.background.secondary,
              borderColor: theme.border.light,
            }]}
          >
            <Text style={styles.benefitIcon}>{benefit.icon}</Text>
            <Text style={[styles.benefitTitle, { color: theme.text.primary }]}>
              {benefit.title}
            </Text>
            <Text style={[styles.benefitDescription, { color: theme.text.secondary }]} numberOfLines={2}>
              {benefit.description}
            </Text>
          </View>
        ))}
      </View>
      
      {/* Key Compounds (Expandable) */}
      <TouchableOpacity 
        style={[styles.compoundsToggle, { borderColor: theme.border.light }]}
        onPress={() => setShowCompounds(!showCompounds)}
      >
        <View style={styles.compoundsHeader}>
          <Beaker size={16} color={theme.accent.primary} />
          <Text style={[styles.compoundsTitle, { color: theme.text.primary }]}>
            Key Compounds
          </Text>
        </View>
        {showCompounds ? (
          <ChevronUp size={18} color={theme.text.secondary} />
        ) : (
          <ChevronDown size={18} color={theme.text.secondary} />
        )}
      </TouchableOpacity>
      
      {showCompounds && (
        <View style={[styles.compoundsList, { 
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.light,
        }]}>
          {benefits.compounds.map((compound, index) => (
            <View 
              key={index} 
              style={[
                styles.compoundItem,
                index !== benefits.compounds.length - 1 && { borderBottomColor: theme.border.light, borderBottomWidth: 1 },
              ]}
            >
              <Text style={[styles.compoundName, { color: theme.text.primary }]}>
                {compound.name}
              </Text>
              <View style={[styles.compoundAmount, { backgroundColor: teaColor.primary + '20' }]}>
                <Text style={[styles.compoundAmountText, { color: teaColor.primary }]}>
                  {compound.amount}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
      
      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Info size={12} color={theme.text.tertiary} />
        <Text style={[styles.disclaimerText, { color: theme.text.tertiary }]}>
          General wellness information. Not medical advice.
        </Text>
      </View>
      
      {/* Note for herbal teas */}
      {benefits.note && (
        <Text style={[styles.noteText, { color: theme.text.secondary }]}>
          ℹ️ {benefits.note}
        </Text>
      )}
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
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  metricLabel: {
    ...typography.caption,
    fontWeight: '500',
  },
  meterContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  meterBar: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  meterBarSmall: {
    width: 18,
    height: 8,
    borderRadius: 4,
  },
  metricValue: {
    ...typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
  },
  metricSubvalue: {
    ...typography.caption,
    marginTop: 2,
    textAlign: 'center',
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  benefitCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  benefitIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  benefitTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitDescription: {
    ...typography.caption,
    lineHeight: 16,
  },
  compoundsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  compoundsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compoundsTitle: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  compoundsList: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    overflow: 'hidden',
  },
  compoundItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  compoundName: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  compoundAmount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compoundAmountText: {
    ...typography.caption,
    fontWeight: '600',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  disclaimerText: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  noteText: {
    ...typography.caption,
    marginTop: 8,
    paddingHorizontal: 4,
  },
});

export default HealthBenefits;
