import { supabase } from '../lib/supabase'

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

export async function generateSQLQuery(tables: TableSchema[], prompt: string): Promise<string> {
  try {
    const { data: result, error } = await supabase.functions.invoke('generate-sql', {
      body: { tables, prompt }
    })

    if (error) {
      console.error('Edge function error:', error)
      throw new Error('Failed to generate SQL: ' + error.message)
    }

    if (result.error) {
      throw new Error(result.error)
    }

    return result.sql

  } catch (error) {
    console.error('SQL Generation Error:', error)
    throw new Error('Failed to generate SQL query. Please try again.')
  }
}

export async function executeSampleQuery(sqlQuery: string, tables: TableSchema[]): Promise<any> {
  try {
    // This is a mock execution that generates sample data based on the schema
    // In a real application, you would execute this against a real database
    
    // Parse the SQL to understand what columns are being selected
    const selectMatch = sqlQuery.match(/SELECT\s+(.*?)\s+FROM/is)
    if (!selectMatch) {
      throw new Error('Could not parse SELECT statement')
    }

    const selectClause = selectMatch[1].trim()
    let columns: string[] = []

    if (selectClause === '*') {
      // If SELECT *, get all columns from the first table mentioned
      const fromMatch = sqlQuery.match(/FROM\s+(\w+)/i)
      if (fromMatch) {
        const tableName = fromMatch[1]
        const table = tables.find(t => t.name.toLowerCase() === tableName.toLowerCase())
        if (table) {
          columns = table.columns.map(col => col.name)
        }
      }
    } else {
      // Parse specific columns
      columns = selectClause
        .split(',')
        .map(col => col.trim().replace(/.*\s+AS\s+/i, '').replace(/.*\./, ''))
        .filter(col => col && !col.includes('(')) // Remove aggregate functions for simplicity
    }

    if (columns.length === 0) {
      columns = ['id', 'name', 'created_at'] // Default columns
    }

    // Generate sample data
    const sampleRows = []
    for (let i = 0; i < 5; i++) {
      const row: any = {}
      columns.forEach(column => {
        row[column] = generateSampleValue(column, i)
      })
      sampleRows.push(row)
    }

    return {
      success: true,
      columns,
      rows: sampleRows,
      executedAt: new Date().toISOString()
    }

  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    }
  }
}

function generateSampleValue(columnName: string, index: number): any {
  const lowerName = columnName.toLowerCase()
  
  if (lowerName.includes('id')) {
    return index + 1
  } else if (lowerName.includes('name')) {
    const names = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson']
    return names[index % names.length]
  } else if (lowerName.includes('email')) {
    const emails = ['john@example.com', 'jane@example.com', 'bob@example.com', 'alice@example.com', 'charlie@example.com']
    return emails[index % emails.length]
  } else if (lowerName.includes('date') || lowerName.includes('created') || lowerName.includes('updated')) {
    const date = new Date()
    date.setDate(date.getDate() - index)
    return date.toISOString().split('T')[0]
  } else if (lowerName.includes('price') || lowerName.includes('amount') || lowerName.includes('cost')) {
    return (Math.random() * 1000 + 10).toFixed(2)
  } else if (lowerName.includes('count') || lowerName.includes('quantity') || lowerName.includes('number')) {
    return Math.floor(Math.random() * 100) + 1
  } else if (lowerName.includes('status')) {
    const statuses = ['active', 'inactive', 'pending', 'completed', 'cancelled']
    return statuses[index % statuses.length]
  } else if (lowerName.includes('description') || lowerName.includes('comment')) {
    const descriptions = [
      'Sample description for item ' + (index + 1),
      'This is a test description',
      'Lorem ipsum dolor sit amet',
      'Sample data for demonstration',
      'Generated sample content'
    ]
    return descriptions[index % descriptions.length]
  } else {
    // Default to string values
    return `Sample ${columnName} ${index + 1}`
  }
}