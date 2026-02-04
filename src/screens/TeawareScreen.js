import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Search, 
  Filter, 
  ChevronRight,
  Coffee,
  Droplets,
  Package,
  Wrench,
  Sparkles,
} from 'lucide-react-native';
import { typography, spacing, fonts } from '../constants';
import { useTheme } from '../context';
import { useTeaware } from '../hooks/useTeaware';
import { SearchBar, FilterPills, TeaCardSkeleton, Gaiwan, Teapot, TeaCup, YixingPot } from '../components';
import { haptics } from '../utils/haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.screenHorizontal * 2 - spacing.cardGap) / 2;

// Teaware categories with icons and colors
const CATEGORIES = [
  { id: 'gaiwan', name: 'Gaiwans', Icon: Gaiwan, color: '#7CB89D' },
  { id: 'teapot', name: 'Teapots', Icon: Teapot, color: '#E8A060' },
  { id: 'cup', name: 'Cups', Icon: TeaCup, color: '#A8D5BA' },
  { id: 'pitcher', name: 'Pitchers', Icon: Droplets, color: '#C4956A' },
  { id: 'tea_tools', name: 'Tools', Icon: Wrench, color: '#B0B0B0' },
  { id: 'tea_pet', name: 'Tea Pets', Icon: Sparkles, color: '#E0B0D8' },
];

// Material filters
const MATERIALS = [
  { id: 'all', name: 'All' },
  { id: 'yixing_clay', name: 'Yixing' },
  { id: 'porcelain', name: 'Porcelain' },
  { id: 'jianshui_clay', name: 'Jianshui' },
  { id: 'glass', name: 'Glass' },
];

/**
 * TeawareCard Component
 */
const TeawareCard = ({ item, onPress, theme }) => {
  const handlePress = useCallback(() => {
    haptics.light();
    onPress?.(item);
  }, [item, onPress]);

  return (
    <TouchableOpacity
      style={[styles.card, { 
        backgroundColor: theme.background.secondary,
        borderColor: theme.border.light,
      }]}
      onPress={handlePress}
      activeOpacity={0.9}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}${item.material ? `, ${item.material.replace('_', ' ')}` : ''}${item.price_usd ? `, $${item.price_usd}` : ''}`}
      accessibilityHint="View teaware details"
    >
      <View style={styles.cardImageContainer}>
        {item.image_url ? (
          <Image 
            source={{ uri: item.image_url }} 
            style={styles.cardImage}
            accessible={true}
            accessibilityRole="image"
            accessibilityLabel={`Photo of ${item.name}`}
          />
        ) : (
          <LinearGradient
            colors={[theme.accent.warm || '#C4956A', theme.accent.primary]}
            style={styles.cardImagePlaceholder}
          >
            <Text style={styles.cardImageEmoji} accessibilityElementsHidden={true}>🫖</Text>
          </LinearGradient>
        )}
        {item.price_usd && (
          <View style={[styles.priceTag, { backgroundColor: theme.background.primary }]} accessibilityElementsHidden={true}>
            <Text style={[styles.priceText, { color: theme.text.primary }]}>
              ${item.price_usd}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardCategory, { color: theme.accent.warm || theme.text.secondary }]}>
          {item.category?.toUpperCase().replace('_', ' ')}
        </Text>
        <Text style={[styles.cardName, { color: theme.text.primary }]} numberOfLines={2}>
          {item.name}
        </Text>
        {item.material && (
          <Text style={[styles.cardMaterial, { color: theme.text.tertiary }]}>
            {item.material.replace('_', ' ')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

/**
 * TeawareScreen - Browse and discover teaware
 */
export const TeawareScreen = ({ navigation }) => {
  const { theme, isDark, getTeaTypeColor } = useTheme();
  const { teaware, loading, refreshTeaware } = useTeaware();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState('all');

  // Filter teaware
  const filteredTeaware = useMemo(() => {
    let result = teaware || [];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.artisan_name?.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory) {
      result = result.filter(item => item.category === selectedCategory);
    }
    
    if (selectedMaterial !== 'all') {
      result = result.filter(item => item.material === selectedMaterial);
    }
    
    return result;
  }, [teaware, searchQuery, selectedCategory, selectedMaterial]);

  // Group by category for browsing
  const teawareByCategory = useMemo(() => {
    const groups = {};
    (teaware || []).forEach(item => {
      const cat = item.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [teaware]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshTeaware();
    setRefreshing(false);
  }, [refreshTeaware]);

  const handleCategoryPress = (categoryId) => {
    haptics.selection();
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handleTeawarePress = (item) => {
    navigation.navigate('TeawareDetail', { teaware: item });
  };

  // Render category button
  const renderCategoryButton = ({ id, name, Icon, color }) => {
    const isSelected = selectedCategory === id;
    const count = teawareByCategory[id]?.length || 0;
    
    return (
      <TouchableOpacity
        key={id}
        style={[
          styles.categoryButton,
          { 
            backgroundColor: isSelected ? color : theme.background.secondary,
            borderColor: isSelected ? color : theme.border.light,
          }
        ]}
        onPress={() => handleCategoryPress(id)}
        activeOpacity={0.8}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${count} items`}
        accessibilityState={{ selected: isSelected }}
        accessibilityHint={isSelected ? "Tap to clear filter" : `Filter by ${name}`}
      >
        <Icon size={24} color={isSelected ? '#FFF' : color} strokeWidth={2} />
        <Text style={[
          styles.categoryName, 
          { color: isSelected ? '#FFF' : theme.text.primary }
        ]}>
          {name}
        </Text>
        <Text style={[
          styles.categoryCount,
          { color: isSelected ? 'rgba(255,255,255,0.8)' : theme.text.tertiary }
        ]}>
          {count}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render horizontal list for a category
  const renderCategorySection = (categoryId, categoryName) => {
    const items = teawareByCategory[categoryId];
    if (!items || items.length === 0) return null;

    return (
      <View style={styles.section} key={categoryId}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            {categoryName}
          </Text>
          <TouchableOpacity 
            onPress={() => {
              haptics.light();
              setSelectedCategory(categoryId);
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`See all ${categoryName}, ${items.length} items`}
          >
            <Text style={[styles.seeAllText, { color: theme.accent.primary }]}>
              See All ({items.length})
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {items.slice(0, 6).map(item => (
            <TeawareCard
              key={item.id}
              item={item}
              onPress={handleTeawarePress}
              theme={theme}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
            Teaware
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.text.secondary }]}>
            Discover the perfect vessels for your tea journey
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search teaware..."
          />
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map(renderCategoryButton)}
        </ScrollView>

        {/* Material Filter Pills */}
        {selectedCategory && (
          <View style={styles.materialFilters}>
            <FilterPills
              options={MATERIALS}
              selected={selectedMaterial}
              onSelect={setSelectedMaterial}
            />
          </View>
        )}

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.skeletonRow}>
              <TeaCardSkeleton compact />
              <TeaCardSkeleton compact />
            </View>
          </View>
        ) : selectedCategory ? (
          // Grid view for selected category
          <View style={styles.gridContainer}>
            {filteredTeaware.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
                  No teaware found
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {filteredTeaware.map(item => (
                  <TeawareCard
                    key={item.id}
                    item={item}
                    onPress={handleTeawarePress}
                    theme={theme}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          // Browse by category
          <>
            {renderCategorySection('gaiwan', 'Gaiwans')}
            {renderCategorySection('teapot', 'Teapots')}
            {renderCategorySection('cup', 'Cups')}
            {renderCategorySection('pitcher', 'Pitchers')}
            {renderCategorySection('tea_tools', 'Tools & Accessories')}
            {renderCategorySection('tea_pet', 'Tea Pets')}
          </>
        )}

        <View style={{ height: 40 }} />
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts?.serif || 'Georgia',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  searchContainer: {
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
  },
  categoriesContainer: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.md,
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 10,
    minWidth: 80,
  },
  categoryIcon: {
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 11,
  },
  materialFilters: {
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
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
  sectionTitle: {
    fontFamily: fonts?.serif || 'Georgia',
    fontSize: 20,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  horizontalList: {
    paddingHorizontal: spacing.screenHorizontal,
    gap: spacing.cardGap,
  },
  gridContainer: {
    paddingHorizontal: spacing.screenHorizontal,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.cardGap,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: spacing.cardBorderRadius,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardImageContainer: {
    height: 140,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImageEmoji: {
    fontSize: 40,
  },
  priceTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardContent: {
    padding: 12,
  },
  cardCategory: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardName: {
    fontFamily: fonts?.serif || 'Georgia',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  cardMaterial: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  loadingContainer: {
    paddingHorizontal: spacing.screenHorizontal,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.cardGap,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

export default TeawareScreen;
