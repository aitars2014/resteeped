import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';

const CollectionContext = createContext({});
const COLLECTION_CACHE_KEY = '@resteeped_collection_cache';
const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

export const useCollection = () => useContext(CollectionContext);

export const CollectionProvider = ({ children }) => {
  const { user, isDevMode, initialized: authInitialized } = useAuth();
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if we should use local-only mode (no Supabase calls for user data)
  const isLocalMode = !isSupabaseConfigured() || isDevMode;

  // Load cached collection immediately on mount (before auth resolves)
  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(COLLECTION_CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (data && Array.isArray(data) && data.length > 0) {
            setCollection(data);
          }
        }
      } catch (error) {
        console.warn('Failed to load collection cache:', error);
      } finally {
        // cacheLoaded state removed (was never read)
      }
    };
    loadCache();
  }, []);

  // Save collection to cache whenever it changes
  const saveCache = useCallback(async (data) => {
    try {
      await AsyncStorage.setItem(COLLECTION_CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn('Failed to save collection cache:', error);
    }
  }, []);

  // Fetch user's tea collection from Supabase
  const fetchCollection = useCallback(async (opts = {}) => {
    const { silent = false } = opts;
    if (!user || isLocalMode) {
      // Only clear collection on explicit sign-out (when auth is initialized but no user)
      // Don't clear during initial auth loading
      if (!user && authInitialized) {
        setCollection([]);
        AsyncStorage.removeItem(COLLECTION_CACHE_KEY).catch(() => {});
      }
      if (!silent) setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_teas')
        .select(`
          *,
          tea:teas(*)
        `)
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;
      const result = data || [];
      setCollection(result);
      saveCache(result);
    } catch (error) {
      console.error('Error fetching collection:', error);
      // On failure, keep existing cached data — don't clear
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user, authInitialized, saveCache]);

  // Fetch from server once auth is ready, or when user identity changes (sign-in/sign-out)
  const userId = user?.id;
  useEffect(() => {
    if (authInitialized) {
      fetchCollection();
    }
  }, [authInitialized, userId, fetchCollection]);

  // Re-fetch collection when app returns from background (silent refresh)
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        fetchCollection({ silent: true });
      }
      appState.current = nextAppState;
    });
    return () => subscription?.remove();
  }, [fetchCollection]);

  // Add tea to collection
  // In dev mode, pass the full tea object so we can display it properly
  const addToCollection = async (teaId, status = 'want_to_try', teaData = null) => {
    console.log('[Collection] addToCollection called', { teaId, status, userId: user?.id, isLocalMode });
    if (!user) {
      return { error: { message: 'Must be signed in' } };
    }

    // Resolve non-UUID tea IDs (from local/scraped data) to Supabase UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(teaId) && teaData?.name) {
      const { data: match } = await supabase
        .from('teas')
        .select('id')
        .eq('name', teaData.name)
        .limit(1)
        .single();
      if (match?.id) {
        console.log('[Collection] Resolved local ID', teaId, 'to UUID', match.id);
        teaId = match.id;
      } else {
        return { error: { message: 'Could not find this tea in the database. Try refreshing.' } };
      }
    }

    if (isLocalMode) {
      // Local-only mode: store tea data alongside the collection item
      setCollection(prev => [
        { 
          id: `local-${Date.now()}`,
          tea_id: teaId, 
          user_id: user.id,
          status, 
          added_at: new Date().toISOString(),
          tea: teaData, // Store the full tea object for display
        },
        ...prev.filter(item => item.tea_id !== teaId), // Remove if already exists
      ]);
      trackEvent(AnalyticsEvents.TEA_ADDED_TO_COLLECTION, { 
        tea_id: teaId, 
        status,
        tea_name: teaData?.name,
        tea_type: teaData?.teaType || teaData?.tea_type,
      });
      return { error: null };
    }

    try {
      const { data, error } = await supabase
        .from('user_teas')
        .upsert({
          user_id: user.id,
          tea_id: teaId,
          status,
          added_at: new Date().toISOString(),
        }, { onConflict: 'user_id,tea_id' })
        .select()
        .single();

      if (error) throw error;
      
      await fetchCollection();
      trackEvent(AnalyticsEvents.TEA_ADDED_TO_COLLECTION, { 
        tea_id: teaId, 
        status,
      });
      return { data, error: null };
    } catch (error) {
      console.error('Error adding to collection:', error);
      return { error };
    }
  };

  // Remove tea from collection
  const removeFromCollection = async (teaId) => {
    if (!user) {
      return { error: { message: 'Must be signed in' } };
    }

    if (isLocalMode) {
      setCollection(prev => prev.filter(item => item.tea_id !== teaId));
      trackEvent(AnalyticsEvents.TEA_REMOVED_FROM_COLLECTION, { tea_id: teaId });
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('user_teas')
        .delete()
        .eq('user_id', user.id)
        .eq('tea_id', teaId);

      if (error) throw error;
      
      await fetchCollection();
      trackEvent(AnalyticsEvents.TEA_REMOVED_FROM_COLLECTION, { tea_id: teaId });
      return { error: null };
    } catch (error) {
      console.error('Error removing from collection:', error);
      return { error };
    }
  };

  // Update tea in collection (rating, status, notes)
  const updateInCollection = async (teaId, updates) => {
    if (!user) {
      return { error: { message: 'Must be signed in' } };
    }

    if (isLocalMode) {
      setCollection(prev => 
        prev.map(item => 
          item.tea_id === teaId ? { ...item, ...updates } : item
        )
      );
      return { error: null };
    }

    try {
      const { data, error } = await supabase
        .from('user_teas')
        .update(updates)
        .eq('user_id', user.id)
        .eq('tea_id', teaId)
        .select()
        .single();

      if (error) throw error;
      
      await fetchCollection();
      return { data, error: null };
    } catch (error) {
      console.error('Error updating collection:', error);
      return { error };
    }
  };

  // Rate a tea
  const rateTea = async (teaId, rating) => {
    return updateInCollection(teaId, {
      user_rating: rating,
      status: 'tried',
      tried_at: new Date().toISOString(),
    });
  };

  // Set preferred steep time for a tea (in seconds)
  const setPreferredSteepTime = async (teaId, steepTimeSeconds) => {
    return updateInCollection(teaId, {
      preferred_steep_time: steepTimeSeconds,
    });
  };

  // Get preferred steep time for a tea (returns null if not set)
  const getPreferredSteepTime = (teaId) => {
    const item = collection.find(item => item.tea_id === teaId);
    return item?.preferred_steep_time || null;
  };

  // Set preferred steep settings for a tea (time, method, temperature)
  const setPreferredSteepSettings = async (teaId, { steepTimeSeconds, brewMethod, temperatureF }) => {
    return updateInCollection(teaId, {
      preferred_steep_time: steepTimeSeconds,
      preferred_brew_method: brewMethod,
      preferred_temperature: temperatureF,
    });
  };

  // Get preferred steep settings for a tea
  const getPreferredSteepSettings = (teaId) => {
    const item = collection.find(item => item.tea_id === teaId);
    if (!item?.preferred_steep_time) return null;
    return {
      steepTimeSeconds: item.preferred_steep_time,
      brewMethod: item.preferred_brew_method || null,
      temperatureF: item.preferred_temperature || null,
    };
  };

  // Check if tea is in collection
  const isInCollection = (teaId) => {
    return collection.some(item => item.tea_id === teaId);
  };

  // Get collection item for a tea
  const getCollectionItem = (teaId) => {
    return collection.find(item => item.tea_id === teaId);
  };

  const value = {
    collection,
    loading,
    addToCollection,
    removeFromCollection,
    updateInCollection,
    rateTea,
    isInCollection,
    getCollectionItem,
    setPreferredSteepTime,
    getPreferredSteepTime,
    setPreferredSteepSettings,
    getPreferredSteepSettings,
    refreshCollection: fetchCollection,
  };

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
};
