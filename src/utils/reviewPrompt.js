import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackEvent } from './analytics';

const REVIEW_STORAGE_KEY = '@resteeped_review_state';
const FIRST_OPEN_KEY = '@resteeped_first_open';

// Trigger conditions (whichever comes first)
const MIN_TEAS_LOGGED = 5;       // 5th tea added to collection
const MIN_DAYS_SINCE_INSTALL = 7; // 7 days after first open
const MIN_POSITIVE_RATING = 4;   // Only on 4+ star tasting note
const MIN_TASTING_NOTES = 3;     // At least 3 notes before prompting
const COOLDOWN_DAYS = 120;       // Apple guideline: don't over-prompt
const MAX_PROMPTS_PER_YEAR = 3;  // Apple max ~3 per 365 days

/**
 * Record first app open time (call once at app startup).
 * Idempotent — only sets if not already recorded.
 */
export const recordFirstOpen = async () => {
  try {
    const existing = await AsyncStorage.getItem(FIRST_OPEN_KEY);
    if (!existing) {
      await AsyncStorage.setItem(FIRST_OPEN_KEY, Date.now().toString());
    }
  } catch (e) {
    // non-fatal
  }
};

/**
 * Internal: check cooldown/max and request review if eligible.
 * @param {string} trigger - What triggered this check
 * @param {object} meta - Additional tracking metadata
 * @returns {boolean} true if review was requested
 */
const _requestIfEligible = async (trigger, meta = {}) => {
  try {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return false;

    const raw = await AsyncStorage.getItem(REVIEW_STORAGE_KEY);
    const state = raw ? JSON.parse(raw) : { promptCount: 0, lastPromptAt: null };

    if (state.promptCount >= MAX_PROMPTS_PER_YEAR) return false;

    if (state.lastPromptAt) {
      const daysSince = (Date.now() - state.lastPromptAt) / (1000 * 60 * 60 * 24);
      if (daysSince < COOLDOWN_DAYS) return false;
    }

    await StoreReview.requestReview();

    trackEvent(AnalyticsEvents.STORE_REVIEW_PROMPTED, {
      trigger,
      promptNumber: state.promptCount + 1,
      ...meta,
    });

    await AsyncStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify({
      promptCount: state.promptCount + 1,
      lastPromptAt: Date.now(),
    }));

    return true;
  } catch (error) {
    console.warn('Review prompt error (non-fatal):', error);
    return false;
  }
};

/**
 * Trigger 1: After a positive tasting note.
 * Call after user saves a tasting note with a 4+ star rating.
 *
 * @param {number} rating - The rating the user just gave (1-5)
 * @param {number} totalNotes - Total tasting notes saved
 */
export const maybeRequestReview = async (rating, totalNotes) => {
  try {
    if (rating < MIN_POSITIVE_RATING) return;
    if (totalNotes < MIN_TASTING_NOTES) return;
    await _requestIfEligible('positive_tasting_note', { rating, totalNotes });
  } catch (error) {
    console.warn('Review prompt error (non-fatal):', error);
  }
};

/**
 * Trigger 2: After adding tea to collection.
 * Prompts at the 5th tea added.
 *
 * @param {number} collectionSize - Current collection size after add
 */
export const maybeRequestReviewOnCollectionAdd = async (collectionSize) => {
  try {
    if (collectionSize < MIN_TEAS_LOGGED) return;
    await _requestIfEligible('collection_milestone', { collectionSize });
  } catch (error) {
    console.warn('Review prompt (collection) error (non-fatal):', error);
  }
};

/**
 * Trigger 3: Time-based — 7 days after first open.
 * Call on app foreground / home screen mount.
 */
export const maybeRequestReviewByAge = async () => {
  try {
    const firstOpen = await AsyncStorage.getItem(FIRST_OPEN_KEY);
    if (!firstOpen) return;

    const daysSinceInstall = (Date.now() - parseInt(firstOpen, 10)) / (1000 * 60 * 60 * 24);
    if (daysSinceInstall < MIN_DAYS_SINCE_INSTALL) return;

    await _requestIfEligible('time_based', { daysSinceInstall: Math.floor(daysSinceInstall) });
  } catch (error) {
    console.warn('Review prompt (age) error (non-fatal):', error);
  }
};
