import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { teas as localTeas } from '../data/teas';

export const useTeas = () => {
  const [teas, setTeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeas = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      // Use local data in demo mode
      setTeas(localTeas);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('teas')
        .select('*')
        .order('avg_rating', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform to match app's expected format
      const formattedTeas = data.map(tea => ({
        id: tea.id,
        name: tea.name,
        brandName: tea.brand_name,
        teaType: tea.tea_type,
        description: tea.description,
        origin: tea.origin,
        steepTempF: tea.steep_temp_f,
        steepTimeMin: tea.steep_time_min,
        steepTimeMax: tea.steep_time_max,
        flavorNotes: tea.flavor_notes || [],
        imageUrl: tea.image_url,
        pricePerOz: tea.price_per_oz,
        avgRating: tea.avg_rating,
        ratingCount: tea.rating_count,
      }));

      setTeas(formattedTeas);
    } catch (err) {
      console.error('Error fetching teas:', err);
      setError(err.message);
      // Fallback to local data
      setTeas(localTeas);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeas();
  }, [fetchTeas]);

  const searchTeas = useCallback((query, typeFilter = 'all') => {
    let result = teas;

    if (typeFilter !== 'all') {
      result = result.filter(tea => tea.teaType === typeFilter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(tea =>
        tea.name.toLowerCase().includes(q) ||
        tea.brandName.toLowerCase().includes(q) ||
        tea.teaType.toLowerCase().includes(q) ||
        tea.flavorNotes?.some(note => note.toLowerCase().includes(q))
      );
    }

    return result;
  }, [teas]);

  const getTeaById = useCallback((id) => {
    return teas.find(tea => tea.id === id);
  }, [teas]);

  return {
    teas,
    loading,
    error,
    refreshTeas: fetchTeas,
    searchTeas,
    getTeaById,
  };
};
