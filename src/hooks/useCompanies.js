import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context';

// Demo companies for local/dev mode
const DEMO_COMPANIES = [
  {
    id: 'demo-1',
    name: 'The Steeping Room',
    slug: 'the-steeping-room',
    short_description: "Austin's premier tea house and café",
    description: "Austin's premier tea house and café, offering an extensive selection of loose-leaf teas from around the world paired with a seasonal food menu.",
    website_url: 'https://www.thesteepingroom.com/',
    headquarters_city: 'Austin',
    headquarters_state: 'TX',
    headquarters_country: 'USA',
    specialty: ['Loose Leaf', 'Tea House', 'Food Pairing'],
    price_range: 'moderate',
    avg_rating: 4.5,
    rating_count: 28,
    tea_count: 58,
    founded_year: 2008,
  },
  {
    id: 'demo-2',
    name: 'Republic of Tea',
    slug: 'republic-of-tea',
    short_description: 'Premium tea pioneer since 1992',
    description: 'Founded in 1992, The Republic of Tea pioneered the premium tea industry in the United States.',
    website_url: 'https://www.republicoftea.com/',
    headquarters_city: 'Novato',
    headquarters_state: 'CA',
    headquarters_country: 'USA',
    specialty: ['Premium Blends', 'Wellness', 'Gift Sets'],
    price_range: 'premium',
    avg_rating: 4.3,
    rating_count: 156,
    tea_count: 300,
    founded_year: 1992,
    ships_internationally: true,
  },
  {
    id: 'demo-3',
    name: 'Rishi Tea',
    slug: 'rishi-tea',
    short_description: 'Direct Trade organic tea importer',
    description: 'Rishi Tea is a Direct Trade importer of organic teas and botanicals, working directly with farmers and artisans worldwide.',
    website_url: 'https://www.rishi-tea.com/',
    headquarters_city: 'Milwaukee',
    headquarters_state: 'WI',
    headquarters_country: 'USA',
    specialty: ['Organic', 'Direct Trade', 'Japanese Green'],
    certifications: ['USDA Organic', 'Fair Trade'],
    price_range: 'premium',
    avg_rating: 4.6,
    rating_count: 89,
    tea_count: 150,
    founded_year: 1997,
    ships_internationally: true,
  },
  {
    id: 'demo-4',
    name: 'Adagio Teas',
    slug: 'adagio-teas',
    short_description: 'Quality tea made accessible',
    description: 'Adagio Teas makes quality tea accessible to everyone with their wide selection of loose-leaf teas at reasonable prices.',
    website_url: 'https://www.adagio.com/',
    headquarters_city: 'Garfield',
    headquarters_state: 'NJ',
    headquarters_country: 'USA',
    specialty: ['Accessible', 'Custom Blends', 'Samplers'],
    price_range: 'moderate',
    avg_rating: 4.4,
    rating_count: 234,
    tea_count: 400,
    founded_year: 1999,
    ships_internationally: true,
  },
];

export const useCompanies = () => {
  const { isDevMode } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isLocalMode = !isSupabaseConfigured() || isDevMode;

  const fetchCompanies = useCallback(async () => {
    if (isLocalMode) {
      setCompanies(DEMO_COMPANIES);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .order('avg_rating', { ascending: false });

      if (fetchError) throw fetchError;
      setCompanies(data || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err.message);
      // Fallback to demo data on error
      setCompanies(DEMO_COMPANIES);
    } finally {
      setLoading(false);
    }
  }, [isLocalMode]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const getCompanyById = useCallback((id) => {
    return companies.find(c => c.id === id);
  }, [companies]);

  const getCompanyBySlug = useCallback((slug) => {
    return companies.find(c => c.slug === slug);
  }, [companies]);

  return {
    companies,
    loading,
    error,
    refreshCompanies: fetchCompanies,
    getCompanyById,
    getCompanyBySlug,
  };
};

export const useCompany = (companyId) => {
  const { isDevMode } = useAuth();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isLocalMode = !isSupabaseConfigured() || isDevMode;

  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) {
        setLoading(false);
        return;
      }

      if (isLocalMode) {
        const found = DEMO_COMPANIES.find(c => c.id === companyId);
        setCompany(found || null);
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (fetchError) throw fetchError;
        setCompany(data);
      } catch (err) {
        console.error('Error fetching company:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [companyId, isLocalMode]);

  return { company, loading, error };
};

export const useCompanyReviews = (companyId) => {
  const { user, isDevMode } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [loading, setLoading] = useState(true);

  const isLocalMode = !isSupabaseConfigured() || isDevMode;

  const fetchReviews = useCallback(async () => {
    if (!companyId || isLocalMode) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('company_reviews')
        .select(`
          *,
          profile:profiles(username, display_name, avatar_url)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(data || []);

      if (user) {
        const myReview = data?.find(r => r.user_id === user.id);
        setUserReview(myReview || null);
      }
    } catch (err) {
      console.error('Error fetching company reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId, user, isLocalMode]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = async ({ rating, reviewText, qualityRating, shippingRating, serviceRating, valueRating }) => {
    if (!user || !companyId) {
      return { error: { message: 'Must be signed in' } };
    }

    if (isLocalMode) {
      const fakeReview = {
        id: Date.now().toString(),
        user_id: user.id,
        company_id: companyId,
        rating,
        review_text: reviewText,
        quality_rating: qualityRating,
        shipping_rating: shippingRating,
        service_rating: serviceRating,
        value_rating: valueRating,
        created_at: new Date().toISOString(),
        profile: { display_name: user.user_metadata?.full_name || 'You' },
      };
      setReviews(prev => [fakeReview, ...prev.filter(r => r.user_id !== user.id)]);
      setUserReview(fakeReview);
      return { data: fakeReview, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('company_reviews')
        .upsert({
          user_id: user.id,
          company_id: companyId,
          rating,
          review_text: reviewText || null,
          quality_rating: qualityRating || null,
          shipping_rating: shippingRating || null,
          service_rating: serviceRating || null,
          value_rating: valueRating || null,
        })
        .select(`
          *,
          profile:profiles(username, display_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      await fetchReviews();
      return { data, error: null };
    } catch (err) {
      console.error('Error submitting company review:', err);
      return { error: err };
    }
  };

  return {
    reviews,
    userReview,
    loading,
    submitReview,
    refreshReviews: fetchReviews,
    reviewCount: reviews.length,
    averageRating: reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0,
  };
};
