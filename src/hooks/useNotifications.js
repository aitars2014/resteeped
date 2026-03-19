import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
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
 * Read notification permission status without exploding on simulators.
 */
async function getPermissionStatusSafe() {
  if (!Device.isDevice) {
    console.log('Skipping notification permission check on simulator');
    return 'unavailable';
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Failed to get notification permissions:', error);
    return 'unavailable';
  }
}

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
  const existingStatus = await getPermissionStatusSafe();
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
      if (error.code === '42P01') {
        console.log('push_tokens table not yet created — storing token locally');
        await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);
        return;
      }
      console.error('Failed to save push token to Supabase:', error);
    }
  } catch (err) {
    console.error('Push token save error:', err);
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
  
  // Use a ref to always have the latest preferences available in callbacks
  // This prevents stale closure issues with useCallback
  const preferencesRef = useRef(preferences);
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  // Load saved preferences on mount
  useEffect(() => {
    let cancelled = false;
    
    const load = async () => {
      try {
        // Always check AsyncStorage first — it's the source of truth
        // (updated synchronously on every toggle)
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_PREFS);
        if (stored && !cancelled) {
          setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
          setLoading(false);
          return;
        }

        // Fall back to Supabase profile (first launch or cleared storage)
        if (profile?.notification_preferences && !cancelled) {
          const prefs = { ...DEFAULT_PREFERENCES, ...profile.notification_preferences };
          setPreferences(prefs);
          // Cache to AsyncStorage so future loads are consistent
          await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PREFS, JSON.stringify(prefs));
        }
      } catch (err) {
        console.error('Failed to load notification preferences:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    load();
    return () => { cancelled = true; };
  }, [user, profile]);

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

      const status = await getPermissionStatusSafe();
      setPermissionStatus(status);
    };

    register();
  }, [user]);

  // Re-check permissions when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        const status = await getPermissionStatusSafe();
        setPermissionStatus(status);
      }
    });

    return () => subscription?.remove();
  }, []);

  /**
   * Update a single notification preference.
   * Uses functional setState + ref to avoid stale closure issues.
   */
  const updatePreference = useCallback(async (key, value) => {
    // Use the ref for the latest preferences (avoids stale closure)
    const current = preferencesRef.current;
    const updated = { ...current, [key]: value };
    
    // Update state
    setPreferences(updated);

    // Save to AsyncStorage (synchronous source of truth)
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PREFS, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save preferences to AsyncStorage:', err);
    }

    // Save to Supabase (async, best-effort)
    if (user) {
      savePreferencesToSupabase(user.id, updated);
    }
  }, [user]);

  /**
   * Request notification permissions.
   */
  const requestPermissions = useCallback(async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      setPushToken(token);
      if (user) {
        await savePushTokenToSupabase(user.id, token);
      }
    }

    const status = await getPermissionStatusSafe();
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
