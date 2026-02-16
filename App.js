import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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

// Lightweight Sentry init — heavy integrations deferred to after mount
Sentry.init({
  dsn: 'https://ed4a86afcec2ac2a1a08ae7ee03bba06@o4510829311754240.ingest.us.sentry.io/4510829313327104',
  sendDefaultPii: true,
  enableLogs: true,

  // Production-appropriate sample rates
  tracesSampleRate: 0.2,
  profilesSampleRate: 0,

  // Replay still captures errors but skips random sessions
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1,

  // Only tracing at init — replay and feedback loaded after first render
  integrations: [
    Sentry.reactNativeTracingIntegration(),
  ],
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

    // Defer heavy Sentry integrations until after first render
    const deferTimer = setTimeout(() => {
      const client = Sentry.getClient();
      if (client) {
        client.addIntegration(Sentry.mobileReplayIntegration());
        client.addIntegration(Sentry.feedbackIntegration());
      }
    }, 3000);
    return () => clearTimeout(deferTimer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <CollectionProvider>
              <AppContent />
            </CollectionProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
});