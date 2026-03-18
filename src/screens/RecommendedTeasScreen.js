import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Plus, ChevronRight, Sparkles } from 'lucide-react-native';
import { typography, spacing } from '../constants';
import { useTheme, useCollection, useAuth } from '../context';
import { useTeas } from '../hooks';
import { Button, TeaCard } from '../components';
import { trackEvent } from '../utils/analytics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.screenHorizontal * 2 - 12) / 2;

/**
 * Post-preference onboarding step: shows personalized tea recommendations
 * and lets the user add their first teas to their collection before
 * landing on the Home screen.
 */
export const RecommendedTeasScreen = ({ onComplete }) => {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const { teas, loading } = useTeas();
  const { addToCollection, collection } = useCollection();
  const [addedTeas, setAddedTeas] = useState(new Set());
  const [adding, setAdding] = useState(null);

  // Generate recommendations based on just-captured preferences
  const recommended = useMemo(() => {
    if (!teas.length) return [];

    const prefs = profile || {};
    const preferredTypes = prefs.preferred_tea_types || [];
    const preferredFlavors = (prefs.preferred_flavors || []).map(f => f.toLowerCase());
    const caffeineLevel = prefs.caffeine_preference;
    const collectionIds = new Set(collection.map(c => c.tea_id));

    // Score each tea
    const scored = teas
      .filter(tea => !collectionIds.has(tea.id))
      .map(tea => {
        let score = 0;
        const type = (tea.teaType || '').toLowerCase();
        const flavors = (tea.flavorNotes || []).map(f => f.toLowerCase());

        // Type match
        if (preferredTypes.includes(type)) score += 5;

        // Flavor overlap
        const flavorOverlap = flavors.filter(f => preferredFlavors.includes(f)).length;
        score += flavorOverlap * 3;

        // Caffeine alignment
        if (caffeineLevel === 'high' && ['black', 'puerh'].includes(type)) score += 2;
        if (caffeineLevel === 'moderate' && ['green', 'oolong', 'white'].includes(type)) score += 2;
        if (caffeineLevel === 'low' && ['white', 'green'].includes(type)) score += 1;
        if (caffeineLevel === 'none' && type === 'herbal') score += 3;

        // Boost highly rated teas
        if (tea.rating >= 4.5) score += 2;
        if (tea.rating >= 4.0) score += 1;

        return { tea, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    // Brand diversity: max 2 per brand
    const result = [];
    const brandCounts = {};
    for (const { tea } of scored) {
      const brand = tea.brandName || 'Unknown';
      const count = brandCounts[brand] || 0;
      if (count >= 2) continue;
      brandCounts[brand] = count + 1;
      result.push(tea);
      if (result.length >= 8) break;
    }

    // If we don't have enough scored results, pad with top-rated
    if (result.length < 6) {
      const resultIds = new Set(result.map(t => t.id));
      const topRated = teas
        .filter(t => !collectionIds.has(t.id) && !resultIds.has(t.id) && (t.rating || 0) >= 4.0)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 8 - result.length);
      result.push(...topRated);
    }

    return result;
  }, [teas, profile, collection]);

  const handleAddTea = useCallback(async (tea) => {
    if (addedTeas.has(tea.id) || adding) return;
    setAdding(tea.id);
    try {
      await addToCollection(tea.id, 'want_to_try', tea);
      setAddedTeas(prev => new Set([...prev, tea.id]));
      trackEvent('onboarding_tea_added', {
        tea_id: tea.id,
        tea_name: tea.name,
        step: 'recommended_teas',
      });
    } catch (e) {
      console.error('Error adding tea to collection:', e);
    } finally {
      setAdding(null);
    }
  }, [addedTeas, adding, addToCollection]);

  const handleContinue = () => {
    trackEvent('onboarding_recommendations_completed', {
      teas_added: addedTeas.size,
      teas_shown: recommended.length,
    });
    onComplete();
  };

  const handleSkip = () => {
    trackEvent('onboarding_recommendations_skipped');
    onComplete();
  };

  const renderTeaItem = ({ item: tea }) => {
    const isAdded = addedTeas.has(tea.id);
    const isAdding = adding === tea.id;

    return (
      <TouchableOpacity
        style={[
          styles.teaItem,
          {
            backgroundColor: theme.background.secondary,
            borderColor: isAdded ? theme.accent.primary : theme.border,
            borderWidth: isAdded ? 2 : 1,
          },
        ]}
        onPress={() => handleAddTea(tea)}
        activeOpacity={0.7}
        disabled={isAdded || isAdding}
        accessibilityRole="button"
        accessibilityLabel={`${tea.name} by ${tea.brandName}. ${isAdded ? 'Added to collection' : 'Tap to add to collection'}`}
        accessibilityState={{ selected: isAdded }}
      >
        <View style={styles.teaInfo}>
          <Text
            style={[styles.teaName, { color: theme.text.primary }]}
            numberOfLines={2}
          >
            {tea.name}
          </Text>
          <Text
            style={[styles.teaBrand, { color: theme.text.secondary }]}
            numberOfLines={1}
          >
            {tea.brandName}
          </Text>
          {tea.teaType && (
            <View style={[styles.typeBadge, { backgroundColor: `${theme.accent.primary}15` }]}>
              <Text style={[styles.typeText, { color: theme.accent.primary }]}>
                {tea.teaType.charAt(0).toUpperCase() + tea.teaType.slice(1)}
              </Text>
            </View>
          )}
        </View>

        <View style={[
          styles.addButton,
          {
            backgroundColor: isAdded ? theme.accent.primary : `${theme.accent.primary}15`,
          },
        ]}>
          {isAdding ? (
            <ActivityIndicator size="small" color={theme.accent.primary} />
          ) : isAdded ? (
            <Check size={18} color="#fff" strokeWidth={2.5} />
          ) : (
            <Plus size={18} color={theme.accent.primary} strokeWidth={2} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent.primary} />
          <Text style={[styles.loadingText, { color: theme.text.secondary }]}>
            Finding teas for you...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Skip */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        accessibilityRole="button"
        accessibilityLabel="Skip recommendations"
      >
        <Text style={[styles.skipText, { color: theme.text.secondary }]}>Skip</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: `${theme.accent.primary}15` }]}>
          <Sparkles size={28} color={theme.accent.primary} strokeWidth={1.5} />
        </View>
        <Text style={[styles.title, { color: theme.text.primary }]}>
          Teas we think you'll love
        </Text>
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
          Tap to save any that catch your eye
        </Text>
      </View>

      {/* Tea grid */}
      <FlatList
        data={recommended}
        renderItem={renderTeaItem}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom */}
      <View style={styles.bottomSection}>
        {addedTeas.size > 0 && (
          <Text style={[styles.addedCount, { color: theme.accent.primary }]}>
            {addedTeas.size} tea{addedTeas.size !== 1 ? 's' : ''} saved ☕
          </Text>
        )}
        <Button
          title={addedTeas.size > 0 ? "Start Exploring" : "Continue"}
          onPress={handleContinue}
          variant="primary"
          style={styles.continueButton}
          icon={<ChevronRight size={18} color="#fff" />}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    ...typography.body,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: spacing.screenHorizontal,
    zIndex: 10,
    padding: spacing.sm,
  },
  skipText: {
    ...typography.body,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headingLarge,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.lg,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  teaItem: {
    width: CARD_WIDTH,
    borderRadius: 14,
    padding: spacing.md,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  teaInfo: {
    flex: 1,
    marginBottom: spacing.sm,
  },
  teaName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  teaBrand: {
    fontSize: 12,
    marginBottom: 6,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  bottomSection: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  addedCount: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  continueButton: {
    width: '100%',
    maxWidth: 320,
  },
});

export default RecommendedTeasScreen;
