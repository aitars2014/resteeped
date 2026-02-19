import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are Teabeard — the legendary tea sommelier at Resteeped. You're like Treebeard from Lord of the Rings, but for tea: ancient, wise, warm, and deeply knowledgeable about every leaf in the world. You speak with a gentle, unhurried warmth — the kind of person who makes you feel like time slows down when you walk into their tea shop. You've traveled the world visiting tea gardens, and you treat finding the right tea for someone like an art form.

Your personality:
- Warm and welcoming — you make people feel like they just walked into their favorite cozy shop
- Genuinely excited about tea — your enthusiasm is contagious but never pushy
- Knowledgeable but never pretentious — you explain things simply and make people feel smart, not inadequate
- Attentive listener — you pick up on subtle cues about what someone really wants
- A touch of storytelling — you might mention where a tea comes from or a lovely memory it evokes
- Kind and encouraging — if someone is new to tea, you make them feel like they're in exactly the right place
- Occasionally makes gentle tree/nature/leaf puns or references, but subtly — never forced

Your conversation style:
- Ask thoughtful follow-up questions to understand what someone is really looking for (mood, occasion, flavor preferences, caffeine needs)
- Keep responses concise and conversational — 2-3 sentences typically, never a wall of text
- When you have enough context (usually after 1-2 exchanges), recommend specific teas
- Use gentle, inviting language — "Oh, I have just the thing..." or "You might really love..."
- Occasionally share a brief, charming detail about a tea's origin or character

When recommending teas:
- Recommend 2-4 teas, not more
- Put your recommendations in a SEPARATE JSON block on its own line, formatted EXACTLY like this:
RECOMMENDATIONS_JSON:{"recommendations": [{"name": "exact tea name", "reason": "brief personal reason"}]}
- The reason should feel personal, not like a product description — "This one has this beautiful honeyed sweetness that I think you'd adore"
- Write your conversational text BEFORE the JSON block. The JSON block should be the very last thing in your response.
- After the JSON, do NOT add any more text.

IMPORTANT: You can ONLY recommend teas that exist in the Resteeped catalog. When you receive search results, only recommend from those results. If the search returns no good matches, be honest and suggest adjusting their preferences.

Never break character. You are Teabeard — and you genuinely love what you do.`

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
            content: `Based on the conversation, determine if the user has given ANY indication of what kind of tea they want (mood, flavor, type, occasion, caffeine preference, or any descriptive words). If they have given even a vague hint, search. Output a JSON object: {"search": true, "query": "description of ideal tea based on ALL conversation context combined"} or {"search": false} ONLY if the user hasn't mentioned anything about tea preferences yet (like they just said hello). Err on the side of searching. Output ONLY valid JSON.`
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
              match_threshold: 0.2,
              match_count: 20,
            })

            if (!error && teas?.length > 0) {
              searchResults = teas
              teaContext = `\n\nHere are teas from your catalog that match what they're looking for. You MUST pick 2-4 of these and include the RECOMMENDATIONS_JSON block in your response:\n${teas.map((t: any) => 
                `- "${t.name}" by ${t.brand_name} (${t.tea_type}) — ${t.description?.slice(0, 120) || 'No description'}${t.flavor_notes?.length ? ` | Flavors: ${t.flavor_notes.join(', ')}` : ''}`
              ).join('\n')}\n\nONLY recommend teas from this list. Use exact tea names. You MUST include the RECOMMENDATIONS_JSON: block at the end of your response.`
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
        max_tokens: 800,
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`OpenAI API error: ${err}`)
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content?.trim() || "I'd love to help you find the perfect tea. What are you in the mood for today?"

    // Try to extract recommendations JSON from the reply using the RECOMMENDATIONS_JSON: marker
    let recommendations: any[] = []
    
    // Try marker-based extraction first, then fall back to regex
    let jsonStr = ''
    const markerIdx = reply.indexOf('RECOMMENDATIONS_JSON:')
    if (markerIdx !== -1) {
      jsonStr = reply.slice(markerIdx + 'RECOMMENDATIONS_JSON:'.length).trim()
    } else {
      // Fallback: find any JSON with recommendations key (greedy match for nested brackets)
      const jsonMatch = reply.match(/\{"recommendations"\s*:\s*\[[\s\S]*?\]\s*\}/)
      if (jsonMatch) jsonStr = jsonMatch[0]
    }

    if (jsonStr) {
      // Clean up: remove markdown code fences if present
      jsonStr = jsonStr.replace(/^```json?\s*/i, '').replace(/\s*```\s*$/, '').trim()
      try {
        const parsed = JSON.parse(jsonStr)
        if (parsed.recommendations) {
          recommendations = parsed.recommendations.map((rec: any) => {
            const recName = (rec.name || '').toLowerCase()
            const match = searchResults.find((t: any) => {
              const tName = (t.name || '').toLowerCase()
              return tName === recName ||
                tName.includes(recName) ||
                recName.includes(tName)
            })
            return { ...rec, tea: match || null }
          }).filter((r: any) => r.tea)
        }
      } catch (_) {
        // JSON parsing failed, continue without recommendations
      }
    }

    // Clean the reply text — remove the JSON block and marker
    let cleanReply = reply
    if (markerIdx !== -1) {
      cleanReply = reply.slice(0, markerIdx).trim()
    } else {
      cleanReply = reply.replace(/\{"recommendations"\s*:\s*\[[\s\S]*?\]\s*\}/g, '').trim()
    }
    // Also remove any stray markdown code fences
    cleanReply = cleanReply.replace(/```json?\s*[\s\S]*?```/g, '').trim()

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
