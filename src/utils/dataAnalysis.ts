// Simulated AI analysis for demo purposes
export interface DataColumn {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  values: any[]
  stats?: {
    min?: number
    max?: number
    avg?: number
    median?: number
    mode?: any
    uniqueCount: number
  }
}

export interface Relationship {
  column1: string
  column2: string
  type: 'correlation' | 'causation' | 'independence'
  strength: number // 0-1
  description: string
}

export interface AIInsight {
  type: 'trend' | 'outlier' | 'pattern' | 'recommendation'
  title: string
  description: string
  confidence: number
  affectedColumns: string[]
}

export function analyzeData(data: any[]): {
  columns: DataColumn[]
  relationships: Relationship[]
  insights: AIInsight[]
  chartConfigs: any[]
} {
  if (!data || data.length === 0) {
    return { columns: [], relationships: [], insights: [], chartConfigs: [] }
  }

  const columns = analyzeColumns(data)
  const relationships = findRelationships(columns)
  const insights = generateInsights(columns, relationships)
  const chartConfigs = generateChartConfigs(columns, relationships)

  return { columns, relationships, insights, chartConfigs }
}

function analyzeColumns(data: any[]): DataColumn[] {
  const keys = Object.keys(data[0])
  
  return keys.map(key => {
    const values = data.map(row => row[key]).filter(val => val !== null && val !== undefined)
    const type = inferDataType(values)
    const stats = calculateStats(values, type)
    
    return {
      name: key,
      type,
      values,
      stats
    }
  })
}

function inferDataType(values: any[]): 'string' | 'number' | 'date' | 'boolean' {
  const sample = values.slice(0, 100)
  
  // Check for boolean
  if (sample.every(val => typeof val === 'boolean' || val === 'true' || val === 'false' || val === '1' || val === '0')) {
    return 'boolean'
  }
  
  // Check for numbers
  if (sample.every(val => !isNaN(Number(val)) && val !== '')) {
    return 'number'
  }
  
  // Check for dates
  if (sample.some(val => !isNaN(Date.parse(val)))) {
    return 'date'
  }
  
  return 'string'
}

function calculateStats(values: any[], type: string) {
  const uniqueCount = new Set(values).size
  
  if (type === 'number') {
    const nums = values.map(Number).filter(n => !isNaN(n))
    return {
      min: Math.min(...nums),
      max: Math.max(...nums),
      avg: nums.reduce((a, b) => a + b, 0) / nums.length,
      median: nums.sort((a, b) => a - b)[Math.floor(nums.length / 2)],
      uniqueCount
    }
  }
  
  return { uniqueCount }
}

function findRelationships(columns: DataColumn[]): Relationship[] {
  const relationships: Relationship[] = []
  
  // Find correlations between numeric columns
  const numericColumns = columns.filter(col => col.type === 'number')
  
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col1 = numericColumns[i]
      const col2 = numericColumns[j]
      
      const correlation = calculateCorrelation(col1.values, col2.values)
      
      if (Math.abs(correlation) > 0.3) {
        relationships.push({
          column1: col1.name,
          column2: col2.name,
          type: Math.abs(correlation) > 0.7 ? 'correlation' : 'independence',
          strength: Math.abs(correlation),
          description: `${Math.abs(correlation) > 0.7 ? 'Strong' : 'Moderate'} ${correlation > 0 ? 'positive' : 'negative'} relationship between ${col1.name} and ${col2.name}`
        })
      }
    }
  }
  
  return relationships
}

function calculateCorrelation(x: any[], y: any[]): number {
  const n = Math.min(x.length, y.length)
  const xNum = x.slice(0, n).map(Number)
  const yNum = y.slice(0, n).map(Number)
  
  const xMean = xNum.reduce((a, b) => a + b) / n
  const yMean = yNum.reduce((a, b) => a + b) / n
  
  let numerator = 0
  let xSumSq = 0
  let ySumSq = 0
  
  for (let i = 0; i < n; i++) {
    const xDiff = xNum[i] - xMean
    const yDiff = yNum[i] - yMean
    numerator += xDiff * yDiff
    xSumSq += xDiff * xDiff
    ySumSq += yDiff * yDiff
  }
  
  const denominator = Math.sqrt(xSumSq * ySumSq)
  return denominator === 0 ? 0 : numerator / denominator
}

function generateInsights(columns: DataColumn[], relationships: Relationship[]): AIInsight[] {
  const insights: AIInsight[] = []
  
  // Identify outliers in numeric data
  columns.filter(col => col.type === 'number' && col.stats).forEach(col => {
    if (col.stats) {
      const range = col.stats.max! - col.stats.min!
      const threshold = range * 0.1
      
      insights.push({
        type: 'pattern',
        title: `Data Distribution in ${col.name}`,
        description: `The ${col.name} column shows values ranging from ${col.stats.min?.toFixed(2)} to ${col.stats.max?.toFixed(2)} with an average of ${col.stats.avg?.toFixed(2)}.`,
        confidence: 0.9,
        affectedColumns: [col.name]
      })
    }
  })
  
  // Generate relationship insights
  relationships.forEach(rel => {
    insights.push({
      type: 'trend',
      title: `Relationship Discovery`,
      description: rel.description,
      confidence: rel.strength,
      affectedColumns: [rel.column1, rel.column2]
    })
  })
  
  // Generate recommendations
  if (columns.length > 5) {
    insights.push({
      type: 'recommendation',
      title: 'Data Complexity',
      description: 'Your dataset has multiple variables. Consider focusing on the strongest relationships for initial analysis.',
      confidence: 0.8,
      affectedColumns: columns.map(col => col.name)
    })
  }
  
  return insights
}

function generateChartConfigs(columns: DataColumn[], relationships: Relationship[]): any[] {
  const charts: any[] = []
  
  // Generate distribution charts for numeric columns
  columns.filter(col => col.type === 'number').forEach(col => {
    charts.push({
      type: 'bar',
      title: `Distribution of ${col.name}`,
      data: {
        labels: ['Min', 'Avg', 'Max'],
        datasets: [{
          label: col.name,
          data: [col.stats?.min, col.stats?.avg, col.stats?.max],
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1
        }]
      }
    })
  })
  
  // Generate scatter plots for relationships
  relationships.forEach(rel => {
    const col1 = columns.find(c => c.name === rel.column1)
    const col2 = columns.find(c => c.name === rel.column2)
    
    if (col1 && col2) {
      charts.push({
        type: 'scatter',
        title: `${rel.column1} vs ${rel.column2}`,
        data: {
          datasets: [{
            label: `${rel.column1} vs ${rel.column2}`,
            data: col1.values.slice(0, 50).map((val, i) => ({
              x: Number(val),
              y: Number(col2.values[i])
            })),
            backgroundColor: 'rgba(139, 92, 246, 0.6)',
            borderColor: 'rgba(139, 92, 246, 1)',
          }]
        }
      })
    }
  })
  
  return charts
}