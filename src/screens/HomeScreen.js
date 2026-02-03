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
import { Search, ChevronRight, Star, TrendingUp, Award } from 'lucide-react-native';
import { colors, typography, spacing, getTeaTypeColor } from '../constants';
import { TeaCard, TeaTypeBadge } from '../components';
import { useTeas, useCompanies } from '../hooks';

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
  const { teas, loading: teasLoading, refreshTeas } = useTeas();
  const { companies, loading: companiesLoading } = useCompanies();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome to</Text>
          <Text style={styles.appName}>Resteeped</Text>
          <Text style={styles.tagline}>Discover your next favorite tea</Text>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchContainer}
          onPress={handleSearch}
          activeOpacity={0.8}
        >
          <View style={styles.searchBar}>
            <Search size={20} color={colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search teas, brands, flavors..."
              placeholderTextColor={colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
        </TouchableOpacity>

        {/* Browse by Tea Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Type</Text>
          <View style={styles.teaTypeGrid}>
            {TEA_TYPES.map(renderTeaTypeButton)}
          </View>
        </View>

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
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{teas.length}</Text>
            <Text style={styles.statLabel}>Teas to Explore</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{companies.length}</Text>
            <Text style={styles.statLabel}>Tea Shops</Text>
          </View>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: {
    ...typography.body,
    color: colors.text.secondary,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.accent.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.sm,
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
  seeAllText: {
    ...typography.bodySmall,
    color: colors.accent.primary,
    fontWeight: '500',
  },
  teaTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screenHorizontal,
    gap: 12,
  },
  teaTypeButton: {
    alignItems: 'center',
    width: (width - (spacing.screenHorizontal * 2) - 60) / 6,
  },
  teaTypeGradient: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  teaTypeEmoji: {
    fontSize: 22,
  },
  teaTypeName: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  horizontalList: {
    paddingHorizontal: spacing.screenHorizontal,
    gap: 12,
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
    borderRadius: 16,
    overflow: 'hidden',
  },
  featuredShopGradient: {
    padding: spacing.lg,
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
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
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
    marginTop: 4,
  },
});

export default HomeScreen;
