import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Bookmark, Plus } from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { TeaCard, Button } from '../components';
import { useAuth, useCollection, useTheme, useSubscription } from '../context';

export const CollectionScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { collection, loading, refreshCollection } = useCollection();
  const { isPremium, canAddToCollection, getRemainingFreeSlots, FREE_TIER_LIMITS } = useSubscription();
  const [filter, setFilter] = useState('all');
  
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
  
  const filteredCollection = collection.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'tried') return item.status === 'tried';
    if (filter === 'want') return item.status === 'want_to_try' || !item.status;
    return false;
  });
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer} accessibilityElementsHidden={true}>
        <Bookmark size={64} color={theme.text.secondary} />
      </View>
      {!user ? (
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
      brandName: rawTea.brandName || rawTea.brand_name,
      teaType: rawTea.teaType || rawTea.tea_type,
      avgRating: rawTea.avgRating || rawTea.avg_rating,
      imageUrl: rawTea.imageUrl || rawTea.image_url,
      companyId: rawTea.companyId || rawTea.company_id,
      ratingCount: rawTea.ratingCount || rawTea.rating_count,
      flavorNotes: rawTea.flavorNotes || rawTea.flavor_notes || [],
      productUrl: rawTea.productUrl || rawTea.product_url,
    };
    
    return (
      <View style={styles.teaItem}>
        <TeaCard 
          tea={tea} 
          onPress={() => navigation.navigate('TeaDetail', { tea })}
        />
        {item.user_rating && (
          <View style={[styles.ratingBadge, { backgroundColor: theme.accent.primary }]}>
            <Text style={[styles.ratingText, { color: theme.text.inverse }]}>★ {item.user_rating}</Text>
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
        onPress={() => setFilter(tab.id)}
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
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text.primary }]}>My Teas</Text>
          {user && collection.length > 0 && (
            <Text style={[styles.count, { color: theme.text.secondary }]}>{collection.length} teas</Text>
          )}
        </View>
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
        {[
          { id: 'all', label: 'All' },
          { id: 'tried', label: 'Tried' },
          { id: 'want', label: 'Want to Try' },
        ].map(renderTab)}
      </View>
      
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
    paddingTop: spacing.sm,
    paddingBottom: 120,
  },
  teaItem: {
    marginBottom: spacing.cardGap,
    position: 'relative',
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  ratingText: {
    ...typography.caption,
    fontWeight: '600',
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
});
