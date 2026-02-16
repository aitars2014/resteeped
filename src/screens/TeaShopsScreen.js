import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Platform,
  Alert,
  TextInput,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { 
  ChevronLeft, 
  Star, 
  MapPin, 
  Globe, 
  ChevronRight,
  Map,
  List,
  Navigation,
  Search,
  Filter,
  X,
  ExternalLink,
  Store,
  Coffee,
} from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { StarRating, FilterPills } from '../components';
import { useCompanies, useTeas } from '../hooks';
import { useTheme } from '../context';

const { width } = Dimensions.get('window');

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Component for company logo with fallback
const CompanyLogo = ({ company, size = 56 }) => {
  const { theme } = useTheme();
  const [imageError, setImageError] = useState(false);
  
  if (!company.logo_url || imageError) {
    return (
      <LinearGradient
        colors={[theme.accent.primary, theme.accent.secondary]}
        style={[styles.logoPlaceholder, { width: size, height: size, borderRadius: size / 4 }]}
      >
        <Text style={[styles.logoText, { fontSize: size * 0.4 }]}>
          {company.name.charAt(0)}
        </Text>
      </LinearGradient>
    );
  }
  
  return (
    <Image 
      source={{ uri: company.logo_url }} 
      style={[styles.logo, { width: size, height: size }]}
      onError={() => setImageError(true)}
    />
  );
};

// Filter options
const SORT_OPTIONS = [
  { id: 'distance', label: 'Nearest' },
  { id: 'rating', label: 'Top Rated' },
  { id: 'tea_count', label: 'Most Teas' },
  { id: 'name', label: 'A-Z' },
];

export const TeaShopsScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { companies, loading, refreshing, refreshCompanies } = useCompanies();
  const { teas } = useTeas();
  
  // Location state
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  // View and filter state
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  const [showFilters, setShowFilters] = useState(false);
  const [filterBrand, setFilterBrand] = useState(null); // Filter by brand that has specific tea
  const [filterTeaType, setFilterTeaType] = useState(null);
  
  // Check if we came from a tea detail with a filter
  useEffect(() => {
    if (route?.params?.filterBrand) {
      setFilterBrand(route.params.filterBrand);
    }
  }, [route?.params]);
  
  // Request location permission on mount
  useEffect(() => {
    requestLocationPermission();
  }, []);
  
  const requestLocationPermission = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.log('Error getting location:', error);
    } finally {
      setLoadingLocation(false);
    }
  };
  
  // Calculate distance for each company
  const companiesWithDistance = useMemo(() => {
    return companies.map(company => {
      let distance = null;
      
      // If we have user location and company has coordinates, calculate distance
      if (userLocation && company.latitude && company.longitude) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          company.latitude,
          company.longitude
        );
      }
      
      // Get tea types this company carries
      const companyTeas = teas.filter(t => 
        t.brandName === company.name || t.companyId === company.id
      );
      const teaTypes = [...new Set(companyTeas.map(t => t.teaType))];
      
      return {
        ...company,
        distance,
        teaTypes,
        teaCount: companyTeas.length,
      };
    });
  }, [companies, userLocation, teas]);
  
  // Filter and sort companies
  const filteredCompanies = useMemo(() => {
    let result = [...companiesWithDistance];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.headquarters_city?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      );
    }
    
    // Brand filter
    if (filterBrand) {
      result = result.filter(c => c.name === filterBrand);
    }
    
    // Tea type filter
    if (filterTeaType) {
      result = result.filter(c => c.teaTypes.includes(filterTeaType));
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        case 'rating':
          return (b.avg_rating || 0) - (a.avg_rating || 0);
        case 'tea_count':
          return (b.teaCount || 0) - (a.teaCount || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    
    return result;
  }, [companiesWithDistance, searchQuery, filterBrand, filterTeaType, sortBy]);
  
  const formatDistance = (miles) => {
    if (miles === null) return null;
    if (miles < 0.1) return 'Nearby';
    if (miles < 1) return `${(miles * 5280).toFixed(0)} ft`;
    return `${miles.toFixed(1)} mi`;
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setFilterBrand(null);
    setFilterTeaType(null);
    setSortBy('distance');
  };
  
  const hasActiveFilters = searchQuery || filterBrand || filterTeaType || sortBy !== 'distance';
  
  const renderShopCard = ({ item: company }) => (
    <TouchableOpacity
      style={[styles.shopCard, { 
        backgroundColor: theme.background.secondary, 
        borderColor: theme.border.light 
      }]}
      onPress={() => navigation.navigate('CompanyProfile', { company })}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${company.name}${company.headquarters_city ? `, located in ${company.headquarters_city}` : ''}${company.avg_rating ? `, rated ${company.avg_rating.toFixed(1)} stars` : ''}`}
      accessibilityHint="View company profile and teas"
    >
      <View style={styles.shopContent}>
        {/* Logo or Placeholder */}
        <View style={styles.logoContainer}>
          <CompanyLogo company={company} size={56} />
        </View>

        {/* Info */}
        <View style={styles.shopInfo}>
          <Text style={[styles.shopName, { color: theme.text.primary }]} numberOfLines={1}>
            {company.name}
          </Text>
          
          {/* Distance Badge (if available) */}
          {company.distance !== null && (
            <View style={[styles.distanceBadge, { backgroundColor: theme.accent.primary + '20' }]}>
              <Navigation size={12} color={theme.accent.primary} />
              <Text style={[styles.distanceText, { color: theme.accent.primary }]}>
                {formatDistance(company.distance)}
              </Text>
            </View>
          )}
          
          {company.headquarters_city && (
            <View style={styles.locationRow}>
              <MapPin size={14} color={theme.text.secondary} />
              <Text style={[styles.locationText, { color: theme.text.secondary }]} numberOfLines={1}>
                {company.headquarters_city}
                {company.headquarters_state && `, ${company.headquarters_state}`}
              </Text>
            </View>
          )}
          
          <View style={styles.statsRow}>
            {company.avg_rating > 0 && (
              <View style={[styles.ratingBadge, { backgroundColor: theme.background.primary }]}>
                <Star size={12} color={theme.rating.star} fill={theme.rating.star} />
                <Text style={[styles.ratingText, { color: theme.text.primary }]}>
                  {company.avg_rating.toFixed(1)}
                </Text>
              </View>
            )}
            {company.teaCount > 0 && (
              <Text style={[styles.teaCount, { color: theme.text.secondary }]}>
                {company.teaCount} teas
              </Text>
            )}
          </View>

          {/* Tea Type Tags */}
          {company.teaTypes.length > 0 && (
            <View style={styles.teaTypeTags}>
              {company.teaTypes.slice(0, 3).map((type, idx) => (
                <View 
                  key={type} 
                  style={[styles.teaTypeTag, { backgroundColor: theme.background.tertiary }]}
                >
                  <Text style={[styles.teaTypeTagText, { color: theme.text.secondary }]}>
                    {type}
                  </Text>
                </View>
              ))}
              {company.teaTypes.length > 3 && (
                <Text style={[styles.moreTypes, { color: theme.text.tertiary }]}>
                  +{company.teaTypes.length - 3}
                </Text>
              )}
            </View>
          )}
        </View>

        <ChevronRight size={20} color={theme.text.secondary} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      {hasActiveFilters ? (
        <>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.background.secondary }]}>
            <Search size={40} color={theme.text.secondary} strokeWidth={1.5} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>No matches found</Text>
          <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
            Try adjusting your filters
          </Text>
          <TouchableOpacity 
            style={[styles.clearFiltersButton, { borderColor: theme.accent.primary }]}
            onPress={clearFilters}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
          >
            <Text style={[styles.clearFiltersText, { color: theme.accent.primary }]}>
              Clear Filters
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.background.secondary }]}>
            <Store size={40} color={theme.text.secondary} strokeWidth={1.5} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>No shops yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.text.secondary }]}>
            Tea shops will appear here once added
          </Text>
        </>
      )}
    </View>
  );
  
  const renderLocationPrompt = () => {
    if (locationPermission === 'granted' || loadingLocation) return null;
    
    return (
      <TouchableOpacity 
        style={[styles.locationPrompt, { 
          backgroundColor: theme.accent.primary + '15',
          borderColor: theme.accent.primary + '30',
        }]}
        onPress={requestLocationPermission}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Enable location services"
        accessibilityHint="See distances to tea shops near you"
      >
        <MapPin size={20} color={theme.accent.primary} accessibilityElementsHidden={true} />
        <View style={styles.locationPromptText}>
          <Text style={[styles.locationPromptTitle, { color: theme.text.primary }]}>
            Enable Location
          </Text>
          <Text style={[styles.locationPromptSubtitle, { color: theme.text.secondary }]}>
            See distances to tea shops near you
          </Text>
        </View>
        <ChevronRight size={20} color={theme.accent.primary} accessibilityElementsHidden={true} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border.light }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text.primary }]} accessibilityRole="header">Tea Shops</Text>
        <View style={styles.headerRight}>
          {/* View Toggle */}
          <View style={[styles.viewToggle, { backgroundColor: theme.background.secondary }]} accessibilityRole="tablist">
            <TouchableOpacity 
              style={[styles.viewToggleButton, viewMode === 'list' && { backgroundColor: theme.accent.primary }]}
              onPress={() => setViewMode('list')}
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel="List view"
              accessibilityState={{ selected: viewMode === 'list' }}
            >
              <List size={16} color={viewMode === 'list' ? theme.text.inverse : theme.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.viewToggleButton, viewMode === 'map' && { backgroundColor: theme.accent.primary }]}
              onPress={() => {
                setViewMode('map');
                Alert.alert('Coming Soon', 'Map view will be available in a future update!');
              }}
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel="Map view"
              accessibilityState={{ selected: viewMode === 'map' }}
            >
              <Map size={16} color={viewMode === 'map' ? theme.text.inverse : theme.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { 
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.light,
        }]}>
          <Search size={18} color={theme.text.secondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text.primary }]}
            placeholder="Search shops..."
            placeholderTextColor={theme.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={theme.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Sort Options */}
      <View style={styles.sortSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortPills}
        >
          {SORT_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.sortPill,
                { backgroundColor: theme.background.secondary, borderColor: theme.border.light },
                sortBy === option.id && { backgroundColor: theme.accent.primary, borderColor: theme.accent.primary },
              ]}
              onPress={() => setSortBy(option.id)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Sort by ${option.label}`}
              accessibilityState={{ selected: sortBy === option.id }}
            >
              <Text style={[
                styles.sortPillText,
                { color: theme.text.secondary },
                sortBy === option.id && { color: theme.text.inverse },
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Active Filters */}
      {(filterBrand || filterTeaType) && (
        <View style={styles.activeFilters}>
          {filterBrand && (
            <TouchableOpacity 
              style={[styles.filterChip, { backgroundColor: theme.accent.primary + '20' }]}
              onPress={() => setFilterBrand(null)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${filterBrand} filter`}
            >
              <Text style={[styles.filterChipText, { color: theme.accent.primary }]}>
                {filterBrand}
              </Text>
              <X size={14} color={theme.accent.primary} />
            </TouchableOpacity>
          )}
          {filterTeaType && (
            <TouchableOpacity 
              style={[styles.filterChip, { backgroundColor: theme.accent.primary + '20' }]}
              onPress={() => setFilterTeaType(null)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${filterTeaType} tea filter`}
            >
              <Text style={[styles.filterChipText, { color: theme.accent.primary }]}>
                {filterTeaType} tea
              </Text>
              <X size={14} color={theme.accent.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* Location Prompt */}
      {renderLocationPrompt()}
      
      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: theme.text.secondary }]}>
          {filteredCompanies.length} {filteredCompanies.length === 1 ? 'shop' : 'shops'}
          {userLocation && ' • sorted by distance'}
        </Text>
      </View>

      <FlatList
        data={filteredCompanies}
        renderItem={renderShopCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshCompanies}
            tintColor={theme.accent.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    ...typography.headingSmall,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  viewToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchSection: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    padding: 0,
  },
  sortSection: {
    paddingTop: spacing.sm,
  },
  sortPills: {
    paddingHorizontal: spacing.screenHorizontal,
    gap: 8,
  },
  sortPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortPillText: {
    ...typography.caption,
    fontWeight: '500',
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.sm,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  filterChipText: {
    ...typography.caption,
    fontWeight: '500',
  },
  locationPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.screenHorizontal,
    marginTop: spacing.md,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  locationPromptText: {
    flex: 1,
  },
  locationPromptTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  locationPromptSubtitle: {
    ...typography.caption,
  },
  resultsHeader: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  resultsCount: {
    ...typography.caption,
  },
  listContent: {
    padding: spacing.screenHorizontal,
    paddingBottom: 100,
  },
  shopCard: {
    borderRadius: spacing.cardBorderRadius,
    marginBottom: spacing.cardGap,
    overflow: 'hidden',
    borderWidth: 1,
  },
  shopContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.cardPadding,
  },
  logoContainer: {
    marginRight: spacing.md,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    ...typography.headingMedium,
    color: '#FFF',
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
    marginBottom: 4,
  },
  distanceText: {
    ...typography.caption,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  locationText: {
    ...typography.caption,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ratingText: {
    ...typography.caption,
    fontWeight: '600',
  },
  teaCount: {
    ...typography.caption,
  },
  teaTypeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  teaTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  teaTypeTagText: {
    ...typography.caption,
    fontSize: 10,
    textTransform: 'capitalize',
  },
  moreTypes: {
    ...typography.caption,
    fontSize: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    ...typography.headingMedium,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  clearFiltersButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  clearFiltersText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
});

export default TeaShopsScreen;
