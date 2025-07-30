import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { webhook_url, payload, headers = {}, webhook_id, is_albato = false } = await req.json()

    if (!webhook_url || !payload) {
      return new Response(
        JSON.stringify({ error: 'Missing webhook_url or payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client for logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Prepare headers for the webhook request
    const webhookHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Fortex-Webhook/1.0',
      'X-Webhook-Event': payload.event || 'unknown',
      'X-Webhook-Timestamp': payload.timestamp || new Date().toISOString(),
      'X-Webhook-Source': 'fortex-claims-portal',
      ...headers
    }

    // Add specific headers for Albato
    if (is_albato || webhook_url.includes('albato.com') || webhook_url.includes('h.albato.com')) {
      webhookHeaders['X-Requested-With'] = 'XMLHttpRequest'
      webhookHeaders['Cache-Control'] = 'no-cache'
      webhookHeaders['Accept-Encoding'] = 'gzip, deflate'
      webhookHeaders['Origin'] = 'https://fortex.com'
    }

    console.log(`🚀 Sending webhook to: ${webhook_url}`)
    console.log(`📦 Payload:`, JSON.stringify(payload, null, 2))
    console.log(`📋 Headers:`, JSON.stringify(webhookHeaders, null, 2))

    // Send the webhook with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 second timeout for Albato

    let response
    let responseText = ''
    let success = false
    let statusCode = 0

    try {
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
      } catch (textError) {
        responseText = `Response received but could not read body: ${response.status} ${response.statusText}`
      }

      console.log(`✅ Webhook response status: ${response.status}`)
      console.log(`📝 Webhook response body: ${responseText}`)

    } catch (error) {
      clearTimeout(timeoutId)
      console.error(`❌ Webhook error:`, error)
      
      if (error.name === 'AbortError') {
        responseText = 'Request timeout after 45 seconds'
        statusCode = 408
      } else {
        responseText = error.message
        statusCode = 0
      }
      success = false
    }

    // Log the webhook result to database
    if (webhook_id) {
      try {
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
          console.error('Error logging webhook result:', logError)
        } else {
          console.log('✅ Webhook result logged successfully')
        }
      } catch (logError) {
        console.error('Error logging webhook result:', logError)
      }
    }

    return new Response(
      JSON.stringify({
        success: success,
        status_code: statusCode,
        response_body: responseText,
        webhook_id,
        method: 'edge-function',
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Edge function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        status_code: 0,
        method: 'edge-function'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})