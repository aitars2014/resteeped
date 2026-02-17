import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Normalize Supabase snake_case rows to camelCase app format
const formatTea = (tea) => ({
  ...tea,
  brandName: tea.brand_name ?? tea.brandName,
  teaType: tea.tea_type ?? tea.teaType,
  imageUrl: tea.image_url ?? tea.imageUrl,
  avgRating: tea.avg_rating ?? tea.avgRating,
  ratingCount: tea.rating_count ?? tea.ratingCount,
  companyId: tea.company_id ?? tea.companyId,
  flavorNotes: tea.flavor_notes ?? tea.flavorNotes ?? [],
  steepTempF: tea.steep_temp_f ?? tea.steepTempF,
  steepTimeMin: tea.steep_time_min ?? tea.steepTimeMin,
  createdAt: tea.created_at ?? tea.createdAt,
});

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
        body: { query: query.trim(), match_count: 20, match_threshold: 0.3 },
      });

      console.log('recommend response:', JSON.stringify(data), fnError);

      if (fnError) throw fnError;

      setRecommendations((data?.teas || []).map(formatTea));
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
