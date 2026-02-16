import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Sparkles } from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { TeaCard } from '../components';
import { useTeaRecommendations } from '../hooks/useTeaRecommendations';
import { useTheme } from '../context';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';

const { width } = Dimensions.get('window');
const cardWidth = (width - spacing.screenHorizontal * 2 - spacing.cardGap) / 2;

const SUGGESTED_CHIPS = [
  'calming',
  'energizing',
  'good for sleep',
  'fruity and light',
  'bold morning tea',
  'caffeine free',
];

export const TeaFinderScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { recommendations, loading, error, findTeas } = useTeaRecommendations();
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback((text) => {
    const searchQuery = text || query;
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setHasSearched(true);
    trackEvent(AnalyticsEvents.TEA_FINDER_SEARCH, { query: searchQuery.trim(), source: 'typed' });
    findTeas(searchQuery);
  }, [query, findTeas]);

  const handleChipPress = useCallback((chip) => {
    setQuery(chip);
    setHasSearched(true);
    trackEvent(AnalyticsEvents.TEA_FINDER_SEARCH, { query: chip, source: 'chip' });
    findTeas(chip);
  }, [findTeas]);

  const renderTeaCard = ({ item, index }) => (
    <View style={[styles.cardContainer, index % 2 === 0 ? styles.cardLeft : styles.cardRight]}>
      <TeaCard
        tea={item}
        onPress={() => {
          trackEvent(AnalyticsEvents.TEA_FINDER_RESULT_TAP, {
            query,
            tea_id: item.id,
            tea_name: item.name,
            position: index,
          });
          navigation.navigate('TeaDetail', { tea: item });
        }}
      />
    </View>
  );

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Tea Finder</Text>
          <Text style={styles.subtitle}>Describe what you're looking for</Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.inputContainer}>
            <Search size={18} color={theme.text.secondary} style={styles.searchIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. calming tea for evening..."
              placeholderTextColor={theme.text.tertiary}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => handleSearch()}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={() => handleSearch()}>
            <Sparkles size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {!hasSearched && (
          <View style={styles.chipsContainer}>
            <Text style={styles.chipsLabel}>Try searching for:</Text>
            <View style={styles.chips}>
              {SUGGESTED_CHIPS.map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={styles.chip}
                  onPress={() => handleChipPress(chip)}
                >
                  <Text style={styles.chipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.text.primary} />
            <Text style={styles.loadingText}>Finding your perfect tea...</Text>
          </View>
        )}

        {error && (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && hasSearched && recommendations.length === 0 && !error && (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptyText}>
              Try a different description — the more detail, the better the results!
            </Text>
          </View>
        )}

        {!loading && recommendations.length > 0 && (
          <FlatList
            data={recommendations}
            renderItem={renderTeaCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: theme.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: theme.text.secondary,
    marginTop: 4,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenHorizontal,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: theme.text.primary,
    height: 48,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.accent?.primary || '#4A90A4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsContainer: {
    paddingHorizontal: spacing.screenHorizontal,
    marginTop: spacing.lg,
  },
  chipsLabel: {
    ...typography.caption,
    color: theme.text.secondary,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.background.secondary,
  },
  chipText: {
    ...typography.caption,
    color: theme.text.primary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenHorizontal,
  },
  loadingText: {
    ...typography.body,
    color: theme.text.secondary,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: theme.status?.error || '#e74c3c',
    textAlign: 'center',
  },
  emptyTitle: {
    ...typography.h3,
    color: theme.text.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: theme.text.secondary,
    textAlign: 'center',
  },
  grid: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
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
});

export default TeaFinderScreen;
