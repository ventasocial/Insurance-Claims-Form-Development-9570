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
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Test payload
    const testPayload = {
      event: 'connectivity_test',
      timestamp: new Date().toISOString(),
      test: true,
      data: {
        message: 'Test de conectividad desde Fortex Edge Function',
        source: 'fortex-claims-portal-edge'
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Fortex-Webhook-Test/1.0',
      'X-Test-Request': 'true'
    }

    // Add Albato-specific headers if it's an Albato URL
    if (webhook_url.includes('albato.com') || webhook_url.includes('h.albato.com')) {
      headers['X-Requested-With'] = 'XMLHttpRequest'
      headers['Cache-Control'] = 'no-cache'
    }

    console.log(`Testing connectivity to: ${webhook_url}`)

    const response = await fetch(webhook_url, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
    })

    const responseText = await response.text()
    
    console.log(`Test response status: ${response.status}`)
    console.log(`Test response: ${responseText}`)

    return new Response(
      JSON.stringify({
        success: response.ok,
        status_code: response.status,
        response_body: responseText || 'OK',
        method: 'edge-function-test'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Connectivity test error:', error)
    
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