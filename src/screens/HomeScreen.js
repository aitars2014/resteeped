import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, ChevronRight, Star, TrendingUp, Award, Sparkles, Coffee } from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { TeaCard, TeaOfTheDay, SeasonalHighlights } from '../components';
import { useTeas, useCompanies, useRecommendations } from '../hooks';
import { useTheme } from '../context';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.42;

const TEA_TYPES = [
  { type: 'black', name: 'Black', emoji: '🫖' },
  { type: 'green', name: 'Green', emoji: '🍃' },
  { type: 'oolong', name: 'Oolong', emoji: '🌿' },
  { type: 'white', name: 'White', emoji: '🤍' },
  { type: 'puerh', name: "Pu'erh", emoji: '🏔️' },
  { type: 'herbal', name: 'Herbal', emoji: '🌸' },
];

export const HomeScreen = ({ navigation }) => {
  const { theme, isDark, getTeaTypeColor } = useTheme();
  const { teas, loading: teasLoading, refreshTeas } = useTeas();
  const { companies } = useCompanies();
  const { forYou, explore, hasPreferences, preferences } = useRecommendations(8);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const featuredTeas = teas
    .filter(t => t.avgRating >= 4.0 || t.avg_rating >= 4.0)
    .sort((a, b) => (b.avgRating || b.avg_rating || 0) - (a.avgRating || a.avg_rating || 0))
    .slice(0, 8);

  const trendingTeas = teas
    .filter(t => (t.ratingCount || t.rating_count || 0) > 0)
    .sort((a, b) => (b.ratingCount || b.rating_count || 0) - (a.ratingCount || a.rating_count || 0))
    .slice(0, 8);

  const newTeas = [...teas]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 8);

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
        <Text style={[styles.teaTypeName, { color: theme.text.primary }]}>{name}</Text>
      </TouchableOpacity>
    );
  };

  const renderHorizontalTeaList = (teaList, emptyMessage) => {
    if (teaList.length === 0) {
      return (
        <View style={styles.emptySection}>
          <Text style={[styles.emptyText, { color: theme.text.secondary }]}>{emptyMessage}</Text>
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

  const renderSectionHeader = (icon, title, onSeeAll) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        {icon}
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>{title}</Text>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={[styles.seeAllText, { color: theme.accent.primary }]}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]} edges={['top']}>
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
          <Image 
            source={isDark 
              ? require('../../assets/resteeped-logo-dark.png')
              : require('../../assets/resteeped-logo.png')
            } 
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchContainer}
          onPress={handleSearch}
          activeOpacity={0.8}
        >
          <View style={[styles.searchBar, { 
            backgroundColor: theme.background.secondary,
            borderColor: theme.border.medium,
          }]}>
            <Search size={20} color={theme.text.secondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text.primary }]}
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
          <Text style={[styles.browseTitle, { color: theme.text.primary }]}>Browse by Type</Text>
          <View style={styles.teaTypeGrid}>
            {TEA_TYPES.map(renderTeaTypeButton)}
          </View>
        </View>

        {/* For You - Personalized Recommendations */}
        {hasPreferences && forYou.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader(
              <Sparkles size={18} color={theme.accent.primary} />,
              'For You',
              () => handleSeeAll('forYou')
            )}
            <Text style={[styles.recommendationHint, { color: theme.text.secondary }]}>
              Based on your love of {preferences.types.slice(0, 2).join(' & ')} teas
            </Text>
            {renderHorizontalTeaList(forYou, 'Rate more teas to get personalized recommendations')}
          </View>
        )}

        {/* Explore Something New */}
        {hasPreferences && explore.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader(
              <Search size={18} color={theme.accent.primary} />,
              'Try Something New',
              null
            )}
            <Text style={[styles.recommendationHint, { color: theme.text.secondary }]}>
              Different from your usual — expand your palate
            </Text>
            {renderHorizontalTeaList(explore.slice(0, 6), 'Start rating teas to unlock recommendations')}
          </View>
        )}

        {/* Featured Teas */}
        <View style={styles.section}>
          {renderSectionHeader(
            <Star size={18} color={theme.accent.primary} />,
            'Featured Teas',
            () => handleSeeAll('featured')
          )}
          {renderHorizontalTeaList(featuredTeas, 'No featured teas yet')}
        </View>

        {/* Trending Now */}
        <View style={styles.section}>
          {renderSectionHeader(
            <TrendingUp size={18} color={theme.accent.primary} />,
            'Trending Now',
            () => handleSeeAll('trending')
          )}
          {renderHorizontalTeaList(trendingTeas, 'Check back for trending teas')}
        </View>

        {/* Featured Tea Shop */}
        {featuredCompany && (
          <View style={styles.section}>
            {renderSectionHeader(
              <Award size={18} color={theme.accent.primary} />,
              'Featured Shop',
              null
            )}
            <TouchableOpacity
              style={styles.featuredShopCard}
              onPress={() => navigation.navigate('CompanyProfile', { company: featuredCompany })}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.accent.primary, theme.accent.secondary]}
                style={styles.featuredShopGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.featuredShopContent}>
                  <View style={styles.featuredShopInfo}>
                    <Text style={[styles.featuredShopName, { color: theme.text.inverse }]}>{featuredCompany.name}</Text>
                    <Text style={styles.featuredShopDescription} numberOfLines={2}>
                      {featuredCompany.short_description || featuredCompany.description}
                    </Text>
                    <View style={styles.featuredShopStats}>
                      <View style={styles.featuredShopStat}>
                        <Star size={14} color="#FFD700" fill="#FFD700" />
                        <Text style={[styles.featuredShopStatText, { color: theme.text.inverse }]}>
                          {(featuredCompany.avg_rating || 0).toFixed(1)}
                        </Text>
                      </View>
                      <Text style={styles.featuredShopStatDivider}>•</Text>
                      <Text style={[styles.featuredShopStatText, { color: theme.text.inverse }]}>
                        {featuredCompany.tea_count || 0} teas
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={24} color={theme.text.inverse} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* New Arrivals */}
        <View style={styles.section}>
          {renderSectionHeader(null, 'New Arrivals', () => handleSeeAll('new'))}
          {renderHorizontalTeaList(newTeas, 'New teas coming soon')}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <TouchableOpacity 
            style={[styles.statCard, { 
              backgroundColor: theme.background.secondary,
              borderColor: theme.border.medium,
            }]}
            onPress={() => navigation.navigate('Discover')}
            activeOpacity={0.7}
          >
            <Text style={[styles.statNumber, { color: theme.accent.primary }]}>{teas.length}</Text>
            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Teas to Explore</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statCard, { 
              backgroundColor: theme.background.secondary,
              borderColor: theme.border.medium,
            }]}
            onPress={() => navigation.navigate('TeaShops')}
            activeOpacity={0.7}
          >
            <Text style={[styles.statNumber, { color: theme.accent.primary }]}>{companies.length}</Text>
            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Tea Shops</Text>
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
  },
  header: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  headerLogo: {
    width: width * 0.5,
    height: 60,
  },
  searchContainer: {
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.searchBarBorderRadius,
    paddingHorizontal: spacing.searchBarPaddingH,
    height: spacing.searchBarHeight,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    ...typography.body,
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
  },
  browseTitle: {
    ...typography.body,
    fontWeight: '600',
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
  },
  seeAllText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  recommendationHint: {
    ...typography.caption,
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
    borderRadius: spacing.cardBorderRadius,
    padding: spacing.cardPaddingLarge,
    alignItems: 'center',
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    marginTop: 6,
  },
});

export default HomeScreen;
