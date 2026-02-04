import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

const TEAWARE_STORAGE_KEY = '@resteeped:teaware';

const TeawareContext = createContext({});

export const useTeaware = () => useContext(TeawareContext);

// Default teaware types - icon names reference custom icons or Lucide
export const TEAWARE_TYPES = [
  { id: 'gaiwan', name: 'Gaiwan', icon: 'Gaiwan' },
  { id: 'yixing', name: 'Yixing Teapot', icon: 'YixingPot' },
  { id: 'teapot', name: 'Teapot', icon: 'Teapot' },
  { id: 'kyusu', name: 'Kyusu', icon: 'Kyusu' },
  { id: 'gongfu_set', name: 'Gongfu Set', icon: 'Gaiwan' },
  { id: 'infuser', name: 'Infuser/Strainer', icon: 'Filter' },
  { id: 'cup', name: 'Tea Cup', icon: 'TeaCup' },
  { id: 'mug', name: 'Mug', icon: 'Coffee' },
  { id: 'travel', name: 'Travel Tumbler', icon: 'Cup' },
  { id: 'kettle', name: 'Kettle', icon: 'Teapot' },
  { id: 'scale', name: 'Tea Scale', icon: 'Scale' },
  { id: 'cha_hai', name: 'Cha Hai (Pitcher)', icon: 'Droplets' },
  { id: 'other', name: 'Other', icon: 'Package' },
];

// Default materials
export const TEAWARE_MATERIALS = [
  { id: 'ceramic', name: 'Ceramic' },
  { id: 'porcelain', name: 'Porcelain' },
  { id: 'clay', name: 'Clay/Zisha' },
  { id: 'glass', name: 'Glass' },
  { id: 'cast_iron', name: 'Cast Iron' },
  { id: 'stainless', name: 'Stainless Steel' },
  { id: 'bamboo', name: 'Bamboo' },
  { id: 'plastic', name: 'Plastic' },
  { id: 'other', name: 'Other' },
];

export const TeawareProvider = ({ children }) => {
  const { user, isDevMode } = useAuth();
  const [teaware, setTeaware] = useState([]);
  const [loading, setLoading] = useState(false);

  const isLocalMode = !isSupabaseConfigured() || isDevMode;

  // Load teaware from storage/database
  const fetchTeaware = useCallback(async () => {
    setLoading(true);
    try {
      if (isLocalMode) {
        // Load from AsyncStorage
        const stored = await AsyncStorage.getItem(TEAWARE_STORAGE_KEY);
        if (stored) {
          setTeaware(JSON.parse(stored));
        }
      } else if (user) {
        // Load from Supabase (when table exists)
        // For now, fall back to local storage
        const stored = await AsyncStorage.getItem(TEAWARE_STORAGE_KEY);
        if (stored) {
          setTeaware(JSON.parse(stored));
        }
      }
    } catch (error) {
      console.error('Error fetching teaware:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isLocalMode]);

  useEffect(() => {
    fetchTeaware();
  }, [fetchTeaware]);

  // Save teaware to storage
  const saveTeaware = async (items) => {
    try {
      await AsyncStorage.setItem(TEAWARE_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving teaware:', error);
    }
  };

  // Add teaware item
  const addTeaware = async (item) => {
    const newItem = {
      id: `teaware-${Date.now()}`,
      ...item,
      created_at: new Date().toISOString(),
      brew_count: 0,
    };
    
    const updated = [newItem, ...teaware];
    setTeaware(updated);
    await saveTeaware(updated);
    
    return { data: newItem, error: null };
  };

  // Update teaware item
  const updateTeaware = async (id, updates) => {
    const updated = teaware.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    setTeaware(updated);
    await saveTeaware(updated);
    
    return { error: null };
  };

  // Remove teaware item
  const removeTeaware = async (id) => {
    const updated = teaware.filter(item => item.id !== id);
    setTeaware(updated);
    await saveTeaware(updated);
    
    return { error: null };
  };

  // Increment brew count for a teaware item
  const incrementBrewCount = async (id) => {
    const item = teaware.find(t => t.id === id);
    if (item) {
      await updateTeaware(id, { 
        brew_count: (item.brew_count || 0) + 1,
        last_used: new Date().toISOString(),
      });
    }
  };

  // Get teaware by type
  const getTeawareByType = (type) => {
    return teaware.filter(item => item.type === type);
  };

  // Get favorite teaware (most used)
  const getFavoriteTeaware = () => {
    return [...teaware]
      .sort((a, b) => (b.brew_count || 0) - (a.brew_count || 0))
      .slice(0, 5);
  };

  const value = {
    teaware,
    loading,
    addTeaware,
    updateTeaware,
    removeTeaware,
    incrementBrewCount,
    getTeawareByType,
    getFavoriteTeaware,
    refreshTeaware: fetchTeaware,
    TEAWARE_TYPES,
    TEAWARE_MATERIALS,
  };

  return (
    <TeawareContext.Provider value={value}>
      {children}
    </TeawareContext.Provider>
  );
};

export default TeawareContext;
