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
    const { webhook_url, payload, headers = {}, webhook_id, is_albato = false } = await req.json()

    if (!webhook_url || !payload) {
      return new Response(
        JSON.stringify({ error: 'Missing webhook_url or payload' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

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
    if (is_albato) {
      webhookHeaders['X-Requested-With'] = 'XMLHttpRequest'
      webhookHeaders['Cache-Control'] = 'no-cache'
    }

    console.log(`Sending webhook to: ${webhook_url}`)
    console.log(`Payload size: ${JSON.stringify(payload).length} bytes`)

    // Send the webhook
    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: webhookHeaders,
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    
    console.log(`Webhook response status: ${response.status}`)
    console.log(`Webhook response: ${responseText}`)

    return new Response(
      JSON.stringify({
        success: response.ok,
        status_code: response.status,
        response_body: responseText,
        webhook_id,
        method: 'edge-function'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    
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