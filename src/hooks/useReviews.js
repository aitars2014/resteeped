import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context';

export const useReviews = (teaId) => {
  const { user, isDevMode } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if we should use local-only mode (no Supabase calls)
  const isLocalMode = !isSupabaseConfigured() || isDevMode;

  const fetchReviews = useCallback(async () => {
    // Skip if no teaId, local mode, or teaId is not a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!teaId || isLocalMode || !uuidRegex.test(teaId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Only fetch the current user's review for this tea
      if (!user) {
        setReviews([]);
        setUserReview(null);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select(`
          *,
          profile:profiles(username, display_name, avatar_url)
        `)
        .eq('tea_id', teaId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setReviews(data || []);
      setUserReview(data?.[0] || null);
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

    if (isLocalMode) {
      // Dev/demo mode - just update local state
      const fakeReview = {
        id: Date.now().toString(),
        user_id: user.id,
        tea_id: teaId,
        rating,
        review_text: reviewText,
        created_at: new Date().toISOString(),
        profile: { display_name: user.user_metadata?.full_name || 'You' },
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
      
      // Check if review was flagged by moderation
      const wasFlagged = data?.moderation_status === 'flagged';
      const moderationReason = data?.moderation_reason;
      
      return { 
        data, 
        error: null,
        moderation: wasFlagged ? {
          status: 'flagged',
          reason: moderationReason,
          message: 'Your review is being held for moderation and will be reviewed shortly.',
        } : null,
      };
    } catch (err) {
      console.error('Error submitting review:', err);
      return { error: err };
    }
  };

  const deleteReview = async () => {
    if (!user || !userReview) {
      return { error: { message: 'No review to delete' } };
    }

    if (isLocalMode) {
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
    averageRating: userReview?.rating || 0,
  };
};
