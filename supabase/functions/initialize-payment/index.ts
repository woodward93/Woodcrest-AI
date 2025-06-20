const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PaystackInitializeResponse {
  status: boolean
  message: string
  data?: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, amount, currency = 'USD' } = await req.json()

    if (!email || !amount) {
      return new Response(
        JSON.stringify({ 
          status: false, 
          message: 'Email and amount are required' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get Paystack secret key from environment
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY environment variable not found')
      return new Response(
        JSON.stringify({ 
          status: false, 
          message: 'Payment service not configured. Please set PAYSTACK_SECRET_KEY environment variable.' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Log the secret key format for debugging (remove in production)
    console.log('Paystack Secret Key format:', paystackSecretKey ? `${paystackSecretKey.substring(0, 8)}...` : 'Not found')

    // Generate unique payment reference
    const reference = `dvai_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

    // Get the origin from the request headers for callback URL
    const origin = req.headers.get('origin') || 'http://localhost:5173'

    // Prepare the request payload
    const requestPayload = {
      email,
      amount: Math.round(amount * 100), // Convert to kobo/cents and ensure integer
      currency: 'NGN', // Use Nigerian Naira as it's the default supported currency
      reference,
      callback_url: `${origin}/subscription?reference=${reference}&status=success`,
      cancel_url: `${origin}/subscription?reference=${reference}&status=cancelled`,
      metadata: {
        cancel_action: `${origin}/subscription?reference=${reference}&status=cancelled`,
        custom_fields: [
          {
            display_name: "Service",
            variable_name: "service",
            value: "DataViz AI Premium Subscription"
          },
          {
            display_name: "Plan",
            variable_name: "plan",
            value: "Premium Monthly"
          }
        ]
      }
    }

    console.log('Initializing payment with payload:', JSON.stringify(requestPayload, null, 2))

    // Initialize payment with Paystack
    const initializeResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload)
    })

    console.log('Paystack response status:', initializeResponse.status)
    console.log('Paystack response headers:', Object.fromEntries(initializeResponse.headers.entries()))

    if (!initializeResponse.ok) {
      const errorText = await initializeResponse.text()
      console.error('Paystack API error response:', errorText)
      throw new Error(`Paystack API error: ${initializeResponse.status} ${initializeResponse.statusText} - ${errorText}`)
    }

    const initializeData: PaystackInitializeResponse = await initializeResponse.json()
    console.log('Paystack response data:', JSON.stringify(initializeData, null, 2))

    if (initializeData.status && initializeData.data) {
      return new Response(
        JSON.stringify({
          status: true,
          message: 'Payment initialized successfully',
          data: {
            authorization_url: initializeData.data.authorization_url,
            access_code: initializeData.data.access_code,
            reference: initializeData.data.reference
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      return new Response(
        JSON.stringify({
          status: false,
          message: initializeData.message || 'Failed to initialize payment'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Payment initialization error:', error)
    
    return new Response(
      JSON.stringify({
        status: false,
        message: `Payment initialization failed: ${error.message || 'Unknown error'}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})