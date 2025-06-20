import React, { useState } from 'react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useSubscription } from '../hooks/useSubscription'
import { useSavedSchemas } from '../hooks/useSavedSchemas'
import { generateSQLQuery, executeSampleQuery } from '../utils/sqlGeneration'
import { SaveSchemaModal } from '../components/sql/SaveSchemaModal'
import { LoadSchemaModal } from '../components/sql/LoadSchemaModal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { 
  Database, 
  Plus, 
  Trash2, 
  Play, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Table,
  Sparkles,
  Code,
  Eye,
  RefreshCw,
  Crown,
  Lock,
  Save,
  FolderOpen
} from 'lucide-react'

interface Column {
  id: string
  name: string
  type: string
  description: string
}

interface TableSchema {
  id: string
  name: string
  description: string
  columns: Column[]
}

export function SQLGenerator() {
  const { user } = useAuth()
  const { limits, subscriptionPlan } = useSubscription()
  const { schemas, loading: schemasLoading, saveSchema, deleteSchema } = useSavedSchemas()
  const navigate = useNavigate()
  const [tables, setTables] = useState<TableSchema[]>([])
  const [prompt, setPrompt] = useState('')
  const [generatedSQL, setGeneratedSQL] = useState('')
  const [queryResult, setQueryResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveSchemaModal, setSaveSchemaModal] = useState(false)
  const [loadSchemaModal, setLoadSchemaModal] = useState(false)

  // Check if user can access SQL generation
  const canGenerateSQL = limits.canGenerateSQL

  // Add new table
  const addTable = () => {
    if (!canGenerateSQL) return
    
    const newTable: TableSchema = {
      id: Date.now().toString(),
      name: '',
      description: '',
      columns: []
    }
    setTables([...tables, newTable])
  }

  // Remove table
  const removeTable = (tableId: string) => {
    setTables(tables.filter(t => t.id !== tableId))
  }

  // Update table
  const updateTable = (tableId: string, field: keyof TableSchema, value: string) => {
    setTables(tables.map(t => 
      t.id === tableId ? { ...t, [field]: value } : t
    ))
  }

  // Add column to table
  const addColumn = (tableId: string) => {
    const newColumn: Column = {
      id: Date.now().toString(),
      name: '',
      type: 'VARCHAR(255)',
      description: ''
    }
    setTables(tables.map(t => 
      t.id === tableId 
        ? { ...t, columns: [...t.columns, newColumn] }
        : t
    ))
  }

  // Remove column
  const removeColumn = (tableId: string, columnId: string) => {
    setTables(tables.map(t => 
      t.id === tableId 
        ? { ...t, columns: t.columns.filter(c => c.id !== columnId) }
        : t
    ))
  }

  // Update column
  const updateColumn = (tableId: string, columnId: string, field: keyof Column, value: string) => {
    setTables(tables.map(t => 
      t.id === tableId 
        ? { 
            ...t, 
            columns: t.columns.map(c => 
              c.id === columnId ? { ...c, [field]: value } : c
            )
          }
        : t
    ))
  }

  // Generate SQL query
  const handleGenerateSQL = async () => {
    if (!canGenerateSQL) {
      setError('SQL generation is only available for Premium users. Please upgrade your plan.')
      return
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt describing the SQL query you want to generate')
      return
    }

    if (tables.length === 0) {
      setError('Please add at least one table schema')
      return
    }

    setLoading(true)
    setError('')
    setGeneratedSQL('')
    setQueryResult(null)

    try {
      const sql = await generateSQLQuery(tables, prompt)
      setGeneratedSQL(sql)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Execute sample query
  const handleExecuteQuery = async () => {
    if (!generatedSQL.trim()) {
      setError('No SQL query to execute')
      return
    }

    setExecuting(true)
    setError('')

    try {
      const result = await executeSampleQuery(generatedSQL, tables)
      setQueryResult(result)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setExecuting(false)
    }
  }

  // Copy SQL to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedSQL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Refine query with new prompt
  const refineQuery = async () => {
    if (!prompt.trim() || !generatedSQL.trim()) return

    setLoading(true)
    setError('')

    try {
      const refinedSQL = await generateSQLQuery(tables, `${prompt}\n\nCurrent query: ${generatedSQL}\n\nPlease refine this query based on the new requirements.`)
      setGeneratedSQL(refinedSQL)
      setQueryResult(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Save query to history
  const saveQuery = async () => {
    if (!generatedSQL.trim() || !prompt.trim()) {
      setError('No query to save')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { error } = await supabase.from('sql_queries').insert({
        user_id: user!.id,
        title: prompt.slice(0, 100) + (prompt.length > 100 ? '...' : ''),
        prompt,
        sql_query: generatedSQL,
        table_schemas: tables,
        execution_result: queryResult
      })

      if (error) throw error

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setError('Failed to save query: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSchema = async (name: string, description: string): Promise<boolean> => {
    if (tables.length === 0) return false
    
    try {
      const success = await saveSchema(name, description, tables)
      if (success) {
        // Show success message briefly
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
      return success
    } catch (error) {
      console.error('Error saving schema:', error)
      return false
    }
  }

  const handleLoadSchema = (schema: any) => {
    // Load the schema tables
    const loadedTables = schema.tables.map((table: any) => ({
      ...table,
      id: Date.now().toString() + Math.random().toString(36).substring(2)
    }))
    
    setTables(loadedTables)
    setError('')
    setGeneratedSQL('')
    setQueryResult(null)
  }

  const columnTypes = [
    'VARCHAR(255)', 'TEXT', 'INT', 'BIGINT', 'DECIMAL(10,2)', 
    'BOOLEAN', 'DATE', 'DATETIME', 'TIMESTAMP', 'JSON'
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Database className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SQL Query Generator</h1>
            <p className="text-gray-600">
              Define your database schema and generate SQL queries using AI
            </p>
          </div>
        </div>

        {/* Premium Feature Notice for Free Users */}
        {!canGenerateSQL && (
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <div className="flex items-start space-x-3">
              <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900 mb-2">Premium Feature</h3>
                <p className="text-purple-800 text-sm mb-4">
                  SQL Query Generation is available exclusively for Premium users. 
                  Upgrade your plan to access AI-powered SQL generation, unlimited analyses, and more advanced features.
                </p>
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => navigate('/subscription')}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/upload')}
                    className="text-purple-700 border-purple-300 hover:bg-purple-50"
                  >
                    Try Data Analysis Instead
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Table Schema Definition */}
        <Card className={!canGenerateSQL ? 'opacity-50 pointer-events-none' : ''}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Table className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Database Schema</h2>
              {!canGenerateSQL && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                  <Lock className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-600">Premium Only</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {tables.length > 0 && (
                <Button 
                  onClick={() => setSaveSchemaModal(true)} 
                  variant="outline" 
                  size="sm"
                  className={saveSuccess ? 'text-green-600 border-green-300' : ''}
                >
                  {saveSuccess ? <CheckCircle className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {saveSuccess ? 'Saved!' : 'Save Schema'}
                </Button>
              )}
              <Button 
                onClick={() => setLoadSchemaModal(true)} 
                variant="outline" 
                size="sm"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Load Schema
              </Button>
              <Button onClick={addTable} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Table
              </Button>
            </div>
          </div>

          {tables.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Table className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tables Defined</h3>
              <p className="text-gray-600 mb-4">
                Start by adding your database tables and their column definitions
              </p>
              <Button onClick={addTable}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Table
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {tables.map((table) => (
                <div key={table.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Table name (e.g., users)"
                        value={table.name}
                        onChange={(e) => updateTable(table.id, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Table description"
                        value={table.description}
                        onChange={(e) => updateTable(table.id, 'description', e.target.value)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTable(table.id)}
                      className="ml-4 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Columns</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addColumn(table.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Column
                      </Button>
                    </div>

                    {table.columns.map((column) => (
                      <div key={column.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                        <Input
                          placeholder="Column name"
                          value={column.name}
                          onChange={(e) => updateColumn(table.id, column.id, 'name', e.target.value)}
                        />
                        <select
                          value={column.type}
                          onChange={(e) => updateColumn(table.id, column.id, 'type', e.target.value)}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          {columnTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        <Input
                          placeholder="Description"
                          value={column.description}
                          onChange={(e) => updateColumn(table.id, column.id, 'description', e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeColumn(table.id, column.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    {table.columns.length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No columns defined. Click "Add Column" to start.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Query Generation */}
        <Card className={!canGenerateSQL ? 'opacity-50 pointer-events-none' : ''}>
          <div className="flex items-center space-x-3 mb-6">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Generate SQL Query</h2>
            {!canGenerateSQL && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                <Lock className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-600">Premium Only</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe the SQL query you want to generate
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Get all users who registered in the last 30 days and have made at least one purchase, ordered by registration date"
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleGenerateSQL}
                loading={loading}
               disabled={!canGenerateSQL || !prompt.trim() || tables.length === 0}
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate SQL Query
              </Button>
              
              {generatedSQL && (
                <Button
                  onClick={refineQuery}
                  loading={loading}
                 disabled={!canGenerateSQL}
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refine Query
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </Card>

        {/* Generated SQL */}
        {generatedSQL && canGenerateSQL && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Code className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Generated SQL Query</h2>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className={copied ? 'text-green-600' : ''}
                >
                  {copied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  onClick={saveQuery}
                  loading={saving}
                  variant="outline"
                  size="sm"
                  className={saveSuccess ? 'text-green-600 border-green-300' : ''}
                >
                  {saveSuccess ? <CheckCircle className="h-4 w-4 mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                  {saveSuccess ? 'Saved!' : 'Save Query'}
                </Button>
                <Button
                  onClick={handleExecuteQuery}
                  loading={executing}
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Sample
                </Button>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                {generatedSQL}
              </pre>
            </div>
          </Card>
        )}

        {/* Query Results */}
        {queryResult && canGenerateSQL && (
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <Eye className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Sample Query Result</h2>
            </div>

            {queryResult.success ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Sample data generated based on your schema (not actual database execution)
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {queryResult.columns.map((column: string) => (
                          <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {queryResult.rows.map((row: any, index: number) => (
                        <tr key={index}>
                          {queryResult.columns.map((column: string) => (
                            <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row[column]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-xs text-gray-500">
                  Showing {queryResult.rows.length} sample rows
                </div>
              </div>
            ) : (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{queryResult.error}</span>
              </div>
            )}
          </Card>
        )}

        {/* Tips */}
        <Card className={`bg-blue-50 border-blue-200 ${!canGenerateSQL ? 'opacity-50' : ''}`}>
          <div className="flex items-start space-x-3">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Tips for Better SQL Generation</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Be specific about what data you want to retrieve</li>
                <li>• Mention any filtering conditions, sorting, or grouping requirements</li>
                <li>• Include join conditions when working with multiple tables</li>
                <li>• Specify if you need aggregations like COUNT, SUM, AVG, etc.</li>
                <li>• Use clear column and table names in your descriptions</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Save Schema Modal */}
      <SaveSchemaModal
        isOpen={saveSchemaModal}
        onClose={() => setSaveSchemaModal(false)}
        tables={tables}
        onSave={handleSaveSchema}
      />

      {/* Load Schema Modal */}
      <LoadSchemaModal
        isOpen={loadSchemaModal}
        onClose={() => setLoadSchemaModal(false)}
        schemas={schemas}
        onLoad={handleLoadSchema}
        onDelete={deleteSchema}
        loading={schemasLoading}
      />
    </DashboardLayout>
  )
}