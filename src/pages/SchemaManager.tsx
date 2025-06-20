import React, { useState } from 'react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useSavedSchemas } from '../hooks/useSavedSchemas'
import { useSubscription } from '../hooks/useSubscription'
import { SaveSchemaModal } from '../components/sql/SaveSchemaModal'
import { LoadSchemaModal } from '../components/sql/LoadSchemaModal'
import { SchemaEditor } from '../components/schema/SchemaEditor'
import { SchemaPreview } from '../components/schema/SchemaPreview'
import { 
  Database, 
  Plus, 
  Search, 
  Calendar, 
  Table, 
  Crown, 
  Lock,
  Save,
  FolderOpen,
  Edit,
  Eye,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface TableSchema {
  id: string
  name: string
  description: string
  columns: Array<{
    id: string
    name: string
    type: string
    description: string
  }>
}

export function SchemaManager() {
  const { schemas, loading, saveSchema, updateSchema, deleteSchema } = useSavedSchemas()
  const { limits, subscriptionPlan } = useSubscription()
  const navigate = useNavigate()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchema, setSelectedSchema] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'list' | 'edit' | 'preview'>('list')
  const [editingTables, setEditingTables] = useState<TableSchema[]>([])
  const [saveSchemaModal, setSaveSchemaModal] = useState(false)
  const [loadSchemaModal, setLoadSchemaModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; schema: any | null }>({
    show: false,
    schema: null
  })
  const [deleting, setDeleting] = useState(false)

  // Check if user can access schema management
  const canManageSchemas = limits.canGenerateSQL

  const filteredSchemas = schemas.filter(schema =>
    schema.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schema.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateNew = () => {
    setEditingTables([])
    setSelectedSchema(null)
    setViewMode('edit')
  }

  const handleEditSchema = (schema: any) => {
    setSelectedSchema(schema)
    setEditingTables(schema.tables.map((table: any) => ({
      ...table,
      id: Date.now().toString() + Math.random().toString(36).substring(2)
    })))
    setViewMode('edit')
  }

  const handleViewSchema = (schema: any) => {
    setSelectedSchema(schema)
    setViewMode('preview')
  }

  const handleSaveSchema = async (name: string, description: string): Promise<boolean> => {
    if (editingTables.length === 0) return false
    
    try {
      let success = false
      if (selectedSchema) {
        // Update existing schema
        success = await updateSchema(selectedSchema.id, name, description, editingTables)
      } else {
        // Create new schema
        success = await saveSchema(name, description, editingTables)
      }
      
      if (success) {
        setViewMode('list')
        setSelectedSchema(null)
        setEditingTables([])
      }
      return success
    } catch (error) {
      console.error('Error saving schema:', error)
      return false
    }
  }

  const handleDeleteClick = (schema: any) => {
    setDeleteConfirm({ show: true, schema })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.schema) return

    setDeleting(true)
    try {
      const success = await deleteSchema(deleteConfirm.schema.id)
      if (success) {
        setDeleteConfirm({ show: false, schema: null })
        if (selectedSchema?.id === deleteConfirm.schema.id) {
          setViewMode('list')
          setSelectedSchema(null)
        }
      }
    } finally {
      setDeleting(false)
    }
  }

  const backToList = () => {
    setViewMode('list')
    setSelectedSchema(null)
    setEditingTables([])
  }

  if (!canManageSchemas) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Schema Manager</h1>
            <p className="text-gray-600">
              Create, manage, and organize your database schemas
            </p>
          </div>

          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <div className="flex items-start space-x-3">
              <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900 mb-2">Premium Feature</h3>
                <p className="text-purple-800 text-sm mb-4">
                  Schema Management is available exclusively for Premium users. 
                  Upgrade your plan to create, save, and manage database schemas for your SQL generation workflows.
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
        </div>
      </DashboardLayout>
    )
  }

  if (viewMode === 'edit') {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedSchema ? 'Edit Schema' : 'Create New Schema'}
              </h1>
              <p className="text-gray-600">
                {selectedSchema ? `Editing: ${selectedSchema.name}` : 'Define your database tables and columns'}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={backToList}>
                Cancel
              </Button>
              <Button 
                onClick={() => setSaveSchemaModal(true)}
                disabled={editingTables.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Schema
              </Button>
            </div>
          </div>

          <SchemaEditor
            tables={editingTables}
            onTablesChange={setEditingTables}
          />

          <SaveSchemaModal
            isOpen={saveSchemaModal}
            onClose={() => setSaveSchemaModal(false)}
            tables={editingTables}
            onSave={handleSaveSchema}
            existingSchema={selectedSchema}
          />
        </div>
      </DashboardLayout>
    )
  }

  if (viewMode === 'preview' && selectedSchema) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedSchema.name}</h1>
              <p className="text-gray-600">{selectedSchema.description || 'No description provided'}</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={backToList}>
                Back to List
              </Button>
              <Button onClick={() => handleEditSchema(selectedSchema)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Schema
              </Button>
            </div>
          </div>

          <SchemaPreview schema={selectedSchema} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
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
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schema Manager</h1>
            <p className="text-gray-600">
              Create, manage, and organize your database schemas
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              onClick={() => setLoadSchemaModal(true)}
              variant="outline"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Import Schema
            </Button>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Schema
            </Button>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="space-y-6">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search schemas by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

        {/* Schema List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading schemas...</p>
          </div>
        ) : filteredSchemas.length === 0 ? (
          <Card className="text-center py-12">
            <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No schemas found' : 'No schemas yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Create your first database schema to get started'
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Schema
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchemas.map((schema) => (
              <Card 
                key={schema.id} 
                className="hover:shadow-lg transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Database className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                        {schema.name}
                      </h3>
                      <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(schema.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewSchema(schema)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSchema(schema)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(schema)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {schema.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {schema.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">
                      {schema.tables.length}
                    </p>
                    <p className="text-gray-600 text-xs">Tables</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">
                      {schema.tables.reduce((sum: number, table: any) => sum + (table.columns?.length || 0), 0)}
                    </p>
                    <p className="text-gray-600 text-xs">Columns</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleViewSchema(schema)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    onClick={() => handleEditSchema(schema)}
                    size="sm"
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Load Schema Modal */}
        <LoadSchemaModal
          isOpen={loadSchemaModal}
          onClose={() => setLoadSchemaModal(false)}
          schemas={schemas}
          onLoad={(schema) => {
            handleEditSchema(schema)
            setLoadSchemaModal(false)
          }}
          onDelete={deleteSchema}
          loading={loading}
        />
      </div>
      </div>
    </DashboardLayout>
  )
}