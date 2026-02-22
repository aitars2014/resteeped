import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SlidersHorizontal, Clock, X, ArrowUp, Sparkles } from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { SearchBar, FilterPills, FilterModal, TeaCard, TeaCardSkeleton } from '../components';
import { useTeas, useSearchHistory } from '../hooks';
import { useTheme } from '../context';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';

// Skeleton grid for loading state
const SkeletonGrid = () => (
  <View style={skeletonStyles.grid}>
    {Array.from({ length: 6 }).map((_, i) => (
      <View key={i} style={[skeletonStyles.cardContainer, i % 2 === 0 ? skeletonStyles.cardLeft : skeletonStyles.cardRight]}>
        <TeaCardSkeleton />
      </View>
    ))}
  </View>
);

const skeletonStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
  },
  cardContainer: {
    width: (width - spacing.screenHorizontal * 2 - spacing.cardGap) / 2,
    marginBottom: spacing.cardGap,
  },
  cardLeft: {
    marginRight: spacing.cardGap / 2,
  },
  cardRight: {
    marginLeft: spacing.cardGap / 2,
  },
});

const { width } = Dimensions.get('window');
const cardWidth = (width - spacing.screenHorizontal * 2 - spacing.cardGap) / 2;

export const DiscoveryScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { teas, loading, refreshing, refreshTeas, filterTeas, dataSource } = useTeas();
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();
  
  // Scroll to top functionality
  const flatListRef = useRef(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const scrollButtonOpacity = useRef(new Animated.Value(0)).current;
  
  // Accept initial values from navigation params (e.g., from Home screen or Company page)
  const { initialSearch, initialFilter, initialCompanyFilter } = route.params || {};
  
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [filters, setFilters] = useState({
    teaType: initialFilter || 'all',
    company: initialCompanyFilter || 'all',
    minRating: 'all',
    sortBy: 'relevance',
  });
  
  // Update filters when navigating from Home with new params
  useEffect(() => {
    // If navigating with a filter/section but no search, clear the search
    if ((initialFilter !== undefined || initialCompanyFilter !== undefined) && initialSearch === undefined) {
      setSearchQuery('');
    }
    if (initialSearch !== undefined) setSearchQuery(initialSearch);
    if (initialFilter !== undefined) {
      setFilters(prev => ({ ...prev, teaType: initialFilter }));
    }
    if (initialCompanyFilter !== undefined) {
      setFilters(prev => ({ ...prev, company: initialCompanyFilter }));
    }
  }, [initialSearch, initialFilter, initialCompanyFilter]);
  
  const filteredTeas = useMemo(() => {
    return filterTeas(searchQuery, filters);
  }, [searchQuery, filters, filterTeas]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    trackEvent(AnalyticsEvents.TEA_FILTERED, {
      tea_type: newFilters.teaType,
      company: newFilters.company,
      min_rating: newFilters.minRating,
      sort_by: newFilters.sortBy,
    });
  };

  const handleTypeChange = (type) => {
    setFilters(prev => ({ ...prev, teaType: type }));
    if (type !== 'all') {
      trackEvent(AnalyticsEvents.TEA_FILTERED, { tea_type: type });
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      addToHistory(searchQuery.trim());
      setShowHistory(false);
      trackEvent(AnalyticsEvents.TEA_SEARCHED, { 
        query: searchQuery.trim(),
        results_count: filteredTeas.length,
      });
    }
  };

  const handleHistorySelect = (query) => {
    setSearchQuery(query);
    addToHistory(query);
    setShowHistory(false);
  };

  // Count active filters (excluding default values)
  const activeFilterCount = [
    filters.teaType !== 'all',
    filters.company !== 'all',
    filters.minRating !== 'all',
  ].filter(Boolean).length;

  // Handle scroll position for scroll-to-top button
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const shouldShow = offsetY > 400;
    
    if (shouldShow !== showScrollToTop) {
      setShowScrollToTop(shouldShow);
      Animated.timing(scrollButtonOpacity, {
        toValue: shouldShow ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };
  
  const renderTeaCard = ({ item, index }) => (
    <View style={[styles.cardContainer, index % 2 === 0 ? styles.cardLeft : styles.cardRight]}>
      <TeaCard 
        tea={item} 
        onPress={() => navigation.navigate('TeaDetail', { tea: item })}
      />
    </View>
  );
  
  const renderEmptyState = () => {
    if (loading) {
      return <SkeletonGrid />;
    }
    
    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>No teas found</Text>
        <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
          {searchQuery ? 'Try a different search term' : 'Try adjusting your filters'}
        </Text>
        {(searchQuery || filters.teaType !== 'all') && (
          <TouchableOpacity 
            onPress={() => { setSearchQuery(''); setFilters(f => ({ ...f, teaType: 'all', company: 'all', minRating: 'all' })); }}
            style={[styles.resetFiltersButton, { backgroundColor: theme.accent.primary + '20' }]}
          >
            <Text style={[styles.resetFiltersText, { color: theme.accent.primary }]}>Reset filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderSearchHistory = () => {
    if (!showHistory || history.length === 0 || searchQuery.length > 0) return null;
    
    return (
      <View style={[styles.historyContainer, { backgroundColor: theme.background.secondary }]}>
        <View style={styles.historyHeader}>
          <View style={styles.historyTitleRow}>
            <Clock size={16} color={theme.text.secondary} />
            <Text style={[styles.historyTitle, { color: theme.text.secondary }]}>Recent Searches</Text>
          </View>
          <TouchableOpacity 
            onPress={clearHistory}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Clear search history"
          >
            <Text style={[styles.clearText, { color: theme.accent.primary }]}>Clear</Text>
          </TouchableOpacity>
        </View>
        {history.slice(0, 5).map((query, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.historyItem, { borderBottomColor: theme.border.light }]}
            onPress={() => handleHistorySelect(query)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Search for ${query}`}
            accessibilityHint="Double tap to search"
          >
            <Text style={[styles.historyQuery, { color: theme.text.primary }]} numberOfLines={1}>
              {query}
            </Text>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => removeFromHistory(query)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={theme.text.tertiary} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  // Memoize the list header (without search bar) to prevent unnecessary re-renders
  const listHeader = useMemo(() => (
    <>
      {/* Tea Type Pills */}
      <View style={styles.filtersContainer}>
        <FilterPills 
          selectedType={filters.teaType}
          onSelectType={handleTypeChange}
        />
      </View>
      
      {/* Result Count */}
      <View style={styles.resultCount}>
        <Text style={[styles.resultText, { color: theme.text.secondary }]}>
          {filteredTeas.length >= 1000 ? `${filteredTeas.length.toLocaleString()}+` : filteredTeas.length.toLocaleString()} tea{filteredTeas.length !== 1 ? 's' : ''}
        </Text>
        {activeFilterCount > 0 && (
          <TouchableOpacity 
            onPress={() => setFilters({
              teaType: 'all',
              company: 'all',
              minRating: 'all',
              sortBy: 'relevance',
            })}
          >
            <Text style={[styles.clearFiltersText, { color: theme.accent.primary }]}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  ), [filters.teaType, filteredTeas.length, activeFilterCount, theme]);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Discover</Text>
      </View>
      
      {/* Search Bar - outside FlatList to prevent keyboard dismiss on re-render */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <SearchBar 
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.length === 0) setShowHistory(true);
            }}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            onSubmitEditing={handleSearchSubmit}
          />
        </View>
        <TouchableOpacity 
          style={[
            styles.filterButton,
            { 
              backgroundColor: activeFilterCount > 0 ? theme.accent.primary : theme.background.secondary,
              borderColor: activeFilterCount > 0 ? theme.accent.primary : theme.border.light,
            }
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <SlidersHorizontal 
            size={20} 
            color={activeFilterCount > 0 ? theme.text.inverse : theme.text.primary} 
          />
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: theme.status.error }]}>
              <Text style={[styles.filterBadgeText, { color: theme.text.inverse }]}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.filterButton,
            { 
              backgroundColor: theme.accent.primary,
              borderColor: theme.accent.primary,
            }
          ]}
          onPress={() => navigation.navigate('TeaFinder')}
        >
          <Sparkles size={20} color={theme.text.inverse} />
        </TouchableOpacity>
      </View>

      {/* Search History */}
      {renderSearchHistory()}
      
      <FlatList
        ref={flatListRef}
        data={filteredTeas}
        renderItem={renderTeaCard}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={renderEmptyState}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScroll={handleScroll}
        scrollEventThrottle={100}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshTeas}
            tintColor={theme.accent.primary}
          />
        }
      />

      {/* Scroll to Top Button */}
      <Animated.View 
        style={[
          styles.scrollToTopButton, 
          { 
            backgroundColor: theme.accent.primary,
            opacity: scrollButtonOpacity,
          }
        ]}
        pointerEvents={showScrollToTop ? 'auto' : 'none'}
      >
        <TouchableOpacity 
          onPress={scrollToTop} 
          style={styles.scrollToTopTouchable}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Scroll to top"
        >
          <ArrowUp size={24} color={theme.text.inverse} />
        </TouchableOpacity>
      </Animated.View>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
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
    paddingTop: spacing.headerPaddingTop,
    paddingBottom: spacing.headerPaddingBottom,
  },
  title: {
    ...typography.headingLarge,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  searchContainer: {
    flex: 1,
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: spacing.buttonBorderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  historyContainer: {
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
    borderRadius: 12,
    padding: spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyTitle: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearText: {
    ...typography.caption,
    fontWeight: '500',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
  },
  historyQuery: {
    ...typography.body,
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  filtersContainer: {
    paddingBottom: spacing.md,
  },
  resultCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.md,
  },
  resultText: {
    ...typography.bodySmall,
  },
  clearFiltersText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: 120,
  },
  cardContainer: {
    width: cardWidth,
    marginBottom: spacing.cardGap,
  },
  cardLeft: {
    marginRight: spacing.cardGap / 2,
  },
  cardRight: {
    marginLeft: spacing.cardGap / 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing.screenHorizontal,
  },
  emptyTitle: {
    ...typography.headingMedium,
    marginBottom: 12,
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  resetFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetFiltersText: {
    ...typography.caption,
    fontWeight: '600',
  },
  scrollToTopButton: {
    position: 'absolute',
    bottom: 100,
    right: spacing.screenHorizontal,
    width: 52,
    height: 52,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollToTopTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
