import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, analysisContext } = await req.json()

    if (!message || !analysisContext) {
      throw new Error('Message and analysis context are required')
    }

    // Prepare the context for OpenAI
    const systemPrompt = `You are an expert data analyst AI assistant helping users understand their specific data analysis. You have access to the following information about their data:

File: ${analysisContext.fileName}
Total Rows: ${analysisContext.totalRows}
Total Columns: ${analysisContext.totalColumns}
Columns: ${analysisContext.columns.join(', ')}
Analysis Date: ${analysisContext.analysisDate}

AI Insights Generated:
${analysisContext.insights.map((insight: any, index: number) => 
  `${index + 1}. ${insight.title} (${insight.type}, ${Math.round(insight.confidence * 100)}% confidence)
     Description: ${insight.description}
     Affected Columns: ${insight.affectedColumns.join(', ')}`
).join('\n\n')}

Charts/Visualizations Created:
${analysisContext.charts.map((chart: any, index: number) => 
  `${index + 1}. ${chart.title || `Chart ${index + 1}`} (Type: ${chart.type})
     Description: ${chart.description || 'No description available'}`
).join('\n\n')}

Sample Data (first few rows):
${JSON.stringify(analysisContext.sampleData.slice(0, 5), null, 2)}

Guidelines for your responses:
1. Be conversational and helpful
2. Reference specific insights, charts, or data points when relevant
3. Provide actionable advice when asked
4. Explain complex concepts in simple terms
5. If asked about something not in the data, politely redirect to what you can help with
6. Keep responses focused and concise but informative
7. Use the actual data and insights to support your answers

The user is asking about their specific data analysis, so always relate your answers back to their actual data, insights, and visualizations.`

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
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const openaiResult = await response.json()
    const aiResponse = openaiResult.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Chat error:', error)
    
    return new Response(
      JSON.stringify({
        response: "I apologize, but I'm having trouble processing your question right now. Please try again or rephrase your question."
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 to avoid frontend errors, but with error message
      }
    )
  }
})