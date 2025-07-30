import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { webhook_url } = await req.json()

    if (!webhook_url) {
      return new Response(
        JSON.stringify({ error: 'Missing webhook_url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Enhanced test payload that mimics real data structure
    const testPayload = {
      event: 'connectivity_test',
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: 'Test de conectividad desde Fortex Edge Function',
        source: 'fortex-claims-portal-edge',
        submission_id: 'test-' + Date.now(),
        contact_info: {
          nombres: 'Test',
          apellido_paterno: 'Usuario',
          apellido_materno: 'Conectividad',
          email: 'test@fortex.com',
          telefono: '+528122334455',
          full_name: 'Test Usuario Conectividad'
        },
        claim_info: {
          insurance_company: 'test',
          claim_type: 'test',
          test_mode: true
        },
        metadata: {
          created_at: new Date().toISOString(),
          status: 'Test',
          source: 'fortex_claims_portal'
        }
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Fortex-Webhook-Test/1.0',
      'X-Test-Request': 'true',
      'X-Webhook-Source': 'fortex-claims-portal'
    }

    // Add Albato-specific headers if it's an Albato URL
    const isAlbato = webhook_url.includes('albato.com') || webhook_url.includes('h.albato.com')
    if (isAlbato) {
      headers['X-Requested-With'] = 'XMLHttpRequest'
      headers['Cache-Control'] = 'no-cache'
      headers['Accept-Encoding'] = 'gzip, deflate'
      headers['Origin'] = 'https://fortex.com'
    }

    console.log(`🔍 Testing connectivity to: ${webhook_url}`)
    console.log(`📦 Test payload:`, JSON.stringify(testPayload, null, 2))
    console.log(`📋 Headers:`, JSON.stringify(headers, null, 2))
    console.log(`🎯 Is Albato URL: ${isAlbato}`)

    // Send test request with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    let response
    let responseText = ''
    let success = false
    let statusCode = 0

    try {
      response = await fetch(webhook_url, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
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

      console.log(`✅ Test response status: ${response.status}`)
      console.log(`📝 Test response: ${responseText}`)

    } catch (error) {
      clearTimeout(timeoutId)
      console.error(`❌ Test error:`, error)
      
      if (error.name === 'AbortError') {
        responseText = 'Request timeout after 30 seconds'
        statusCode = 408
      } else {
        responseText = error.message
        statusCode = 0
      }
      success = false
    }

    return new Response(
      JSON.stringify({
        success: success,
        status_code: statusCode,
        response_body: responseText || 'OK',
        method: 'edge-function-test',
        is_albato: isAlbato,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Connectivity test error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        status_code: 0,
        method: 'edge-function-test'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})