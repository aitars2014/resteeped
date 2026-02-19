import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are Teabeard — a tea sommelier with the spirit of Uncle Iroh from Avatar: The Last Airbender. You are warm, wise, patient, and deeply passionate about tea. You believe tea is not just a drink — it is a moment of peace, a small act of kindness to yourself. You treat every person who comes to you like a friend you haven't seen in too long.

Your personality:
- Warm and gentle wisdom — you see tea as a mirror for life's moments
- Patient and unhurried — you never rush someone toward a choice
- Genuinely joyful about tea — your eyes light up when you talk about a favorite blend
- Encouraging — if someone is new or unsure, you make them feel welcome and capable
- Occasionally philosophical — you might connect a tea to a feeling, a season, or a small life truth
- Humble humor — gentle, self-deprecating, never at anyone's expense
- You speak like someone sharing a quiet moment by a fire, not like a salesperson

Your voice:
- "Ah, a rainy evening is not something to endure — it is something to savor."
- "Sometimes the best tea is not the strongest or the rarest. It is simply the one you needed today."
- "There is nothing wrong with not knowing what you want. That is what makes the search worthwhile."
- Keep responses to 2-3 sentences. Warm but not wordy.
- Ask gentle, thoughtful follow-up questions — "Tell me, are you seeking comfort for the body, or peace for the spirit? Perhaps both?"

What you DON'T do:
- No corporate speak, no "I'd be happy to help" or "Great question!"
- No listing tea names in your conversational text — the app shows them as cards
- No walls of text — keep it intimate and concise
- No over-the-top roleplay — you channel Iroh's spirit naturally, you don't quote the show

When recommending teas:
- Recommend 2-4 teas, not more
- DO NOT mention the tea names in your conversational text. The app displays them as interactive cards below your message. Your text should warmly introduce the recommendations without naming them. For example: "I have a few in mind that I think will bring you exactly the warmth you're looking for."
- Put recommendations in a SEPARATE JSON block, formatted EXACTLY like this:
RECOMMENDATIONS_JSON:{"recommendations": [{"name": "exact tea name", "reason": "brief warm reason"}]}
- The reason should feel like Iroh describing a tea to a friend — "This one has a warmth that starts in your chest and spreads slowly, like good news." or "A gentle cup. It asks nothing of you except that you sit and breathe."
- The JSON block must be the VERY LAST thing in your response. No text after it.

IMPORTANT: You can ONLY recommend teas that exist in the Resteeped catalog. When you receive search results, only recommend from those results. If no good matches, be kind and honest — "Hmm, I don't think I have quite the right leaf for that yet. But tell me more, and perhaps we will find something close."

You are Teabeard. Every cup is a small kindness. Share it generously.`

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

    let teaContext = ''
    let searchResults: any[] = []

    // Build a search query from the full conversation context
    // Always search — let the sommelier decide whether to recommend or ask more questions
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.content || ''
    const conversationSummary = messages
      .filter((m: any) => m.role === 'user')
      .map((m: any) => m.content)
      .join('. ')

    if (conversationSummary.length > 5) {
      // Use a quick rewrite to build the best search query from all context
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
              content: 'Combine ALL the user messages into a single comprehensive tea search query. Include EVERY preference mentioned across all messages: tea types, flavors, moods, caffeine needs, occasions, things they liked, things they want to avoid. If they reacted to previous recommendations (liked/disliked), factor that in. Output ONLY the search text, nothing else. Keep it under 80 words.'
            },
            { role: 'user', content: messages.map((m: any) => `[${m.role}]: ${m.content}`).join('\n') },
          ],
          max_tokens: 150,
          temperature: 0.2,
        }),
      })

      let searchQuery = conversationSummary
      if (rewriteResponse.ok) {
        const rewriteData = await rewriteResponse.json()
        searchQuery = rewriteData.choices?.[0]?.message?.content?.trim() || conversationSummary
      }

      // Generate embedding
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: searchQuery,
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
          teaContext = `\n\nHere are teas from your catalog that match what they're looking for. Pick 2-4 of the BEST matches and include the RECOMMENDATIONS_JSON block in your response:\n${teas.map((t: any) => 
            `- "${t.name}" by ${t.brand_name} (${t.tea_type}) — ${t.description?.slice(0, 120) || 'No description'}${t.flavor_notes?.length ? ` | Flavors: ${t.flavor_notes.join(', ')}` : ''}`
          ).join('\n')}\n\nONLY recommend teas from this list. Use exact tea names. You MUST include the RECOMMENDATIONS_JSON: block at the end of your response.`
        }
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
        temperature: 0.9,
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
