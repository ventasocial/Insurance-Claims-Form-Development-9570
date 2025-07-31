import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestBody {
  webhook_url: string;
  payload: any;
  headers?: Record<string, string>;
  webhook_id?: string;
  is_albato?: boolean;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request): Promise<Response> => {
  console.log(`📥 Received ${req.method} request to send-webhook`)

  // Handle CORS preflight request FIRST - before trying to read body
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request')
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    })
  }

  // Only handle POST requests from here
  if (req.method !== 'POST') {
    console.log(`❌ Method ${req.method} not allowed`)
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    console.log('🚀 Processing webhook request...')

    // Parse request body
    let requestBody: RequestBody
    try {
      const bodyText = await req.text()
      console.log('📄 Raw request body:', bodyText.substring(0, 500) + '...') // Limit log size

      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Empty request body')
      }

      requestBody = JSON.parse(bodyText) as RequestBody
      console.log('✅ Parsed request body successfully')
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError)
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { webhook_url, payload, headers = {}, webhook_id, is_albato = false } = requestBody

    if (!webhook_url || !payload) {
      console.error('❌ Missing required fields:', { webhook_url: !!webhook_url, payload: !!payload })
      return new Response(
        JSON.stringify({ error: 'Missing webhook_url or payload' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`📡 Webhook URL: ${webhook_url}`)
    console.log(`📦 Payload event: ${payload.event || 'unknown'}`)

    // Initialize Supabase client using REAL secrets
    const supabaseUrl = Deno.env.get('URL_REAL') || Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY_REAL') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    let supabase: any = null
    if (supabaseUrl && supabaseKey) {
      try {
        supabase = createClient(supabaseUrl, supabaseKey)
        console.log('✅ Supabase client initialized with real credentials')
      } catch (supabaseError) {
        console.error('⚠️ Error creating Supabase client:', supabaseError)
      }
    } else {
      console.warn('⚠️ Supabase credentials not found, logging will be skipped')
      console.warn('Available env vars:', Object.keys(Deno.env.toObject()).filter(key => 
        key.includes('SUPABASE') || key.includes('URL') || key.includes('KEY')
      ))
    }

    // Prepare webhook headers
    const webhookHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Fortex-Webhook/1.0',
      'X-Webhook-Event': payload.event || 'unknown',
      'X-Webhook-Timestamp': payload.timestamp || new Date().toISOString(),
      'X-Webhook-Source': 'fortex-claims-portal',
      ...headers
    }

    // Add Albato-specific headers if needed
    if (is_albato || webhook_url.includes('albato.com') || webhook_url.includes('h.albato.com')) {
      webhookHeaders['X-Requested-With'] = 'XMLHttpRequest'
      webhookHeaders['Cache-Control'] = 'no-cache'
      webhookHeaders['Accept-Encoding'] = 'gzip, deflate'
      webhookHeaders['Origin'] = 'https://fortex.com'
      console.log('🔗 Added Albato-specific headers')
    }

    console.log(`🚀 Sending webhook to: ${webhook_url}`)

    // Set up timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.log('⏰ Webhook request timeout')
      controller.abort()
    }, 30000) // 30 seconds timeout

    let response: Response
    let responseText = ''
    let success = false
    let statusCode = 0

    try {
      console.log('📤 Making HTTP request...')
      response = await fetch(webhook_url, {
        method: 'POST',
        headers: webhookHeaders,
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      statusCode = response.status
      success = response.ok

      try {
        responseText = await response.text()
        console.log(`📥 Response received: ${statusCode} - ${responseText.substring(0, 200)}`)
      } catch (textError) {
        responseText = `Response received but could not read body: ${response.status} ${response.statusText}`
        console.warn('⚠️ Could not read response body:', textError)
      }

      console.log(`✅ Webhook response status: ${response.status}`)
    } catch (error) {
      clearTimeout(timeoutId)
      console.error(`❌ Webhook error:`, error)

      if (error instanceof Error && error.name === 'AbortError') {
        responseText = 'Request timeout after 30 seconds'
        statusCode = 408
      } else {
        responseText = error instanceof Error ? error.message : 'Unknown error'
        statusCode = 0
      }
      success = false
    }

    // Log webhook result if Supabase is available
    if (webhook_id && supabase) {
      try {
        console.log('📝 Logging webhook result...')
        const logData = {
          webhook_id: webhook_id,
          event: payload.event || 'unknown',
          status_code: statusCode,
          success: success,
          response_body: responseText || 'No response body',
          payload: JSON.stringify(payload),
          sent_at: new Date().toISOString(),
          retry_count: payload.retry_count || 0
        }

        const { error: logError } = await supabase
          .from('webhook_logs_r2x4')
          .insert([logData])

        if (logError) {
          console.error('❌ Error logging webhook result:', logError)
        } else {
          console.log('✅ Webhook result logged successfully')
        }
      } catch (logError) {
        console.error('❌ Error logging webhook result:', logError)
      }
    }

    const result = {
      success: success,
      status_code: statusCode,
      response_body: responseText,
      webhook_id,
      method: 'edge-function',
      timestamp: new Date().toISOString()
    }

    console.log('✅ Webhook processing completed:', result)

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Edge function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status_code: 0,
        method: 'edge-function',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})