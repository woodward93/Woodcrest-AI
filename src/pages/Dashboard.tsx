import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Upload, TrendingUp, Users, Sparkles, Zap, Brain, Target, Database, Cpu } from 'lucide-react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ChartRenderer } from '../components/charts/ChartRenderer'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    chartsGenerated: 0,
    sqlQueriesGenerated: 0,
    lastAnalysis: null as string | null
  })
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Properly URL-encoded SVG data URL
  const dotPatternUrl = "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"

  useEffect(() => {
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    try {
      // Load analyses
      const { data: analyses, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      // Load SQL queries count
      const { data: sqlQueries, error: sqlError } = await supabase
        .from('sql_queries')
        .select('id')
        .eq('user_id', user.id)

      if (sqlError) throw sqlError
      setRecentAnalyses(analyses || [])
      setStats({
        totalAnalyses: analyses?.length || 0,
        chartsGenerated: analyses?.reduce((sum, analysis) => sum + (analysis.charts_config?.length || 0), 0) || 0,
        sqlQueriesGenerated: sqlQueries?.length || 0,
        lastAnalysis: analyses?.[0]?.created_at || null
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const sampleChartConfig = {
    type: 'bar',
    title: 'Sample Data Distribution',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      datasets: [{
        label: 'Sample Dataset',
        data: [12, 19, 3, 5, 2],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8
      }]
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <Card variant="gradient" className="relative p-8 lg:p-12">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/90 via-secondary-600/90 to-accent-600/90 rounded-2xl" />
            <div className={`absolute inset-0 bg-[url('${dotPatternUrl}')] opacity-20`} />
            
            <div className="relative z-10 text-white">
              <div className="flex items-center space-x-4 mb-6">
                <div className="h-16 w-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center relative">
                  <span className="text-white font-bold text-3xl">W</span>
                  <div className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                    <Cpu className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                    Welcome to Woodcrest AI
                  </h1>
                  <p className="text-xl opacity-90">
                    Transform your raw data into actionable insights with AI-powered analysis
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="text-center p-4 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20">
                  <div className="text-3xl font-bold">{stats.totalAnalyses}</div>
                  <div className="text-sm opacity-80">Analyses Completed</div>
                </div>
                <div className="text-center p-4 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20">
                  <div className="text-3xl font-bold">{stats.chartsGenerated}</div>
                  <div className="text-sm opacity-80">Charts Generated</div>
                </div>
                <div className="text-center p-4 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20">
                  <div className="text-3xl font-bold">{stats.sqlQueriesGenerated}</div>
                  <div className="text-sm opacity-80">SQL Queries Generated</div>
                </div>
              </div>
            </div>
          </Card>
        </div>


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Start */}
          <Card className="group hover-lift">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900">Quick Start</h2>
            </div>
            
            <div className="space-y-6">
              <p className="text-neutral-600 leading-relaxed">
                Ready to unlock the power of your data? Upload a CSV or Excel file and let our advanced AI analyze it for you.
              </p>
              
              <div className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl border border-primary-200/50">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="h-6 w-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-neutral-800">AI-Powered Features</span>
                </div>
                <ul className="text-sm text-neutral-600 space-y-1">
                  <li>• Automatic pattern recognition</li>
                  <li>• Smart visualization recommendations</li>
                  <li>• Predictive insights generation</li>
                </ul>
              </div>
              
              <Button 
                variant="gradient"
                size="lg"
                className="w-full group"
                onClick={() => navigate('/upload')}
                glow
              >
                <Upload className="h-5 w-5 mr-3 group-hover:animate-bounce" />
                Upload Your Data
                <Sparkles className="h-4 w-4 ml-2 opacity-70" />
              </Button>
            </div>
          </Card>

          {/* Recent Analyses */}
          <Card className="group hover-lift">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-neutral-900">Recent Analyses</h2>
              </div>
              {recentAnalyses.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => navigate('/history')}>
                  View All
                </Button>
              )}
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-neutral-600">Loading analyses...</p>
                </div>
              ) : recentAnalyses.length > 0 ? (
                recentAnalyses.map((analysis, index) => (
                  <div 
                    key={analysis.id} 
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-50 to-white rounded-xl border border-neutral-200/50 hover:shadow-md transition-all duration-300 group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 group-hover:text-primary-700 transition-colors">
                          {analysis.file_name}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/history')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      View
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="h-16 w-16 mx-auto bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-2xl flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-neutral-500" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No analyses yet</h3>
                  <p className="text-neutral-600 mb-4">Upload your first file to get started!</p>
                  <Button variant="outline" onClick={() => navigate('/upload')}>
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sample Chart */}
        {stats.totalAnalyses === 0 && (
          <div className="animate-slide-up">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900">Sample Visualization</h2>
              <div className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-medium rounded-full">
                Demo
              </div>
            </div>
            <div className="chart-container">
              <ChartRenderer config={sampleChartConfig} />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}