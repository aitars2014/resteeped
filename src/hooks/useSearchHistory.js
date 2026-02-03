import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = '@resteeped:search_history';
const MAX_HISTORY_ITEMS = 10;

export const useSearchHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.log('Error loading search history:', e);
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = useCallback(async (query) => {
    if (!query || !query.trim()) return;
    
    const trimmed = query.trim();
    
    setHistory(prev => {
      // Remove if already exists, then add to front
      const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
      const newHistory = [trimmed, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      
      // Save async
      AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory)).catch(console.log);
      
      return newHistory;
    });
  }, []);

  const removeFromHistory = useCallback(async (query) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item !== query);
      AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory)).catch(console.log);
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
      setHistory([]);
    } catch (e) {
      console.log('Error clearing search history:', e);
    }
  }, []);

  return {
    history,
    loading,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
};

export default useSearchHistory;
