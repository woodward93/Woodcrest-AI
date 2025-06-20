import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

export interface SubscriptionLimits {
  maxAnalyses: number
  maxFileSize: number // in MB
  canGenerateSQL: boolean
  canExport: boolean
  chartTypes: string[]
}

export interface SubscriptionData {
  id: string
  plan: 'free' | 'premium'
  status: 'active' | 'cancelled' | 'expired'
  starts_at: string
  expires_at: string | null
  cancelled_at: string | null
  days_remaining: number | null
}

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [analysesCount, setAnalysesCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadSubscriptionData()
    }
  }, [user])

  const loadSubscriptionData = async () => {
    if (!user) return

    try {
      // Load user's current subscription directly from the table
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (subscriptionError) {
        console.error('Error loading subscription:', subscriptionError)
      }

      // Set subscription data and calculate days remaining
      const currentSubscription = subscriptionData?.[0] || null
      let daysRemaining = null
      
      if (currentSubscription?.expires_at) {
        const expiryDate = new Date(currentSubscription.expires_at)
        const today = new Date()
        const timeDiff = expiryDate.getTime() - today.getTime()
        daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24))
      }
      
      setSubscription(currentSubscription ? {
        id: currentSubscription.id,
        plan: currentSubscription.plan,
        status: currentSubscription.status,
        starts_at: currentSubscription.starts_at,
        expires_at: currentSubscription.expires_at,
        cancelled_at: currentSubscription.cancelled_at,
        days_remaining: daysRemaining
      } : null)

      // Load current analyses count
      const { data: analyses, error: analysesError } = await supabase
        .from('analyses')
        .select('id')
        .eq('user_id', user.id)

      if (analysesError) {
        console.error('Error loading analyses count:', analysesError)
        setAnalysesCount(0)
      } else {
        setAnalysesCount(analyses?.length || 0)
      }
    } catch (error) {
      console.error('Error loading subscription data:', error)
      setAnalysesCount(0)
    } finally {
      setLoading(false)
    }
  }

  const getSubscriptionLimits = (): SubscriptionLimits => {
    // Premium limits apply if user has premium plan and it's either active or cancelled but not expired
    if (subscription?.plan === 'premium' && 
        (subscription?.status === 'active' || 
         (subscription?.status === 'cancelled' && subscription?.expires_at && new Date(subscription.expires_at) > new Date()))) {
      return {
        maxAnalyses: -1, // unlimited
        maxFileSize: 100, // 100MB
        canGenerateSQL: true,
        canExport: true,
        chartTypes: ['bar', 'line', 'scatter', 'pie', 'doughnut', 'polarArea', 'radar']
      }
    }

    // Free plan limits
    return {
      maxAnalyses: 2,
      maxFileSize: 20, // 20MB
      canGenerateSQL: false,
      canExport: false,
      chartTypes: ['bar', 'line', 'pie'] // limited chart types
    }
  }

  const canCreateAnalysis = (): boolean => {
    const limits = getSubscriptionLimits()
    if (limits.maxAnalyses === -1) return true // unlimited
    return analysesCount < limits.maxAnalyses
  }

  const getRemainingAnalyses = (): number => {
    const limits = getSubscriptionLimits()
    if (limits.maxAnalyses === -1) return -1 // unlimited
    return Math.max(0, limits.maxAnalyses - analysesCount)
  }

  const createPremiumSubscription = async (paymentReference: string): Promise<boolean> => {
    if (!user) return false

    try {
      // Calculate expiry date (30 days from now)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      // Cancel any existing active subscriptions
      await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('status', 'active')

      // Create new premium subscription
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan: 'premium',
          status: 'active',
          starts_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          payment_reference: paymentReference
        })

      if (error) throw error

      // Reload subscription data
      await loadSubscriptionData()
      return true
    } catch (error) {
      console.error('Error creating premium subscription:', error)
      return false
    }
  }

  const cancelSubscription = async (): Promise<boolean> => {
    if (!user || !subscription) return false

    try {
      // Update subscription status to cancelled but keep it active until expiry
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id)
        .eq('user_id', user.id)

      if (error) throw error

      // Reload subscription data
      await loadSubscriptionData()
      return true
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      return false
    }
  }

  const refreshSubscriptionData = () => {
    return loadSubscriptionData()
  }

  return {
    subscription,
    subscriptionPlan: subscription?.plan || 'free',
    subscriptionStatus: subscription?.status || 'active',
    analysesCount,
    loading,
    limits: getSubscriptionLimits(),
    canCreateAnalysis: canCreateAnalysis(),
    remainingAnalyses: getRemainingAnalyses(),
    createPremiumSubscription,
    cancelSubscription,
    refreshSubscriptionData
  }
}