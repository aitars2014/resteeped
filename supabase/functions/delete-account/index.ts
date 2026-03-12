import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { withTracing } from '../_shared/tracing.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(withTracing('delete-account', async (req, tracer, rootSpan) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify the user is authenticated
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    rootSpan.setAttribute('error.type', 'no_auth_header')
    return new Response(JSON.stringify({ error: 'No authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Create client with user's JWT to verify identity
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  // Get the authenticated user
  const { data: { user }, error: userError } = await tracer.trace(
    'supabase.auth.get_user',
    rootSpan.context,
    { 'db.system': 'postgresql', 'db.operation': 'auth.getUser' },
    () => userClient.auth.getUser(),
  )

  if (userError || !user) {
    rootSpan.setError(new Error(userError?.message || 'User not found'))
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  rootSpan.setAttribute('user.id', user.id)

  // Use service role to delete user data and account
  const adminClient = createClient(supabaseUrl, supabaseServiceKey)

  // Delete user's data from all tables
  const tables = ['reviews', 'collection_teas', 'collections', 'user_preferences', 'profiles']
  for (const table of tables) {
    await tracer.trace(
      `supabase.delete.${table}`,
      rootSpan.context,
      { 'db.system': 'postgresql', 'db.operation': 'delete', 'db.table': table },
      async () => {
        const { error } = await adminClient.from(table).delete().eq('user_id', user.id)
        if (error) rootSpan.addEvent('delete_warning', { 'db.table': table, 'error.message': error.message })
        return { error }
      },
    )
  }

  // Delete the auth user
  await tracer.trace(
    'supabase.auth.admin.delete_user',
    rootSpan.context,
    { 'db.system': 'postgresql', 'db.operation': 'auth.admin.deleteUser' },
    async () => {
      const { error } = await adminClient.auth.admin.deleteUser(user.id)
      if (error) throw new Error(`Failed to delete auth user: ${error.message}`)
      return { error }
    },
  )

  rootSpan.addEvent('account_deleted', { 'user.id': user.id })

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}))
