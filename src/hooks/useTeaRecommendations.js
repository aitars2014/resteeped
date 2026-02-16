import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useTeaRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const findTeas = useCallback(async (query) => {
    if (!query?.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('recommend-teas', {
        body: { query: query.trim(), match_count: 20 },
      });

      if (fnError) throw fnError;

      setRecommendations(data?.teas || []);
    } catch (err) {
      console.error('Tea recommendation error:', err);
      setError(err.message || 'Failed to find teas. Please try again.');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { recommendations, loading, error, findTeas };
};
