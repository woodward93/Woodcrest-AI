import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { InsightCard } from '../components/insights/InsightCard'
import { Card } from '../components/ui/Card'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Brain, TrendingUp } from 'lucide-react'

export function Insights() {
  const { user } = useAuth()
  const [insights, setInsights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInsights()
  }, [user])

  const loadInsights = async () => {
    if (!user) return

    try {
      const { data: analyses, error } = await supabase
        .from('analyses')
        .select('ai_insights, file_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Flatten all insights from all analyses
      const allInsights = analyses?.flatMap(analysis => 
        (analysis.ai_insights || []).map((insight: any) => ({
          ...insight,
          fileName: analysis.file_name,
          createdAt: analysis.created_at
        }))
      ) || []

      setInsights(allInsights)
    } catch (error) {
      console.error('Error loading insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const insightTypes = ['all', 'trend', 'pattern', 'outlier', 'recommendation']
  const [selectedType, setSelectedType] = useState('all')

  const filteredInsights = selectedType === 'all' 
    ? insights 
    : insights.filter(insight => insight.type === selectedType)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Insights</h1>
          <p className="text-gray-600">
            Discover patterns, trends, and recommendations from your data analyses
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="text-center">
            <div className="h-12 w-12 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-3">
              <Brain className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{insights.length}</h3>
            <p className="text-gray-600">Total Insights Generated</p>
          </Card>

          <Card className="text-center">
            <div className="h-12 w-12 mx-auto bg-secondary-100 rounded-full flex items-center justify-center mb-3">
              <TrendingUp className="h-6 w-6 text-secondary-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {insights.filter(i => i.type === 'trend').length}
            </h3>
            <p className="text-gray-600">Trends Identified</p>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Card padding="sm">
          <div className="flex flex-wrap gap-2">
            {insightTypes.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors duration-200
                  ${selectedType === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {type} ({type === 'all' ? insights.length : insights.filter(i => i.type === type).length})
              </button>
            ))}
          </div>
        </Card>

        {/* Insights Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading insights...</p>
          </div>
        ) : filteredInsights.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredInsights.map((insight, index) => (
              <div key={index} className="space-y-2">
                <InsightCard insight={insight} />
                <div className="text-xs text-gray-500 px-2">
                  From: {insight.fileName} • {new Date(insight.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Yet</h3>
            <p className="text-gray-600">
              Upload and analyze your data to start generating AI-powered insights
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}