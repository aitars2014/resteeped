import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context';

// Demo companies for local/dev mode - all 17 companies from production database
const DEMO_COMPANIES = [
  {
    id: 'daa13f4f-b52b-4f3b-a5e2-efdb3140aba7',
    name: 'The Steeping Room',
    slug: 'the-steeping-room',
    short_description: "Austin's premier tea house and café",
    description: "Austin's premier tea house and café, offering an extensive selection of loose-leaf teas from around the world paired with a seasonal food menu.",
    logo_url: 'https://pakfofausiltnkojafpd.supabase.co/storage/v1/object/public/logos/companies/the-steeping-room.png',
    website_url: 'https://www.thesteepingroom.com/',
    headquarters_city: 'Austin',
    headquarters_state: 'TX',
    headquarters_country: 'USA',
    specialty: ['Loose Leaf', 'Tea House', 'Food Pairing'],
    price_range: 'moderate',
    avg_rating: 0,
    rating_count: 0,
    tea_count: 0,
  },
  {
    id: 'ded6ab2e-539a-4cdb-91bd-83ede0406609',
    name: 'Republic of Tea',
    slug: 'republic-of-tea',
    short_description: 'Premium tea pioneer since 1992',
    description: 'Founded in 1992, The Republic of Tea pioneered the premium tea industry in the United States.',
    logo_url: 'https://pakfofausiltnkojafpd.supabase.co/storage/v1/object/public/logos/companies/republic-of-tea.png',
    website_url: 'https://www.republicoftea.com/',
    headquarters_city: 'Novato',
    headquarters_state: 'CA',
    headquarters_country: 'USA',
    specialty: ['Premium Blends', 'Wellness', 'Gift Sets'],
    price_range: 'premium',
    avg_rating: 0,
    rating_count: 0,
    tea_count: 0,
    ships_internationally: true,
  },
  {
    id: 'e22343bd-522e-4c60-a32a-63a7fd955ba0',
    name: 'Rishi Tea',
    slug: 'rishi-tea',
    short_description: 'Direct Trade organic tea importer',
    description: 'Rishi Tea is a Direct Trade importer of organic teas and botanicals, working directly with farmers and artisans worldwide.',
    logo_url: 'https://pakfofausiltnkojafpd.supabase.co/storage/v1/object/public/logos/companies/rishi-tea.png',
    website_url: 'https://www.rishi-tea.com/',
    headquarters_city: 'Milwaukee',
    headquarters_state: 'WI',
    headquarters_country: 'USA',
    specialty: ['Organic', 'Direct Trade', 'Japanese Green', 'Botanical Blends'],
    price_range: 'premium',
    avg_rating: 0,
    rating_count: 0,
    tea_count: 0,
    ships_internationally: true,
  },
  {
    id: '814e74f0-cac5-4e0c-86e3-47e798e9bb5c',
    name: 'Adagio Teas',
    slug: 'adagio-teas',
    short_description: 'Quality tea made accessible',
    description: 'Adagio Teas makes quality tea accessible to everyone with their wide selection of loose-leaf teas at reasonable prices.',
    logo_url: 'https://pakfofausiltnkojafpd.supabase.co/storage/v1/object/public/logos/companies/adagio-teas.png',
    website_url: 'https://www.adagio.com/',
    headquarters_city: 'Garfield',
    headquarters_state: 'NJ',
    headquarters_country: 'USA',
    specialty: ['Accessible', 'Custom Blends', 'Signature Blends', 'Samplers'],
    price_range: 'moderate',
    avg_rating: 0,
    rating_count: 0,
    tea_count: 0,
    ships_internationally: true,
  },
  {
    id: '5e90bdf2-e452-4052-a54b-0407211ac67b',
    name: 'Crimson Lotus Tea',
    slug: 'crimson-lotus-tea',
    short_description: "Pu-erh specialists with premium Yunnan teaware",
    description: "Crimson Lotus Tea is a Seattle-based tea company specializing in aged and raw pu-erh teas from Yunnan, China.",
    logo_url: 'https://pakfofausiltnkojafpd.supabase.co/storage/v1/object/public/logos/companies/crimson-lotus-tea.png',
    website_url: 'https://crimsonlotustea.com',
    headquarters_city: 'Seattle',
    headquarters_state: 'WA',
    headquarters_country: 'USA',
    specialty: ['Pu-erh', 'Raw Pu-erh', 'Aged Tea', 'Jianshui Teaware'],
    price_range: 'premium',
    avg_rating: 0,
    rating_count: 0,
    tea_count: 0,
    ships_internationally: true,
    instagram_handle: 'crimsonlotustea',
  },
  {
    id: '1e36955b-1af2-4bc8-a74f-6f22548459fc',
    name: 'Teapigs',
    slug: 'teapigs',
    short_description: "UK's quality tea in biodegradable tea temples",
    logo_url: 'https://pakfofausiltnkojafpd.supabase.co/storage/v1/object/public/logos/companies/teapigs.png',
    website_url: 'https://www.teapigs.com',
    headquarters_city: 'London',
    headquarters_country: 'United Kingdom',
    specialty: ['Whole Leaf', 'Matcha'],
    price_range: 'moderate',
    avg_rating: 0,
    rating_count: 0,
    tea_count: 0,
    founded_year: 2006,
  },
  {
    id: '67d32e56-18c3-4889-aa2c-347b5c79ad4c',
    name: 'Steven Smith Teamaker',
    slug: 'steven-smith-teamaker',
    short_description: 'Handcrafted small-batch teas from a tea industry pioneer',
    logo_url: 'https://pakfofausiltnkojafpd.supabase.co/storage/v1/object/public/logos/companies/steven-smith-teamaker.svg',
    website_url: 'https://www.smithtea.com',
    headquarters_city: 'Portland',
    headquarters_state: 'OR',
    headquarters_country: 'USA',
    specialty: ['Craft Blends'],
    price_range: 'premium',
    avg_rating: 0,
    rating_count: 0,
    tea_count: 0,
    founded_year: 2009,
  },
  {
    id: '9a3184cb-0d7d-474f-87ed-b06c922d7d2c',
    name: 'Art of Tea',
    slug: 'art-of-tea',
    short_description: 'Hand-crafted organic teas from sustainable gardens',
    logo_url: 'https://pakfofausiltnkojafpd.supabase.co/storage/v1/object/public/logos/companies/art-of-tea.png',
    website_url: 'https://www.artoftea.com',
    headquarters_city: 'Los Angeles',
    headquarters_state: 'CA',
    headquarters_country: 'USA',
    specialty: ['Organic', 'Matcha'],
    price_range: 'moderate',
    avg_rating: 0,
    rating_count: 0,
    tea_count: 0,
    founded_year: 2003,
  },
  {
    id: '2c229969-2b11-4309-848e-b1ffe2dab59e',
    name: 'Harney & Sons',
    slug: 'harney-and-sons',
    short_description: 'Family-owned tea company with 300+ premium blends since 1983',
    logo_url: 'https://pakfofausiltnkojafpd.supabase.co/storage/v1/object/public/logos/companies/harney-and-sons.png',
    website_url: 'https://www.harney.com',
    headquarters_city: 'Millerton',
    headquarters_state: 'NY',
    headquarters_country: 'USA',
    specialty: ['Black Tea', 'Flavored Blends'],
    price_range: 'moderate',
    avg_rating: 0,
    rating_count: 0,
    tea_count: 0,
    founded_year: 1983,
  },
  {
    id: 'e6f54d94-18ae-464c-a93f-8fbc90444816',
    name: 'Mountain Rose Herbs',
    slug: 'mountain-rose-herbs',
    short_description: 'Organic herbs and botanicals with sustainability focus',
    logo_url: 'https://pakfofausiltnkojafpd.supabase.co/storage/v1/object/public/logos/companies/mountain-rose-herbs.png',
    website_url: 'https://www.mountainroseherbs.com',
    headquarters_city: 'Eugene',
    headquarters_state: 'OR',
    headquarters_country: 'USA',
    specialty: ['Herbal', 'Organic'],
    price_range: 'budget',
    avg_rating: 0,
    rating_count: 0,
    tea_count: 0,
    founded_year: 1987,
  },
  {
    id: '6368d9c8-1d76-4fa6-b072-62b662e40340',
    name: 'Song Tea & Ceramics',
    slug: 'song-tea',
    short_description: 'Traditional and rare Chinese & Taiwanese teas with ceramics',
    logo_url: 'https://pakfofausiltnkojafpd.supabase.co/storage/v1/object/public/logos/companies/song-tea.svg',
    website_url: 'https://songtea.com',
    headquarters_city: 'San Francisco',
    headquarters_state: 'CA',
    headquarters_country: 'USA',
    specialty: ['Oolong', 'Pu-erh'],
    price_range: 'premium',
    avg_rating: 0,
    rating_count: 0,
    tea_count: 0,
    founded_year: 2012,
  },
  {
    id: '9cb35171-ec8a-46af-87bf-9557a28a5f46',
    name: 'Teasenz',
    slug: 'teasenz',
    short_description: 'Authentic Chinese teas and teaware direct from Fujian',
    description: 'Teasenz is a Chinese tea company based in Xiamen, Fujian province, offering authentic loose leaf teas directly from origin.',
    logo_url: 'https://pakfofausiltnkojafpd.supabase.co/storage/v1/object/public/logos/companies/teasenz.png',
    website_url: 'https://www.teasenz.com',
    headquarters_city: 'Xiamen',
    headquarters_country: 'China',
    specialty: ['Oolong', 'Pu-erh', 'Yixing Teaware', 'Traditional Chinese'],
    price_range: 'moderate',
    avg_rating: 0,
    rating_count: 0,
    tea_count: 0,
    ships_internationally: true,
  },
  {
    id: 'ae4a104f-a0b2-4562-a912-8a283c960b65',
    name: 'The Tea Spot',
    slug: 'the-tea-spot',
    short_description: 'Wellness-focused teas with 10% donated to cancer programs',
    logo_url: 'https://pakfofausiltnkojafpd.supabase.co/storage/v1/object/public/logos/companies/the-tea-spot.png',
    website_url: 'https://www.theteaspot.com',
    headquarters_city: 'Boulder',
    headquarters_state: 'CO',
    headquarters_country: 'USA',
    specialty: ['Wellness', 'Organic'],
    price_range: 'moderate',
    avg_rating: 0,
    rating_count: 0,
    tea_count: 0,
    founded_year: 2004,
  },
  {
    id: '7569ca42-a515-494b-bfde-af2632468b08',
    name: 'Vahdam Teas',
    slug: 'vahdam-teas',
    short_description: "India's freshest teas, garden-to-cup in 72 hours",
    logo_url: 'https://pakfofausiltnkojafpd.supabase.co/storage/v1/object/public/logos/companies/vahdam-teas.png',
    website_url: 'https://www.vahdamteas.com',
    headquarters_city: 'New Delhi',
    headquarters_country: 'India',
    specialty: ['Darjeeling', 'Assam', 'Chai'],
    price_range: 'moderate',
    avg_rating: 0,
    rating_count: 0,
    tea_count: 0,
    founded_year: 2015,
  },
  {
    id: 'fced16b0-b95d-44ea-b20b-8d1c1fc54ff0',
    name: 'Spirit Tea',
    slug: 'spirit-tea',
    short_description: 'Seasonal collection of rare, direct-sourced specialty teas',
    logo_url: 'https://pakfofausiltnkojafpd.supabase.co/storage/v1/object/public/logos/companies/spirit-tea.png',
    website_url: 'https://spirittea.co',
    headquarters_city: 'Chicago',
    headquarters_state: 'IL',
    headquarters_country: 'USA',
    specialty: ['Seasonal', 'Chinese'],
    price_range: 'premium',
    avg_rating: 0,
    rating_count: 0,
    tea_count: 0,
    founded_year: 2015,
  },
  {
    id: '685ee01a-64db-402e-aec4-8e60097935c7',
    name: 'Mei Leaf',
    slug: 'mei-leaf',
    short_description: 'Premium artisan teas with expert education',
    description: 'Mei Leaf is a London-based tea company founded by Don Mei, offering premium loose leaf teas sourced directly from artisan producers.',
    logo_url: 'https://pakfofausiltnkojafpd.supabase.co/storage/v1/object/public/logos/companies/mei-leaf.svg',
    website_url: 'https://meileaf.com',
    headquarters_city: 'London',
    headquarters_country: 'United Kingdom',
    specialty: ['Chinese', 'Taiwanese', 'Oolong', 'Gongfu'],
    price_range: 'premium',
    avg_rating: 0,
    rating_count: 0,
    tea_count: 0,
    ships_internationally: true,
    instagram_handle: 'meaboratory',
  },
  {
    id: '362d1f26-cf08-4b7e-bcbb-788444344137',
    name: 'Yunnan Sourcing',
    slug: 'yunnan-sourcing',
    short_description: 'Massive selection of Yunnan teas and traditional teaware',
    description: 'Yunnan Sourcing is one of the largest online retailers of Chinese tea, specializing in pu-erh and other teas from Yunnan province.',
    logo_url: 'https://pakfofausiltnkojafpd.supabase.co/storage/v1/object/public/logos/companies/yunnan-sourcing.png',
    website_url: 'https://yunnansourcing.com',
    headquarters_city: 'Kunming',
    headquarters_country: 'China',
    specialty: ['Pu-erh', 'Yunnan Teas', 'Yixing', 'Teaware'],
    price_range: 'budget',
    avg_rating: 0,
    rating_count: 0,
    tea_count: 0,
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
