import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface WebhookRequest {
  webhook_url: string;
  payload: any;
  headers?: Record<string, string>;
  webhook_id?: string;
  test_mode?: boolean;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request): Promise<Response> => {
  console.log(`📥 Received ${req.method} request to webhook-handler`)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request')
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    console.log(`❌ Method ${req.method} not allowed`)
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    console.log('🚀 Processing webhook request...')

    // Parse request body
    let requestBody: WebhookRequest
    try {
      const bodyText = await req.text()
      console.log('📄 Request body received:', bodyText.substring(0, 200) + '...')
      
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Empty request body')
      }
      
      requestBody = JSON.parse(bodyText) as WebhookRequest
      console.log('✅ Request body parsed successfully')
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { webhook_url, payload, headers = {}, webhook_id, test_mode = false } = requestBody

    if (!webhook_url || !payload) {
      console.error('❌ Missing required fields:', { webhook_url: !!webhook_url, payload: !!payload })
      return new Response(
        JSON.stringify({ error: 'Missing webhook_url or payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📡 Webhook URL: ${webhook_url}`)
    console.log(`📦 Payload event: ${payload.event || 'unknown'}`)
    console.log(`🧪 Test mode: ${test_mode}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    let supabase: any = null

    if (supabaseUrl && supabaseKey) {
      try {
        supabase = createClient(supabaseUrl, supabaseKey)
        console.log('✅ Supabase client initialized')
      } catch (supabaseError) {
        console.error('⚠️ Error creating Supabase client:', supabaseError)
      }
    } else {
      console.warn('⚠️ Supabase credentials not found, logging will be skipped')
    }

    // Prepare webhook headers
    const webhookHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Fortex-Webhook/1.0',
      ...headers
    }

    // Add specific headers for test mode or Albato
    const isAlbato = webhook_url.includes('albato.com') || webhook_url.includes('h.albato.com')
    
    if (test_mode) {
      webhookHeaders['X-Test-Request'] = 'true'
      webhookHeaders['X-Webhook-Source'] = 'fortex-claims-portal-test'
    } else {
      webhookHeaders['X-Webhook-Event'] = payload.event || 'unknown'
      webhookHeaders['X-Webhook-Timestamp'] = payload.timestamp || new Date().toISOString()
      webhookHeaders['X-Webhook-Source'] = 'fortex-claims-portal'
    }

    if (isAlbato) {
      webhookHeaders['X-Requested-With'] = 'XMLHttpRequest'
      webhookHeaders['Cache-Control'] = 'no-cache'
      console.log('🔗 Added Albato-specific headers')
    }

    console.log(`🚀 Sending ${test_mode ? 'test ' : ''}webhook to: ${webhook_url}`)

    // Set up timeout (shorter for test mode)
    const timeoutMs = test_mode ? 15000 : 30000
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.log(`⏰ Webhook request timeout (${timeoutMs}ms)`)
      controller.abort()
    }, timeoutMs)

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
        responseText = `Request timeout after ${timeoutMs / 1000} seconds`
        statusCode = 408
      } else {
        responseText = error instanceof Error ? error.message : 'Unknown error'
        statusCode = 0
      }
      success = false
    }

    // Log webhook result if not in test mode and Supabase is available
    if (!test_mode && webhook_id && supabase) {
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
      test_mode: test_mode,
      is_albato: isAlbato,
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