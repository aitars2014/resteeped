import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { teas as localTeas } from '../data/teas';

const CACHE_KEY = '@resteeped_teas_cache';
const CACHE_TIMESTAMP_KEY = '@resteeped_teas_cache_ts';
const PAGE_SIZE = 500; // Fetch in batches of 500

// Calculate a ranking score that balances rating quality with popularity
const calculateRankingScore = (tea) => {
  const avgRating = tea.avgRating || 0;
  const ratingCount = tea.ratingCount || 0;
  const C = 5;
  const m = 3.8;
  const bayesianRating = (avgRating * ratingCount + C * m) / (ratingCount + C);
  const popularityBoost = Math.log10(ratingCount + 1) * 0.1;
  return bayesianRating + popularityBoost;
};

// Sort teas by ranking score, then interleave by brand for variety
const rankAndDiversifyTeas = (teas) => {
  if (!teas.length) return teas;

  const scoredTeas = teas.map(tea => ({
    ...tea,
    _rankScore: calculateRankingScore(tea),
  }));
  scoredTeas.sort((a, b) => b._rankScore - a._rankScore);

  const byBrand = {};
  scoredTeas.forEach(tea => {
    const brand = tea.brandName || tea.companyId || 'unknown';
    if (!byBrand[brand]) byBrand[brand] = [];
    byBrand[brand].push(tea);
  });

  const brands = Object.keys(byBrand).sort((a, b) => {
    return byBrand[b][0]._rankScore - byBrand[a][0]._rankScore;
  });

  const result = [];
  let hasMore = true;
  let index = 0;

  while (hasMore) {
    hasMore = false;
    for (const brand of brands) {
      if (byBrand[brand].length > index) {
        const tea = byBrand[brand][index];
        delete tea._rankScore;
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

// Transform raw Supabase row to app format
const formatTea = (tea) => ({
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
});

// --- Cache helpers ---

const loadCachedTeas = async () => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load tea cache:', err?.message);
  }
  return null;
};

const saveTeasToCache = async (teas) => {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(teas));
    await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (err) {
    console.warn('Failed to save tea cache:', err?.message);
  }
};

// --- Paginated Supabase fetch ---

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

const fetchAllTeasPaginated = async () => {
  const allData = [];
  let from = 0;
  let hasMore = true;
  const PAGE_TIMEOUT = 30000; // 30s per page

  while (hasMore) {
    const to = from + PAGE_SIZE - 1;
    const { data, error: fetchError } = await withTimeout(
      supabase
        .from('teas')
        .select(LIST_FIELDS)
        .order('avg_rating', { ascending: false, nullsFirst: false })
        .range(from, to),
      PAGE_TIMEOUT,
      `Tea fetch timed out (page starting at ${from})`
    );

    if (fetchError) throw fetchError;

    if (data && data.length > 0) {
      allData.push(...data);
      from += PAGE_SIZE;
      // If we got fewer than PAGE_SIZE, we've reached the end
      if (data.length < PAGE_SIZE) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  return allData;
};

export const useTeas = () => {
  const [teas, setTeas] = useState(() => rankAndDiversifyTeas(localTeas));
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // For subtle refresh indicator
  const [error, setError] = useState(null);
  const [isRemoteData, setIsRemoteData] = useState(false);
  const [dataSource, setDataSource] = useState('local'); // 'local' | 'cache' | 'remote'

  // Load cached data on mount (before Supabase fetch)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const loadCache = async () => {
      const cached = await loadCachedTeas();
      if (cached && cached.length > 0) {
        setTeas(rankAndDiversifyTeas(cached));
        setDataSource('cache');
        // Don't set isRemoteData — we still want to fetch fresh data
        // But cache is far better than 60 local teas
      }
    };
    loadCache();
  }, []);

  const fetchTeas = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    if (!isSupabaseConfigured()) {
      setTeas(rankAndDiversifyTeas(localTeas));
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const data = await fetchAllTeasPaginated();

      const formattedTeas = data.map(formatTea);

      // Rank and diversify
      const ranked = rankAndDiversifyTeas(formattedTeas);
      setTeas(ranked);
      setIsRemoteData(true);
      setDataSource('remote');

      // Cache for next time
      await saveTeasToCache(formattedTeas);
    } catch (err) {
      console.error('Error fetching teas:', err?.message || err);
      setError(err?.message || 'Unknown fetch error');
      // Keep whatever we have (cache or local)
      setIsRemoteData(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const isRemoteRef = useRef(false);
  useEffect(() => {
    isRemoteRef.current = isRemoteData;
  }, [isRemoteData]);

  // Initial fetch
  useEffect(() => {
    fetchTeas();
  }, [fetchTeas]);

  // Re-fetch when app comes back to foreground if still on local/cached data
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && !isRemoteRef.current) {
        fetchTeas({ isRefresh: true });
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

    if (teaType !== 'all') {
      result = result.filter(tea => tea.teaType === teaType);
    }

    if (company !== 'all') {
      result = result.filter(tea => tea.companyId === company);
    }

    if (minRating !== 'all') {
      const min = parseInt(minRating, 10);
      result = result.filter(tea => (tea.avgRating || 0) >= min);
    }

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

    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
        break;
      case 'relevance':
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
      return formatTea(data);
    } catch (err) {
      console.error('Error fetching tea details:', err?.message || err);
      return teas.find(t => t.id === teaId) || null;
    }
  }, [teas]);

  return {
    teas,
    loading,
    refreshing, // Use this for subtle refresh indicator in UI
    error,
    isRemoteData,
    dataSource, // 'local' | 'cache' | 'remote'
    refreshTeas: () => fetchTeas({ isRefresh: true }),
    searchTeas,
    filterTeas,
    getTeaById,
    getTeaDetails,
  };
};
