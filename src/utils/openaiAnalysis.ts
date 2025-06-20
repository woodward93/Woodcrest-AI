import { supabase } from '../lib/supabase'

export interface AIAnalysisResult {
  insights: AIInsight[]
  chartConfigs: ChartConfig[]
  summary: string
}

export interface AIInsight {
  type: 'trend' | 'outlier' | 'pattern' | 'recommendation'
  title: string
  description: string
  confidence: number
  affectedColumns: string[]
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'scatter' | 'pie' | 'histogram'
  title: string
  data: any
  description: string
}

export async function analyzeDataWithOpenAI(data: any[], fileName: string): Promise<AIAnalysisResult> {
  try {
    const { data: result, error } = await supabase.functions.invoke('analyze-data', {
      body: { data, fileName }
    })

    if (error) {
      console.error('Edge function error:', error)
      throw new Error('Failed to analyze data: ' + error.message)
    }

    return result as AIAnalysisResult

  } catch (error) {
    console.error('Data Analysis Error:', error)
    
    // Fallback to basic analysis if edge function fails
    return generateFallbackAnalysis(data, fileName)
  }
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