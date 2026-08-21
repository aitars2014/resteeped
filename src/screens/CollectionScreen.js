import React, { useState, useCallback, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Bookmark, Plus, SlidersHorizontal, Share2, ChevronDown, Check, Coffee } from 'lucide-react-native';
import { typography, spacing, getPlaceholderImage } from '../constants';
import { Button, FilterModal, SearchBar, ShareableCollectionCard, TeaTypeBadge } from '../components';
import { useAuth, useCollection, useTheme, useSubscription } from '../context';
import { useBrewHistory } from '../hooks';
import { haptics } from '../utils/haptics';
import { COLLECTION_STATUSES, COLLECTION_STATUS_LABELS } from '../utils/tasteProfile';
import { teaTypes } from '../data/teas';

const COLLECTION_SORT_OPTIONS = [
  { id: 'recently_added', label: 'Recently added' },
  { id: 'recently_steeped', label: 'Recently steeped' },
  { id: 'frequently_steeped', label: 'Frequently steeped' },
  { id: 'name', label: 'Name (A-Z)' },
];

const formatShortDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const CollectionScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, initialized: authInitialized, loading: authLoading } = useAuth();
  const { collection, loading, refreshCollection, updateInCollection } = useCollection();
  const { isPremium, canAddToCollection, getRemainingFreeSlots, FREE_TIER_LIMITS } = useSubscription();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [openStatusMenuId, setOpenStatusMenuId] = useState(null);
  const [teaFilters, setTeaFilters] = useState({
    teaType: 'all',
    company: 'all',
    minRating: 'all',
    teaMethod: 'all',
    sortBy: 'recently_added',
  });
  
  const collectionCardRef = useRef();
  const { brewSessions } = useBrewHistory();
  const isAuthResolving = authLoading || !authInitialized;

  const brewStatsByTeaId = useMemo(() => {
    const stats = {};
    brewSessions.forEach(session => {
      if (!session.tea_id) return;
      const teaId = String(session.tea_id);
      const brewedAt = session.created_at ? new Date(session.created_at).getTime() : 0;
      if (!stats[teaId]) {
        stats[teaId] = { count: 0, lastSteepedAt: 0 };
      }
      stats[teaId].count += 1;
      stats[teaId].lastSteepedAt = Math.max(stats[teaId].lastSteepedAt, brewedAt || 0);
    });
    return stats;
  }, [brewSessions]);

  const handleSteepTea = useCallback((tea) => {
    haptics.selection();
    navigation.navigate('Timer', {
      screen: 'TimerHome',
      params: { tea },
    });
  }, [navigation]);

  // Re-fetch collection whenever this screen gains focus
  useFocusEffect(
    useCallback(() => {
      refreshCollection();
    }, [refreshCollection])
  );
  
  const remainingSlots = getRemainingFreeSlots(collection.length);
  const showUpgradeBanner = !isPremium && collection.length >= FREE_TIER_LIMITS.MAX_COLLECTION_SIZE - 3;
  
  const handleAddTea = () => {
    if (canAddToCollection(collection.length)) {
      navigation.navigate('AddTea');
    } else {
      navigation.navigate('Paywall');
    }
  };
  
  const filteredCollection = useMemo(() => {
    let result = collection.filter(item => {
      if (filter === 'all') return true;
      if (filter === 'want_to_try') return item.status === 'want_to_try' || !item.status;
      return item.status === filter;
    });

    // Apply tea-level filters
    if (teaFilters.teaType !== 'all') {
      result = result.filter(item => {
        const tea = item.tea || {};
        return (tea.teaType || tea.tea_type) === teaFilters.teaType;
      });
    }

    if (teaFilters.company !== 'all') {
      result = result.filter(item => {
        const tea = item.tea || {};
        return (tea.companyId || tea.company_id) === teaFilters.company;
      });
    }

    if (teaFilters.teaMethod !== 'all') {
      result = result.filter(item => {
        const tea = item.tea || {};
        return (tea.teaMethod || tea.tea_method) === teaFilters.teaMethod;
      });
    }

    if (teaFilters.minRating !== 'all') {
      const min = parseInt(teaFilters.minRating, 10);
      result = result.filter(item => {
        const rating = item.user_rating || item.tea?.avgRating || item.tea?.avg_rating || 0;
        return rating >= min;
      });
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => {
        const tea = item.tea || {};
        return (
          (tea.name || '').toLowerCase().includes(q) ||
          (tea.brandName || tea.brand_name || '').toLowerCase().includes(q) ||
          (tea.teaType || tea.tea_type || '').toLowerCase().includes(q) ||
          (tea.flavorNotes || tea.flavor_notes || []).some(n => n.toLowerCase().includes(q))
        );
      });
    }

    // Sort
    switch (teaFilters.sortBy) {
      case 'recently_steeped':
        result.sort((a, b) => {
          const teaIdA = String(a.tea?.id || a.tea_id || '');
          const teaIdB = String(b.tea?.id || b.tea_id || '');
          const lastA = brewStatsByTeaId[teaIdA]?.lastSteepedAt || 0;
          const lastB = brewStatsByTeaId[teaIdB]?.lastSteepedAt || 0;
          if (lastB !== lastA) return lastB - lastA;
          return new Date(b.added_at || b.created_at || 0) - new Date(a.added_at || a.created_at || 0);
        });
        break;
      case 'frequently_steeped':
        result.sort((a, b) => {
          const teaIdA = String(a.tea?.id || a.tea_id || '');
          const teaIdB = String(b.tea?.id || b.tea_id || '');
          const statsA = brewStatsByTeaId[teaIdA] || {};
          const statsB = brewStatsByTeaId[teaIdB] || {};
          if ((statsB.count || 0) !== (statsA.count || 0)) {
            return (statsB.count || 0) - (statsA.count || 0);
          }
          return (statsB.lastSteepedAt || 0) - (statsA.lastSteepedAt || 0);
        });
        break;
      case 'name':
        result.sort((a, b) => (a.tea?.name || '').localeCompare(b.tea?.name || ''));
        break;
      case 'recently_added':
        result.sort((a, b) => new Date(b.added_at || b.created_at || 0) - new Date(a.added_at || a.created_at || 0));
        break;
      default:
        break;
    }

    return result;
  }, [collection, filter, teaFilters, searchQuery, brewStatsByTeaId]);
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer} accessibilityElementsHidden={true}>
        <Bookmark size={64} color={theme.text.secondary} />
      </View>
      {isAuthResolving || loading ? (
        <>
          <ActivityIndicator size="small" color={theme.accent.primary} style={styles.emptySpinner} />
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>Loading your teas...</Text>
        </>
      ) : !user ? (
        <>
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>Sign in to track your teas</Text>
          <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
            Create an account to save teas, rate them, and build your collection.
          </Text>
          <Button 
            title="Sign In"
            onPress={() => navigation.navigate('Profile')}
            variant="primary"
            style={styles.emptyButton}
          />
        </>
      ) : (
        <>
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>Your collection is empty</Text>
          <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
            Start exploring teas and save the ones you love!
          </Text>
          <Button 
            title="Discover Teas"
            onPress={() => navigation.navigate('Discover')}
            variant="primary"
            style={styles.emptyButton}
          />
        </>
      )}
    </View>
  );
  
  const renderTeaItem = ({ item }) => {
    const rawTea = item.tea || {
      id: item.tea_id,
      name: 'Tea',
      brand_name: 'Unknown',
      tea_type: 'black',
      avg_rating: item.user_rating || 0,
    };
    // Normalize snake_case DB fields to camelCase app format
    const tea = {
      ...rawTea,
      id: rawTea.id || item.tea_id,
      brandName: rawTea.brandName || rawTea.brand_name,
      teaType: rawTea.teaType || rawTea.tea_type,
      avgRating: rawTea.avgRating || rawTea.avg_rating,
      imageUrl: rawTea.imageUrl || rawTea.image_url,
      companyId: rawTea.companyId || rawTea.company_id,
      ratingCount: rawTea.ratingCount || rawTea.rating_count,
      flavorNotes: rawTea.flavorNotes || rawTea.flavor_notes || [],
      productUrl: rawTea.productUrl || rawTea.product_url,
    };
    
    const teaId = item.tea?.id || item.tea_id;
    const itemStatus = item.status || 'want_to_try';
    const statusLabel = COLLECTION_STATUS_LABELS[item.status || 'want_to_try'] || 'Saved';
    const isStatusMenuOpen = openStatusMenuId === teaId;
    const teaStats = brewStatsByTeaId[String(teaId)] || {};
    const brewCount = teaStats.count || 0;
    const lastSteepedLabel = formatShortDate(teaStats.lastSteepedAt);
    const addedLabel = formatShortDate(item.added_at || item.created_at);
    const brandName = tea.brandName || tea.brand_name || 'Unknown shop';
    const imageSource = tea.imageUrl || tea.image_url
      ? { uri: tea.imageUrl || tea.image_url }
      : getPlaceholderImage(tea.teaType || tea.tea_type);

    return (
      <View style={[styles.teaItem, { backgroundColor: theme.background.secondary, borderColor: theme.border.light }]}>
        <TouchableOpacity
          style={styles.teaRow}
          onPress={() => navigation.navigate('TeaDetail', { tea })}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={`${tea.name} by ${brandName}. Status: ${statusLabel}. ${brewCount} steep${brewCount === 1 ? '' : 's'}.`}
          accessibilityHint="Double tap to view tea details"
        >
          <Image source={imageSource} style={styles.teaImage} />
          <View style={styles.teaContent}>
            <Text style={[styles.teaBrand, { color: theme.text.tertiary }]} numberOfLines={1}>
              {brandName.toUpperCase()}
            </Text>
            <Text style={[styles.teaName, { color: theme.text.primary }]} numberOfLines={2}>
              {tea.name}
            </Text>
            <View style={styles.teaMetaRow}>
              <TeaTypeBadge teaType={tea.teaType || tea.tea_type} size="tiny" />
              {item.user_rating ? (
                <View style={[styles.ratingPill, { backgroundColor: theme.accent.primary + '18' }]}>
                  <Text style={[styles.ratingText, { color: theme.accent.primary }]}>
                    {item.user_rating.toFixed(1)}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.teaStatsText, { color: theme.text.secondary }]} numberOfLines={1}>
              {[
                addedLabel ? `Added ${addedLabel}` : null,
                brewCount > 0 ? `${brewCount} steep${brewCount === 1 ? '' : 's'}` : 'Not steeped yet',
                lastSteepedLabel ? `Last ${lastSteepedLabel}` : null,
              ].filter(Boolean).join(' • ')}
            </Text>
          </View>
          <View style={styles.teaActions}>
            <TouchableOpacity
              style={[styles.quickBrewBtn, { backgroundColor: theme.background.primary, borderColor: theme.border.light }]}
              onPress={(event) => {
                event.stopPropagation();
                handleSteepTea(tea);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Steep ${tea.name}`}
              accessibilityHint="Open the tea timer with your saved steeping settings"
            >
              <Coffee size={16} color={theme.text.secondary} />
              <Text style={[styles.quickBrewLabel, { color: theme.text.secondary }]}>
                Steep
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusChip, { backgroundColor: theme.background.primary, borderColor: theme.border.light }]}
              onPress={(event) => {
                event.stopPropagation();
                haptics.selection();
                setOpenStatusMenuId(prev => prev === teaId ? null : teaId);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Status: ${statusLabel}. Change status`}
              accessibilityState={{ expanded: isStatusMenuOpen }}
            >
              <Text style={[styles.statusChipText, { color: theme.text.primary }]} numberOfLines={1}>
                {statusLabel}
              </Text>
              <ChevronDown size={14} color={theme.text.secondary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        {isStatusMenuOpen && (
          <View style={[styles.statusSelector, { borderTopColor: theme.border.light }]}>
            <View style={styles.statusDropdown}>
              {COLLECTION_STATUSES.filter(status => status.id !== 'all').map(status => {
                const isActive = itemStatus === status.id;
                return (
                  <TouchableOpacity
                    key={status.id}
                    style={styles.statusDropdownItem}
                    onPress={() => {
                      haptics.selection();
                      setOpenStatusMenuId(null);
                      if (!isActive) {
                        updateInCollection(teaId, { status: status.id });
                      }
                    }}
                    accessibilityRole="menuitem"
                    accessibilityLabel={`Mark ${tea.name} as ${status.label}`}
                  >
                    <Text style={[
                      styles.statusDropdownText,
                      { color: isActive ? theme.accent.primary : theme.text.primary },
                      isActive && { fontWeight: '700' },
                    ]}>
                      {status.label}
                    </Text>
                    {isActive && <Check size={16} color={theme.accent.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderTab = (tab) => {
    const isActive = filter === tab.id;
    return (
      <TouchableOpacity
        key={tab.id}
        style={[
          styles.tab, 
          isActive && { borderBottomColor: theme.accent.primary, borderBottomWidth: 2 }
        ]}
        onPress={() => { haptics.selection(); setFilter(tab.id); }}
        accessible={true}
        accessibilityRole="tab"
        accessibilityLabel={`${tab.label} filter`}
        accessibilityState={{ selected: isActive }}
        accessibilityHint={`Filter collection to show ${tab.label.toLowerCase()} teas`}
      >
        <Text style={[
          styles.tabText, 
          { color: isActive ? theme.accent.primary : theme.text.secondary },
          isActive && { fontWeight: '600' }
        ]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };
  
  const activeFilterCount = [
    teaFilters.teaType !== 'all',
    teaFilters.company !== 'all',
    teaFilters.minRating !== 'all',
    teaFilters.teaMethod !== 'all',
  ].filter(Boolean).length;
  const selectedSortOption = COLLECTION_SORT_OPTIONS.find(option => option.id === teaFilters.sortBy) || COLLECTION_SORT_OPTIONS[0];
  const selectedTeaType = teaTypes.find(type => type.id === teaFilters.teaType);
  const hasCustomSort = teaFilters.sortBy !== 'recently_added';
  const activeRefinementCount = activeFilterCount + (hasCustomSort ? 1 : 0);

  const handleApplyFilters = (newFilters) => {
    setTeaFilters(newFilters);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setTeaFilters({ teaType: 'all', company: 'all', minRating: 'all', teaMethod: 'all', sortBy: 'recently_added' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text.primary }]}>My Teas</Text>
          {user && collection.length > 0 && (
            <Text style={[styles.count, { color: theme.text.secondary }]}>{collection.length} teas</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {collection.length >= 3 && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.background.secondary }]}
              onPress={async () => {
                haptics.medium();
                try {
                  const uri = await collectionCardRef.current.capture();
                  const Sharing = require('expo-sharing');
                  if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, {
                      mimeType: 'image/png',
                      dialogTitle: 'Share My Tea Collection',
                    });
                    haptics.success();
                  }
                } catch (e) {
                  console.error('Error sharing collection:', e);
                  haptics.error();
                }
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Share my tea collection"
              accessibilityHint="Creates a shareable image card of your tea collection"
            >
              <Share2 size={20} color={theme.text.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: theme.accent.primary }]}
            onPress={handleAddTea}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Add new tea"
            accessibilityHint={canAddToCollection(collection.length) 
              ? "Opens form to add a custom tea to your collection" 
              : "Upgrade to premium to add more teas"}
          >
            <Plus size={20} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Upgrade Banner */}
      {showUpgradeBanner && (
        <TouchableOpacity 
          style={[styles.upgradeBanner, { backgroundColor: theme.accent.primary + '15' }]}
          onPress={() => navigation.navigate('Paywall')}
        >
          <Text style={[styles.upgradeBannerText, { color: theme.accent.primary }]}>
            {remainingSlots > 0 
              ? `${remainingSlots} free slot${remainingSlots === 1 ? '' : 's'} remaining`
              : 'Collection full — Upgrade for unlimited teas'}
          </Text>
        </TouchableOpacity>
      )}
      
      {/* Filter tabs */}
      <View style={[styles.filterTabs, { borderBottomColor: theme.border.light }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {COLLECTION_STATUSES.map(renderTab)}
        </ScrollView>
      </View>

      {/* Search & Filters */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search your collection..."
          />
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: activeRefinementCount > 0 ? theme.accent.primary : theme.background.secondary,
              borderColor: activeRefinementCount > 0 ? theme.accent.primary : theme.border.light,
            }
          ]}
          onPress={() => { haptics.light(); setShowFilterModal(true); }}
          accessibilityRole="button"
          accessibilityLabel="Open filters and sort"
        >
          <SlidersHorizontal
            size={20}
            color={activeRefinementCount > 0 ? theme.text.inverse : theme.text.primary}
          />
          {activeRefinementCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: theme.status.error }]}>
              <Text style={[styles.filterBadgeText, { color: theme.text.inverse }]}>{activeRefinementCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {activeRefinementCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeRefinements}
        >
          {hasCustomSort && (
            <View style={[styles.refinementChip, { backgroundColor: theme.background.secondary, borderColor: theme.border.light }]}>
              <Text style={[styles.refinementText, { color: theme.text.primary }]} numberOfLines={1}>
                {selectedSortOption.label}
              </Text>
            </View>
          )}
          {teaFilters.teaType !== 'all' && (
            <View style={[styles.refinementChip, { backgroundColor: theme.background.secondary, borderColor: theme.border.light }]}>
              <Text style={[styles.refinementText, { color: theme.text.primary }]} numberOfLines={1}>
                {selectedTeaType?.label || 'Tea type'}
              </Text>
            </View>
          )}
          {teaFilters.company !== 'all' && (
            <View style={[styles.refinementChip, { backgroundColor: theme.background.secondary, borderColor: theme.border.light }]}>
              <Text style={[styles.refinementText, { color: theme.text.primary }]} numberOfLines={1}>
                Brand
              </Text>
            </View>
          )}
          {teaFilters.minRating !== 'all' && (
            <View style={[styles.refinementChip, { backgroundColor: theme.background.secondary, borderColor: theme.border.light }]}>
              <Text style={[styles.refinementText, { color: theme.text.primary }]} numberOfLines={1}>
                {teaFilters.minRating}+ rating
              </Text>
            </View>
          )}
          {teaFilters.teaMethod !== 'all' && (
            <View style={[styles.refinementChip, { backgroundColor: theme.background.secondary, borderColor: theme.border.light }]}>
              <Text style={[styles.refinementText, { color: theme.text.primary }]} numberOfLines={1}>
                Tea method
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={clearAllFilters} style={styles.clearRefinementsButton}>
            <Text style={[styles.clearFiltersText, { color: theme.accent.primary }]}>Clear</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Result count */}
      {(searchQuery || activeFilterCount > 0) && (
        <View style={styles.resultCount}>
          <Text style={[styles.resultText, { color: theme.text.secondary }]}>
            {filteredCollection.length} tea{filteredCollection.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={clearAllFilters}>
            <Text style={[styles.clearFiltersText, { color: theme.accent.primary }]}>Clear filters</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {filteredCollection.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredCollection}
          renderItem={renderTeaItem}
          keyExtractor={item => item.id || item.tea_id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refreshCollection}
              tintColor={theme.accent.primary}
            />
          }
        />
      )}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={teaFilters}
        onApplyFilters={handleApplyFilters}
        sortOptions={COLLECTION_SORT_OPTIONS}
      />
      {/* Hidden shareable card for capture */}
      <View style={{ position: 'absolute', left: -9999, top: -9999 }}>
        <ShareableCollectionCard
          ref={collectionCardRef}
          collection={collection}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.headerPaddingTop,
    paddingBottom: spacing.headerPaddingBottom,
  },
  title: {
    ...typography.headingLarge,
  },
  count: {
    ...typography.bodySmall,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginRight: spacing.sm,
  },
  tabText: {
    ...typography.body,
  },
  listContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.xs,
    paddingBottom: 120,
  },
  teaItem: {
    marginBottom: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  teaRow: {
    minHeight: 104,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  teaImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  teaContent: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  teaBrand: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  teaName: {
    ...typography.headingSmall,
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 5,
  },
  teaMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  teaStatsText: {
    ...typography.caption,
  },
  teaActions: {
    width: 74,
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: 6,
  },
  quickBrewBtn: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  quickBrewLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
  statusChip: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  statusChipText: {
    ...typography.caption,
    fontWeight: '700',
    flexShrink: 1,
  },
  ratingPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusSelector: {
    borderTopWidth: 1,
  },
  statusDropdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 6,
  },
  statusDropdownItem: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDropdownText: {
    ...typography.caption,
  },
  ratingText: {
    ...typography.caption,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  emptySpinner: {
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.headingMedium,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
  upgradeBanner: {
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeBannerText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  searchContainer: {
    flex: 1,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activeRefinements: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.sm,
    gap: 8,
  },
  refinementChip: {
    height: 32,
    maxWidth: 180,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  refinementText: {
    ...typography.caption,
    fontWeight: '700',
  },
  clearRefinementsButton: {
    height: 32,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.sm,
  },
  resultText: {
    ...typography.bodySmall,
  },
  clearFiltersText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
});
