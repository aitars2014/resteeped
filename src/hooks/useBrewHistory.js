import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context';

const BREW_HISTORY_KEY = '@resteeped:brew_history';

export const useBrewHistory = () => {
  const { user, isDevMode } = useAuth();
  const [brewSessions, setBrewSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if we should use local-only mode
  const isLocalMode = !isSupabaseConfigured() || isDevMode;

  const fetchBrewHistory = useCallback(async () => {
    if (isLocalMode) {
      // Load from AsyncStorage in dev mode
      try {
        const stored = await AsyncStorage.getItem(BREW_HISTORY_KEY);
        if (stored) {
          setBrewSessions(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Error loading local brew history:', err);
      }
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('brew_sessions')
        .select(`
          *,
          tea:teas(id, name, tea_type, brand_name, image_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setBrewSessions(data || []);
    } catch (err) {
      console.error('Error fetching brew history:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const userId = user?.id;
  useEffect(() => {
    fetchBrewHistory();
  }, [userId, fetchBrewHistory]);

  const logBrewSession = async ({ teaId, steepTimeSeconds, temperatureF, teaData = null, infusionNumber = null, note = null, rating = null, tastingNotes = null, brewMethod = null }) => {
    if (isLocalMode) {
      // Store locally for dev mode or non-logged-in users
      const session = {
        id: Date.now().toString(),
        user_id: user?.id,
        tea_id: teaId,
        steep_time_seconds: steepTimeSeconds,
        temperature_f: temperatureF,
        infusion_number: infusionNumber,
        note: note,
        rating: rating,
        tasting_notes: tastingNotes,
        brew_method: brewMethod,
        created_at: new Date().toISOString(),
        tea: teaData, // Store tea data for display in dev mode
      };
      // Use functional setState to avoid stale closure
      setBrewSessions(prev => {
        const newSessions = [session, ...prev];
        // Persist to AsyncStorage (async, fire and forget)
        AsyncStorage.setItem(BREW_HISTORY_KEY, JSON.stringify(newSessions.slice(0, 100)))
          .catch(err => console.error('Error saving local brew history:', err));
        return newSessions;
      });
      return { data: session, error: null };
    }
    
    if (!user) {
      return { error: new Error('User not logged in') };
    }

    try {
      const { data, error } = await supabase
        .from('brew_sessions')
        .insert({
          user_id: user.id,
          tea_id: teaId || null,
          steep_time_seconds: steepTimeSeconds,
          temperature_f: temperatureF || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchBrewHistory();
      return { data, error: null };
    } catch (err) {
      console.error('Error logging brew session:', err);
      return { error: err };
    }
  };

  const getTodayBrewCount = () => {
    const today = new Date().toDateString();
    return brewSessions.filter(s => 
      new Date(s.created_at).toDateString() === today
    ).length;
  };

  const getWeekBrewCount = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return brewSessions.filter(s => 
      new Date(s.created_at) >= weekAgo
    ).length;
  };

  // Get most brewed teas
  const getMostBrewedTeas = (limit = 5) => {
    const teaCounts = {};
    const teaData = {};
    
    brewSessions.forEach(session => {
      if (session.tea_id) {
        teaCounts[session.tea_id] = (teaCounts[session.tea_id] || 0) + 1;
        if (session.tea) {
          teaData[session.tea_id] = session.tea;
        }
      }
    });
    
    return Object.entries(teaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([teaId, count]) => ({
        teaId,
        count,
        tea: teaData[teaId] || null,
      }));
  };

  // Get brew stats
  const getBrewStats = () => {
    const totalBrews = brewSessions.length;
    const totalSteepTime = brewSessions.reduce((sum, s) => sum + (s.steep_time_seconds || 0), 0);
    const avgSteepTime = totalBrews > 0 ? Math.round(totalSteepTime / totalBrews) : 0;
    const uniqueTeas = new Set(brewSessions.map(s => s.tea_id).filter(Boolean)).size;
    
    return {
      totalBrews,
      totalSteepTime,
      avgSteepTime,
      uniqueTeas,
    };
  };

  // Get brews grouped by date
  const getBrewsByDate = () => {
    const grouped = {};
    brewSessions.forEach(session => {
      const date = new Date(session.created_at).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(session);
    });
    return grouped;
  };

  return {
    brewSessions,
    loading,
    logBrewSession,
    refreshBrewHistory: fetchBrewHistory,
    todayBrewCount: getTodayBrewCount(),
    weekBrewCount: getWeekBrewCount(),
    getMostBrewedTeas,
    getBrewStats,
    getBrewsByDate,
  };
};
