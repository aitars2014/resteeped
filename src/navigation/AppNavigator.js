import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { OnboardingScreen, isOnboardingComplete } from '../screens';
import { PreferenceCaptureScreen } from '../screens/PreferenceCaptureScreen';
import { useTheme, useAuth } from '../context';

const Stack = createNativeStackNavigator();
const { width } = Dimensions.get('window');

export const AppNavigator = () => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const complete = await isOnboardingComplete();
    setShowOnboarding(!complete);
    setIsLoading(false);
  };

  const handleOnboardingComplete = () => {
    // After onboarding slides, show preference capture if user is logged in
    if (user) {
      setShowOnboarding(false);
      setShowPreferences(true);
    } else {
      setShowOnboarding(false);
    }
  };

  const handlePreferencesComplete = () => {
    setShowPreferences(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background.primary }]}>
        <Image 
          source={isDark 
            ? require('../../assets/resteeped-logo-dark.png')
            : require('../../assets/resteeped-logo.png')
          } 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {showOnboarding ? (
        <Stack.Screen name="Onboarding">
          {(props) => (
            <OnboardingScreen {...props} onComplete={handleOnboardingComplete} />
          )}
        </Stack.Screen>
      ) : showPreferences ? (
        <Stack.Screen name="Preferences">
          {(props) => (
            <PreferenceCaptureScreen {...props} onComplete={handlePreferencesComplete} />
          )}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Main" component={TabNavigator} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.7,
    height: width * 0.5,
  },
});

export default AppNavigator;
