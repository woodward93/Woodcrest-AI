import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tables, prompt } = await req.json()

    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      throw new Error('No table schemas provided')
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('No prompt provided')
    }

    // Prepare schema information for OpenAI
    const schemaInfo = tables.map((table: TableSchema) => ({
      name: table.name,
      description: table.description,
      columns: table.columns.map(col => ({
        name: col.name,
        type: col.type,
        description: col.description
      }))
    }))

    const systemPrompt = `You are an expert SQL developer. Generate SQL queries based on the provided database schema and user requirements.

Database Schema:
${schemaInfo.map(table => `
Table: ${table.name}
Description: ${table.description}
Columns:
${table.columns.map(col => `  - ${col.name} (${col.type}): ${col.description}`).join('\n')}
`).join('\n')}

Guidelines:
1. Generate clean, well-formatted SQL queries
2. Use proper SQL syntax and best practices
3. Include appropriate JOINs when multiple tables are involved
4. Add comments to explain complex parts
5. Use meaningful aliases for tables and columns
6. Consider performance optimizations where applicable
7. Return ONLY the SQL query, no additional text or formatting

User Request: ${prompt}`

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
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const openaiResult = await response.json()
    const sqlQuery = openaiResult.choices[0]?.message?.content?.trim()
    
    if (!sqlQuery) {
      throw new Error('No SQL query generated')
    }

    // Clean up the response to ensure it's just SQL
    const cleanedSQL = sqlQuery
      .replace(/^```sql\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim()

    return new Response(JSON.stringify({ sql: cleanedSQL }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('SQL Generation Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate SQL query' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})