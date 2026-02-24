import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, getTeaTypeColor } from '../constants';
import { TeaTypeBadge } from './TeaTypeBadge';

/**
 * Deterministically select a "tea of the day" based on date
 * So everyone sees the same tea on the same day
 */
const getTeaOfTheDay = (teas, date = new Date()) => {
  if (!teas || teas.length === 0) return null;
  
  // Use date as seed for pseudo-random selection
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const seed = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // All teas are eligible (ratings removed)
  const eligibleTeas = teas.filter(t => t.imageUrl); // prefer teas with images
  if (eligibleTeas.length === 0) return teas[0];
  
  const index = seed % eligibleTeas.length;
  return eligibleTeas[index];
};

export const TeaOfTheDay = ({ teas, onPress }) => {
  const tea = useMemo(() => getTeaOfTheDay(teas), [teas]);
  
  if (!tea) return null;
  
  const teaColor = getTeaTypeColor(tea.teaType);
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress(tea)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[teaColor.primary, teaColor.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.badge}>
            <Sparkles size={14} color={colors.text.inverse} />
            <Text style={styles.badgeText}>Tea of the Day</Text>
          </View>
          <ChevronRight size={20} color={colors.text.inverse} />
        </View>
        
        <View style={styles.content}>
          <View style={styles.info}>
            <Text style={styles.teaName} numberOfLines={2}>{tea.name}</Text>
            <Text style={styles.brandName}>{tea.brandName}</Text>
            
            <View style={styles.meta}>
              <TeaTypeBadge teaType={tea.teaType} size="small" inverted />
            </View>
          </View>
          
          {tea.imageUrl && (
            <Image 
              source={{ uri: tea.imageUrl }} 
              style={styles.image}
              resizeMode="cover"
            />
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.screenHorizontal,
    borderRadius: spacing.cardBorderRadius,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  gradient: {
    padding: spacing.cardPaddingLarge,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    paddingRight: spacing.md,
  },
  teaName: {
    ...typography.headingSmall,
    color: colors.text.inverse,
    marginBottom: 4,
  },
  brandName: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});

export default TeaOfTheDay;
