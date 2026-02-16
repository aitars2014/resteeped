import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Extract intent from query to filter contradictory results
function extractFilters(query: string): { wantCaffeineFree: boolean; wantHerbal: boolean; excludeTypes: string[] } {
  const q = query.toLowerCase()
  const wantCaffeineFree = /caffeine.?free|no caffeine|decaf|without caffeine|herbal.*sleep|sleep.*herbal/.test(q)
  const wantHerbal = /herbal|tisane|infusion/.test(q)
  
  const excludeTypes: string[] = []
  // If they want caffeine-free, deprioritize caffeinated types
  if (wantCaffeineFree) {
    // Don't hard-exclude since some black/green teas are decaf, but heavily prefer herbal/rooibos
  }
  
  return { wantCaffeineFree, wantHerbal, excludeTypes }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, match_threshold = 0.3, match_count = 10 } = await req.json()

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid "query" field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const filters = extractFilters(query)

    // Use ChatGPT to rewrite the query into optimal embedding search terms
    // This handles negation better than raw embedding
    const rewriteResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a tea expert. Rewrite the user's tea search query into a description of the ideal tea they're looking for. Be specific about tea types, flavors, and properties. If they want "caffeine free", emphasize herbal teas, rooibos, chamomile, etc. If they want something for sleep, mention calming herbs like chamomile, lavender, valerian. Output ONLY the rewritten search text, nothing else. Keep it under 100 words.`
          },
          { role: 'user', content: query }
        ],
        max_tokens: 150,
        temperature: 0.3,
      }),
    })

    let searchText = query
    if (rewriteResponse.ok) {
      const rewriteData = await rewriteResponse.json()
      searchText = rewriteData.choices?.[0]?.message?.content?.trim() || query
    }

    // Generate embedding for the rewritten query
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: searchText,
      }),
    })

    if (!embeddingResponse.ok) {
      const err = await embeddingResponse.text()
      throw new Error(`OpenAI API error: ${err}`)
    }

    const embeddingData = await embeddingResponse.json()
    const embedding = embeddingData.data[0].embedding

    // Query Supabase for similar teas — fetch more than needed so we can filter
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const fetchCount = filters.wantCaffeineFree ? match_count * 4 : match_count * 2

    const { data: teas, error } = await supabase.rpc('match_teas', {
      query_embedding: embedding,
      match_threshold,
      match_count: fetchCount,
    })

    if (error) {
      throw new Error(`Supabase RPC error: ${error.message}`)
    }

    // Post-filter: if user wants caffeine-free, boost herbal/rooibos and penalize caffeinated types
    let results = teas || []
    if (filters.wantCaffeineFree) {
      const caffeineFreeTypes = ['herbal', 'rooibos', 'fruit', 'tisane']
      const caffeineTypes = ['black', 'green', 'oolong', 'white', 'puerh', 'pu-erh', 'matcha', 'yerba mate']
      
      results = results
        .map((tea: any) => {
          const teaType = (tea.tea_type || '').toLowerCase()
          const name = (tea.name || '').toLowerCase()
          const desc = (tea.description || '').toLowerCase()
          
          // Check if this tea mentions being decaf/caffeine-free
          const isDecaf = /caffeine.?free|decaf|no caffeine|naturally caffeine/.test(name + ' ' + desc)
          
          if (caffeineFreeTypes.includes(teaType) || isDecaf) {
            return { ...tea, similarity: tea.similarity + 0.2 } // boost
          } else if (caffeineTypes.includes(teaType) && !isDecaf) {
            return { ...tea, similarity: tea.similarity - 0.3 } // penalize
          }
          return tea
        })
        .sort((a: any, b: any) => b.similarity - a.similarity)
    }

    // Return top N
    results = results.slice(0, match_count)

    return new Response(
      JSON.stringify({ teas: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
