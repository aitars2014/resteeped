import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider, CollectionProvider, ThemeProvider, useTheme } from './src/context';

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

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CollectionProvider>
          <AppContent />
        </CollectionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
