import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, getTeaTypeColor } from '../constants';
import { TeaTypeBadge } from './TeaTypeBadge';

/**
 * Simple deterministic hash (djb2) for better distribution than char-code sum.
 */
const hashString = (str) => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
};

/**
 * Deterministically select a "tea of the day" based on date.
 * Ensures shop diversity: picks a brand first (rotating through all brands),
 * then picks a tea from that brand. Everyone sees the same tea on the same day.
 */
const getTeaOfTheDay = (teas, date = new Date()) => {
  if (!teas || teas.length === 0) return null;

  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const daySeed = hashString(dateStr);

  // Only consider teas with images
  const eligible = teas.filter(t => t.imageUrl);
  if (eligible.length === 0) return teas[0];

  // Group by brand for shop diversity
  const brandMap = {};
  for (const t of eligible) {
    const brand = t.brandName || 'Unknown';
    if (!brandMap[brand]) brandMap[brand] = [];
    brandMap[brand].push(t);
  }

  // Sort brand names for stable ordering
  const brands = Object.keys(brandMap).sort();
  if (brands.length === 0) return eligible[0];

  // Pick today's brand, then today's tea within that brand
  const brandIndex = daySeed % brands.length;
  const brand = brands[brandIndex];
  const brandTeas = brandMap[brand];
  const teaSeed = hashString(dateStr + ':tea');
  const teaIndex = teaSeed % brandTeas.length;

  return brandTeas[teaIndex];
};

const TEA_OF_DAY_KEY = '@resteeped_tea_of_day';

export const TeaOfTheDay = ({ teas, onPress }) => {
  const [tea, setTea] = useState(null);
  const lastResolvedDate = useRef(null);
  const resolving = useRef(false);

  useEffect(() => {
    if (!teas || teas.length === 0 || resolving.current) return;

    const today = new Date().toISOString().split('T')[0];
    if (lastResolvedDate.current === today) return;

    resolving.current = true;

    (async () => {
      try {
        const cached = await AsyncStorage.getItem(TEA_OF_DAY_KEY);
        if (cached) {
          const { date, teaId } = JSON.parse(cached);
          if (date === today) {
            const found = teas.find(t => t.id === teaId);
            if (found) {
              lastResolvedDate.current = today;
              setTea(found);
              return;
            }
          }
        }
      } catch {}

      // Select new tea for today
      const selected = getTeaOfTheDay(teas);
      if (selected) {
        lastResolvedDate.current = today;
        setTea(selected);
        AsyncStorage.setItem(TEA_OF_DAY_KEY, JSON.stringify({ date: today, teaId: selected.id })).catch(() => {});
      }
    })()
      .finally(() => {
        resolving.current = false;
      });
  }, [teas]);
  
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
