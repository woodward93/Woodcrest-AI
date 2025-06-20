import { supabase } from '../lib/supabase'

export interface PaymentResult {
  success: boolean
  reference?: string
  message: string
}

export async function initializePaystackPayment(
  email: string,
  amount: number = 3000,
  currency: string = 'NGN'
): Promise<PaymentResult> {
  try {
    console.log('Initializing payment for:', email, 'Amount:', amount)
    
    // Initialize payment via edge function
    const { data: initResult, error: initError } = await supabase.functions.invoke('initialize-payment', {
      body: { email, amount, currency }
    })

    if (initError) {
      throw new Error(initError.message || 'Failed to initialize payment')
    }

    if (!initResult.status || !initResult.data) {
      throw new Error(initResult.message || 'Payment initialization failed')
    }

    const { authorization_url, reference } = initResult.data

    console.log('Payment initialized with reference:', reference)
    
    // Open Paystack checkout in a popup window
    const paymentWindow = window.open(
      authorization_url,
      'paystack-checkout',
      'width=500,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
    )

    if (!paymentWindow) {
      throw new Error('Please allow popups to complete payment. Check your browser settings and try again.')
    }

    // Monitor the payment window and verify payment when closed
    return new Promise((resolve) => {
      let pollTimer: number
      let timeoutTimer: number
      let verificationTimer: number

      const cleanup = () => {
        if (pollTimer) clearInterval(pollTimer)
        if (timeoutTimer) clearTimeout(timeoutTimer)
        if (verificationTimer) clearInterval(verificationTimer)
      }

      // Function to verify payment status
      const verifyPayment = async () => {
        try {
          console.log('Verifying payment with reference:', reference)
          const verificationResult = await verifyPaystackPayment(reference)
          
          if (verificationResult.success) {
            cleanup()
            if (!paymentWindow.closed) {
              paymentWindow.close()
            }
            resolve(verificationResult)
            return true
          }
          return false
        } catch (error) {
          console.error('Payment verification error:', error)
          return false
        }
      }

      const checkWindowClosed = async () => {
        if (paymentWindow.closed) {
          cleanup()
          
          // Wait a moment for any final processing
          setTimeout(async () => {
            const verified = await verifyPayment()
            if (!verified) {
              resolve({
                success: false,
                message: 'Payment window was closed. Please contact support if payment was deducted.'
              })
            }
          }, 2000)
        }
      }

      // Poll every 1 second to check if window is closed
      pollTimer = setInterval(checkWindowClosed, 1000)
      
      // Also poll for payment verification every 3 seconds
      // This helps catch successful payments even if the window doesn't close properly
      verificationTimer = setInterval(async () => {
        const verified = await verifyPayment()
        if (verified) {
          // Payment verified successfully, stop polling
          return
        }
      }, 3000)

      // Set timeout for 15 minutes
      timeoutTimer = setTimeout(() => {
        cleanup()
        if (!paymentWindow.closed) {
          paymentWindow.close()
        }
        resolve({
          success: false,
          message: 'Payment session expired. Please try again.'
        })
      }, 15 * 60 * 1000) // 15 minutes

      // Handle case where popup is blocked or immediately closed
      setTimeout(() => {
        if (paymentWindow.closed) {
          checkWindowClosed()
        }
      }, 500)
    })

  } catch (error) {
    console.error('Payment initialization error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Payment initialization failed'
    }
  }
}

export async function verifyPaystackPayment(reference: string): Promise<PaymentResult> {
  try {
    console.log('Calling verify-payment edge function with reference:', reference)
    
    const { data: result, error } = await supabase.functions.invoke('verify-payment', {
      body: { reference }
    })

    if (error) {
      console.error('Edge function error:', error)
      throw new Error(error.message || 'Failed to verify payment')
    }

    console.log('Verification result:', result)
    
    if (result.status && result.data?.status === 'success') {
      return {
        success: true,
        reference: result.data.reference,
        message: 'Payment completed successfully! Your account is being upgraded to Premium.'
      }
    } else {
      return {
        success: false,
        message: result.message || 'Payment was not completed successfully.'
      }
    }
  } catch (error) {
    console.error('Payment verification error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to verify payment. Please contact support if payment was deducted.'
    }
  }
}

// Helper function to handle payment completion from callback URL
export function handlePaymentCallback(): PaymentResult | null {
  const urlParams = new URLSearchParams(window.location.search)
  const reference = urlParams.get('reference')
  const status = urlParams.get('status')

  if (reference && status) {
    // Clear the URL parameters
    window.history.replaceState({}, document.title, window.location.pathname)

    if (status === 'success') {
      return {
        success: true,
        reference,
        message: 'Payment completed successfully!'
      }
    } else {
      return {
        success: false,
        message: 'Payment was cancelled or failed.'
      }
    }
  }

  return null
}