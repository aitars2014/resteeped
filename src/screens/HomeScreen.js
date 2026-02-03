import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, ChevronRight, Star, TrendingUp, Award, Sparkles, Coffee } from 'lucide-react-native';
import { colors, typography, spacing } from '../constants';
import { TeaCard, TeaTypeBadge, TeaOfTheDay, SeasonalHighlights } from '../components';
import { useTeas, useCompanies, useRecommendations } from '../hooks';
import { useTheme } from '../context';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.42;

// Tea type categories for browsing
const TEA_TYPES = [
  { type: 'black', name: 'Black', emoji: '🫖' },
  { type: 'green', name: 'Green', emoji: '🍃' },
  { type: 'oolong', name: 'Oolong', emoji: '🌿' },
  { type: 'white', name: 'White', emoji: '🤍' },
  { type: 'puerh', name: "Pu'erh", emoji: '🏔️' },
  { type: 'herbal', name: 'Herbal', emoji: '🌸' },
];

export const HomeScreen = ({ navigation }) => {
  const { theme, getTeaTypeColor } = useTheme();
  const { teas, loading: teasLoading, refreshTeas } = useTeas();
  const { companies, loading: companiesLoading } = useCompanies();
  const { forYou, explore, hasPreferences, preferences } = useRecommendations(8);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dynamic theme styles
  const themedStyles = {
    container: { backgroundColor: theme.background.primary },
    searchBar: { 
      backgroundColor: theme.background.secondary,
      borderColor: theme.border.light,
    },
    searchInput: { color: theme.text.primary },
    text: { color: theme.text.primary },
    textSecondary: { color: theme.text.secondary },
    accent: { color: theme.accent.primary },
    card: { backgroundColor: theme.background.secondary },
    logoIcon: { backgroundColor: theme.accent.primary },
  };

  // Get featured teas (highest rated)
  const featuredTeas = teas
    .filter(t => t.avgRating >= 4.0 || t.avg_rating >= 4.0)
    .sort((a, b) => (b.avgRating || b.avg_rating || 0) - (a.avgRating || a.avg_rating || 0))
    .slice(0, 8);

  // Get trending teas (most reviews/recent activity - for now, random selection with good ratings)
  const trendingTeas = teas
    .filter(t => (t.ratingCount || t.rating_count || 0) > 0)
    .sort((a, b) => (b.ratingCount || b.rating_count || 0) - (a.ratingCount || a.rating_count || 0))
    .slice(0, 8);

  // Get new arrivals (most recently added)
  const newTeas = [...teas]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 8);

  // Featured company (highest rated or most teas)
  const featuredCompany = companies
    .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))[0];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshTeas();
    setRefreshing(false);
  }, [refreshTeas]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Discover', {
        screen: 'DiscoveryHome',
        params: { initialSearch: searchQuery.trim() }
      });
    } else {
      navigation.navigate('Discover');
    }
  };

  const handleTeaTypePress = (teaType) => {
    navigation.navigate('Discover', {
      screen: 'DiscoveryHome',
      params: { initialFilter: teaType }
    });
  };

  const handleSeeAll = (section) => {
    navigation.navigate('Discover', {
      screen: 'DiscoveryHome',
      params: { initialSection: section }
    });
  };

  const renderTeaTypeButton = ({ type, name, emoji }) => {
    const typeColor = getTeaTypeColor(type);
    return (
      <TouchableOpacity
        key={type}
        style={styles.teaTypeButton}
        onPress={() => handleTeaTypePress(type)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[typeColor.primary, typeColor.gradient]}
          style={styles.teaTypeGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.teaTypeEmoji}>{emoji}</Text>
        </LinearGradient>
        <Text style={styles.teaTypeName}>{name}</Text>
      </TouchableOpacity>
    );
  };

  const renderHorizontalTeaList = (teaList, emptyMessage) => {
    if (teaList.length === 0) {
      return (
        <View style={styles.emptySection}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {teaList.map((tea) => (
          <TeaCard
            key={tea.id}
            tea={tea}
            onPress={() => navigation.navigate('TeaDetail', { tea })}
            style={styles.horizontalTeaCard}
            compact
          />
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.accent.primary}
          />
        }
      >
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={[styles.logoIcon, themedStyles.logoIcon]}>
              <Coffee size={28} color={theme.text.inverse} />
            </View>
            <View>
              <Text style={[styles.appName, { color: theme.accent.primary }]}>Resteeped</Text>
              <Text style={[styles.tagline, themedStyles.textSecondary]}>Discover your next favorite tea</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchContainer}
          onPress={handleSearch}
          activeOpacity={0.8}
        >
          <View style={[styles.searchBar, themedStyles.searchBar]}>
            <Search size={20} color={theme.text.secondary} />
            <TextInput
              style={[styles.searchInput, themedStyles.searchInput]}
              placeholder="Search teas, brands, flavors..."
              placeholderTextColor={theme.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
        </TouchableOpacity>

        {/* Tea of the Day */}
        {teas.length > 0 && (
          <View style={styles.section}>
            <TeaOfTheDay 
              teas={teas} 
              onPress={(tea) => navigation.navigate('TeaDetail', { tea })}
            />
          </View>
        )}

        {/* Seasonal Highlights */}
        <SeasonalHighlights
          teas={teas}
          onTeaPress={(tea) => navigation.navigate('TeaDetail', { tea })}
          onSeeAll={() => handleSeeAll('seasonal')}
        />

        {/* Browse by Tea Type */}
        <View style={styles.section}>
          <Text style={styles.browseTitle}>Browse by Type</Text>
          <View style={styles.teaTypeGrid}>
            {TEA_TYPES.map(renderTeaTypeButton)}
          </View>
        </View>

        {/* For You - Personalized Recommendations */}
        {hasPreferences && forYou.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Sparkles size={18} color={colors.accent.primary} />
                <Text style={styles.sectionTitle}>For You</Text>
              </View>
              <TouchableOpacity onPress={() => handleSeeAll('forYou')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.recommendationHint}>
              Based on your love of {preferences.types.slice(0, 2).join(' & ')} teas
            </Text>
            {renderHorizontalTeaList(forYou, 'Rate more teas to get personalized recommendations')}
          </View>
        )}

        {/* Explore Something New */}
        {hasPreferences && explore.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Search size={18} color={colors.accent.primary} />
                <Text style={styles.sectionTitle}>Try Something New</Text>
              </View>
            </View>
            <Text style={styles.recommendationHint}>
              Different from your usual — expand your palate
            </Text>
            {renderHorizontalTeaList(explore.slice(0, 6), 'Start rating teas to unlock recommendations')}
          </View>
        )}

        {/* Featured Teas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Star size={18} color={colors.accent.primary} />
              <Text style={styles.sectionTitle}>Featured Teas</Text>
            </View>
            <TouchableOpacity onPress={() => handleSeeAll('featured')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {renderHorizontalTeaList(featuredTeas, 'No featured teas yet')}
        </View>

        {/* Trending Now */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <TrendingUp size={18} color={colors.accent.primary} />
              <Text style={styles.sectionTitle}>Trending Now</Text>
            </View>
            <TouchableOpacity onPress={() => handleSeeAll('trending')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {renderHorizontalTeaList(trendingTeas, 'Check back for trending teas')}
        </View>

        {/* Featured Tea Shop */}
        {featuredCompany && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Award size={18} color={colors.accent.primary} />
                <Text style={styles.sectionTitle}>Featured Shop</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.featuredShopCard}
              onPress={() => navigation.navigate('CompanyProfile', { company: featuredCompany })}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.accent.primary, colors.accent.secondary]}
                style={styles.featuredShopGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.featuredShopContent}>
                  <View style={styles.featuredShopInfo}>
                    <Text style={styles.featuredShopName}>{featuredCompany.name}</Text>
                    <Text style={styles.featuredShopDescription} numberOfLines={2}>
                      {featuredCompany.short_description || featuredCompany.description}
                    </Text>
                    <View style={styles.featuredShopStats}>
                      <View style={styles.featuredShopStat}>
                        <Star size={14} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.featuredShopStatText}>
                          {(featuredCompany.avg_rating || 0).toFixed(1)}
                        </Text>
                      </View>
                      <Text style={styles.featuredShopStatDivider}>•</Text>
                      <Text style={styles.featuredShopStatText}>
                        {featuredCompany.tea_count || 0} teas
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={24} color={colors.text.inverse} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* New Arrivals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>New Arrivals</Text>
            <TouchableOpacity onPress={() => handleSeeAll('new')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {renderHorizontalTeaList(newTeas, 'New teas coming soon')}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Discover')}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{teas.length}</Text>
            <Text style={styles.statLabel}>Teas to Explore</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('TeaShops')}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{companies.length}</Text>
            <Text style={styles.statLabel}>Tea Shops</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.searchBarBorderRadius,
    paddingHorizontal: spacing.searchBarPaddingH,
    height: spacing.searchBarHeight,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    ...typography.body,
    color: colors.text.primary,
  },
  section: {
    marginBottom: spacing.sectionSpacing,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  browseTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
  },
  seeAllText: {
    ...typography.bodySmall,
    color: colors.accent.primary,
    fontWeight: '500',
  },
  recommendationHint: {
    ...typography.caption,
    color: colors.text.secondary,
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  teaTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screenHorizontal,
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  teaTypeButton: {
    alignItems: 'center',
    width: (width - (spacing.screenHorizontal * 2) - 40) / 6,
    paddingVertical: spacing.xs,
  },
  teaTypeGradient: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  teaTypeEmoji: {
    fontSize: 26,
  },
  teaTypeName: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  horizontalList: {
    paddingHorizontal: spacing.screenHorizontal,
    gap: spacing.cardGap,
  },
  horizontalTeaCard: {
    width: CARD_WIDTH,
  },
  emptySection: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  featuredShopCard: {
    marginHorizontal: spacing.screenHorizontal,
    borderRadius: spacing.cardBorderRadius,
    overflow: 'hidden',
  },
  featuredShopGradient: {
    padding: spacing.cardPaddingLarge,
  },
  featuredShopContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredShopInfo: {
    flex: 1,
  },
  featuredShopName: {
    ...typography.headingSmall,
    color: colors.text.inverse,
    marginBottom: 4,
  },
  featuredShopDescription: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 8,
  },
  featuredShopStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredShopStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredShopStatText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: '500',
  },
  featuredShopStatDivider: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.6)',
    marginHorizontal: 8,
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenHorizontal,
    gap: spacing.cardGap,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.cardPaddingLarge,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 6,
  },
});

export default HomeScreen;
