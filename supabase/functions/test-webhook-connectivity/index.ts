import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface RequestBody {
  webhook_url: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request): Promise<Response> => {
  console.log(`📥 Received ${req.method} request to test-webhook-connectivity`)

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
    console.log('🔍 Processing connectivity test...')

    // Parse request body
    let requestBody: RequestBody
    try {
      const bodyText = await req.text()
      console.log('📄 Raw request body:', bodyText)

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

    const { webhook_url } = requestBody

    if (!webhook_url) {
      console.error('❌ Missing webhook_url')
      return new Response(
        JSON.stringify({ error: 'Missing webhook_url' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`🔗 Testing connectivity to: ${webhook_url}`)

    // Simple test payload
    const testPayload = {
      event: 'connectivity_test',
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: 'Test de conectividad desde Fortex',
        source: 'fortex-claims-portal'
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Fortex-Webhook-Test/1.0',
      'X-Test-Request': 'true',
      'X-Webhook-Source': 'fortex-claims-portal'
    }

    // Check if it's Albato
    const isAlbato = webhook_url.includes('albato.com') || webhook_url.includes('h.albato.com')
    if (isAlbato) {
      headers['X-Requested-With'] = 'XMLHttpRequest'
      headers['Cache-Control'] = 'no-cache'
      headers['Accept-Encoding'] = 'gzip, deflate'
      headers['Origin'] = 'https://fortex.com'
      console.log('🔗 Added Albato-specific headers')
    }

    console.log(`🎯 Is Albato URL: ${isAlbato}`)

    // Set up timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.log('⏰ Connectivity test timeout')
      controller.abort()
    }, 15000) // 15 seconds timeout for connectivity test

    let response: Response
    let responseText = ''
    let success = false
    let statusCode = 0

    try {
      console.log('📤 Making connectivity test request...')
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
        console.log(`📥 Test response received: ${statusCode} - ${responseText.substring(0, 200)}`)
      } catch (textError) {
        responseText = `Response received but could not read body: ${response.status} ${response.statusText}`
        console.warn('⚠️ Could not read response body:', textError)
      }

      console.log(`✅ Test response status: ${response.status}`)
    } catch (error) {
      clearTimeout(timeoutId)
      console.error(`❌ Test error:`, error)

      if (error instanceof Error && error.name === 'AbortError') {
        responseText = 'Request timeout after 15 seconds'
        statusCode = 408
      } else {
        responseText = error instanceof Error ? error.message : 'Unknown error'
        statusCode = 0
      }
      success = false
    }

    const result = {
      success: success,
      status_code: statusCode,
      response_body: responseText || 'OK',
      method: 'edge-function-test',
      is_albato: isAlbato,
      timestamp: new Date().toISOString()
    }

    console.log('✅ Connectivity test completed:', result)

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Connectivity test error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status_code: 0,
        method: 'edge-function-test',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})