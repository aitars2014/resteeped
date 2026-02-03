import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context';

export const useReviews = (teaId) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = useCallback(async () => {
    if (!teaId || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch all reviews for this tea
      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select(`
          *,
          profile:profiles(username, display_name, avatar_url)
        `)
        .eq('tea_id', teaId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setReviews(data || []);

      // Find user's review if logged in
      if (user) {
        const myReview = data?.find(r => r.user_id === user.id);
        setUserReview(myReview || null);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teaId, user]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = async ({ rating, reviewText }) => {
    if (!user || !teaId) {
      return { error: { message: 'Must be signed in' } };
    }

    if (!isSupabaseConfigured()) {
      // Demo mode - just update local state
      const fakeReview = {
        id: Date.now().toString(),
        user_id: user.id,
        tea_id: teaId,
        rating,
        review_text: reviewText,
        created_at: new Date().toISOString(),
        profile: { display_name: 'You' },
      };
      setReviews(prev => [fakeReview, ...prev.filter(r => r.user_id !== user.id)]);
      setUserReview(fakeReview);
      return { data: fakeReview, error: null };
    }

    try {
      // Upsert review (update if exists, insert if not)
      const { data, error } = await supabase
        .from('reviews')
        .upsert({
          user_id: user.id,
          tea_id: teaId,
          rating,
          review_text: reviewText || null,
        })
        .select(`
          *,
          profile:profiles(username, display_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Refresh reviews list
      await fetchReviews();
      
      return { data, error: null };
    } catch (err) {
      console.error('Error submitting review:', err);
      return { error: err };
    }
  };

  const deleteReview = async () => {
    if (!user || !userReview) {
      return { error: { message: 'No review to delete' } };
    }

    if (!isSupabaseConfigured()) {
      setReviews(prev => prev.filter(r => r.user_id !== user.id));
      setUserReview(null);
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', userReview.id);

      if (error) throw error;

      await fetchReviews();
      return { error: null };
    } catch (err) {
      console.error('Error deleting review:', err);
      return { error: err };
    }
  };

  return {
    reviews,
    userReview,
    loading,
    error,
    submitReview,
    deleteReview,
    refreshReviews: fetchReviews,
    reviewCount: reviews.length,
    averageRating: reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0,
  };
};
