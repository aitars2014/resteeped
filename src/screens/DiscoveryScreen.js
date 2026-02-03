import React, { useState, useMemo, useEffect } from 'react';
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
} from 'react-native';
import { SlidersHorizontal, Clock, X } from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { SearchBar, FilterPills, FilterModal, TeaCard } from '../components';
import { useTeas, useSearchHistory } from '../hooks';
import { useTheme } from '../context';

const { width } = Dimensions.get('window');
const cardWidth = (width - spacing.screenHorizontal * 2 - spacing.cardGap) / 2;

export const DiscoveryScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { teas, loading, refreshTeas, filterTeas } = useTeas();
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();
  
  // Accept initial values from navigation params (e.g., from Home screen)
  const { initialSearch, initialFilter } = route.params || {};
  
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [filters, setFilters] = useState({
    teaType: initialFilter || 'all',
    company: 'all',
    minRating: 'all',
    sortBy: 'rating',
  });
  
  // Update filters when navigating from Home with new params
  useEffect(() => {
    if (initialSearch !== undefined) setSearchQuery(initialSearch);
    if (initialFilter !== undefined) {
      setFilters(prev => ({ ...prev, teaType: initialFilter }));
    }
  }, [initialSearch, initialFilter]);
  
  const filteredTeas = useMemo(() => {
    return filterTeas(searchQuery, filters);
  }, [searchQuery, filters, filterTeas]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handleTypeChange = (type) => {
    setFilters(prev => ({ ...prev, teaType: type }));
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      addToHistory(searchQuery.trim());
      setShowHistory(false);
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
  
  const renderTeaCard = ({ item, index }) => (
    <View style={[styles.cardContainer, index % 2 === 0 ? styles.cardLeft : styles.cardRight]}>
      <TeaCard 
        tea={item} 
        onPress={() => navigation.navigate('TeaDetail', { tea: item })}
      />
    </View>
  );
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      {loading ? (
        <ActivityIndicator size="large" color={theme.accent.primary} />
      ) : (
        <>
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>No teas found</Text>
          <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>Try a different search or filter</Text>
        </>
      )}
    </View>
  );

  const renderSearchHistory = () => {
    if (!showHistory || history.length === 0 || searchQuery.length > 0) return null;
    
    return (
      <View style={[styles.historyContainer, { backgroundColor: theme.background.secondary }]}>
        <View style={styles.historyHeader}>
          <View style={styles.historyTitleRow}>
            <Clock size={16} color={theme.text.secondary} />
            <Text style={[styles.historyTitle, { color: theme.text.secondary }]}>Recent Searches</Text>
          </View>
          <TouchableOpacity onPress={clearHistory}>
            <Text style={[styles.clearText, { color: theme.accent.primary }]}>Clear</Text>
          </TouchableOpacity>
        </View>
        {history.slice(0, 5).map((query, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.historyItem, { borderBottomColor: theme.border.light }]}
            onPress={() => handleHistorySelect(query)}
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
  
  const renderHeader = () => (
    <>
      {/* Search Bar Row */}
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
      </View>

      {/* Search History */}
      {renderSearchHistory()}
      
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
          {filteredTeas.length} tea{filteredTeas.length !== 1 ? 's' : ''}
        </Text>
        {activeFilterCount > 0 && (
          <TouchableOpacity 
            onPress={() => setFilters({
              teaType: 'all',
              company: 'all',
              minRating: 'all',
              sortBy: 'rating',
            })}
          >
            <Text style={[styles.clearFiltersText, { color: theme.accent.primary }]}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Discover</Text>
      </View>
      
      <FlatList
        data={filteredTeas}
        renderItem={renderTeaCard}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshTeas}
            tintColor={theme.accent.primary}
          />
        }
      />

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
});
