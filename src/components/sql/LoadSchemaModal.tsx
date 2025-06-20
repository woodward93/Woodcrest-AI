import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { X, Database, Calendar, Trash2, Eye, AlertTriangle } from 'lucide-react'
import { SavedSchema } from '../../hooks/useSavedSchemas'

interface LoadSchemaModalProps {
  isOpen: boolean
  onClose: () => void
  schemas: SavedSchema[]
  onLoad: (schema: SavedSchema) => void
  onDelete: (id: string) => Promise<boolean>
  loading: boolean
}

export function LoadSchemaModal({ isOpen, onClose, schemas, onLoad, onDelete, loading }: LoadSchemaModalProps) {
  const [selectedSchema, setSelectedSchema] = useState<SavedSchema | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; schema: SavedSchema | null }>({
    show: false,
    schema: null
  })
  const [deleting, setDeleting] = useState(false)

  if (!isOpen) return null

  const handleLoad = (schema: SavedSchema) => {
    onLoad(schema)
    onClose()
  }

  const handleDeleteClick = (schema: SavedSchema, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirm({ show: true, schema })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.schema) return

    setDeleting(true)
    try {
      const success = await onDelete(deleteConfirm.schema.id)
      if (success) {
        setDeleteConfirm({ show: false, schema: null })
      }
    } finally {
      setDeleting(false)
    }
  }

  const viewSchemaDetails = (schema: SavedSchema, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedSchema(schema)
  }

  if (deleteConfirm.show) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="max-w-md w-full mx-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Schema</h3>
              <p className="text-gray-600 text-sm">This action cannot be undone</p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6">
            Are you sure you want to delete the schema{' '}
            <span className="font-medium">"{deleteConfirm.schema?.name}"</span>?
            This will permanently remove the schema and all its table definitions.
          </p>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm({ show: false, schema: null })}
              className="flex-1"
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              loading={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Schema
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (selectedSchema) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedSchema.name}</h3>
                <p className="text-gray-600 text-sm">Schema Details</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedSchema(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {selectedSchema.description && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-700 text-sm">{selectedSchema.description}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-900">Tables:</span> {selectedSchema.tables.length}
              </div>
              <div>
                <span className="font-medium text-gray-900">Total Columns:</span>{' '}
                {selectedSchema.tables.reduce((sum, table) => sum + (table.columns?.length || 0), 0)}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Tables</h4>
              <div className="space-y-3">
                {selectedSchema.tables.map((table, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{table.name}</h5>
                      <span className="text-xs text-gray-500">{table.columns?.length || 0} columns</span>
                    </div>
                    {table.description && (
                      <p className="text-sm text-gray-600 mb-2">{table.description}</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {table.columns?.map((column: any, colIndex: number) => (
                        <div key={colIndex} className="text-xs bg-gray-50 rounded px-2 py-1">
                          <span className="font-medium">{column.name}</span>
                          <span className="text-gray-500 ml-1">({column.type})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setSelectedSchema(null)}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              onClick={() => handleLoad(selectedSchema)}
              className="flex-1"
            >
              <Database className="h-4 w-4 mr-2" />
              Load Schema
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Load Saved Schema</h3>
              <p className="text-gray-600 text-sm">Choose a previously saved schema to load</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading saved schemas...</p>
          </div>
        ) : schemas.length === 0 ? (
          <div className="text-center py-12">
            <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Saved Schemas</h4>
            <p className="text-gray-600">
              You haven't saved any schemas yet. Create some table definitions and save them for future use.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {schemas.map((schema) => (
              <div
                key={schema.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors cursor-pointer group"
                onClick={() => handleLoad(schema)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900 group-hover:text-primary-700 transition-colors">
                        {schema.name}
                      </h4>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(schema.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {schema.description && (
                      <p className="text-sm text-gray-600 mb-2">{schema.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{schema.tables.length} table{schema.tables.length !== 1 ? 's' : ''}</span>
                      <span>
                        {schema.tables.reduce((sum, table) => sum + (table.columns?.length || 0), 0)} columns
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => viewSchemaDetails(schema, e)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteClick(schema, e)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}