import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

const CollectionContext = createContext({});

export const useCollection = () => useContext(CollectionContext);

export const CollectionProvider = ({ children }) => {
  const { user } = useAuth();
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's tea collection
  const fetchCollection = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setCollection([]);
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
  const addToCollection = async (teaId, status = 'want_to_try') => {
    if (!user) {
      return { error: { message: 'Must be signed in' } };
    }

    if (!isSupabaseConfigured()) {
      // Local-only mode: just update state
      setCollection(prev => [
        ...prev,
        { tea_id: teaId, status, added_at: new Date().toISOString() }
      ]);
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

    if (!isSupabaseConfigured()) {
      setCollection(prev => prev.filter(item => item.tea_id !== teaId));
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

    if (!isSupabaseConfigured()) {
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
    refreshCollection: fetchCollection,
  };

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
};
