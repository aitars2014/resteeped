import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device'; // Requires native build - using fallback
const Device = { isDevice: true }; // Fallback for dev builds without native module
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context';

// Storage keys
const STORAGE_KEYS = {
  PUSH_TOKEN: '@resteeped:push_token',
  NOTIFICATION_PREFS: '@resteeped:notification_preferences',
};

// Default notification preferences (all opt-in, default OFF)
const DEFAULT_PREFERENCES = {
  dailySuggestion: false,
  brewReminder: false,
  newTeasFromBrands: false,
  seasonalPrompts: false,
};

/**
 * Register for push notifications and get the Expo push token.
 * Returns null if permissions are denied or device is a simulator.
 */
async function registerForPushNotificationsAsync() {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permission status
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Get Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.error('No EAS project ID found in app config');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenData.data;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

/**
 * Store or update the push token in Supabase for the current user.
 */
async function savePushTokenToSupabase(userId, token) {
  if (!isSupabaseConfigured() || !userId || !token) return;

  try {
    // Upsert into push_tokens table
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: userId,
          token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,token' }
      );

    if (error) {
      // If table doesn't exist yet, just store locally
      if (error.code === '42P01') {
        console.log('push_tokens table not yet created — storing token locally');
        await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);
        return;
      }
      console.error('Failed to save push token to Supabase:', error);
    }
  } catch (err) {
    console.error('Push token save error:', err);
    // Always cache locally as fallback
    await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);
  }
}

/**
 * Save notification preferences to Supabase and local storage.
 */
async function savePreferencesToSupabase(userId, preferences) {
  if (!isSupabaseConfigured() || !userId) return;

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: preferences })
      .eq('id', userId);

    if (error) {
      // Column might not exist yet — that's fine, local storage is the fallback
      if (error.code === '42703') {
        console.log('notification_preferences column not yet added to profiles');
        return;
      }
      console.error('Failed to save notification prefs:', error);
    }
  } catch (err) {
    console.error('Notification prefs save error:', err);
  }
}

/**
 * Hook to manage push notifications: registration, permissions, and preferences.
 */
export function useNotifications() {
  const { user, profile } = useAuth();
  const [pushToken, setPushToken] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Load saved preferences
  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    try {
      // Always check local storage first — it's updated immediately on toggle
      // and is more up-to-date than the profile cached at login
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_PREFS);
      if (stored) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
        setLoading(false);
        return;
      }

      // Fall back to Supabase profile (first launch or cleared storage)
      if (profile?.notification_preferences) {
        const prefs = { ...DEFAULT_PREFERENCES, ...profile.notification_preferences };
        setPreferences(prefs);
        // Cache to local storage so future loads are fast and consistent
        await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PREFS, JSON.stringify(prefs));
      }
    } catch (err) {
      console.error('Failed to load notification preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  // Register for push notifications when user is authenticated
  useEffect(() => {
    if (!user) return;

    const register = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setPushToken(token);
        await savePushTokenToSupabase(user.id, token);
        await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);
      }

      // Check current permission status
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    };

    register();
  }, [user]);

  // Re-check permissions when app comes to foreground (user may have toggled in Settings)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        const { status } = await Notifications.getPermissionsAsync();
        setPermissionStatus(status);
      }
    });

    return () => subscription?.remove();
  }, []);

  /**
   * Update a single notification preference.
   */
  const updatePreference = useCallback(async (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);

    // Save locally
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PREFS, JSON.stringify(updated));

    // Save to Supabase
    if (user) {
      await savePreferencesToSupabase(user.id, updated);
    }
  }, [preferences, user]);

  /**
   * Request notification permissions (if not already granted).
   * Useful for a manual "Enable Notifications" button.
   */
  const requestPermissions = useCallback(async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      setPushToken(token);
      if (user) {
        await savePushTokenToSupabase(user.id, token);
      }
    }

    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
    return status;
  }, [user]);

  return {
    pushToken,
    permissionStatus,
    isPermissionGranted: permissionStatus === 'granted',
    preferences,
    updatePreference,
    requestPermissions,
    loading,
  };
}
