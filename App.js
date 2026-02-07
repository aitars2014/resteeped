import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider, CollectionProvider, ThemeProvider, SubscriptionProvider, useTheme } from './src/context';
import { initAnalytics } from './src/utils';
import * as Sentry from '@sentry/react-native';

// Get build number for cache invalidation
const BUILD_VERSION = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1';

// Clear stale caches when app version changes
const checkAndClearCache = async () => {
  try {
    const storedVersion = await AsyncStorage.getItem('app_build_version');
    if (storedVersion !== BUILD_VERSION) {
      console.log(`Build changed (${storedVersion} → ${BUILD_VERSION}), clearing caches...`);
      // Clear any cached data that might be stale
      await AsyncStorage.multiRemove([
        'tea_cache',
        'cached_teas',
        'cached_companies', 
        'onboarding_complete', // Don't clear this - user shouldn't re-see onboarding
      ].filter(key => key !== 'onboarding_complete'));
      await AsyncStorage.setItem('app_build_version', BUILD_VERSION);
    }
  } catch (error) {
    console.error('Cache clear check failed:', error);
  }
};

Sentry.init({
  dsn: 'https://ed4a86afcec2ac2a1a08ae7ee03bba06@o4510829311754240.ingest.us.sentry.io/4510829313327104',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions in dev, reduce in production
  profilesSampleRate: 1.0, // Profile 100% of sampled transactions

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.reactNativeTracingIntegration(),
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// Wrapper to access theme for StatusBar
const AppContent = () => {
  const { isDark } = useTheme();
  
  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </NavigationContainer>
  );
};

export default Sentry.wrap(function App() {
  // Initialize analytics and check cache on app start
  useEffect(() => {
    checkAndClearCache();
    initAnalytics();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <CollectionProvider>
            <AppContent />
          </CollectionProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
});