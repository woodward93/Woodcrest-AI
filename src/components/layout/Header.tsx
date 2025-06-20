import React from 'react'
import { Menu, Bell, User, Sparkles, Brain } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useSubscription } from '../../hooks/useSubscription'
import { Button } from '../ui/Button'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth()
  const { subscription, subscriptionPlan } = useSubscription()

  return (
    <header className="nav-modern h-20 flex items-center justify-between px-6 lg:px-8 relative z-10">
      <div className="flex items-center space-x-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="hidden lg:block">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center relative">
              <span className="text-white font-bold text-lg">W</span>
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Brain className="h-2 w-2 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold gradient-text">
                Welcome back, {user?.user_metadata?.full_name || 'User'}
              </h2>
              <p className="text-sm text-neutral-600">
                {subscriptionPlan === 'premium' && subscription?.status === 'cancelled' 
                  ? `Premium access until ${subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : 'expiry'}`
                  : 'Ready to analyze your data?'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="glass" size="sm" className="relative group">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            2
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Button>
        
        <div className="flex items-center space-x-3 p-2 rounded-xl bg-white/20 backdrop-blur-xl border border-white/30">
          <div className="relative">
            <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-glow">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-neutral-800">
              {user?.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-xs text-neutral-600 truncate max-w-32">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}