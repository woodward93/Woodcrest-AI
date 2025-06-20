import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { X, Save, Database } from 'lucide-react'

interface SaveSchemaModalProps {
  isOpen: boolean
  onClose: () => void
  tables: any[]
  onSave: (name: string, description: string) => Promise<boolean>
  existingSchema?: any
}

export function SaveSchemaModal({ isOpen, onClose, tables, onSave, existingSchema }: SaveSchemaModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Initialize form with existing schema data if editing
  React.useEffect(() => {
    if (isOpen && existingSchema) {
      setName(existingSchema.name)
      setDescription(existingSchema.description || '')
    } else if (isOpen) {
      setName('')
      setDescription('')
    }
  }, [isOpen, existingSchema])

  if (!isOpen) return null

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Schema name is required')
      return
    }

    if (tables.length === 0) {
      setError('No tables to save')
      return
    }

    setSaving(true)
    setError('')

    try {
      const success = await onSave(name.trim(), description.trim())
      if (success) {
        setName('')
        setDescription('')
        onClose()
      } else {
        setError('Failed to save schema')
      }
    } catch (err) {
      setError('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {existingSchema ? 'Update Schema' : 'Save Schema'}
              </h3>
              <p className="text-gray-600 text-sm">
                {existingSchema ? 'Update this table schema' : 'Save this table schema for future use'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Schema Summary</h4>
            <div className="text-sm text-blue-800">
              <p>{tables.length} table{tables.length !== 1 ? 's' : ''}</p>
              <p>{tables.reduce((sum, table) => sum + (table.columns?.length || 0), 0)} total columns</p>
            </div>
          </div>

          <Input
            label="Schema Name"
            placeholder="e.g., E-commerce Database, User Management Schema"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error && !name.trim() ? 'Name is required' : ''}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this schema is used for..."
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors duration-200 resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {existingSchema ? 'Update Schema' : 'Save Schema'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}