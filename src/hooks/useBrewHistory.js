import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context';

export const useBrewHistory = () => {
  const { user } = useAuth();
  const [brewSessions, setBrewSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBrewHistory = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
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

  useEffect(() => {
    fetchBrewHistory();
  }, [fetchBrewHistory]);

  const logBrewSession = async ({ teaId, steepTimeSeconds, temperatureF }) => {
    if (!user) {
      // Store locally for non-logged-in users
      const session = {
        id: Date.now().toString(),
        tea_id: teaId,
        steep_time_seconds: steepTimeSeconds,
        temperature_f: temperatureF,
        created_at: new Date().toISOString(),
      };
      setBrewSessions(prev => [session, ...prev]);
      return { data: session, error: null };
    }

    if (!isSupabaseConfigured()) {
      const session = {
        id: Date.now().toString(),
        user_id: user.id,
        tea_id: teaId,
        steep_time_seconds: steepTimeSeconds,
        temperature_f: temperatureF,
        created_at: new Date().toISOString(),
      };
      setBrewSessions(prev => [session, ...prev]);
      return { data: session, error: null };
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

  return {
    brewSessions,
    loading,
    logBrewSession,
    refreshBrewHistory: fetchBrewHistory,
    todayBrewCount: getTodayBrewCount(),
    weekBrewCount: getWeekBrewCount(),
  };
};
