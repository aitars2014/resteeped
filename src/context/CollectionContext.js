import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';

const CollectionContext = createContext({});

export const useCollection = () => useContext(CollectionContext);

export const CollectionProvider = ({ children }) => {
  const { user, isDevMode } = useAuth();
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(false);

  // Check if we should use local-only mode (no Supabase calls for user data)
  const isLocalMode = !isSupabaseConfigured() || isDevMode;

  // Fetch user's tea collection
  const fetchCollection = useCallback(async () => {
    if (!user || isLocalMode) {
      // In dev mode, keep whatever is in local state
      if (!user) setCollection([]);
      return;
    }

    setLoading(true);
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
      setCollection(data || []);
    } catch (error) {
      console.error('Error fetching collection:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  // Add tea to collection
  // In dev mode, pass the full tea object so we can display it properly
  const addToCollection = async (teaId, status = 'want_to_try', teaData = null) => {
    console.log('[Collection] addToCollection called', { teaId, status, userId: user?.id, isLocalMode });
    if (!user) {
      return { error: { message: 'Must be signed in' } };
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
        })
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
    refreshCollection: fetchCollection,
  };

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
};
