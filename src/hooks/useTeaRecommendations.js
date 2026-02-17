import { useState, useCallback } from 'react';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/recommend-teas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ query: query.trim(), match_count: 20, match_threshold: 0.3 }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errBody = await response.text();
        console.error('recommend-teas error:', response.status, errBody);
        throw new Error('Failed to find teas. Please try again.');
      }

      const data = await response.json();
      console.log('recommend response:', JSON.stringify(data));

      if (!data || !data.teas) {
        console.warn('Unexpected response shape:', data);
        throw new Error('Unexpected response from server. Please try again.');
      }

      setRecommendations(data.teas.map(formatTea));
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
