import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Bookmark } from 'lucide-react-native';
import { colors, typography, spacing } from '../constants';
import { TeaCard, Button } from '../components';
import { useAuth, useCollection, useTheme } from '../context';

export const CollectionScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { collection, loading, refreshCollection } = useCollection();
  const [filter, setFilter] = useState('all');
  
  const filteredCollection = collection.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'tried') return item.status === 'tried';
    // 'want_to_try' is default, so include items without a status too
    if (filter === 'want') return item.status === 'want_to_try' || !item.status;
    return false;
  });
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Bookmark size={64} color={colors.text.secondary} />
      </View>
      {!user ? (
        <>
          <Text style={styles.emptyTitle}>Sign in to track your teas</Text>
          <Text style={styles.emptySubtitle}>
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
          <Text style={styles.emptyTitle}>Your collection is empty</Text>
          <Text style={styles.emptySubtitle}>
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
    // For now, we're using local tea data
    // When Supabase is connected, item.tea will contain the full tea object
    const tea = item.tea || {
      id: item.tea_id,
      name: 'Tea',
      brandName: 'Unknown',
      teaType: 'black',
      avgRating: item.user_rating || 0,
    };
    
    return (
      <View style={styles.teaItem}>
        <TeaCard 
          tea={tea} 
          onPress={() => navigation.navigate('TeaDetail', { tea })}
        />
        {item.user_rating && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>★ {item.user_rating}</Text>
          </View>
        )}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text.primary }]}>My Teas</Text>
        {user && collection.length > 0 && (
          <Text style={[styles.count, { color: theme.text.secondary }]}>{collection.length} teas</Text>
        )}
      </View>
      
      {/* Filter tabs */}
      <View style={styles.filterTabs}>
        {[
          { id: 'all', label: 'All' },
          { id: 'tried', label: 'Tried' },
          { id: 'want', label: 'Want to Try' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, filter === tab.id && styles.tabActive]}
            onPress={() => setFilter(tab.id)}
          >
            <Text style={[styles.tabText, filter === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
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
              tintColor={colors.accent.primary}
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
    backgroundColor: colors.background.primary,
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
    color: colors.text.primary,
  },
  count: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginRight: spacing.sm,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accent.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.accent.primary,
    fontWeight: '600',
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
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  ratingText: {
    ...typography.caption,
    color: colors.text.inverse,
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
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
});
