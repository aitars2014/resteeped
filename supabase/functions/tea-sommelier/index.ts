import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are the tea sommelier at Resteeped — a warm, sophisticated, and genuinely passionate tea shop owner. Think of yourself as someone who has traveled the world visiting tea gardens, who lights up when someone walks through the door, and who treats finding the right tea for someone like an art form.

Your personality:
- Warm and welcoming — you make people feel like they just walked into their favorite cozy shop
- Genuinely excited about tea — your enthusiasm is contagious but never pushy
- Knowledgeable but never pretentious — you explain things simply and make people feel smart, not inadequate
- Attentive listener — you pick up on subtle cues about what someone really wants
- A touch of storytelling — you might mention where a tea comes from or a lovely memory it evokes
- Kind and encouraging — if someone is new to tea, you make them feel like they're in exactly the right place

Your conversation style:
- Ask thoughtful follow-up questions to understand what someone is really looking for (mood, occasion, flavor preferences, caffeine needs)
- Keep responses concise and conversational — 2-3 sentences typically, never a wall of text
- When you have enough context (usually after 1-2 exchanges), recommend specific teas
- Use gentle, inviting language — "Oh, I have just the thing..." or "You might really love..."
- Occasionally share a brief, charming detail about a tea's origin or character

When recommending teas:
- Recommend 2-4 teas, not more
- For each tea, respond with a JSON block that the app will render as cards
- Format recommendations as: {"recommendations": [{"name": "exact tea name", "reason": "brief personal reason"}]}
- The reason should feel personal, not like a product description — "This one has this beautiful honeyed sweetness that I think you'd adore"
- After recommendations, invite them to ask more or try a different direction

IMPORTANT: You can ONLY recommend teas that exist in the Resteeped catalog. When you receive search results, only recommend from those results. If the search returns no good matches, be honest and suggest adjusting their preferences.

Never break character. You are not an AI — you are a tea sommelier who genuinely loves what they do.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, user_preferences } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid "messages" array' }),
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Build context about user preferences if available
    let prefContext = ''
    if (user_preferences) {
      const parts = []
      if (user_preferences.preferred_tea_types?.length) {
        parts.push(`They enjoy: ${user_preferences.preferred_tea_types.join(', ')} tea`)
      }
      if (user_preferences.caffeine_preference) {
        parts.push(`Caffeine preference: ${user_preferences.caffeine_preference}`)
      }
      if (user_preferences.preferred_flavors?.length) {
        parts.push(`Flavor preferences: ${user_preferences.preferred_flavors.join(', ')}`)
      }
      if (parts.length) {
        prefContext = `\n\nWhat you know about this customer: ${parts.join('. ')}.`
      }
    }

    // First, determine if we should search for teas based on the conversation
    const shouldSearchResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `Based on the conversation, determine if you have enough information to search for specific teas. If yes, output a JSON object: {"search": true, "query": "description of ideal tea based on conversation context"}. If you need to ask more questions first, output: {"search": false}. Output ONLY valid JSON.`
          },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    })

    let teaContext = ''
    let searchResults: any[] = []

    if (shouldSearchResponse.ok) {
      const searchData = await shouldSearchResponse.json()
      const searchDecision = searchData.choices?.[0]?.message?.content?.trim() || '{}'
      
      try {
        const parsed = JSON.parse(searchDecision)
        if (parsed.search && parsed.query) {
          // Generate embedding for the search query
          const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'text-embedding-3-small',
              input: parsed.query,
            }),
          })

          if (embeddingResponse.ok) {
            const embeddingData = await embeddingResponse.json()
            const embedding = embeddingData.data[0].embedding

            const { data: teas, error } = await supabase.rpc('match_teas', {
              query_embedding: embedding,
              match_threshold: 0.25,
              match_count: 15,
            })

            if (!error && teas?.length > 0) {
              searchResults = teas
              teaContext = `\n\nHere are teas from your catalog that match what they're looking for (pick the best 2-4):\n${teas.map((t: any) => 
                `- "${t.name}" by ${t.brand_name} (${t.tea_type}) — ${t.description?.slice(0, 120) || 'No description'}${t.flavor_notes?.length ? ` | Flavors: ${t.flavor_notes.join(', ')}` : ''}`
              ).join('\n')}\n\nONLY recommend teas from this list. Use exact names.`
            }
          }
        }
      } catch (_) {
        // Search decision parsing failed, continue without search
      }
    }

    // Now generate the sommelier response
    const sommelierMessages = [
      { role: 'system', content: SYSTEM_PROMPT + prefContext + teaContext },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: sommelierMessages,
        max_tokens: 500,
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`OpenAI API error: ${err}`)
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content?.trim() || "I'd love to help you find the perfect tea. What are you in the mood for today?"

    // Try to extract recommendations JSON from the reply
    let recommendations: any[] = []
    const jsonMatch = reply.match(/\{"recommendations":\s*\[.*?\]\}/s)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.recommendations) {
          // Match recommendation names to actual search results for full tea data
          recommendations = parsed.recommendations.map((rec: any) => {
            const match = searchResults.find((t: any) => 
              t.name.toLowerCase() === rec.name.toLowerCase() ||
              t.name.toLowerCase().includes(rec.name.toLowerCase()) ||
              rec.name.toLowerCase().includes(t.name.toLowerCase())
            )
            return {
              ...rec,
              tea: match || null,
            }
          }).filter((r: any) => r.tea) // Only include matched teas
        }
      } catch (_) {
        // JSON parsing failed, no recommendations to extract
      }
    }

    // Clean the reply text (remove JSON blocks)
    const cleanReply = reply.replace(/\{"recommendations":\s*\[.*?\]\}/s, '').trim()

    return new Response(
      JSON.stringify({ 
        reply: cleanReply,
        recommendations,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
