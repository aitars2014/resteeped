import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { teas as localTeas } from '../data/teas';

// Calculate a ranking score that balances rating quality with popularity
// Uses Bayesian average: score = (avgRating * ratingCount + C * m) / (ratingCount + C)
// - C = confidence threshold (reviews needed before we trust the rating)
// - m = prior mean (assumed average for teas with few/no reviews)
const calculateRankingScore = (tea) => {
  const avgRating = tea.avgRating || 0;
  const ratingCount = tea.ratingCount || 0;
  
  // Tunable parameters
  const C = 5;    // Confidence threshold - need ~5 reviews to trust rating
  const m = 3.8;  // Prior mean - assume average tea is ~3.8 stars
  
  // Bayesian average
  const bayesianRating = (avgRating * ratingCount + C * m) / (ratingCount + C);
  
  // Add small popularity boost (log scale to avoid domination by very popular teas)
  const popularityBoost = Math.log10(ratingCount + 1) * 0.1;
  
  return bayesianRating + popularityBoost;
};

// Sort teas by ranking score, then interleave by brand for variety
const rankAndDiversifyTeas = (teas) => {
  if (!teas.length) return teas;
  
  // Calculate scores and sort
  const scoredTeas = teas.map(tea => ({
    ...tea,
    _rankScore: calculateRankingScore(tea),
  }));
  scoredTeas.sort((a, b) => b._rankScore - a._rankScore);
  
  // Group by brand, preserving score order within each brand
  const byBrand = {};
  scoredTeas.forEach(tea => {
    const brand = tea.brandName || tea.companyId || 'unknown';
    if (!byBrand[brand]) byBrand[brand] = [];
    byBrand[brand].push(tea);
  });
  
  // Sort brands by their top tea's score (best brands first)
  const brands = Object.keys(byBrand).sort((a, b) => {
    return byBrand[b][0]._rankScore - byBrand[a][0]._rankScore;
  });
  
  // Interleave: take top tea from each brand in round-robin
  // This ensures variety while keeping quality teas near the top
  const result = [];
  let hasMore = true;
  let index = 0;
  
  while (hasMore) {
    hasMore = false;
    for (const brand of brands) {
      if (byBrand[brand].length > index) {
        const tea = byBrand[brand][index];
        delete tea._rankScore; // Clean up internal property
        result.push(tea);
        if (byBrand[brand].length > index + 1) hasMore = true;
      }
    }
    index++;
  }
  
  return result;
};

export const useTeas = () => {
  const [teas, setTeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeas = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      // Use local data in demo mode, ranked and diversified for better discovery
      setTeas(rankAndDiversifyTeas(localTeas));
      setLoading(false);
      return;
    }

    try {
      // Supabase defaults to 1000 rows max - need to fetch all
      const { data, error: fetchError } = await supabase
        .from('teas')
        .select('*')
        .order('avg_rating', { ascending: false })
        .range(0, 9999); // Fetch up to 10k teas

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
        companyId: tea.company_id,
        createdAt: tea.created_at,
      }));

      // Rank and diversify teas for better discovery experience
      setTeas(rankAndDiversifyTeas(formattedTeas));
    } catch (err) {
      console.error('Error fetching teas:', err);
      setError(err.message);
      // Fallback to local data
      setTeas(rankAndDiversifyTeas(localTeas));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeas();
  }, [fetchTeas]);

  // Basic search with type filter (backward compatible)
  const searchTeas = useCallback((query, typeFilter = 'all') => {
    return filterTeas(query, { teaType: typeFilter });
  }, [teas]);

  // Advanced filtering with multiple criteria
  const filterTeas = useCallback((query, filters = {}) => {
    let result = [...teas];
    
    const {
      teaType = 'all',
      company = 'all',
      minRating = 'all',
      sortBy = 'rating',
    } = filters;

    // Filter by tea type
    if (teaType !== 'all') {
      result = result.filter(tea => tea.teaType === teaType);
    }

    // Filter by company
    if (company !== 'all') {
      result = result.filter(tea => tea.companyId === company);
    }

    // Filter by minimum rating
    if (minRating !== 'all') {
      const min = parseInt(minRating, 10);
      result = result.filter(tea => (tea.avgRating || 0) >= min);
    }

    // Search query
    if (query && query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(tea =>
        tea.name.toLowerCase().includes(q) ||
        tea.brandName.toLowerCase().includes(q) ||
        tea.teaType.toLowerCase().includes(q) ||
        tea.flavorNotes?.some(note => note.toLowerCase().includes(q)) ||
        tea.origin?.toLowerCase().includes(q) ||
        tea.description?.toLowerCase().includes(q)
      );
    }

    // Sort results
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
        break;
      case 'relevance':
        // Sort by combined rating + popularity score
        result.sort((a, b) => calculateRankingScore(b) - calculateRankingScore(a));
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case 'reviews':
        result.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
        break;
      default:
        break;
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
    filterTeas,
    getTeaById,
  };
};
