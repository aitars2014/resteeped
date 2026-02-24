import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves a tea's local/numeric ID to a Supabase UUID.
 * Returns the UUID immediately if already valid, otherwise looks up by name.
 */
export const useResolvedTeaId = (tea) => {
  const rawId = tea?.id;
  const name = tea?.name;
  const isUuid = rawId && UUID_REGEX.test(rawId);
  
  const [resolvedId, setResolvedId] = useState(isUuid ? rawId : null);

  useEffect(() => {
    if (isUuid) {
      setResolvedId(rawId);
      return;
    }
    if (!name || !isSupabaseConfigured()) return;

    let cancelled = false;
    supabase
      .from('teas')
      .select('id')
      .eq('name', name)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (!cancelled && data?.id) setResolvedId(data.id);
      });
    return () => { cancelled = true; };
  }, [rawId, name, isUuid]);

  return resolvedId || rawId;
};
