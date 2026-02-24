// Analytics utility using Amplitude
import * as Amplitude from '@amplitude/analytics-react-native';
import { Platform, LogBox } from 'react-native';

// Initialize with API key from environment
const AMPLITUDE_API_KEY = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY;

let initialized = false;

// Suppress Amplitude cookie errors (not applicable in React Native)
LogBox.ignoreLogs([
  'Amplitude Logger [Error]: Failed to set cookie',
  'Failed to set cookie for key: AMP',
]);

// Also filter console.error for Amplitude cookie messages
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0]?.toString?.() || '';
  if (message.includes('Amplitude Logger') && message.includes('cookie')) {
    return; // Silently ignore Amplitude cookie errors
  }
  originalConsoleError.apply(console, args);
};

/**
 * Initialize Amplitude analytics
 * Call this once at app startup
 */
export const initAnalytics = async () => {
  if (initialized || !AMPLITUDE_API_KEY) {
    if (!AMPLITUDE_API_KEY) {
      console.log('[Analytics] No API key configured, analytics disabled');
    }
    return;
  }

  try {
    // Configure for React Native environment
    const config = {
      // Track session events automatically
      defaultTracking: {
        sessions: true,
        appLifecycles: true,
        screenViews: false, // Disable auto screen views - we'll track manually
      },
      // Privacy-friendly defaults
      trackingOptions: {
        ipAddress: false,
      },
      // Increase flush interval to reduce battery/network usage
      flushIntervalMillis: 30000,
      flushQueueSize: 30,
      // Disable cookie storage (not supported in React Native)
      disableCookies: true,
      // Use in-memory storage as fallback
      storageProvider: undefined,
    };

    await Amplitude.init(AMPLITUDE_API_KEY, undefined, config);
    initialized = true;
    console.log(`[Analytics] Amplitude initialized (${Platform.OS})`);
  } catch (error) {
    // Analytics is non-critical - log warning but don't crash the app
    console.warn('[Analytics] Init warning:', error.message || error);
    // Still mark as initialized to prevent repeated init attempts
    initialized = true;
  }
};

/**
 * Track a custom event
 * @param {string} eventName - Name of the event
 * @param {Object} properties - Optional event properties
 */
export const trackEvent = (eventName, properties = {}) => {
  if (!initialized) return;
  
  try {
    Amplitude.track(eventName, properties);
  } catch (error) {
    console.error('[Analytics] Failed to track event:', error);
  }
};

/**
 * Identify a user (call after sign-in)
 * @param {string} userId - User's unique ID
 * @param {Object} userProperties - Optional user properties
 */
export const identifyUser = (userId, userProperties = {}) => {
  if (!initialized) return;
  
  try {
    Amplitude.setUserId(userId);
    
    if (Object.keys(userProperties).length > 0) {
      const identifyEvent = new Amplitude.Identify();
      Object.entries(userProperties).forEach(([key, value]) => {
        identifyEvent.set(key, value);
      });
      Amplitude.identify(identifyEvent);
    }
  } catch (error) {
    console.error('[Analytics] Failed to identify user:', error);
  }
};

/**
 * Clear user identity (call on sign-out)
 */
export const resetUser = () => {
  if (!initialized) return;
  
  try {
    Amplitude.reset();
  } catch (error) {
    console.error('[Analytics] Failed to reset user:', error);
  }
};

// Pre-defined event names for consistency
export const AnalyticsEvents = {
  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',
  
  // Auth
  SIGN_UP: 'sign_up',
  SIGN_IN: 'sign_in',
  SIGN_OUT: 'sign_out',
  
  // Tea Discovery
  TEA_VIEWED: 'tea_viewed',
  TEA_SEARCHED: 'tea_searched',
  TEA_FILTERED: 'tea_filtered',
  
  // Collection
  TEA_ADDED_TO_COLLECTION: 'tea_added_to_collection',
  TEA_REMOVED_FROM_COLLECTION: 'tea_removed_from_collection',
  
  // Brewing
  BREW_STARTED: 'brew_started',
  BREW_COMPLETED: 'brew_completed',
  BREW_CANCELLED: 'brew_cancelled',
  
  // Reviews
  REVIEW_SUBMITTED: 'review_submitted',
  REVIEW_EDITED: 'review_edited',
  
  // Social
  TEA_SHARED: 'tea_shared',
  PROFILE_VIEWED: 'profile_viewed',
  COMPANY_VIEWED: 'company_viewed',
  
  // Teaware
  TEAWARE_VIEWED: 'teaware_viewed',
  TEAWARE_ADDED: 'teaware_added',
  
  // Tea Finder
  TEA_FINDER_SEARCH: 'tea_finder_search',
  TEA_FINDER_RESULT_TAP: 'tea_finder_result_tap',
  
  // Community Feed
  FEED_VIEWED: 'feed_viewed',
  FEED_REFRESHED: 'feed_refreshed',
  
  // Brew History
  BREW_HISTORY_VIEWED: 'brew_history_viewed',
  
  // Paywall
  PAYWALL_VIEWED: 'paywall_viewed',
  SUBSCRIPTION_STARTED: 'subscription_started',
  
  // Timer
  STEEP_PREFERENCE_SAVED: 'steep_preference_saved',
  
  // Tasting Notes
  TASTING_NOTES_SAVED: 'tasting_notes_saved',
  
  // Collection
  COLLECTION_VIEWED: 'collection_viewed',
};
