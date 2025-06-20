import React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { 
  BarChart3, 
  History, 
  Settings, 
  CreditCard,
  LogOut,
  Brain as BrainIcon,
  Sparkles,
  Zap,
  Database,
  Upload
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useSubscription } from '../../hooks/useSubscription'
import { Button } from '../ui/Button'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { signOut } = useAuth()
  const { limits, subscriptionPlan } = useSubscription()
  const location = useLocation()
  const navigate = useNavigate()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, color: 'from-blue-500 to-cyan-500' },
    { name: 'Upload Data', href: '/upload', icon: Upload, color: 'from-emerald-500 to-teal-500' },
    { 
      name: 'SQL Generator', 
      href: '/sql-generator', 
      icon: Database, 
      color: 'from-indigo-500 to-purple-500',
      premium: subscriptionPlan === 'free'
    },
    { 
      name: 'Schema Manager', 
      href: '/schemas', 
      icon: Database, 
      color: 'from-purple-500 to-pink-500',
      premium: subscriptionPlan === 'free'
    },
    { name: 'History', href: '/history', icon: History, color: 'from-green-500 to-emerald-500' },
    { name: 'Settings', href: '/settings', icon: Settings, color: 'from-gray-500 to-slate-500' },
    { name: 'Subscription', href: '/subscription', icon: CreditCard, color: 'from-yellow-500 to-orange-500' },
  ]

  const handleSignOut = async () => {
    await signOut()
    onClose()
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-white/90 backdrop-blur-xl border-r border-white/20 shadow-glass transform transition-all duration-300 ease-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 px-6 border-b border-white/20">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-12 w-12 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center shadow-glow">
                  <span className="text-white font-bold text-2xl">W</span>
                </div>
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <BrainIcon className="h-3 w-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">
                  Woodcrest AI
                </h1>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-3">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`
                    nav-item group relative flex items-center space-x-4 px-4 py-3 text-sm font-medium transition-all duration-300
                    ${isActive 
                      ? 'bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-primary-700 shadow-inner-glow' 
                      : 'text-neutral-600 hover:bg-white/30 hover:text-neutral-900'
                    }
                  `}
                >
                  <div className={`
                    relative h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300
                    ${isActive 
                      ? `bg-gradient-to-r ${item.color} text-white shadow-glow` 
                      : 'bg-neutral-100 text-neutral-600 group-hover:bg-white group-hover:shadow-md'
                    }
                  `}>
                    <Icon className="h-5 w-5" />
                    {isActive && (
                      <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse" />
                    )}
                  </div>
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <div className="h-2 w-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full animate-pulse" />
                  )}
                  {item.premium && (
                    <div className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                      Premium
                    </div>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Upgrade prompt - only show for free users */}
          {subscriptionPlan === 'free' && (
            <div className="p-6 border-t border-white/20">
              <div className="p-4 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 rounded-2xl border border-primary-200/50">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-8 w-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-800">Upgrade to Pro</p>
                    <p className="text-xs text-neutral-600">Unlock advanced features</p>
                  </div>
                </div>
                <Button 
                  variant="gradient" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/subscription')}
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          )}

          {/* Sign out */}
          <div className="p-6 border-t border-white/20">
            <Button
              variant="ghost"
              className="w-full justify-start text-neutral-600 hover:text-red-600 hover:bg-red-50/50"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}