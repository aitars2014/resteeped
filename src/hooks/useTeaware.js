import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Demo teaware data for development
const DEMO_TEAWARE = [
  {
    id: 'demo-1',
    name: 'Titanium Double-Walled Gaiwan',
    slug: 'titanium-gaiwan',
    description: 'Modern titanium gaiwan with double-wall construction for comfortable handling.',
    category: 'gaiwan',
    material: 'other',
    capacity_ml: 140,
    price_usd: 79,
    image_url: 'https://cdn.shopify.com/s/files/1/0586/9817/files/DSC_9694_5a745c4b-d52f-48e2-b5a1-906f9f09f79f.jpg',
    in_stock: true,
    origin_region: 'China',
  },
  {
    id: 'demo-2',
    name: 'Da Hong Pao Clay Shui Ping Teapot',
    slug: 'da-hong-pao-shui-ping',
    description: 'Classic Yixing teapot made from prized Da Hong Pao clay by Jin Jia Qi.',
    category: 'teapot',
    material: 'yixing_clay',
    clay_type: 'hong_ni',
    capacity_ml: 115,
    price_usd: 96,
    artisan_name: 'Jin Jia Qi',
    image_url: 'https://cdn.shopify.com/s/files/1/0586/9817/files/DSC_1323_0dcd6c8a-78d1-49fb-a850-709606c50e7b.jpg',
    in_stock: true,
    origin_region: 'Yixing, Jiangsu, China',
    recommended_teas: ['puerh', 'oolong'],
  },
  {
    id: 'demo-3',
    name: 'Ice Jade Porcelain Bamboo Tea Set',
    slug: 'ice-jade-bamboo-set',
    description: 'Beautiful jade porcelain gaiwan set with blue-and-white bamboo motif.',
    category: 'gaiwan',
    material: 'porcelain',
    capacity_ml: 150,
    price_usd: 67,
    image_url: 'https://cdn.shopify.com/s/files/1/0586/9817/files/DSC_4593.jpg',
    in_stock: true,
    origin_region: 'Dehua, Fujian, China',
  },
  {
    id: 'demo-4',
    name: 'Wenge Ni Xi Shi Teapot',
    slug: 'wenge-ni-xi-shi',
    description: 'Charming Xi Shi style teapot made from aged Wenge Ni clay.',
    category: 'teapot',
    material: 'yixing_clay',
    clay_type: 'zi_sha',
    capacity_ml: 95,
    price_usd: 96,
    artisan_name: 'Jin Jia Qi',
    image_url: 'https://cdn.shopify.com/s/files/1/0586/9817/files/DSC_6267.jpg',
    in_stock: true,
    origin_region: 'Yixing, Jiangsu, China',
    recommended_teas: ['puerh', 'oolong', 'black'],
  },
  {
    id: 'demo-5',
    name: 'Midnight Constellation Jianzhan Gaiwan',
    slug: 'jianzhan-constellation',
    description: 'Striking high-fired Jianzhan with classic oil-spot crystallization.',
    category: 'gaiwan',
    material: 'stoneware',
    capacity_ml: 150,
    price_usd: 45,
    image_url: null,
    in_stock: true,
    origin_region: 'Jianyang, Fujian, China',
  },
  {
    id: 'demo-6',
    name: 'Pale Celadon Gongfu Tea Set',
    slug: 'celadon-gongfu-set',
    description: 'Complete jade porcelain set in light celadon with gaiwan, cups, and pitcher.',
    category: 'gaiwan',
    material: 'porcelain',
    capacity_ml: 150,
    price_usd: 72,
    image_url: 'https://cdn.shopify.com/s/files/1/0586/9817/files/DSC_5018.jpg',
    in_stock: true,
    origin_region: 'Dehua, Fujian, China',
  },
];

/**
 * useTeaware Hook
 * Fetches and manages teaware data
 */
export const useTeaware = () => {
  const [teaware, setTeaware] = useState([]);
  const [userTeaware, setUserTeaware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all teaware
  const fetchTeaware = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('teaware')
        .select('*, company:companies(name, slug)')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setTeaware(data);
      } else {
        // Use demo data if no real data
        setTeaware(DEMO_TEAWARE);
      }
    } catch (err) {
      console.error('Error fetching teaware:', err);
      setError(err.message);
      // Fallback to demo data
      setTeaware(DEMO_TEAWARE);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's teaware collection
  const fetchUserTeaware = useCallback(async (userId) => {
    if (!userId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('user_teaware')
        .select('*, teaware:teaware(*)')
        .eq('user_id', userId);

      if (fetchError) throw fetchError;
      setUserTeaware(data || []);
    } catch (err) {
      console.error('Error fetching user teaware:', err);
    }
  }, []);

  // Add teaware to user's collection
  const addToCollection = useCallback(async (userId, teawareId, details = {}) => {
    try {
      const { data, error } = await supabase
        .from('user_teaware')
        .insert({
          user_id: userId,
          teaware_id: teawareId,
          ...details,
        })
        .select()
        .single();

      if (error) throw error;
      
      setUserTeaware(prev => [...prev, data]);
      return { success: true, data };
    } catch (err) {
      console.error('Error adding teaware to collection:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Update user teaware (e.g., add notes, update seasoning)
  const updateUserTeaware = useCallback(async (userTeawareId, updates) => {
    try {
      const { data, error } = await supabase
        .from('user_teaware')
        .update(updates)
        .eq('id', userTeawareId)
        .select()
        .single();

      if (error) throw error;

      setUserTeaware(prev => 
        prev.map(item => item.id === userTeawareId ? data : item)
      );
      return { success: true, data };
    } catch (err) {
      console.error('Error updating user teaware:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Remove from collection
  const removeFromCollection = useCallback(async (userTeawareId) => {
    try {
      const { error } = await supabase
        .from('user_teaware')
        .delete()
        .eq('id', userTeawareId);

      if (error) throw error;

      setUserTeaware(prev => prev.filter(item => item.id !== userTeawareId));
      return { success: true };
    } catch (err) {
      console.error('Error removing teaware from collection:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Filter teaware
  const filterTeaware = useCallback((filters = {}) => {
    let result = [...teaware];

    if (filters.category) {
      result = result.filter(item => item.category === filters.category);
    }

    if (filters.material) {
      result = result.filter(item => item.material === filters.material);
    }

    if (filters.clayType) {
      result = result.filter(item => item.clay_type === filters.clayType);
    }

    if (filters.minPrice !== undefined) {
      result = result.filter(item => item.price_usd >= filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      result = result.filter(item => item.price_usd <= filters.maxPrice);
    }

    if (filters.inStock) {
      result = result.filter(item => item.in_stock);
    }

    if (filters.query) {
      const query = filters.query.toLowerCase();
      result = result.filter(item =>
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.artisan_name?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [teaware]);

  // Get teaware by ID
  const getTeawareById = useCallback((id) => {
    return teaware.find(item => item.id === id);
  }, [teaware]);

  // Refresh
  const refreshTeaware = useCallback(async () => {
    await fetchTeaware();
  }, [fetchTeaware]);

  // Initial fetch
  useEffect(() => {
    fetchTeaware();
  }, [fetchTeaware]);

  return {
    teaware,
    userTeaware,
    loading,
    error,
    fetchTeaware,
    fetchUserTeaware,
    addToCollection,
    updateUserTeaware,
    removeFromCollection,
    filterTeaware,
    getTeawareById,
    refreshTeaware,
  };
};

export default useTeaware;
