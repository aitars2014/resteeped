import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Snowflake, Sun, Leaf, Flower2 } from 'lucide-react-native';
import { colors, typography, spacing } from '../constants';
import { TeaCard } from './TeaCard';

// Seasonal tea recommendations
const SEASONS = {
  winter: {
    name: 'Winter Warmers',
    icon: Snowflake,
    description: 'Rich, warming teas for cold days',
    colors: ['#4A90A4', '#2C5F7C'],
    months: [12, 1, 2],
    teaTypes: ['black', 'puerh', 'oolong'],
    keywords: ['warming', 'spicy', 'rich', 'bold', 'malty', 'chocolate', 'cinnamon'],
  },
  spring: {
    name: 'Spring Greens',
    icon: Flower2,
    description: 'Fresh, delicate teas for renewal',
    colors: ['#7CB89D', '#4A9B7F'],
    months: [3, 4, 5],
    teaTypes: ['green', 'white'],
    keywords: ['fresh', 'floral', 'light', 'grassy', 'vegetal', 'jasmine', 'delicate'],
  },
  summer: {
    name: 'Summer Refreshers',
    icon: Sun,
    description: 'Cool, refreshing teas for hot days',
    colors: ['#F4A460', '#E8952D'],
    months: [6, 7, 8],
    teaTypes: ['green', 'white', 'herbal'],
    keywords: ['refreshing', 'citrus', 'mint', 'fruity', 'light', 'iced', 'cool'],
  },
  fall: {
    name: 'Autumn Harvest',
    icon: Leaf,
    description: 'Earthy, comforting teas for cozy days',
    colors: ['#D2691E', '#8B4513'],
    months: [9, 10, 11],
    teaTypes: ['oolong', 'black', 'puerh'],
    keywords: ['earthy', 'roasted', 'nutty', 'honey', 'caramel', 'woody', 'toasted'],
  },
};

const getCurrentSeason = () => {
  const month = new Date().getMonth() + 1;
  for (const [key, season] of Object.entries(SEASONS)) {
    if (season.months.includes(month)) {
      return key;
    }
  }
  return 'winter';
};

const getSeasonalTeas = (teas, seasonKey) => {
  const season = SEASONS[seasonKey];
  if (!season || !teas) return [];
  
  return teas
    .filter(tea => {
      // Match by tea type
      const typeMatch = season.teaTypes.includes(tea.teaType?.toLowerCase());
      
      // Match by keywords in flavor notes or description
      const flavorNotes = (tea.flavorNotes || []).map(f => f.toLowerCase());
      const description = (tea.description || '').toLowerCase();
      const keywordMatch = season.keywords.some(kw => 
        flavorNotes.some(fn => fn.includes(kw)) || description.includes(kw)
      );
      
      return typeMatch || keywordMatch;
    })
    .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
    .slice(0, 8);
};

export const SeasonalHighlights = ({ teas, onTeaPress, onSeeAll }) => {
  const currentSeason = useMemo(() => getCurrentSeason(), []);
  const season = SEASONS[currentSeason];
  const seasonalTeas = useMemo(() => getSeasonalTeas(teas, currentSeason), [teas, currentSeason]);
  
  if (seasonalTeas.length === 0) return null;
  
  const Icon = season.icon;
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity 
        style={styles.headerCard}
        onPress={onSeeAll}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={season.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <Icon size={28} color={colors.text.inverse} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.seasonName}>{season.name}</Text>
              <Text style={styles.seasonDescription}>{season.description}</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
      
      {/* Tea list */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.teaList}
      >
        {seasonalTeas.map(tea => (
          <View key={tea.id} style={styles.teaCardWrapper}>
            <TeaCard tea={tea} onPress={() => onTeaPress(tea)} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sectionSpacing,
  },
  headerCard: {
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
    borderRadius: spacing.cardBorderRadius,
    overflow: 'hidden',
  },
  headerGradient: {
    padding: spacing.cardPadding,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  seasonName: {
    ...typography.headingSmall,
    color: colors.text.inverse,
    marginBottom: 2,
  },
  seasonDescription: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
  },
  teaList: {
    paddingHorizontal: spacing.screenHorizontal,
    gap: spacing.cardGap,
  },
  teaCardWrapper: {
    width: 160,
  },
});

export default SeasonalHighlights;
