import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Bookmark } from 'lucide-react-native';
import { colors, typography, spacing } from '../constants';
import { TeaCard, Button } from '../components';

// Placeholder for collection - will be replaced with Supabase data
const mockCollection = [];

export const CollectionScreen = ({ navigation }) => {
  const [filter, setFilter] = useState('all');
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Bookmark size={64} color={colors.text.secondary} />
      </View>
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
    </View>
  );
  
  const renderTeaItem = ({ item }) => (
    <View style={styles.teaItem}>
      <TeaCard 
        tea={item} 
        onPress={() => navigation.navigate('TeaDetail', { tea: item })}
      />
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Teas</Text>
      </View>
      
      {/* Filter tabs */}
      <View style={styles.filterTabs}>
        {['all', 'tried', 'want'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, filter === tab && styles.tabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>
              {tab === 'all' ? 'All' : tab === 'tried' ? 'Tried' : 'Want to Try'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {mockCollection.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={mockCollection}
          renderItem={renderTeaItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    ...typography.headingLarge,
    color: colors.text.primary,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.sectionSpacing,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
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
    paddingBottom: 100,
  },
  teaItem: {
    marginBottom: spacing.cardGap,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenHorizontal,
  },
  emptyIconContainer: {
    marginBottom: 24,
    opacity: 0.5,
  },
  emptyTitle: {
    ...typography.headingMedium,
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
});
