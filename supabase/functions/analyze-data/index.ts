import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIAnalysisResult {
  insights: AIInsight[]
  chartConfigs: ChartConfig[]
  summary: string
}

interface AIInsight {
  type: 'trend' | 'outlier' | 'pattern' | 'recommendation'
  title: string
  description: string
  confidence: number
  affectedColumns: string[]
}

interface ChartConfig {
  type: 'bar' | 'line' | 'scatter' | 'pie' | 'histogram'
  title: string
  data: any
  description: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { data, fileName } = await req.json()

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid data provided')
    }

    // Prepare data sample for analysis (limit to first 100 rows to avoid token limits)
    const sampleData = data.slice(0, 100)
    const columns = Object.keys(sampleData[0] || {})
    
    // Create data summary for OpenAI
    const dataSummary = {
      fileName,
      totalRows: data.length,
      columns: columns.map(col => ({
        name: col,
        type: inferColumnType(sampleData.map(row => row[col])),
        sampleValues: sampleData.slice(0, 5).map(row => row[col])
      })),
      sampleRows: sampleData.slice(0, 10)
    }

    const prompt = `
You are a data analyst AI. Analyze the following dataset and provide insights and chart recommendations.

Dataset Information:
- File: ${fileName}
- Total Rows: ${data.length}
- Columns: ${columns.join(', ')}

Column Details:
${dataSummary.columns.map(col => 
  `- ${col.name} (${col.type}): Sample values: ${col.sampleValues.join(', ')}`
).join('\n')}

Sample Data (first 10 rows):
${JSON.stringify(sampleData.slice(0, 10), null, 2)}

Please provide a JSON response with the following structure:
{
  "summary": "Brief overview of the dataset and key findings",
  "insights": [
    {
      "type": "trend|outlier|pattern|recommendation",
      "title": "Insight title",
      "description": "Detailed description of the insight",
      "confidence": 0.8,
      "affectedColumns": ["column1", "column2"]
    }
  ],
  "chartConfigs": [
    {
      "type": "bar|line|scatter|pie|histogram",
      "title": "Chart title",
      "description": "What this chart shows",
      "data": {
        "labels": ["label1", "label2"],
        "datasets": [{
          "label": "Dataset name",
          "data": [value1, value2],
          "backgroundColor": "rgba(59, 130, 246, 0.6)",
          "borderColor": "rgba(59, 130, 246, 1)",
          "borderWidth": 1
        }]
      }
    }
  ]
}

Guidelines:
1. Generate 10 meaningful insights based on the data
2. Create 8 relevant charts that best visualize the data relationships
3. Use appropriate chart types for the data (bar for categories, scatter for correlations, etc.)
4. Ensure chart data uses actual values from the dataset
5. Provide actionable recommendations where possible
6. Focus on the most significant patterns and relationships
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert data analyst. Always respond with valid JSON only, no additional text or formatting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const openaiResult = await response.json()
    const analysisText = openaiResult.choices[0]?.message?.content

    if (!analysisText) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    let analysisResult: AIAnalysisResult
    try {
      analysisResult = JSON.parse(analysisText)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', analysisText)
      throw new Error('Invalid response format from AI analysis')
    }

    // Generate actual chart data from the dataset
    const enhancedChartConfigs = analysisResult.chartConfigs.map(config => 
      enhanceChartWithRealData(config, data, columns)
    )

    const result = {
      ...analysisResult,
      chartConfigs: enhancedChartConfigs
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Analysis Error:', error)
    
    // Return fallback analysis if OpenAI fails
    const fallbackResult = generateFallbackAnalysis(
      req.body ? JSON.parse(await req.text()).data : [], 
      req.body ? JSON.parse(await req.text()).fileName : 'unknown'
    )
    
    return new Response(JSON.stringify(fallbackResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  }
})

function inferColumnType(values: any[]): string {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '')
  if (nonNullValues.length === 0) return 'unknown'
  
  // Check if all values are numbers
  if (nonNullValues.every(v => !isNaN(Number(v)))) return 'number'
  
  // Check if values look like dates
  if (nonNullValues.some(v => !isNaN(Date.parse(v)))) return 'date'
  
  // Check if boolean-like
  if (nonNullValues.every(v => ['true', 'false', '1', '0', 'yes', 'no'].includes(String(v).toLowerCase()))) {
    return 'boolean'
  }
  
  return 'string'
}

function enhanceChartWithRealData(config: ChartConfig, data: any[], columns: string[]): ChartConfig {
  try {
    // Ensure config has a valid type
    if (!config.type) {
      config.type = 'bar'
    }

    // Normalize chart type
    const normalizeType = (type: string): string => {
      const lowerType = type.toLowerCase().trim()
      switch (lowerType) {
        case 'histogram':
        case 'column':
          return 'bar'
        case 'area':
          return 'line'
        case 'donut':
          return 'doughnut'
        case 'polar':
          return 'polarArea'
        case 'spider':
          return 'radar'
        default:
          return lowerType
      }
    }

    config.type = normalizeType(config.type)

    // For bar charts, use actual data aggregation
    if (config.type === 'bar') {
      const relevantColumn = findRelevantColumn(config.title, columns)
      if (relevantColumn) {
        const values = data.map(row => row[relevantColumn]).filter(v => v !== null && v !== undefined)
        
        if (values.every(v => !isNaN(Number(v)))) {
          // Numeric data - create distribution
          const numValues = values.map(Number)
          const min = Math.min(...numValues)
          const max = Math.max(...numValues)
          const avg = numValues.reduce((a, b) => a + b, 0) / numValues.length
          
          config.data = {
            labels: ['Minimum', 'Average', 'Maximum'],
            datasets: [{
              label: relevantColumn,
              data: [min, avg, max],
              backgroundColor: ['rgba(239, 68, 68, 0.6)', 'rgba(59, 130, 246, 0.6)', 'rgba(34, 197, 94, 0.6)'],
              borderColor: ['rgba(239, 68, 68, 1)', 'rgba(59, 130, 246, 1)', 'rgba(34, 197, 94, 1)'],
              borderWidth: 1
            }]
          }
        } else {
          // Categorical data - create frequency chart
          const frequency: { [key: string]: number } = {}
          values.forEach(val => {
            const key = String(val)
            frequency[key] = (frequency[key] || 0) + 1
          })
          
          const sortedEntries = Object.entries(frequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10) // Top 10 categories
          
          config.data = {
            labels: sortedEntries.map(([key]) => key),
            datasets: [{
              label: 'Frequency',
              data: sortedEntries.map(([, count]) => count),
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1
            }]
          }
        }
      }
    }
    
    // For pie/doughnut charts, create categorical distribution
    if (config.type === 'pie' || config.type === 'doughnut') {
      const relevantColumn = findRelevantColumn(config.title, columns)
      if (relevantColumn) {
        const values = data.map(row => row[relevantColumn]).filter(v => v !== null && v !== undefined)
        const frequency: { [key: string]: number } = {}
        
        values.forEach(val => {
          const key = String(val)
          frequency[key] = (frequency[key] || 0) + 1
        })
        
        const sortedEntries = Object.entries(frequency)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 8) // Top 8 categories for readability
        
        const colors = [
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(6, 182, 212, 0.8)',
          'rgba(251, 146, 60, 0.8)'
        ]
        
        config.data = {
          labels: sortedEntries.map(([key]) => key),
          datasets: [{
            label: relevantColumn,
            data: sortedEntries.map(([, count]) => count),
            backgroundColor: colors.slice(0, sortedEntries.length),
            borderColor: colors.slice(0, sortedEntries.length).map(color => color.replace('0.8', '1')),
            borderWidth: 2
          }]
        }
        config.title = `${relevantColumn} Distribution`
      }
    }

    // For scatter plots, find two numeric columns
    if (config.type === 'scatter') {
      const numericColumns = columns.filter(col => {
        const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined)
        return values.length > 0 && values.every(v => !isNaN(Number(v)))
      })
      
      if (numericColumns.length >= 2) {
        const xCol = numericColumns[0]
        const yCol = numericColumns[1]
        
        const scatterData = data.slice(0, 100).map(row => ({
          x: Number(row[xCol]),
          y: Number(row[yCol])
        })).filter(point => !isNaN(point.x) && !isNaN(point.y))
        
        config.data = {
          datasets: [{
            label: `${xCol} vs ${yCol}`,
            data: scatterData,
            backgroundColor: 'rgba(139, 92, 246, 0.6)',
            borderColor: 'rgba(139, 92, 246, 1)',
          }]
        }
        config.title = `${xCol} vs ${yCol} Relationship`
      }
    }

    // Ensure config has valid data structure
    if (!config.data) {
      config.data = {
        labels: ['No Data'],
        datasets: [{
          label: 'No Data Available',
          data: [0],
          backgroundColor: 'rgba(156, 163, 175, 0.6)',
          borderColor: 'rgba(156, 163, 175, 1)',
          borderWidth: 1
        }]
      }
    }
    
    return config
  } catch (error) {
    console.error('Error enhancing chart data:', error)
    // Return a safe fallback chart
    return {
      ...config,
      type: 'bar',
      data: {
        labels: ['Error'],
        datasets: [{
          label: 'Chart Error',
          data: [0],
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1
        }]
      }
    }
  }
}

function findRelevantColumn(title: string, columns: string[]): string | null {
  const titleLower = title.toLowerCase()
  
  // Try to find column mentioned in title
  for (const col of columns) {
    if (titleLower.includes(col.toLowerCase())) {
      return col
    }
  }
  
  // Return first column as fallback
  return columns[0] || null
}

function generateFallbackAnalysis(data: any[], fileName: string): AIAnalysisResult {
  const columns = Object.keys(data[0] || {})
  
  return {
    summary: `Analysis of ${fileName} with ${data.length} rows and ${columns.length} columns. Basic analysis completed due to AI service unavailability.`,
    insights: [
      {
        type: 'pattern',
        title: 'Dataset Overview',
        description: `Your dataset contains ${data.length} records across ${columns.length} different fields: ${columns.join(', ')}.`,
        confidence: 1.0,
        affectedColumns: columns
      },
      {
        type: 'recommendation',
        title: 'Data Quality Check',
        description: 'Consider reviewing your data for completeness and consistency to get better insights.',
        confidence: 0.8,
        affectedColumns: columns
      }
    ],
    chartConfigs: [
      {
        type: 'bar',
        title: 'Data Overview',
        description: 'Basic overview of your dataset structure',
        data: {
          labels: ['Total Rows', 'Total Columns'],
          datasets: [{
            label: 'Dataset Metrics',
            data: [data.length, columns.length],
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1
          }]
        }
      }
    ]
  }
}