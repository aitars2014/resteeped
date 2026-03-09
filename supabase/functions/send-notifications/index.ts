import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Send push notifications via Expo's Push API.
 * 
 * This function is designed to be called by:
 * - A cron job (pg_cron or external scheduler)
 * - An admin API call
 * - A database trigger (e.g., new teas added)
 * 
 * Request body:
 * {
 *   "type": "daily_suggestion" | "brew_reminder" | "new_teas" | "seasonal",
 *   "title": "Optional override title",
 *   "body": "Optional override body",
 *   "data": { ... optional deep-link data ... }
 * }
 */

interface ExpoPushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: string
  badge?: number
  channelId?: string
}

async function sendExpoPushNotifications(messages: ExpoPushMessage[]) {
  if (messages.length === 0) return { tickets: [] }

  // Expo accepts batches of up to 100 messages
  const batches: ExpoPushMessage[][] = []
  for (let i = 0; i < messages.length; i += 100) {
    batches.push(messages.slice(i, i + 100))
  }

  const allTickets = []
  for (const batch of batches) {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    })

    const result = await response.json()
    if (result.data) {
      allTickets.push(...result.data)
    }
  }

  return { tickets: allTickets }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // This function should be called with service role key or verified admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { type, title, body, data } = await req.json()

    if (!type) {
      return new Response(JSON.stringify({ error: 'Missing notification type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Map notification type to the preference key
    const prefKeyMap: Record<string, string> = {
      daily_suggestion: 'dailySuggestion',
      brew_reminder: 'brewReminder',
      new_teas: 'newTeasFromBrands',
      seasonal: 'seasonalPrompts',
    }

    const prefKey = prefKeyMap[type]
    if (!prefKey) {
      return new Response(JSON.stringify({ error: `Unknown notification type: ${type}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch users who have this notification type enabled
    // Join push_tokens with profiles to check preferences
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select(`
        token,
        user_id,
        profiles!inner (
          notification_preferences
        )
      `)

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError)
      return new Response(JSON.stringify({ error: 'Failed to fetch tokens' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Filter to users who have opted in to this notification type
    const eligibleTokens = (tokens || []).filter((t: any) => {
      const prefs = t.profiles?.notification_preferences
      return prefs && prefs[prefKey] === true
    })

    if (eligibleTokens.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        sent: 0, 
        message: 'No users opted in for this notification type' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Default messages per type
    const defaultMessages: Record<string, { title: string; body: string }> = {
      daily_suggestion: {
        title: '🍵 Your morning tea suggestion',
        body: 'Time to discover something new — tap to see today\'s pick.',
      },
      brew_reminder: {
        title: '🫖 Missing your daily steep?',
        body: 'It\'s been a while since your last brew. Ready for a cup?',
      },
      new_teas: {
        title: '🆕 New teas just added',
        body: 'Check out the latest additions from your favorite brands.',
      },
      seasonal: {
        title: '🌿 Seasonal teas are here',
        body: 'Explore this season\'s freshest picks.',
      },
    }

    const defaults = defaultMessages[type]

    // Build push messages
    const messages: ExpoPushMessage[] = eligibleTokens.map((t: any) => ({
      to: t.token,
      title: title || defaults.title,
      body: body || defaults.body,
      data: data || { type, screen: 'Home' },
      sound: 'default',
    }))

    // Send via Expo Push API
    const result = await sendExpoPushNotifications(messages)

    // Log errors from tickets
    const errors = result.tickets.filter((t: any) => t.status === 'error')
    if (errors.length > 0) {
      console.error('Push notification errors:', JSON.stringify(errors))
    }

    return new Response(JSON.stringify({
      success: true,
      sent: messages.length,
      errors: errors.length,
      tickets: result.tickets,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Notification function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
