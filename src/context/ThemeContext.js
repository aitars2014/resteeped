import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, getTeaTypeColor as getTeaColor } from '../constants/themes';

const THEME_STORAGE_KEY = '@resteeped:theme_preference';

const ThemeContext = createContext({
  theme: darkTheme,
  isDark: true,
  themePreference: 'dark', // 'light', 'dark', 'system'
  setThemePreference: () => {},
  getTeaTypeColor: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  // Default to dark mode - looks better and most users prefer it
  const [themePreference, setThemePreferenceState] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        setThemePreferenceState(saved);
      }
    } catch (e) {
      console.log('Error loading theme preference:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemePreference = async (preference) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
      setThemePreferenceState(preference);
    } catch (e) {
      console.log('Error saving theme preference:', e);
    }
  };

  // Determine if dark mode should be active
  const isDark = useMemo(() => {
    if (themePreference === 'system') {
      return systemColorScheme === 'dark';
    }
    return themePreference === 'dark';
  }, [themePreference, systemColorScheme]);

  // Get the active theme
  const theme = useMemo(() => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  // Helper to get tea type color with current theme
  const getTeaTypeColor = (teaType) => {
    return getTeaColor(teaType, theme);
  };

  const value = {
    theme,
    isDark,
    themePreference,
    setThemePreference,
    getTeaTypeColor,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
