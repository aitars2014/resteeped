import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { teas as localTeas } from '../data/teas';
import { diversifyTeasByShop, isDisplayableTea } from '../utils/teaCatalogQuality';

const CACHE_KEY = '@resteeped_teas_cache_v2';
const CACHE_TIMESTAMP_KEY = '@resteeped_teas_cache_ts';
const PAGE_SIZE = 500; // Fetch in batches of 500
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const INITIAL_TEAS = diversifyTeasByShop(localTeas.filter(tea => isDisplayableTea(tea)));

let catalogState = {
  teas: INITIAL_TEAS,
  isRemoteData: false,
  dataSource: 'local',
  timestamp: null,
};
let cacheLoadPromise = null;
let fetchPromise = null;
const catalogListeners = new Set();

const notifyCatalogListeners = () => {
  catalogListeners.forEach(listener => listener(catalogState));
};

const setCatalogState = (nextState) => {
  catalogState = { ...catalogState, ...nextState };
  notifyCatalogListeners();
};

const subscribeToCatalog = (listener) => {
  catalogListeners.add(listener);
  return () => catalogListeners.delete(listener);
};

const isCatalogFresh = () => {
  if (!catalogState.timestamp) return false;
  return Date.now() - catalogState.timestamp < CACHE_MAX_AGE_MS;
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
  productUrl: tea.product_url,
  pricePerOz: tea.price_per_oz,
  avgRating: tea.avg_rating,
  ratingCount: tea.rating_count,
  companyId: tea.company_id,
  createdAt: tea.created_at,
  teaMethod: tea.tea_method,
});

// --- Cache helpers ---

const loadCachedTeas = async () => {
  try {
    const [[, cached], [, cachedAt]] = await AsyncStorage.multiGet([CACHE_KEY, CACHE_TIMESTAMP_KEY]);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const timestamp = Number(cachedAt);
        return {
          teas: parsed,
          timestamp: Number.isFinite(timestamp) ? timestamp : null,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load tea cache:', err?.message);
  }
  return null;
};

const loadCachedCatalog = async () => {
  if (cacheLoadPromise) return cacheLoadPromise;

  cacheLoadPromise = (async () => {
    const cached = await loadCachedTeas();
    if (cached?.teas?.length > 0) {
      setCatalogState({
        teas: diversifyTeasByShop(cached.teas.filter(tea => isDisplayableTea(tea, { requireImage: true }))),
        dataSource: 'cache',
        isRemoteData: false,
        timestamp: cached.timestamp,
      });
    }
    return cached;
  })().finally(() => {
    cacheLoadPromise = null;
  });

  return cacheLoadPromise;
};

const saveTeasToCache = async (teas, timestamp = Date.now()) => {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(teas));
    await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp.toString());
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
  description,
  origin,
  flavor_notes,
  image_url,
  product_url,
  avg_rating,
  rating_count,
  company_id,
  created_at,
  tea_method
`;

const LIST_FIELDS_WITHOUT_PRODUCT_URL = LIST_FIELDS
  .split('\n')
  .filter(field => !field.includes('product_url'))
  .join('\n');

const isMissingProductUrlColumnError = (error) => (
  error?.code === '42703' ||
  String(error?.message || '').toLowerCase().includes('product_url')
);

const fetchAllTeasPaginated = async () => {
  const allData = [];
  let from = 0;
  let hasMore = true;
  const PAGE_TIMEOUT = 30000; // 30s per page
  let listFields = LIST_FIELDS;

  while (hasMore) {
    const to = from + PAGE_SIZE - 1;
    let { data, error: fetchError } = await withTimeout(
      supabase
        .from('teas')
        .select(listFields)
        .order('name', { ascending: true })
        .range(from, to),
      PAGE_TIMEOUT,
      `Tea fetch timed out (page starting at ${from})`
    );

    if (fetchError && listFields === LIST_FIELDS && isMissingProductUrlColumnError(fetchError)) {
      listFields = LIST_FIELDS_WITHOUT_PRODUCT_URL;
      ({ data, error: fetchError } = await withTimeout(
        supabase
          .from('teas')
          .select(listFields)
          .order('name', { ascending: true })
          .range(from, to),
        PAGE_TIMEOUT,
        `Tea fetch timed out (page starting at ${from})`
      ));
    }

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
  const [catalog, setCatalog] = useState(catalogState);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // For subtle refresh indicator
  const [error, setError] = useState(null);
  const teas = catalog.teas;
  const isRemoteData = catalog.isRemoteData;
  const dataSource = catalog.dataSource; // 'local' | 'cache' | 'remote'

  useEffect(() => subscribeToCatalog(setCatalog), []);

  // Load cached data on mount (before Supabase fetch)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cancelled = false;
    const hydrateCatalog = async () => {
      if (catalogState.dataSource === 'local') {
        await loadCachedCatalog();
      }

      if (!cancelled && !isCatalogFresh()) {
        fetchTeas({ silent: true });
      }
    };

    hydrateCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchTeas = useCallback(async ({ isRefresh = false, silent = false, force = false } = {}) => {
    if (!force && isCatalogFresh()) {
      return catalogState;
    }

    if (fetchPromise) {
      if (!silent && isRefresh) setRefreshing(true);
      if (!silent && !isRefresh) setLoading(true);
      try {
        return await fetchPromise;
      } finally {
        if (!silent) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    if (silent) {
      // Don't show any loading state — content already visible.
    } else if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    if (!isSupabaseConfigured()) {
      setCatalogState({
        teas: INITIAL_TEAS,
        dataSource: 'local',
        isRemoteData: false,
        timestamp: null,
      });
      setLoading(false);
      setRefreshing(false);
      return catalogState;
    }

    try {
      fetchPromise = (async () => {
        const data = await fetchAllTeasPaginated();

        const formattedTeas = data
          .map(formatTea)
          .filter(tea => isDisplayableTea(tea, { requireImage: true }));

        // Rank and diversify
        const ranked = diversifyTeasByShop(formattedTeas);
        const timestamp = Date.now();
        setCatalogState({
          teas: ranked,
          isRemoteData: true,
          dataSource: 'remote',
          timestamp,
        });

        // Cache for next time
        await saveTeasToCache(formattedTeas, timestamp);
        return catalogState;
      })();

      return await fetchPromise;
    } catch (err) {
      console.error('Error fetching teas:', err?.message || err);
      setError(err?.message || 'Unknown fetch error');
      // Keep whatever we have (cache or local)
      setCatalogState({ isRemoteData: false });
      return catalogState;
    } finally {
      fetchPromise = null;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const isRemoteRef = useRef(false);
  useEffect(() => {
    isRemoteRef.current = isRemoteData;
  }, [isRemoteData]);

  // Re-fetch when app comes back to foreground only after the cache gets stale.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && !isRemoteRef.current && !isCatalogFresh()) {
        fetchTeas({ silent: true });
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
      sortBy = 'relevance',
      teaMethod = 'all',
    } = filters;

    if (teaType !== 'all') {
      result = result.filter(tea => tea.teaType === teaType);
    }

    if (company !== 'all') {
      result = result.filter(tea => tea.companyId === company);
    }

    if (teaMethod !== 'all') {
      result = result.filter(tea => tea.teaMethod === teaMethod);
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
      case 'relevance':
        result = diversifyTeasByShop(result);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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
    refreshTeas: () => fetchTeas({ isRefresh: true, force: true }),
    searchTeas,
    filterTeas,
    getTeaById,
    getTeaDetails,
  };
};
