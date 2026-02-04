import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { teas as localTeas } from '../data/teas';

// Interleave teas so brands are mixed rather than grouped together
// This creates a better discovery experience
const interleaveTeasByBrand = (teas) => {
  if (!teas.length) return teas;
  
  // Group teas by brand
  const byBrand = {};
  teas.forEach(tea => {
    const brand = tea.brandName || tea.companyId || 'unknown';
    if (!byBrand[brand]) byBrand[brand] = [];
    byBrand[brand].push(tea);
  });
  
  // Get brand arrays and shuffle each one slightly to add variety
  const brands = Object.keys(byBrand);
  brands.forEach(brand => {
    // Light shuffle within each brand (preserves some rating order)
    byBrand[brand].sort(() => Math.random() - 0.5);
  });
  
  // Shuffle brand order
  brands.sort(() => Math.random() - 0.5);
  
  // Interleave: take one from each brand in round-robin fashion
  const result = [];
  let hasMore = true;
  let index = 0;
  
  while (hasMore) {
    hasMore = false;
    for (const brand of brands) {
      if (byBrand[brand].length > index) {
        result.push(byBrand[brand][index]);
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
      // Use local data in demo mode, interleaved for better discovery
      setTeas(interleaveTeasByBrand(localTeas));
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
        companyId: tea.company_id,
        createdAt: tea.created_at,
      }));

      // Interleave teas by brand for better discovery experience
      setTeas(interleaveTeasByBrand(formattedTeas));
    } catch (err) {
      console.error('Error fetching teas:', err);
      setError(err.message);
      // Fallback to local data
      setTeas(interleaveTeasByBrand(localTeas));
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
