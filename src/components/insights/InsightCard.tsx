import React from 'react'
import { TrendingUp, AlertTriangle, Lightbulb, Target, Sparkles } from 'lucide-react'
import { Card } from '../ui/Card'
import { AIInsight } from '../../utils/dataAnalysis'

interface InsightCardProps {
  insight: AIInsight
}

export function InsightCard({ insight }: InsightCardProps) {
  const icons = {
    trend: TrendingUp,
    outlier: AlertTriangle,
    pattern: Target,
    recommendation: Lightbulb
  }

  const colors = {
    trend: {
      icon: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-50 to-cyan-50',
      border: 'border-blue-200/50',
      text: 'text-blue-900'
    },
    outlier: {
      icon: 'from-orange-500 to-red-500',
      bg: 'from-orange-50 to-red-50',
      border: 'border-orange-200/50',
      text: 'text-orange-900'
    },
    pattern: {
      icon: 'from-purple-500 to-pink-500',
      bg: 'from-purple-50 to-pink-50',
      border: 'border-purple-200/50',
      text: 'text-purple-900'
    },
    recommendation: {
      icon: 'from-green-500 to-emerald-500',
      bg: 'from-green-50 to-emerald-50',
      border: 'border-green-200/50',
      text: 'text-green-900'
    }
  }

  const Icon = icons[insight.type]
  const colorScheme = colors[insight.type]

  return (
    <Card className="insight-card group relative overflow-hidden">
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorScheme.bg} opacity-50 transition-opacity duration-300 group-hover:opacity-70`} />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-4 right-4 w-2 h-2 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full animate-float opacity-60" />
        <div className="absolute bottom-6 left-6 w-1 h-1 bg-gradient-to-r from-accent-400 to-primary-400 rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 flex items-start space-x-4">
        <div className={`relative p-3 rounded-2xl bg-gradient-to-br ${colorScheme.icon} shadow-glow group-hover:shadow-glow-lg transition-all duration-300`}>
          <Icon className="h-6 w-6 text-white" />
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
            <Sparkles className="h-2 w-2 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${colorScheme.text} text-lg`}>
              {insight.title}
            </h3>
            <div className="flex items-center space-x-2">
              <div className="relative h-3 w-20 bg-neutral-200 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${insight.confidence * 100}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
              <span className="text-xs font-medium text-neutral-600 bg-white/80 px-2 py-1 rounded-full">
                {Math.round(insight.confidence * 100)}%
              </span>
            </div>
          </div>
          
          <p className="text-neutral-700 text-sm leading-relaxed mb-4">
            {insight.description}
          </p>
          
          {insight.affectedColumns.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {insight.affectedColumns.map(column => (
                <span 
                  key={column}
                  className="px-3 py-1 bg-white/80 backdrop-blur-xl text-neutral-700 text-xs font-medium rounded-full border border-white/30 hover:bg-white/90 transition-colors duration-200"
                >
                  {column}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
    </Card>
  )
}