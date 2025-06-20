import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { initializePaystackPayment, handlePaymentCallback } from '../utils/paystack'
import { Check, Crown, Zap, BarChart3, Brain, Upload, Calendar, X, AlertTriangle } from 'lucide-react'

export function Subscription() {
  const { user } = useAuth()
  const { subscription, subscriptionPlan, subscriptionStatus, createPremiumSubscription, cancelSubscription, refreshSubscriptionData } = useSubscription()
  const [upgrading, setUpgrading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    // Check for payment callback on page load
    const callbackResult = handlePaymentCallback()
    if (callbackResult) {
      if (callbackResult.success) {
        setMessage({ type: 'success', text: callbackResult.message })
      } else {
        setMessage({ type: 'error', text: callbackResult.message })
      }
    }
  }, [])

  const handleUpgradeToPremium = async () => {
    if (!user?.email) {
      setMessage({ type: 'error', text: 'User email not found' })
      return
    }

    setUpgrading(true)
    setMessage(null)

    try {
      // Show loading message
      setMessage({ 
        type: 'success', 
        text: 'Opening payment window... Please complete your payment in the popup window.' 
      })

      const result = await initializePaystackPayment(
        user.email,
        3000, // ₦3,000 NGN (will be converted to kobo in the function)
        'NGN'
      )

      if (result.success) {
        // Payment was successful, refresh subscription data
        await refreshSubscriptionData()
        
        setMessage({ 
          type: 'success',
          text: result.message + ' Your premium features are now active!'
        })
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || 'Payment failed. Please try again.' 
        })
      }
    } catch (error) {
      console.error('Payment error:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.' 
      })
    } finally {
      setUpgrading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setCancelling(true)
    setMessage(null)

    try {
      const success = await cancelSubscription()
      
      if (success) {
        await refreshSubscriptionData() // Refresh after successful cancellation
        setMessage({ 
          type: 'success', 
          text: 'Subscription cancelled successfully. You will retain premium access until ' + 
                (subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : 'your current billing period ends') + 
                '. After this date, your account will be automatically downgraded to the Free plan.'
        })
        setShowCancelConfirm(false)
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Failed to cancel subscription. Please try again or contact support.' 
        })
      }
    } catch (error) {
      console.error('Cancellation error:', error)
      setMessage({ 
        type: 'error', 
        text: 'An unexpected error occurred. Please try again.' 
      })
    } finally {
      setCancelling(false)
    }
  }
  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for getting started',
      features: [
        'Upload up to 2 analyses',
        'Basic AI insights',
        '3 chart types',
        'Email support',
        'No data export'
      ],
      limitations: [
        'Limited file size (20MB)',
        'Basic analysis only',
        'No advanced insights',
        'No SQL generation'
      ],
      current: subscriptionPlan === 'free',
      popular: false
    },
    {
      name: 'Premium',
      price: '₦3,000',
      description: 'Unlock the full power of AI analysis',
      features: [
        'Unlimited file uploads',
        'Advanced AI insights & recommendations',
        'All chart types & visualizations',
        'Priority support',
        'Data export (CSV, Excel, PDF)',
        'Advanced relationship analysis',
        'Custom dashboard creation',
        'API access'
      ],
      limitations: [],
      current: subscriptionPlan === 'premium',
      popular: true
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Cancel Premium Subscription</h3>
                  <p className="text-gray-600 text-sm">This action will cancel your subscription</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to cancel your Premium subscription? You will retain access to premium features until{' '}
                <span className="font-medium">
                  {subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : 'the end of your billing period'}
                </span>, after which your account will be downgraded to the Free plan.
              </p>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1"
                  disabled={cancelling}
                >
                  Keep Subscription
                </Button>
                <Button
                  onClick={handleCancelSubscription}
                  loading={cancelling}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Subscription
                </Button>
              </div>
            </Card>
          </div>
        )}

        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
          <p className="text-gray-600">
            Unlock powerful AI-driven data analysis and visualization
          </p>
        </div>

        {/* Current Plan Status */}
        <Card className="text-center bg-gradient-to-r from-primary-50 to-secondary-50">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Crown className={`h-5 w-5 ${subscriptionPlan === 'premium' ? 'text-yellow-500' : 'text-gray-400'}`} />
            <h3 className="text-lg font-semibold text-gray-900">
              Current Plan: {subscriptionPlan === 'premium' ? 'Premium' : 'Free'}
            </h3>
          </div>
          
          {subscriptionPlan === 'premium' && subscription ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    {subscriptionStatus === 'cancelled' ? 'Expires' : 'Renews'} on{' '}
                    {subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                {subscription.days_remaining !== null && (
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    subscription.days_remaining > 7 
                      ? 'bg-green-100 text-green-700' 
                      : subscription.days_remaining > 3
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {subscription.days_remaining} days remaining
                  </div>
                )}
              </div>
              
              {subscriptionStatus === 'cancelled' ? (
                <p className="text-orange-600 text-sm">
                  Your subscription has been cancelled but you still have premium access until{' '}
                  {subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : 'the end of your billing period'}.
                  After this date, your account will be automatically downgraded to the Free plan.
                </p>
              ) : (
                <div className="flex items-center justify-center space-x-4">
                  <p className="text-gray-600">You have access to all premium features</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600">
              Upgrade to unlock advanced AI insights and unlimited uploads
            </p>
          )}
          
          {message && (
            <div className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <span className="text-sm">{message.text}</span>
            </div>
          )}
        </Card>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`relative ${
                plan.popular ? 'ring-2 ring-primary-500 scale-105' : ''
              } ${plan.current ? 'bg-gray-50' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.price !== '$0' && !plan.price.includes('₦') && <span className="text-gray-600">/month</span>}
                  {plan.price.includes('₦') && <span className="text-gray-600">/month</span>}
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-green-600" />
                    Features Included
                  </h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.limitations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2 text-gray-400" />
                      Limitations
                    </h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className="h-4 w-4 border border-gray-300 rounded-full mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 text-sm">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-auto">
                {plan.current ? (
                  <Button disabled className="w-full">
                    Current Plan
                  </Button>
                ) : plan.name === 'Premium' ? (
                  <Button 
                    onClick={handleUpgradeToPremium}
                    loading={upgrading}
                    className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700"
                    disabled={upgrading || (subscriptionPlan === 'premium' && subscriptionStatus === 'active')}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    {upgrading 
                      ? 'Processing...' 
                      : subscriptionPlan === 'premium' && subscriptionStatus === 'active'
                      ? 'Already Premium'
                      : 'Upgrade to Premium'
                    }
                  </Button>
                ) : (
                  <Button variant="outline" disabled className="w-full">
                    Current Plan
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Detailed Feature Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Feature</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Free</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 px-4 flex items-center">
                    <Upload className="h-4 w-4 mr-2 text-gray-600" />
                    Analyses allowed
                  </td>
                  <td className="text-center py-3 px-4">2 analyses</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 flex items-center">
                    <Brain className="h-4 w-4 mr-2 text-gray-600" />
                    AI insights
                  </td>
                  <td className="text-center py-3 px-4">Basic</td>
                  <td className="text-center py-3 px-4">Advanced</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-gray-600" />
                    Chart types
                  </td>
                  <td className="text-center py-3 px-4">3 types</td>
                  <td className="text-center py-3 px-4">All types</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">File size limit</td>
                  <td className="text-center py-3 px-4">20MB</td>
                  <td className="text-center py-3 px-4">100MB</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">SQL Generation</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Data Export</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Payment Security Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Secure Payment Processing</h3>
              <p className="text-blue-800 text-sm">
                All payments are processed securely through Paystack with bank-level encryption. 
                We never store your payment information. Your subscription will be activated immediately after successful payment.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}