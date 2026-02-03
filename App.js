import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { TabNavigator } from './src/navigation/TabNavigator';
import { AuthProvider, CollectionProvider } from './src/context';

export default function App() {
  return (
    <AuthProvider>
      <CollectionProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <TabNavigator />
        </NavigationContainer>
      </CollectionProvider>
    </AuthProvider>
  );
}
