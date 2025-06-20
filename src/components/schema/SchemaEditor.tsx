import React from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Plus, Trash2, Table, Columns } from 'lucide-react'

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

interface SchemaEditorProps {
  tables: TableSchema[]
  onTablesChange: (tables: TableSchema[]) => void
}

export function SchemaEditor({ tables, onTablesChange }: SchemaEditorProps) {
  const columnTypes = [
    'VARCHAR(255)', 'TEXT', 'INT', 'BIGINT', 'DECIMAL(10,2)', 
    'BOOLEAN', 'DATE', 'DATETIME', 'TIMESTAMP', 'JSON'
  ]

  const addTable = () => {
    const newTable: TableSchema = {
      id: Date.now().toString(),
      name: '',
      description: '',
      columns: []
    }
    onTablesChange([...tables, newTable])
  }

  const removeTable = (tableId: string) => {
    onTablesChange(tables.filter(t => t.id !== tableId))
  }

  const updateTable = (tableId: string, field: keyof TableSchema, value: string) => {
    onTablesChange(tables.map(t => 
      t.id === tableId ? { ...t, [field]: value } : t
    ))
  }

  const addColumn = (tableId: string) => {
    const newColumn: Column = {
      id: Date.now().toString(),
      name: '',
      type: 'VARCHAR(255)',
      description: ''
    }
    onTablesChange(tables.map(t => 
      t.id === tableId 
        ? { ...t, columns: [...t.columns, newColumn] }
        : t
    ))
  }

  const removeColumn = (tableId: string, columnId: string) => {
    onTablesChange(tables.map(t => 
      t.id === tableId 
        ? { ...t, columns: t.columns.filter(c => c.id !== columnId) }
        : t
    ))
  }

  const updateColumn = (tableId: string, columnId: string, field: keyof Column, value: string) => {
    onTablesChange(tables.map(t => 
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

  return (
    <div className="space-y-6">
      {/* Add Table Button */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Table className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Database Tables</h2>
          </div>
          <Button onClick={addTable} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Table
          </Button>
        </div>
      </Card>

      {/* Tables */}
      {tables.length === 0 ? (
        <Card className="text-center py-12 border-2 border-dashed border-gray-300">
          <Table className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tables Defined</h3>
          <p className="text-gray-600 mb-4">
            Start by adding your database tables and their column definitions
          </p>
          <Button onClick={addTable}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Table
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {tables.map((table) => (
            <Card key={table.id}>
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
                  <div className="flex items-center space-x-2">
                    <Columns className="h-4 w-4 text-gray-600" />
                    <h4 className="font-medium text-gray-900">Columns</h4>
                  </div>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}