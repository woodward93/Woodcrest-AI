import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PaystackVerificationResponse {
  status: boolean
  message: string
  data?: {
    id: number
    domain: string
    status: string
    reference: string
    amount: number
    message: string | null
    gateway_response: string
    paid_at: string
    created_at: string
    channel: string
    currency: string
    ip_address: string
    metadata: any
    log: any
    fees: number
    fees_split: any
    authorization: any
    customer: {
      id: number
      first_name: string | null
      last_name: string | null
      email: string
      customer_code: string
      phone: string | null
      metadata: any
      risk_action: string
      international_format_phone: string | null
    }
    plan: any
    split: any
    order_id: any
    paidAt: string
    createdAt: string
    requested_amount: number
    pos_transaction_data: any
    source: any
    fees_breakdown: any
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reference } = await req.json()

    if (!reference) {
      return new Response(
        JSON.stringify({ 
          status: false, 
          message: 'Payment reference is required' 
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
          message: 'Payment verification service not configured' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Verifying payment with reference:', reference)

    // Verify payment with Paystack
    const verificationResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        }
      }
    )

    console.log('Paystack verification response status:', verificationResponse.status)

    if (!verificationResponse.ok) {
      const errorText = await verificationResponse.text()
      console.error('Paystack verification error response:', errorText)
      throw new Error(`Paystack API error: ${verificationResponse.status} ${verificationResponse.statusText}`)
    }

    const verificationData: PaystackVerificationResponse = await verificationResponse.json()
    console.log('Paystack verification data:', JSON.stringify(verificationData, null, 2))

    // Check if payment was successful
    if (verificationData.status && verificationData.data?.status === 'success') {
      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Get user by email from the payment data
      const customerEmail = verificationData.data.customer.email
      console.log('Looking for user with email:', customerEmail)
      
      // Find user in auth.users table using admin API
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        console.error('Error fetching users:', authError)
        throw new Error('Failed to find user: ' + authError.message)
      }

      const user = authUsers.users.find(u => u.email === customerEmail)
      
      if (!user) {
        console.error('User not found with email:', customerEmail)
        throw new Error('User not found with email: ' + customerEmail)
      }

      console.log('Found user:', user.id, user.email)

      // Check if user has a profile, create one if not
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.error('Error checking profile:', profileCheckError)
      }

      if (!existingProfile) {
        console.log('Creating profile for user:', user.id)
        const { error: profileCreateError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || ''
          })

        if (profileCreateError) {
          console.error('Error creating profile:', profileCreateError)
          // Continue anyway, as the subscription creation might still work
        }
      }

      // Calculate expiry date (30 days from now)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      console.log('Creating premium subscription for user:', user.id)

      // Cancel any existing active subscriptions first
      const { error: cancelError } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (cancelError) {
        console.error('Error cancelling existing subscriptions:', cancelError)
        // Continue anyway
      }

      // Create new premium subscription
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan: 'premium',
          status: 'active',
          starts_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          payment_reference: verificationData.data.reference
        })

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError)
        throw new Error('Failed to create subscription: ' + subscriptionError.message)
      }

      console.log('Premium subscription created successfully for user:', user.id)

      return new Response(
        JSON.stringify({
          status: true,
          message: 'Payment verified and subscription updated successfully',
          data: {
            reference: verificationData.data.reference,
            amount: verificationData.data.amount / 100, // Convert back from kobo/cents
            currency: verificationData.data.currency,
            status: verificationData.data.status,
            customer: {
              email: verificationData.data.customer.email
            },
            subscription: {
              plan: 'premium',
              expires_at: expiresAt.toISOString()
            }
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      console.log('Payment verification failed:', verificationData.message)
      return new Response(
        JSON.stringify({
          status: false,
          message: verificationData.message || 'Payment verification failed'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Payment verification error:', error)
    
    return new Response(
      JSON.stringify({
        status: false,
        message: error.message || 'Payment verification failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})