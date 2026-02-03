import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider, CollectionProvider } from './src/context';

export default function App() {
  return (
    <AuthProvider>
      <CollectionProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <AppNavigator />
        </NavigationContainer>
      </CollectionProvider>
    </AuthProvider>
  );
}
