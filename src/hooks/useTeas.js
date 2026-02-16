import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
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

// Helper to add timeout to promises
const withTimeout = (promise, ms, fallbackError = 'Request timed out') => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(fallbackError)), ms)
    )
  ]);
};

export const useTeas = () => {
  // Start with local data for instant loading, update with remote data when available
  const [teas, setTeas] = useState(() => rankAndDiversifyTeas(localTeas));
  const [loading, setLoading] = useState(false); // Start false since we have local data
  const [error, setError] = useState(null);
  const [isRemoteData, setIsRemoteData] = useState(false);

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
      // Light query for list view: only fields needed for browsing/search
      // Description, steep params, flavor notes fetched on-demand in detail view
      const LIST_FIELDS = `
        id,
        name,
        brand_name,
        tea_type,
        origin,
        flavor_notes,
        image_url,
        avg_rating,
        rating_count,
        company_id,
        created_at
      `;
      const REQUEST_TIMEOUT = 15000; // 15 second timeout
      
      // Single query, no pagination needed (~2.5MB for 8k teas with minimal fields)
      const { data, error: fetchError } = await withTimeout(
        supabase
          .from('teas')
          .select(LIST_FIELDS)
          .order('avg_rating', { ascending: false, nullsFirst: false }),
        REQUEST_TIMEOUT,
        'Tea fetch timed out'
      );

      if (fetchError) throw fetchError;

      // Transform to match app's expected format
      // Note: description, steep params, flavor notes, price are loaded on-demand in detail view
      const formattedTeas = data.map(tea => ({
        id: tea.id,
        name: tea.name,
        brandName: tea.brand_name,
        teaType: tea.tea_type,
        description: tea.description || '',
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
      setIsRemoteData(true);
    } catch (err) {
      console.error('Error fetching teas:', err?.message || err);
      setError(err?.message || 'Unknown fetch error');
      // Keep local data on error (already loaded)
      setIsRemoteData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const isRemoteRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isRemoteRef.current = isRemoteData;
  }, [isRemoteData]);

  useEffect(() => {
    fetchTeas();
  }, [fetchTeas]);

  // Re-fetch when app comes back to foreground if still on local data
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && !isRemoteRef.current) {
        fetchTeas();
      }
    });
    return () => subscription?.remove();
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

  // Fetch full tea details on-demand (for detail screen)
  const getTeaDetails = useCallback(async (teaId) => {
    if (!isSupabaseConfigured()) {
      return teas.find(t => t.id === teaId) || null;
    }
    try {
      const { data, error: fetchError } = await withTimeout(
        supabase
          .from('teas')
          .select('*')
          .eq('id', teaId)
          .single(),
        10000,
        'Tea detail fetch timed out'
      );
      if (fetchError) throw fetchError;
      return {
        id: data.id,
        name: data.name,
        brandName: data.brand_name,
        teaType: data.tea_type,
        description: data.description || '',
        origin: data.origin,
        steepTempF: data.steep_temp_f,
        steepTimeMin: data.steep_time_min,
        steepTimeMax: data.steep_time_max,
        flavorNotes: data.flavor_notes || [],
        imageUrl: data.image_url,
        pricePerOz: data.price_per_oz,
        avgRating: data.avg_rating,
        ratingCount: data.rating_count,
        companyId: data.company_id,
        createdAt: data.created_at,
      };
    } catch (err) {
      console.error('Error fetching tea details:', err?.message || err);
      // Fall back to list data
      return teas.find(t => t.id === teaId) || null;
    }
  }, [teas]);

  return {
    teas,
    loading,
    error,
    isRemoteData, // true if data came from Supabase, false if using local fallback
    refreshTeas: fetchTeas,
    searchTeas,
    filterTeas,
    getTeaById,
    getTeaDetails,
  };
};
