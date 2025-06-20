import React from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Database, Table, Columns, Calendar, FileText, Copy, CheckCircle } from 'lucide-react'
import { useState } from 'react'

interface SchemaPreviewProps {
  schema: any
}

export function SchemaPreview({ schema }: SchemaPreviewProps) {
  const [copied, setCopied] = useState('')

  const generateSQLDDL = () => {
    const ddlStatements = schema.tables.map((table: any) => {
      const columns = table.columns.map((col: any) => 
        `  ${col.name} ${col.type}${col.description ? ` -- ${col.description}` : ''}`
      ).join(',\n')
      
      return `CREATE TABLE ${table.name} (\n${columns}\n);${table.description ? ` -- ${table.description}` : ''}`
    }).join('\n\n')
    
    return ddlStatements
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

  const totalColumns = schema.tables.reduce((sum: number, table: any) => sum + (table.columns?.length || 0), 0)

  return (
    <div className="space-y-6">
      {/* Schema Overview */}
      <Card>
        <div className="flex items-start space-x-4">
          <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Database className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{schema.name}</h2>
            {schema.description && (
              <p className="text-gray-600 mb-4">{schema.description}</p>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{schema.tables.length}</p>
                <p className="text-gray-600 text-sm">Tables</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{totalColumns}</p>
                <p className="text-gray-600 text-sm">Total Columns</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center space-x-1">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <p className="text-sm text-gray-600">Created</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(schema.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center space-x-1">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <p className="text-sm text-gray-600">Updated</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(schema.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tables Detail */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Table className="h-5 w-5 mr-2 text-purple-600" />
          Tables ({schema.tables.length})
        </h3>
        
        {schema.tables.map((table: any, index: number) => (
          <Card key={index}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium text-gray-900">{table.name}</h4>
                {table.description && (
                  <p className="text-gray-600 text-sm mt-1">{table.description}</p>
                )}
                <div className="flex items-center space-x-1 text-xs text-gray-500 mt-2">
                  <Columns className="h-3 w-3" />
                  <span>{table.columns?.length || 0} columns</span>
                </div>
              </div>
            </div>

            {table.columns && table.columns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Column Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {table.columns.map((column: any, colIndex: number) => (
                      <tr key={colIndex}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {column.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {column.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {column.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No columns defined for this table
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* SQL DDL Export */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">SQL DDL</h3>
          </div>
          <Button
            onClick={() => copyToClipboard(generateSQLDDL(), 'ddl')}
            variant="outline"
            size="sm"
            className={copied === 'ddl' ? 'text-green-600' : ''}
          >
            {copied === 'ddl' ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied === 'ddl' ? 'Copied!' : 'Copy DDL'}
          </Button>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
            {generateSQLDDL()}
          </pre>
        </div>
      </Card>
    </div>
  )
}