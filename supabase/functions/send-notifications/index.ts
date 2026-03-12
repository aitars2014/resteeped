import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { withTracing } from '../_shared/tracing.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

serve(withTracing('send-notifications', async (req, tracer, rootSpan) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    rootSpan.setAttribute('error.type', 'no_auth_header')
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { type, title, body, data } = await req.json()

  rootSpan.setAttribute('notification.type', type || 'unknown')

  if (!type) {
    return new Response(JSON.stringify({ error: 'Missing notification type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const prefKeyMap: Record<string, string> = {
    daily_suggestion: 'dailySuggestion',
    brew_reminder: 'brewReminder',
    new_teas: 'newTeasFromBrands',
    seasonal: 'seasonalPrompts',
  }

  const prefKey = prefKeyMap[type]
  if (!prefKey) {
    rootSpan.setAttribute('error.type', 'unknown_notification_type')
    return new Response(JSON.stringify({ error: `Unknown notification type: ${type}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fetch eligible push tokens
  const { data: tokens, error: tokensError } = await tracer.trace(
    'supabase.query.push_tokens',
    rootSpan.context,
    { 'db.system': 'postgresql', 'db.operation': 'select', 'db.table': 'push_tokens' },
    () => supabase
      .from('push_tokens')
      .select(`
        token,
        user_id,
        profiles!inner (
          notification_preferences
        )
      `),
  )

  if (tokensError) {
    throw new Error(`Failed to fetch tokens: ${tokensError.message}`)
  }

  const eligibleTokens = (tokens || []).filter((t: any) => {
    const prefs = t.profiles?.notification_preferences
    return prefs && prefs[prefKey] === true
  })

  rootSpan.setAttributes({
    'notification.total_tokens': (tokens || []).length,
    'notification.eligible_tokens': eligibleTokens.length,
  })

  if (eligibleTokens.length === 0) {
    rootSpan.addEvent('no_eligible_users')
    return new Response(JSON.stringify({ 
      success: true, sent: 0, 
      message: 'No users opted in for this notification type' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

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
  const pushMessages: ExpoPushMessage[] = eligibleTokens.map((t: any) => ({
    to: t.token,
    title: title || defaults.title,
    body: body || defaults.body,
    data: data || { type, screen: 'Home' },
    sound: 'default',
  }))

  const result = await tracer.trace(
    'expo.push.send',
    rootSpan.context,
    { 'expo.message_count': pushMessages.length },
    () => sendExpoPushNotifications(pushMessages),
  )

  const errors = result.tickets.filter((t: any) => t.status === 'error')
  rootSpan.setAttributes({
    'notification.sent': pushMessages.length,
    'notification.errors': errors.length,
  })

  if (errors.length > 0) {
    rootSpan.addEvent('push_errors', { 'error.count': errors.length })
  }

  return new Response(JSON.stringify({
    success: true,
    sent: pushMessages.length,
    errors: errors.length,
    tickets: result.tickets,
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}))
