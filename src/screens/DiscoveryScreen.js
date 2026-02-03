import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { colors, typography, spacing } from '../constants';
import { SearchBar, FilterPills, TeaCard } from '../components';
import { teas } from '../data/teas';

const { width } = Dimensions.get('window');
const cardWidth = (width - spacing.screenHorizontal * 2 - spacing.cardGap) / 2;

export const DiscoveryScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  
  const filteredTeas = useMemo(() => {
    let result = teas;
    
    // Filter by type
    if (selectedType !== 'all') {
      result = result.filter(tea => tea.teaType === selectedType);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(tea => 
        tea.name.toLowerCase().includes(query) ||
        tea.brandName.toLowerCase().includes(query) ||
        tea.teaType.toLowerCase().includes(query) ||
        tea.flavorNotes?.some(note => note.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [searchQuery, selectedType]);
  
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
      <Text style={styles.emptyTitle}>No teas found</Text>
      <Text style={styles.emptySubtitle}>Try a different search or filter</Text>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
      </View>
      
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
      
      <FlatList
        data={filteredTeas}
        renderItem={renderTeaCard}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
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
