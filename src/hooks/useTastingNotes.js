import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const useTastingNotes = (teaId) => {
  const [tastingNote, setTastingNote] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchNote = useCallback(async () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!teaId || !isSupabaseConfigured() || !uuidRegex.test(teaId)) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasting_notes')
        .select('note_text, source_attribution')
        .eq('tea_id', teaId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, that's fine
        console.error('Error fetching tasting note:', error);
      }
      setTastingNote(data || null);
    } catch (err) {
      console.error('Error fetching tasting note:', err);
    } finally {
      setLoading(false);
    }
  }, [teaId]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  return { tastingNote, loading };
};
