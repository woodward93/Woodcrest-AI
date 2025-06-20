import { supabase } from '../lib/supabase'

export async function chatWithDataAnalysis(message: string, analysis: any): Promise<string> {
  try {
    // Prepare context about the analysis for the AI
    const analysisContext = {
      fileName: analysis.file_name,
      totalRows: analysis.file_data?.length || 0,
      totalColumns: Object.keys(analysis.file_data?.[0] || {}).length,
      columns: Object.keys(analysis.file_data?.[0] || {}),
      insights: analysis.ai_insights || [],
      charts: analysis.charts_config || [],
      sampleData: analysis.file_data?.slice(0, 10) || [], // First 10 rows for context
      analysisDate: analysis.created_at
    }

    const { data: result, error } = await supabase.functions.invoke('chat-with-data', {
      body: { 
        message, 
        analysisContext 
      }
    })

    if (error) {
      console.error('Edge function error:', error)
      throw new Error('Failed to get AI response: ' + error.message)
    }

    return result.response || 'I apologize, but I could not generate a response. Please try rephrasing your question.'

  } catch (error) {
    console.error('Chat error:', error)
    
    // Fallback response
    return generateFallbackResponse(message, analysis)
  }
}

function generateFallbackResponse(message: string, analysis: any): string {
  const lowerMessage = message.toLowerCase()
  
  // Simple keyword-based responses as fallback
  if (lowerMessage.includes('insight') || lowerMessage.includes('key') || lowerMessage.includes('important')) {
    const insights = analysis.ai_insights || []
    if (insights.length > 0) {
      return `Based on your data analysis, here are the key insights I found:\n\n${insights.slice(0, 3).map((insight: any, index: number) => 
        `${index + 1}. ${insight.title}: ${insight.description}`
      ).join('\n\n')}`
    }
  }
  
  if (lowerMessage.includes('chart') || lowerMessage.includes('visualization') || lowerMessage.includes('graph')) {
    const charts = analysis.charts_config || []
    if (charts.length > 0) {
      return `Your analysis includes ${charts.length} visualizations:\n\n${charts.map((chart: any, index: number) => 
        `${index + 1}. ${chart.title || `Chart ${index + 1}`} (${chart.type})`
      ).join('\n')}`
    }
  }
  
  if (lowerMessage.includes('data') || lowerMessage.includes('rows') || lowerMessage.includes('columns')) {
    const totalRows = analysis.file_data?.length || 0
    const totalColumns = Object.keys(analysis.file_data?.[0] || {}).length
    const columns = Object.keys(analysis.file_data?.[0] || {})
    
    return `Your dataset "${analysis.file_name}" contains:\n\n• ${totalRows} rows of data\n• ${totalColumns} columns: ${columns.join(', ')}\n\nThis gives you a comprehensive view of your data structure.`
  }
  
  if (lowerMessage.includes('recommend') || lowerMessage.includes('suggestion') || lowerMessage.includes('advice')) {
    const recommendations = (analysis.ai_insights || []).filter((insight: any) => insight.type === 'recommendation')
    if (recommendations.length > 0) {
      return `Here are my recommendations based on your data:\n\n${recommendations.map((rec: any, index: number) => 
        `${index + 1}. ${rec.title}: ${rec.description}`
      ).join('\n\n')}`
    }
  }
  
  // Generic fallback
  return `I understand you're asking about "${message}". While I'm having trouble connecting to the AI service right now, I can tell you that your analysis of "${analysis.file_name}" contains ${analysis.file_data?.length || 0} rows of data with ${analysis.ai_insights?.length || 0} AI-generated insights and ${analysis.charts_config?.length || 0} visualizations. Please try asking a more specific question about your data, insights, or charts.`
}