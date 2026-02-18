import { useMemo } from 'react';
import { useTeas } from './useTeas';
import { useCollection, useAuth } from '../context';

/**
 * Generate personalized tea recommendations based on user's collection and preferences.
 * 
 * Strategy:
 * 1. Analyze user's tried teas to determine preferred tea types and flavor profiles
 * 2. Find similar teas they haven't tried yet
 * 3. Boost teas from brands they've liked
 * 4. Include highly-rated teas as fallback
 */
export const useRecommendations = (limit = 10) => {
  const { teas } = useTeas();
  const { collection } = useCollection();
  const { profile } = useAuth();

  const recommendations = useMemo(() => {
    if (teas.length === 0) return { forYou: [], explore: [], topRated: [] };

    // Get user's tried and liked teas
    const triedTeas = collection.filter(item => item.status === 'tried');
    const likedTeas = triedTeas.filter(item => (item.user_rating || 0) >= 4);
    const collectionTeaIds = new Set(collection.map(item => item.tea_id));

    // Calculate preferences based on liked teas
    const preferences = {
      teaTypes: {},
      brands: {},
      flavors: {},
    };

    likedTeas.forEach(item => {
      const tea = item.tea || teas.find(t => t.id === item.tea_id);
      if (!tea) return;

      // Count tea types
      preferences.teaTypes[tea.teaType] = (preferences.teaTypes[tea.teaType] || 0) + 1;
      
      // Count brands
      preferences.brands[tea.brandName] = (preferences.brands[tea.brandName] || 0) + 1;
      
      // Count flavor notes
      (tea.flavorNotes || []).forEach(flavor => {
        preferences.flavors[flavor.toLowerCase()] = 
          (preferences.flavors[flavor.toLowerCase()] || 0) + 1;
      });
    });

    // If user has no usage history but has onboarding preferences, seed from those
    const onboardingPrefs = profile || {};
    const hasOnboardingPrefs = (onboardingPrefs.preferred_tea_types || []).length > 0;

    if (likedTeas.length === 0 && hasOnboardingPrefs) {
      // Seed preferences from onboarding selections
      (onboardingPrefs.preferred_tea_types || []).forEach(type => {
        preferences.teaTypes[type] = (preferences.teaTypes[type] || 0) + 3;
      });
      (onboardingPrefs.preferred_flavors || []).forEach(flavor => {
        preferences.flavors[flavor.toLowerCase()] = (preferences.flavors[flavor.toLowerCase()] || 0) + 2;
      });
    }

    // Get preferred tea types (top 3)
    const preferredTypes = Object.entries(preferences.teaTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);

    // Get preferred brands
    const preferredBrands = Object.entries(preferences.brands)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([brand]) => brand);

    // Get preferred flavors (top 5)
    const preferredFlavors = Object.entries(preferences.flavors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([flavor]) => flavor);

    // Score teas for recommendations
    const scoredTeas = teas
      .filter(tea => !collectionTeaIds.has(tea.id)) // Exclude already in collection
      .map(tea => {
        let score = 0;

        // Base score from rating
        score += (tea.avgRating || 0) * 10;

        // Boost for preferred tea type
        if (preferredTypes.includes(tea.teaType)) {
          const typeRank = preferredTypes.indexOf(tea.teaType);
          score += (3 - typeRank) * 15; // 45, 30, or 15 points
        }

        // Boost for preferred brand
        if (preferredBrands.includes(tea.brandName)) {
          score += 20;
        }

        // Boost for matching flavor notes
        const matchingFlavors = (tea.flavorNotes || []).filter(
          f => preferredFlavors.includes(f.toLowerCase())
        ).length;
        score += matchingFlavors * 8;

        // Caffeine preference boost (from onboarding)
        if (onboardingPrefs.caffeine_preference) {
          const cafPref = onboardingPrefs.caffeine_preference;
          const teaType = (tea.teaType || '').toLowerCase();
          const highCaf = ['black', 'puerh', 'matcha'];
          const modCaf = ['green', 'oolong', 'white'];
          const noCaf = ['herbal', 'rooibos'];

          if (cafPref === 'high' && highCaf.includes(teaType)) score += 10;
          if (cafPref === 'moderate' && modCaf.includes(teaType)) score += 10;
          if (cafPref === 'low' && [...modCaf, ...noCaf].includes(teaType)) score += 8;
          if (cafPref === 'none' && noCaf.includes(teaType)) score += 15;
          if (cafPref === 'none' && highCaf.includes(teaType)) score -= 10;
        }

        // Slight boost for popular teas (many reviews)
        score += Math.min((tea.ratingCount || 0) * 0.5, 10);

        return { tea, score };
      })
      .sort((a, b) => b.score - a.score);

    // "For You" - Personalized recommendations (if user has preferences)
    const forYou = preferredTypes.length > 0
      ? scoredTeas.slice(0, limit).map(item => item.tea)
      : [];

    // "Explore" - Different from user's usual preferences
    const explore = teas
      .filter(tea => {
        // Not in collection
        if (collectionTeaIds.has(tea.id)) return false;
        // Different from preferred types (to encourage exploration)
        if (preferredTypes.length > 0 && preferredTypes.includes(tea.teaType)) return false;
        return true;
      })
      .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
      .slice(0, limit);

    // "Top Rated" - Highest rated teas overall
    const topRated = teas
      .filter(tea => !collectionTeaIds.has(tea.id))
      .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
      .slice(0, limit);

    return {
      forYou,
      explore,
      topRated,
      preferences: {
        types: preferredTypes,
        brands: preferredBrands,
        flavors: preferredFlavors,
      },
      hasPreferences: preferredTypes.length > 0,
    };
  }, [teas, collection, limit, profile]);

  return recommendations;
};

export default useRecommendations;
