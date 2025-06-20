import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ChartRenderer } from '../components/charts/ChartRenderer'
import { InsightCard } from '../components/insights/InsightCard'
import { ExportModal } from '../components/export/ExportModal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { exportAnalysis, exportToCSV, exportInsightsToText } from '../utils/exportUtils'
import { DataChatModal } from '../components/chat/DataChatModal'
import { FileSpreadsheet, Calendar, BarChart3, Brain, Trash2, Eye, ArrowLeft, AlertTriangle, Database, Code, Copy, CheckCircle, Download, X } from 'lucide-react'

export function History() {
  const { user } = useAuth()
  const { limits, subscriptionPlan } = useSubscription()
  const navigate = useNavigate()
  const [analyses, setAnalyses] = useState<any[]>([])
  const [sqlQueries, setSqlQueries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null)
  const [selectedQuery, setSelectedQuery] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
  const [activeTab, setActiveTab] = useState<'analyses' | 'sql'>('analyses')
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; analysis: any | null }>({
    show: false,
    analysis: null
  })
  const [copied, setCopied] = useState('')
  const [exportModal, setExportModal] = useState<{ show: boolean; analysis: any | null }>({
    show: false,
    analysis: null
  })
  const [chatModal, setChatModal] = useState<{ show: boolean; analysis: any | null }>({
    show: false,
    analysis: null
  })
  const [exportError, setExportError] = useState('')

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return

    try {
      // Load analyses
      const { data: analysesData, error: analysesError } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (analysesError) throw analysesError
      setAnalyses(analysesData || [])

      // Load SQL queries
      const { data: queriesData, error: queriesError } = await supabase
        .from('sql_queries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (queriesError) throw queriesError
      setSqlQueries(queriesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const showDeleteConfirmation = (analysis: any) => {
    setDeleteConfirm({ show: true, analysis })
  }

  const hideDeleteConfirmation = () => {
    setDeleteConfirm({ show: false, analysis: null })
  }

  const confirmDeleteAnalysis = async () => {
    if (!deleteConfirm.analysis) return

    try {
      let error
      if (deleteConfirm.analysis.type === 'sql') {
        const result = await supabase
          .from('sql_queries')
          .delete()
          .eq('id', deleteConfirm.analysis.id)
        error = result.error
      } else {
        const result = await supabase
          .from('analyses')
          .delete()
          .eq('id', deleteConfirm.analysis.id)
        error = result.error
      }

      if (error) throw error
      
      if (deleteConfirm.analysis.type === 'sql') {
        setSqlQueries(prev => prev.filter(q => q.id !== deleteConfirm.analysis.id))
      } else {
        setAnalyses(prev => prev.filter(a => a.id !== deleteConfirm.analysis.id))
      }
      
      if (selectedAnalysis?.id === deleteConfirm.analysis.id) {
        setSelectedAnalysis(null)
      }
      if (selectedQuery?.id === deleteConfirm.analysis.id) {
        setSelectedQuery(null)
      }
      hideDeleteConfirmation()
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const viewAnalysisDetails = (analysis: any) => {
    setSelectedAnalysis(analysis)
    setSelectedQuery(null)
    setViewMode('detail')
  }

  const viewQueryDetails = (query: any) => {
    setSelectedQuery(query)
    setSelectedAnalysis(null)
    setViewMode('detail')
  }

  const backToList = () => {
    setViewMode('list')
    setSelectedAnalysis(null)
    setSelectedQuery(null)
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(''), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const showExportModal = (analysis: any) => {
    setExportModal({ show: true, analysis })
    setExportError('')
  }

  const hideExportModal = () => {
    setExportModal({ show: false, analysis: null })
    setExportError('')
  }

  const showChatModal = (analysis: any) => {
    setChatModal({ show: true, analysis })
  }

  const hideChatModal = () => {
    setChatModal({ show: false, analysis: null })
  }

  const handleExport = async (format: 'pdf' | 'ppt') => {
    if (!exportModal.analysis) return

    try {
      await exportAnalysis(exportModal.analysis, format)
      hideExportModal()
    } catch (error) {
      console.error('Export error:', error)
      setExportError((error as Error).message)
    }
  }

  const handleQuickExport = async (analysis: any, type: 'csv' | 'insights') => {
    try {
      if (type === 'csv') {
        exportToCSV(analysis.file_data, analysis.file_name)
      } else {
        exportInsightsToText(analysis.ai_insights, analysis.file_name)
      }
    } catch (error) {
      console.error('Quick export error:', error)
      setExportError((error as Error).message)
    }
  }

  if (viewMode === 'detail' && (selectedAnalysis || selectedQuery)) {
    const item = selectedAnalysis || selectedQuery
    const isQuery = !!selectedQuery

    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header with back button */}
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={backToList}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {isQuery ? item.title : item.file_name}
              </h1>
              <p className="text-gray-600">
                {isQuery ? 'Generated' : 'Analyzed'} on {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>
            {!isQuery && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => showChatModal(selectedAnalysis)}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-purple-100"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Learn More
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => showExportModal(selectedAnalysis)}
                  disabled={!limits.canExport}
                  className={!limits.canExport ? 'opacity-50' : ''}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {limits.canExport ? 'Export' : 'Export (Premium)'}
                </Button>
              </div>
            )}
          </div>

          {isQuery ? (
            /* SQL Query Details */
            <>
              {/* Query Summary */}
              <Card>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">
                      {item.table_schemas?.length || 0}
                    </p>
                    <p className="text-gray-600 text-sm">Tables</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">
                      {item.table_schemas?.reduce((sum: number, table: any) => sum + (table.columns?.length || 0), 0) || 0}
                    </p>
                    <p className="text-gray-600 text-sm">Columns</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">
                      {item.execution_result?.rows?.length || 0}
                    </p>
                    <p className="text-gray-600 text-sm">Sample Rows</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">SQL</p>
                    <p className="text-gray-600 text-sm">Query Type</p>
                  </div>
                </div>
              </Card>

              {/* Original Prompt */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Original Prompt</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{item.prompt}</p>
                </div>
              </Card>

              {/* Generated SQL */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Code className="h-5 w-5 mr-2 text-green-600" />
                    Generated SQL Query
                  </h3>
                  <Button
                    onClick={() => copyToClipboard(item.sql_query, 'sql')}
                    variant="outline"
                    size="sm"
                    className={copied === 'sql' ? 'text-green-600' : ''}
                  >
                    {copied === 'sql' ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied === 'sql' ? 'Copied!' : 'Copy SQL'}
                  </Button>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                    {item.sql_query}
                  </pre>
                </div>
              </Card>

              {/* Table Schemas */}
              {item.table_schemas && item.table_schemas.length > 0 && (
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Database className="h-5 w-5 mr-2 text-blue-600" />
                    Table Schemas Used
                  </h3>
                  <div className="space-y-4">
                    {item.table_schemas.map((table: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{table.name}</h4>
                          <span className="text-sm text-gray-500">{table.columns?.length || 0} columns</span>
                        </div>
                        {table.description && (
                          <p className="text-sm text-gray-600 mb-3">{table.description}</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {table.columns?.map((column: any, colIndex: number) => (
                            <div key={colIndex} className="p-2 bg-gray-50 rounded text-sm">
                              <span className="font-medium">{column.name}</span>
                              <span className="text-gray-500 ml-2">({column.type})</span>
                              {column.description && (
                                <p className="text-xs text-gray-600 mt-1">{column.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Execution Result */}
              {item.execution_result && item.execution_result.success && (
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Eye className="h-5 w-5 mr-2 text-purple-600" />
                    Sample Execution Result
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {item.execution_result.columns.map((column: string) => (
                            <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {item.execution_result.rows.map((row: any, rowIndex: number) => (
                          <tr key={rowIndex}>
                            {item.execution_result.columns.map((column: string) => (
                              <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row[column]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    Sample data generated for demonstration purposes
                  </p>
                </Card>
              )}
            </>
          ) : (
            /* Analysis Details */
            <>
              {/* Analysis Summary */}
              <Card>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">
                      {selectedAnalysis.file_data?.length || 0}
                    </p>
                    <p className="text-gray-600 text-sm">Rows</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">
                      {Object.keys(selectedAnalysis.file_data?.[0] || {}).length}
                    </p>
                    <p className="text-gray-600 text-sm">Columns</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">
                      {selectedAnalysis.charts_config?.length || 0}
                    </p>
                    <p className="text-gray-600 text-sm">Charts</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">
                      {selectedAnalysis.ai_insights?.length || 0}
                    </p>
                    <p className="text-gray-600 text-sm">Insights</p>
                  </div>
                </div>
              </Card>

              {/* Charts */}
              {selectedAnalysis.charts_config && selectedAnalysis.charts_config.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Visualizations</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {selectedAnalysis.charts_config.map((config: any, index: number) => (
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

              {/* AI Insights */}
              {selectedAnalysis.ai_insights && selectedAnalysis.ai_insights.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-primary-600" />
                    AI Insights
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {selectedAnalysis.ai_insights.map((insight: any, index: number) => (
                      <InsightCard key={index} insight={insight} />
                    ))}
                  </div>
                </div>
              )}

              {/* Data Preview */}
              {selectedAnalysis.file_data && selectedAnalysis.file_data.length > 0 && (
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Preview</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(selectedAnalysis.file_data[0]).map((column) => (
                            <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedAnalysis.file_data.slice(0, 10).map((row: any, index: number) => (
                          <tr key={index}>
                            {Object.values(row).map((value: any, cellIndex: number) => (
                              <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {selectedAnalysis.file_data.length > 10 && (
                    <p className="text-sm text-gray-500 text-center mt-4">
                      Showing first 10 rows of {selectedAnalysis.file_data.length} total rows
                    </p>
                  )}
                </Card>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Export Modal */}
        <ExportModal
          isOpen={exportModal.show}
          onClose={hideExportModal}
          analysis={exportModal.analysis}
          onExport={handleExport}
        />

        {/* Data Chat Modal */}
        <DataChatModal
          isOpen={chatModal.show}
          onClose={hideChatModal}
          analysis={chatModal.analysis}
        />

        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Analysis</h3>
                  <p className="text-gray-600 text-sm">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete {deleteConfirm.analysis?.type === 'sql' ? 'the SQL query' : 'the analysis for'}{' '}
                <span className="font-medium">
                  {deleteConfirm.analysis?.type === 'sql' ? deleteConfirm.analysis?.title : deleteConfirm.analysis?.file_name}
                </span>?
                This will permanently remove all associated data{deleteConfirm.analysis?.type === 'sql' ? ' and query details' : ', insights, and charts'}.
              </p>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={hideDeleteConfirmation}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteAnalysis}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </Card>
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">History</h1>
          <p className="text-gray-600">
            View and manage your previous data analyses and SQL queries
          </p>
        </div>

        {/* Tabs */}
        <Card padding="sm">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('analyses')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                ${activeTab === 'analyses'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              Data Analyses ({analyses.length})
            </button>
            <button
              onClick={() => setActiveTab('sql')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                ${activeTab === 'sql'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              SQL Queries ({sqlQueries.length})
            </button>
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading your history...</p>
          </div>
        ) : activeTab === 'analyses' ? (
          analyses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyses.map((analysis) => (
                <Card 
                  key={analysis.id} 
                  className="hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileSpreadsheet className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {analysis.file_name}
                      </h3>
                      <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(analysis.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {subscriptionPlan === 'premium' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          showDeleteConfirmation({ ...analysis, type: 'analysis' })
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">
                        {analysis.file_data?.length || 0}
                      </p>
                      <p className="text-gray-600 text-xs">Rows</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">
                        {Object.keys(analysis.file_data?.[0] || {}).length}
                      </p>
                      <p className="text-gray-600 text-xs">Columns</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <BarChart3 className="h-3 w-3" />
                      <span>{analysis.charts_config?.length || 0} charts</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Brain className="h-3 w-3" />
                      <span>{analysis.ai_insights?.length || 0} insights</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => viewAnalysisDetails(analysis)}
                    className="w-full"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Analysis
                  </Button>
                  
                  {limits.canExport && (
                    <div className="mt-2 flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => showExportModal(analysis)}
                        className="flex-1"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analyses Yet</h3>
              <p className="text-gray-600 mb-4">
                Start by uploading your first data file to create an analysis
              </p>
              <Button onClick={() => navigate('/upload')}>
                Upload Data
              </Button>
            </Card>
          )
        ) : (
          sqlQueries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sqlQueries.map((query) => (
                <Card 
                  key={query.id} 
                  className="hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Database className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {query.title}
                      </h3>
                      <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(query.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {subscriptionPlan === 'premium' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          showDeleteConfirmation({ ...query, type: 'sql' })
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">
                        {query.table_schemas?.length || 0}
                      </p>
                      <p className="text-gray-600 text-xs">Tables</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">
                        {query.execution_result?.rows?.length || 0}
                      </p>
                      <p className="text-gray-600 text-xs">Sample Rows</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {query.prompt}
                    </p>
                  </div>

                  <Button
                    onClick={() => viewQueryDetails(query)}
                    className="w-full"
                    size="sm"
                  >
                    <Code className="h-4 w-4 mr-2" />
                    View Query
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No SQL Queries Yet</h3>
              <p className="text-gray-600 mb-4">
                Start by generating your first SQL query using our AI-powered generator
              </p>
              <Button onClick={() => navigate('/sql-generator')}>
                Generate SQL Query
              </Button>
            </Card>
          )
        )}

        {/* Export Error */}
        {exportError && (
          <div className="fixed bottom-4 right-4 max-w-sm">
            <Card className="bg-red-50 border-red-200">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div className="flex-1">
                  <p className="text-red-800 text-sm font-medium">Export Failed</p>
                  <p className="text-red-700 text-xs">{exportError}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExportError('')}
                  className="text-red-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}