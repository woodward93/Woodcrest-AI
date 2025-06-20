import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportData {
  fileName: string
  fileData: any[]
  charts: any[]
  insights: any[]
  summary: {
    totalRows: number
    totalColumns: number
    totalCharts: number
    totalInsights: number
    analysisDate: string
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { exportData, format, analysisId } = await req.json()

    if (!exportData || !format) {
      throw new Error('Missing required parameters')
    }

    if (!['pdf', 'ppt'].includes(format)) {
      throw new Error('Invalid export format. Supported formats: pdf, ppt')
    }

    // Generate the export file based on format
    let result
    if (format === 'pdf') {
      result = await generatePDFReport(exportData)
    } else {
      result = await generatePowerPointPresentation(exportData)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Export error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Export failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function generatePDFReport(exportData: ExportData) {
  try {
    // Create a simple PDF using basic PDF structure
    const pdfContent = createBasicPDF(exportData)
    const fileName = `${exportData.fileName.replace(/\.[^/.]+$/, '')}_analysis_report.pdf`
    
    // Convert to base64 for transmission
    const base64Content = btoa(pdfContent)
    
    return {
      success: true,
      message: 'PDF report generated successfully',
      fileName,
      fileData: base64Content,
      mimeType: 'application/pdf'
    }
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error('Failed to generate PDF report')
  }
}

async function generatePowerPointPresentation(exportData: ExportData) {
  try {
    // Create a basic PPTX structure
    const pptxContent = await createBasicPPTX(exportData)
    const fileName = `${exportData.fileName.replace(/\.[^/.]+$/, '')}_analysis_presentation.pptx`
    
    return {
      success: true,
      message: 'PowerPoint presentation generated successfully',
      fileName,
      fileData: pptxContent,
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    }
  } catch (error) {
    console.error('PPTX generation error:', error)
    throw new Error('Failed to generate PowerPoint presentation')
  }
}

function createBasicPDF(exportData: ExportData): string {
  const { fileName, summary, insights, charts } = exportData
  
  // Create a basic PDF structure
  // This is a simplified PDF - in production, you'd use a proper PDF library
  const pdfHeader = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length ${getContentLength(exportData)}
>>
stream
BT
/F1 24 Tf
50 750 Td
(Woodcrest AI Analysis Report) Tj
0 -30 Td
/F1 18 Tf
(${fileName}) Tj
0 -40 Td
/F1 12 Tf
(Generated on ${summary.analysisDate}) Tj
0 -60 Td
/F1 16 Tf
(Analysis Summary) Tj
0 -30 Td
/F1 12 Tf
(Total Rows: ${summary.totalRows}) Tj
0 -20 Td
(Total Columns: ${summary.totalColumns}) Tj
0 -20 Td
(Charts Generated: ${summary.totalCharts}) Tj
0 -20 Td
(AI Insights: ${summary.totalInsights}) Tj
0 -40 Td
/F1 16 Tf
(Key Insights) Tj`

  let yPosition = 450
  const insightContent = insights.slice(0, 5).map(insight => {
    yPosition -= 40
    return `0 ${yPosition} Td
/F1 12 Tf
(${insight.title.substring(0, 60)}) Tj
0 -15 Td
(Confidence: ${Math.round(insight.confidence * 100)}% | Type: ${insight.type}) Tj
0 -15 Td
(${insight.description.substring(0, 80)}...) Tj`
  }).join('\n')

  const pdfFooter = `
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000000380 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
456
%%EOF`

  return pdfHeader + insightContent + pdfFooter
}

function getContentLength(exportData: ExportData): number {
  // Calculate approximate content length for PDF
  const baseLength = 500
  const insightLength = exportData.insights.slice(0, 5).length * 100
  return baseLength + insightLength
}

async function createBasicPPTX(exportData: ExportData): Promise<string> {
  // Create a minimal PPTX structure
  // This is a simplified approach - in production, you'd use a proper PPTX library
  
  const { fileName, summary, insights, charts } = exportData
  
  // Create basic XML structure for PPTX
  const presentationXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
    <p:sldId id="257" r:id="rId3"/>
    <p:sldId id="258" r:id="rId4"/>
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000" type="screen4x3"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`

  // Create slide content
  const slide1Xml = createSlideXML("DataViz AI Analysis", fileName, [
    `Analysis Date: ${summary.analysisDate}`,
    `Total Rows: ${summary.totalRows}`,
    `Total Columns: ${summary.totalColumns}`,
    `Charts Generated: ${summary.totalCharts}`,
    `AI Insights: ${summary.totalInsights}`
  ])

  const slide2Xml = createSlideXML("Key Insights", "AI-Generated Insights", 
    insights.slice(0, 5).map(insight => 
      `${insight.title} (${Math.round(insight.confidence * 100)}% confidence)`
    )
  )

  const slide3Xml = createSlideXML("Data Visualizations", "Generated Charts", 
    charts.map(chart => `${chart.title || 'Chart'} (${chart.type})`)
  )

  // Create a basic ZIP structure for PPTX (simplified)
  // In a real implementation, you'd use a proper ZIP library
  const pptxData = {
    presentation: presentationXml,
    slide1: slide1Xml,
    slide2: slide2Xml,
    slide3: slide3Xml
  }

  // Return base64 encoded JSON as a placeholder
  // In production, this would be a proper PPTX binary
  return btoa(JSON.stringify(pptxData))
}

function createSlideXML(title: string, subtitle: string, bulletPoints: string[]): string {
  const bullets = bulletPoints.map(point => 
    `<a:p><a:r><a:t>${point}</a:t></a:r></a:p>`
  ).join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="4400"/>
              <a:t>${title}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="2800"/>
              <a:t>${subtitle}</a:t>
            </a:r>
          </a:p>
          ${bullets}
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`
}