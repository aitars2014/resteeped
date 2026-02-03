import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors, typography, spacing } from '../constants';
import { SearchBar, FilterPills, TeaCard } from '../components';
import { useTeas } from '../hooks';
import { teaTypes } from '../data/teas';

const { width } = Dimensions.get('window');
const cardWidth = (width - spacing.screenHorizontal * 2 - spacing.cardGap) / 2;

export const DiscoveryScreen = ({ navigation }) => {
  const { teas, loading, refreshTeas, searchTeas } = useTeas();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  
  const filteredTeas = useMemo(() => {
    return searchTeas(searchQuery, selectedType);
  }, [searchQuery, selectedType, searchTeas]);
  
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
      <View style={styles.searchContainer}>
        <SearchBar 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <View style={styles.filtersContainer}>
        <FilterPills 
          selectedType={selectedType}
          onSelectType={setSelectedType}
        />
      </View>
      
      <View style={styles.resultCount}>
        <Text style={styles.resultText}>
          {filteredTeas.length} tea{filteredTeas.length !== 1 ? 's' : ''}
        </Text>
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
  searchContainer: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.elementSpacing,
  },
  filtersContainer: {
    paddingBottom: spacing.elementSpacing,
  },
  resultCount: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.elementSpacing,
  },
  resultText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  listContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: 100,
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
    paddingTop: 60,
  },
  emptyTitle: {
    ...typography.headingMedium,
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
