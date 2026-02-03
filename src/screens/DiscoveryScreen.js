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
import { SlidersHorizontal } from 'lucide-react-native';
import { colors, typography, spacing } from '../constants';
import { SearchBar, FilterPills, FilterModal, TeaCard } from '../components';
import { useTeas } from '../hooks';

const { width } = Dimensions.get('window');
const cardWidth = (width - spacing.screenHorizontal * 2 - spacing.cardGap) / 2;

export const DiscoveryScreen = ({ navigation, route }) => {
  const { teas, loading, refreshTeas, filterTeas } = useTeas();
  
  // Accept initial values from navigation params (e.g., from Home screen)
  const { initialSearch, initialFilter } = route.params || {};
  
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [showFilterModal, setShowFilterModal] = useState(false);
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
        <ActivityIndicator size="large" color={colors.accent.primary} />
      ) : (
        <>
          <Text style={styles.emptyTitle}>No teas found</Text>
          <Text style={styles.emptySubtitle}>Try a different search or filter</Text>
        </>
      )}
    </View>
  );
  
  const renderHeader = () => (
    <>
      {/* Search Bar Row */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <SearchBar 
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={[
            styles.filterButton,
            activeFilterCount > 0 && styles.filterButtonActive
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <SlidersHorizontal 
            size={20} 
            color={activeFilterCount > 0 ? colors.text.inverse : colors.text.primary} 
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Tea Type Pills */}
      <View style={styles.filtersContainer}>
        <FilterPills 
          selectedType={filters.teaType}
          onSelectType={handleTypeChange}
        />
      </View>
      
      {/* Result Count */}
      <View style={styles.resultCount}>
        <Text style={styles.resultText}>
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
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
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
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshTeas}
            tintColor={colors.accent.primary}
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
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.headerPaddingTop,
    paddingBottom: spacing.headerPaddingBottom,
  },
  title: {
    ...typography.headingLarge,
    color: colors.text.primary,
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
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterButtonActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.status.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.inverse,
    fontWeight: '700',
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
    color: colors.text.secondary,
  },
  clearFiltersText: {
    ...typography.bodySmall,
    color: colors.accent.primary,
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
    color: colors.text.primary,
    marginBottom: 12,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
