import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_STORAGE_KEY = '@resteeped_review_state';

// Minimum conditions before asking for a review
const MIN_TASTING_NOTES = 3; // At least 3 notes saved before prompting
const MIN_RATING = 4; // Only prompt after a 4+ star rating
const COOLDOWN_DAYS = 90; // Don't ask again for 90 days
const MAX_PROMPTS = 3; // Never ask more than 3 times total

/**
 * Check if we should request a review and do so if appropriate.
 * Call this after a user saves a tasting note with a positive rating.
 *
 * @param {number} rating - The rating the user just gave (1-5)
 * @param {number} totalNotes - Total tasting notes the user has saved
 */
export const maybeRequestReview = async (rating, totalNotes) => {
  try {
    // Quick checks before hitting storage
    if (rating < MIN_RATING) return;
    if (totalNotes < MIN_TASTING_NOTES) return;

    // Check if StoreReview is available
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return;

    // Load review state
    const raw = await AsyncStorage.getItem(REVIEW_STORAGE_KEY);
    const state = raw ? JSON.parse(raw) : { promptCount: 0, lastPromptAt: null };

    // Don't exceed max prompts
    if (state.promptCount >= MAX_PROMPTS) return;

    // Respect cooldown
    if (state.lastPromptAt) {
      const daysSince = (Date.now() - state.lastPromptAt) / (1000 * 60 * 60 * 24);
      if (daysSince < COOLDOWN_DAYS) return;
    }

    // All checks passed — request review
    await StoreReview.requestReview();

    // Update state
    await AsyncStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify({
      promptCount: state.promptCount + 1,
      lastPromptAt: Date.now(),
    }));
  } catch (error) {
    // Never let review logic crash the app
    console.warn('Review prompt error (non-fatal):', error);
  }
};
