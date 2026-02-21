import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, ChevronRight, Star, TrendingUp, Award, Sparkles, Coffee, Users, X, Leaf, Flower2, Sprout, Heart, Mountain, TreeDeciduous, Cuboid, Shuffle } from 'lucide-react-native';
import { typography, spacing, fonts } from '../constants';
import { TeaCard, TeaOfTheDay, SeasonalHighlights, TeaRandomizer, TeaBattle, TeawareCard, Skeleton, TeaCardSkeleton, BrewPicker } from '../components';
import { useTeas, useCompanies, useRecommendations, useTeaware } from '../hooks';
import { useTheme } from '../context';

// Skeleton for horizontal tea list while loading
const HorizontalListSkeleton = () => (
  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ paddingHorizontal: spacing.screenHorizontal, gap: spacing.cardGap }}
  >
    {Array.from({ length: 4 }).map((_, i) => (
      <View key={i} style={{ width: width * 0.42 }}>
        <TeaCardSkeleton compact />
      </View>
    ))}
  </ScrollView>
);

// Skeleton for Tea of the Day
const TeaOfDaySkeleton = () => (
  <View style={{ marginHorizontal: spacing.screenHorizontal, borderRadius: 16, overflow: 'hidden' }}>
    <Skeleton height={200} borderRadius={16} />
  </View>
);

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.42;

const TEA_TYPES = [
  { type: 'black', name: 'Black', Icon: Coffee },
  { type: 'green', name: 'Green', Icon: Leaf },
  { type: 'oolong', name: 'Oolong', Icon: TreeDeciduous },
  { type: 'white', name: 'White', Icon: Sprout },
  { type: 'puerh', name: "Pu'erh", Icon: Mountain },
  { type: 'herbal', name: 'Herbal', Icon: Flower2 },
];

export const HomeScreen = ({ navigation }) => {
  const { theme, isDark, getTeaTypeColor } = useTheme();
  const { teas, loading: teasLoading, refreshing: teasRefreshing, refreshTeas, dataSource } = useTeas();
  const { companies, refreshing: companiesRefreshing, refreshCompanies } = useCompanies();
  const { teaware } = useTeaware();
  const { forYou, explore, hasPreferences, preferences } = useRecommendations(8);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // BrewPicker / TeaRandomizer state
  const brewPickerRef = useRef(null);
  const [randomizerVisible, setRandomizerVisible] = useState(false);
  const [randomizerSource, setRandomizerSource] = useState('all');

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

  // Featured shop: check featured_shops table first, fall back to highest-rated
  const [featuredCompany, setFeaturedCompany] = useState(null);
  const adminFeatured = useRef({ loaded: false, company: null });

  // Query admin table once on mount
  useEffect(() => {
    let cancelled = false;
    const loadAdmin = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await require('../lib/supabase').supabase
          .from('featured_shops')
          .select('company_id, companies(*)')
          .eq('is_active', true)
          .lte('start_date', today)
          .gte('end_date', today)
          .order('priority', { ascending: false })
          .limit(1)
          .single();
        if (!cancelled && data?.companies) {
          adminFeatured.current = { loaded: true, company: data.companies };
          setFeaturedCompany(data.companies);
        }
      } catch (e) {
        // No featured shop set in admin
      }
      if (!cancelled) {
        adminFeatured.current.loaded = true;
      }
    };
    loadAdmin();
    return () => { cancelled = true; };
  }, []);

  // Fallback: use highest-rated company only if admin didn't set one
  useEffect(() => {
    if (companies.length > 0 && adminFeatured.current.loaded && !adminFeatured.current.company) {
      const fallback = [...companies].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))[0];
      setFeaturedCompany(fallback || null);
    }
  }, [companies]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshTeas(), refreshCompanies()]);
    setRefreshing(false);
  }, [refreshTeas, refreshCompanies]);

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

  // BrewPicker handlers
  const handleOpenBrewPicker = () => {
    brewPickerRef.current?.snapToIndex(0);
  };

  const handleSelectCollection = () => {
    setRandomizerSource('collection');
    setRandomizerVisible(true);
  };

  const handleSelectDiscover = () => {
    navigation.navigate('TeaFinder');
  };

  const handleSelectSurprise = () => {
    setRandomizerSource('all');
    setRandomizerVisible(true);
  };

  const renderTeaTypeButton = ({ type, name, Icon }) => {
    const typeColor = getTeaTypeColor(type);
    return (
      <TouchableOpacity
        key={type}
        style={styles.teaTypeButton}
        onPress={() => handleTeaTypePress(type)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${name} tea`}
        accessibilityHint="Double tap to filter by this tea type"
      >
        <LinearGradient
          colors={[typeColor.primary, typeColor.gradient]}
          style={styles.teaTypeGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon size={26} color="#FFFFFF" strokeWidth={2} />
        </LinearGradient>
        <Text style={[styles.teaTypeName, { color: theme.text.primary }]}>{name}</Text>
      </TouchableOpacity>
    );
  };

  const renderHorizontalTeaList = (teaList, emptyMessage) => {
    if (teasLoading) {
      return <HorizontalListSkeleton />;
    }
    
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
        {/* 1. Header with Logo */}
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

        {/* Subtle loading indicator when fetching fresh data */}
        {(teasLoading || teasRefreshing) && dataSource !== 'remote' && (
          <View style={[styles.loadingBanner, { backgroundColor: theme.accent.primary + '15' }]}>
            <ActivityIndicator size="small" color={theme.accent.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.loadingBannerText, { color: theme.text.secondary }]}>
              Loading latest teas...
            </Text>
          </View>
        )}

        {/* 2. Search Bar */}
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
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={theme.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>

        {/* 3. Browse by Type */}
        <View style={styles.section}>
          <Text style={[styles.browseTitle, { color: theme.text.primary }]}>Browse by Type</Text>
          <View style={styles.teaTypeGrid}>
            {TEA_TYPES.map(renderTeaTypeButton)}
          </View>
        </View>

        {/* 4. "What should I brew?" button */}
        {teas.length > 0 && (
          <TouchableOpacity
            style={[styles.triggerButton, { backgroundColor: theme.accent.primary }]}
            onPress={handleOpenBrewPicker}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.accent.primary, theme.accent.secondary]}
              style={styles.triggerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Shuffle size={20} color={theme.text.inverse} />
              <Text style={[styles.triggerText, { color: theme.text.inverse }]}>
                What should I brew?
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* 5. Tea of the Day */}
        <View style={styles.section}>
          {teasLoading ? (
            <TeaOfDaySkeleton />
          ) : teas.length > 0 ? (
            <TeaOfTheDay 
              teas={teas} 
              onPress={(tea) => navigation.navigate('TeaDetail', { tea })}
            />
          ) : null}
        </View>

        {/* 6. Featured Tea Shop */}
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

        {/* 7. Seasonal Highlights (carousel only — banner removed) */}
        <SeasonalHighlights
          teas={teas}
          onTeaPress={(tea) => navigation.navigate('TeaDetail', { tea })}
          onSeeAll={(curatedTeas, season) => {
            navigation.navigate('SeasonalCollection', { 
              teas: curatedTeas, 
              title: season.name,
              description: season.description,
              colors: season.colors,
            });
          }}
          hideCarousel
        />

        {/* 8. Tea Battle */}
        {teas.length > 1 && (
          <TeaBattle
            teas={teas}
            onCompare={(tea1, tea2) => navigation.navigate('CompareTeas', { 
              initialTeas: [tea1, tea2] 
            })}
            onViewTea={(tea) => navigation.navigate('TeaDetail', { tea })}
          />
        )}

        {/* 9. For You / Explore Something New */}
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

        {/* 10. Featured Teas */}
        <View style={styles.section}>
          {renderSectionHeader(
            <Star size={18} color={theme.accent.primary} />,
            'Featured Teas',
            () => handleSeeAll('featured')
          )}
          {renderHorizontalTeaList(featuredTeas, 'No featured teas yet')}
        </View>

        {/* 11. Trending Now */}
        <View style={styles.section}>
          {renderSectionHeader(
            <TrendingUp size={18} color={theme.accent.primary} />,
            'Trending Now',
            () => handleSeeAll('trending')
          )}
          {renderHorizontalTeaList(trendingTeas, 'Check back for trending teas')}
        </View>

        {/* 12. New Arrivals */}
        <View style={styles.section}>
          {renderSectionHeader(null, 'New Arrivals', () => handleSeeAll('new'))}
          {renderHorizontalTeaList(newTeas, 'New teas coming soon')}
        </View>

        {/* 13. Teaware */}
        {teaware.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader(
              <Cuboid size={18} color={theme.accent.primary} />,
              'Teaware',
              () => navigation.navigate('Profile', { screen: 'TeawareCollection' })
            )}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {teaware.slice(0, 6).map((item) => (
                <TeawareCard
                  key={item.id}
                  item={item}
                  onPress={() => navigation.navigate('TeawareDetail', { teaware: item })}
                  compact
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* 14. Community Activity */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.communityCard, { 
              backgroundColor: theme.background.secondary,
              borderColor: theme.border.light,
            }]}
            onPress={() => navigation.navigate('ActivityFeed')}
            activeOpacity={0.8}
          >
            <View style={[styles.communityIcon, { backgroundColor: theme.accent.primary + '20' }]}>
              <Users size={24} color={theme.accent.primary} />
            </View>
            <View style={styles.communityContent}>
              <Text style={[styles.communityTitle, { color: theme.text.primary }]}>Community Feed</Text>
              <Text style={[styles.communitySubtitle, { color: theme.text.secondary }]}>
                See what other tea lovers are brewing
              </Text>
            </View>
            <ChevronRight size={20} color={theme.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* 15. Quick Stats */}
        <View style={styles.statsSection}>
          <TouchableOpacity 
            style={[styles.statCard, { 
              backgroundColor: theme.background.secondary,
              borderColor: theme.border.medium,
            }]}
            onPress={() => navigation.navigate('Discover')}
            activeOpacity={0.7}
          >
            <Text style={[styles.statNumber, { color: theme.accent.primary }]}>{teas.length >= 1000 ? `${teas.length.toLocaleString()}+` : teas.length.toLocaleString()}</Text>
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
            <Text style={[styles.statNumber, { color: theme.accent.primary }]}>{companies.length.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Tea Shops</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* BrewPicker Bottom Sheet */}
      <BrewPicker
        ref={brewPickerRef}
        onSelectCollection={handleSelectCollection}
        onSelectDiscover={handleSelectDiscover}
        onSelectSurprise={handleSelectSurprise}
      />

      {/* TeaRandomizer Modal (controlled) */}
      <TeaRandomizer
        visible={randomizerVisible}
        source={randomizerSource}
        teas={teas}
        onClose={() => setRandomizerVisible(false)}
        onBrewTea={(tea) => navigation.navigate('Timer', { 
          screen: 'TimerHome',
          params: { tea } 
        })}
        onViewTea={(tea) => navigation.navigate('TeaDetail', { tea })}
        onAddTea={() => navigation.navigate('Discover', {
          screen: 'DiscoveryHome',
        })}
      />
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
    height: '100%',
    paddingVertical: 0,
    textAlignVertical: 'center',
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
    fontFamily: fonts?.serif || 'Georgia',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  browseTitle: {
    fontFamily: fonts?.serif || 'Georgia',
    fontSize: 18,
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
  triggerButton: {
    borderRadius: spacing.buttonBorderRadius,
    overflow: 'hidden',
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.sectionSpacing,
  },
  triggerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  triggerText: {
    ...typography.body,
    fontWeight: '600',
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
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.screenHorizontal,
    padding: spacing.cardPadding,
    borderRadius: spacing.cardBorderRadius,
    borderWidth: 1,
  },
  communityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  communityContent: {
    flex: 1,
  },
  communityTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  communitySubtitle: {
    ...typography.caption,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 8,
  },
  loadingBannerText: {
    fontSize: 13,
  },
});

export default HomeScreen;
