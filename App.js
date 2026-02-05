import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider, CollectionProvider, ThemeProvider, SubscriptionProvider, useTheme } from './src/context';
import { initAnalytics } from './src/utils';
import * as Sentry from '@sentry/react-native';

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
  // Initialize analytics on app start
  useEffect(() => {
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