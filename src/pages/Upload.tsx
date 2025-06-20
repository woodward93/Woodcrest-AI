import React, { useState } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { FileUpload } from '../components/upload/FileUpload'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ChartRenderer } from '../components/charts/ChartRenderer'
import { processFile, ProcessedData } from '../utils/fileProcessing'
import { analyzeDataWithOpenAI } from '../utils/openaiAnalysis'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { CheckCircle, AlertCircle, Brain, Crown, Lock, Sparkles, TrendingUp } from 'lucide-react'

export function Upload() {
  const { user } = useAuth()
  const { canCreateAnalysis, remainingAnalyses, limits, subscriptionPlan, refreshSubscriptionData, analysesCount } = useSubscription()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)

  useEffect(() => {
    // Listen for file upload errors
    const handleFileUploadError = (event: CustomEvent) => {
      setError(event.detail)
    }

    window.addEventListener('fileUploadError', handleFileUploadError as EventListener)
    return () => {
      window.removeEventListener('fileUploadError', handleFileUploadError as EventListener)
    }
  }, [])

  const handleFileUpload = async (file: File) => {
    // Check if user can create more analyses
    if (!canCreateAnalysis) {
      setError(`You've reached the limit of ${limits.maxAnalyses} analyses for your free plan. Please upgrade to Premium for unlimited analyses.`)
      return
    }

    setLoading(true)
    setError('')
    setProcessedData(null)
    setAnalysisResult(null)
    setAnalysisComplete(false)

    try {
      // Process the file
      const processed = await processFile(file)
      setProcessedData(processed)

      // Analyze the data
      const analysis = await analyzeDataWithOpenAI(processed.data, processed.fileName)
      setAnalysisResult(analysis)
      setAnalysisComplete(true)
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setAnalysisComplete(false), 5000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAnalysis = async () => {
    if (!user || !processedData || !analysisResult) return

    setSaving(true)
    try {
      const { error } = await supabase.from('analyses').insert({
        user_id: user.id,
        file_name: processedData.fileName,
        file_data: processedData.data,
        ai_insights: analysisResult.insights,
        charts_config: analysisResult.chartConfigs
      })

      if (error) throw error

      navigate('/history')
      refreshSubscriptionData() // Refresh the count after saving
    } catch (err) {
      setError('Failed to save analysis: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload & Analyze Data</h1>
          <p className="text-gray-600">
            Upload your CSV or Excel file to get AI-powered insights and visualizations
          </p>
          
          {/* Plan Status */}
          <div className="mt-4 flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              {subscriptionPlan === 'premium' ? (
                <Crown className="h-5 w-5 text-yellow-500" />
              ) : (
                <div className="h-5 w-5 bg-gray-400 rounded-full" />
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {subscriptionPlan === 'premium' ? 'Premium Plan' : 'Free Plan'}
                </p>
                <p className="text-sm text-gray-600">
                  {subscriptionPlan === 'premium' 
                    ? 'Unlimited analyses • Up to 100MB files'
                    : `${analysesCount} of ${limits.maxAnalyses} analyses used • Up to ${limits.maxFileSize}MB files`
                  }
                </p>
              </div>
            </div>
            {subscriptionPlan === 'free' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/subscription')}
                className="text-primary-600 border-primary-300 hover:bg-primary-50"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade
              </Button>
            )}
          </div>
        </div>

        {/* Upload Limit Warning */}
        {!canCreateAnalysis && (
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <div className="flex items-start space-x-3">
              <Lock className="h-6 w-6 text-orange-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-900 mb-2">Analysis Limit Reached</h3>
                <p className="text-orange-800 text-sm mb-4">
                  You've used all {limits.maxAnalyses} analyses available in your free plan. 
                  Upgrade to Premium to get unlimited analyses and advanced features.
                </p>
                <Button 
                  onClick={() => navigate('/subscription')}
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Premium
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Analysis Success Notification */}
        {analysisComplete && analysisResult && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 animate-slide-down">
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-glow animate-pulse">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-green-900">Analysis Complete!</h3>
                  <Sparkles className="h-4 w-4 text-green-600 animate-bounce" />
                </div>
                <p className="text-green-800 text-sm mb-3">
                  Your data has been successfully analyzed with AI-powered insights and visualizations.
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-2 bg-white/60 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-lg font-bold text-green-900">{analysisResult.chartConfigs?.length || 0}</span>
                    </div>
                    <p className="text-xs text-green-700">Charts Generated</p>
                  </div>
                  <div className="p-2 bg-white/60 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Brain className="h-4 w-4 text-green-600" />
                      <span className="text-lg font-bold text-green-900">{analysisResult.insights?.length || 0}</span>
                    </div>
                    <p className="text-xs text-green-700">AI Insights</p>
                  </div>
                  <div className="p-2 bg-white/60 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-lg font-bold text-green-900">100%</span>
                    </div>
                    <p className="text-xs text-green-700">Complete</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {canCreateAnalysis && (
          <FileUpload
            onFileUpload={handleFileUpload}
            loading={loading}
            error={error}
          />
        )}

        {processedData && (
          <Card>
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">AI Analysis Complete</h3>
            </div>
            
            {analysisResult?.summary && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Analysis Summary</h4>
                <p className="text-blue-800 text-sm">{analysisResult.summary}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{processedData.rowCount}</p>
                <p className="text-gray-600">Rows</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{processedData.columns.length}</p>
                <p className="text-gray-600">Columns</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{analysisResult?.insights.length || 0}</p>
                <p className="text-gray-600">AI Insights</p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Columns Detected:</h4>
              <div className="flex flex-wrap gap-2">
                {processedData.columns.map((column) => (
                  <span key={column} className="px-2 py-1 bg-primary-100 text-primary-700 text-sm rounded-full">
                    {column}
                  </span>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleSaveAnalysis} 
              loading={saving}
              className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {saving ? 'Saving Analysis...' : 'Save Analysis & View Results'}
            </Button>
          </Card>
        )}

        {analysisResult && analysisResult.chartConfigs.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI-Generated Visualizations</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analysisResult.chartConfigs.map((config: any, index: number) => (
                <div key={index} className="space-y-2">
                  <ChartRenderer config={config} />
                  {config.description && (
                    <p className="text-sm text-gray-600 px-2">{config.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {analysisResult && analysisResult.insights.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Brain className="h-5 w-5 mr-2 text-primary-600" />
              AI-Powered Insights
            </h3>
            <div className="space-y-3">
              {analysisResult.insights.map((insight: any, index: number) => (
                <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                      {Math.round(insight.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mb-2">{insight.description}</p>
                  {insight.affectedColumns && insight.affectedColumns.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {insight.affectedColumns.map((col: string) => (
                        <span key={col} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                          {col}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}