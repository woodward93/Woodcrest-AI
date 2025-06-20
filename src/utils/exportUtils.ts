import { supabase } from '../lib/supabase'
// @ts-ignore
import jsPDF from 'jspdf'
// @ts-ignore
import PptxGenJS from 'pptxgenjs'
// @ts-ignore
import html2canvas from 'html2canvas'

export interface ExportData {
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

export async function exportAnalysis(analysis: any, format: 'pdf' | 'ppt'): Promise<void> {
  try {
    // Prepare export data
    const exportData: ExportData = {
      fileName: analysis.file_name,
      fileData: analysis.file_data || [],
      charts: analysis.charts_config || [],
      insights: analysis.ai_insights || [],
      summary: {
        totalRows: analysis.file_data?.length || 0,
        totalColumns: Object.keys(analysis.file_data?.[0] || {}).length,
        totalCharts: analysis.charts_config?.length || 0,
        totalInsights: analysis.ai_insights?.length || 0,
        analysisDate: new Date(analysis.created_at).toLocaleDateString()
      }
    }

    // Capture chart images before generating the document
    const chartImages = await captureChartImages()

    if (format === 'pdf') {
      await generateClientSidePDF(exportData, chartImages)
    } else {
      await generateClientSidePPTX(exportData, chartImages)
    }

  } catch (error) {
    console.error('Export error:', error)
    throw error
  }
}

async function captureChartImages(): Promise<string[]> {
  const chartImages: string[] = []
  
  try {
    // Find all chart containers in the current page
    const chartContainers = document.querySelectorAll('.chart-container canvas')
    
    for (let i = 0; i < chartContainers.length; i++) {
      const canvas = chartContainers[i] as HTMLCanvasElement
      if (canvas) {
        try {
          // Get the chart image as base64
          const imageData = canvas.toDataURL('image/png', 1.0)
          chartImages.push(imageData)
        } catch (error) {
          console.warn(`Failed to capture chart ${i}:`, error)
          // Add a placeholder for failed charts
          chartImages.push('')
        }
      }
    }
    
    // If no canvas elements found, try to capture chart containers as images
    if (chartImages.length === 0) {
      const chartDivs = document.querySelectorAll('.chart-container')
      
      for (let i = 0; i < chartDivs.length; i++) {
        const chartDiv = chartDivs[i] as HTMLElement
        if (chartDiv) {
          try {
            const canvas = await html2canvas(chartDiv, {
              backgroundColor: '#ffffff',
              scale: 2,
              logging: false,
              useCORS: true,
              allowTaint: true
            })
            const imageData = canvas.toDataURL('image/png', 1.0)
            chartImages.push(imageData)
          } catch (error) {
            console.warn(`Failed to capture chart container ${i}:`, error)
            chartImages.push('')
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error capturing chart images:', error)
  }
  
  return chartImages
}

async function generateClientSidePDF(exportData: ExportData, chartImages: string[]): Promise<void> {
  try {
    const doc = new jsPDF()
    const { fileName, summary, insights, charts } = exportData
    
    // Set up fonts and colors
    doc.setFont('helvetica')
    
    // Header
    doc.setFontSize(24)
    doc.setTextColor(102, 126, 234) // Primary color
    doc.text('DataViz AI Analysis Report', 20, 30)
    
    doc.setFontSize(18)
    doc.setTextColor(0, 0, 0)
    doc.text(fileName, 20, 45)
    
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated on ${summary.analysisDate}`, 20, 55)
    
    // Summary section
    let yPos = 80
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text('Analysis Summary', 20, yPos)
    
    yPos += 15
    doc.setFontSize(12)
    doc.text(`Total Rows: ${summary.totalRows}`, 20, yPos)
    yPos += 10
    doc.text(`Total Columns: ${summary.totalColumns}`, 20, yPos)
    yPos += 10
    doc.text(`Charts Generated: ${summary.totalCharts}`, 20, yPos)
    yPos += 10
    doc.text(`AI Insights: ${summary.totalInsights}`, 20, yPos)
    
    // Charts section
    if (chartImages.length > 0) {
      yPos += 25
      doc.setFontSize(16)
      doc.text('Data Visualizations', 20, yPos)
      yPos += 15
      
      for (let i = 0; i < Math.min(chartImages.length, charts.length); i++) {
        const chartImage = chartImages[i]
        const chart = charts[i]
        
        if (chartImage && chartImage !== '') {
          // Check if we need a new page
          if (yPos > 200) {
            doc.addPage()
            yPos = 30
          }
          
          // Add chart title
          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.text(`${i + 1}. ${chart.title || `Chart ${i + 1}`}`, 20, yPos)
          yPos += 10
          
          // Add chart image
          try {
            const imgWidth = 160
            const imgHeight = 100
            doc.addImage(chartImage, 'PNG', 20, yPos, imgWidth, imgHeight)
            yPos += imgHeight + 15
            
            // Add chart description if available
            if (chart.description) {
              doc.setFont('helvetica', 'normal')
              doc.setFontSize(10)
              doc.setTextColor(100, 100, 100)
              const descLines = doc.splitTextToSize(chart.description, 160)
              doc.text(descLines, 20, yPos)
              yPos += descLines.length * 4 + 10
            }
          } catch (error) {
            console.warn(`Failed to add chart image ${i} to PDF:`, error)
            // Add placeholder text instead
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.text(`[Chart visualization not available]`, 20, yPos)
            yPos += 15
          }
        }
      }
    }
    
    // Insights section
    if (yPos > 200) {
      doc.addPage()
      yPos = 30
    }
    
    yPos += 15
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text('AI-Generated Insights', 20, yPos)
    
    yPos += 15
    doc.setFontSize(12)
    
    insights.slice(0, 8).forEach((insight, index) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 30
      }
      
      // Insight title
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${insight.title}`, 20, yPos)
      yPos += 8
      
      // Insight details
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(`Type: ${insight.type} | Confidence: ${Math.round(insight.confidence * 100)}%`, 25, yPos)
      yPos += 8
      
      // Insight description
      doc.setTextColor(0, 0, 0)
      const description = insight.description
      const lines = doc.splitTextToSize(description, 160)
      doc.text(lines, 25, yPos)
      yPos += lines.length * 6 + 5
      
      // Affected columns
      if (insight.affectedColumns && insight.affectedColumns.length > 0) {
        doc.setTextColor(100, 100, 100)
        doc.text(`Affected Columns: ${insight.affectedColumns.join(', ')}`, 25, yPos)
        yPos += 8
      }
      
      yPos += 5
    })
    
    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      doc.text('Generated by Woodcrest AI - AI-Powered Data Analysis Platform', 20, 285)
      doc.text(`Page ${i} of ${pageCount}`, 170, 285)
    }
    
    // Save the PDF
    const cleanFileName = fileName.replace(/\.[^/.]+$/, '')
    doc.save(`${cleanFileName}_analysis_report.pdf`)
    
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error('Failed to generate PDF report')
  }
}

async function generateClientSidePPTX(exportData: ExportData, chartImages: string[]): Promise<void> {
  try {
    const pptx = new PptxGenJS()
    const { fileName, summary, insights, charts } = exportData
    
    // Set presentation properties
    pptx.author = 'Woodcrest AI'
    pptx.company = 'Woodcrest AI Platform'
    pptx.title = `Analysis Report - ${fileName}`
    
    // Slide 1: Title slide
    const slide1 = pptx.addSlide()
    slide1.background = { fill: 'F8F9FA' }
    
    slide1.addText('Woodcrest AI Analysis Report', {
      x: 1,
      y: 1.5,
      w: 8,
      h: 1,
      fontSize: 32,
      bold: true,
      color: '667EEA',
      align: 'center'
    })
    
    slide1.addText(fileName, {
      x: 1,
      y: 2.8,
      w: 8,
      h: 0.8,
      fontSize: 24,
      color: '333333',
      align: 'center'
    })
    
    slide1.addText(`Generated on ${summary.analysisDate}`, {
      x: 1,
      y: 3.8,
      w: 8,
      h: 0.5,
      fontSize: 16,
      color: '666666',
      align: 'center'
    })
    
    // Slide 2: Summary
    const slide2 = pptx.addSlide()
    slide2.background = { fill: 'FFFFFF' }
    
    slide2.addText('Analysis Summary', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: '333333'
    })
    
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Rows', summary.totalRows.toString()],
      ['Total Columns', summary.totalColumns.toString()],
      ['Charts Generated', summary.totalCharts.toString()],
      ['AI Insights', summary.totalInsights.toString()]
    ]
    
    slide2.addTable(summaryData, {
      x: 1,
      y: 1.5,
      w: 8,
      h: 3,
      fontSize: 16,
      border: { pt: 1, color: 'DDDDDD' },
      fill: { color: 'F8F9FA' },
      color: '333333'
    })
    
    // Slide 3: Charts (if available)
    if (chartImages.length > 0) {
      const slide3 = pptx.addSlide()
      slide3.background = { fill: 'FFFFFF' }
      
      slide3.addText('Data Visualizations', {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.8,
        fontSize: 28,
        bold: true,
        color: '333333'
      })
      
      // Add up to 4 charts per slide
      const chartsPerSlide = 4
      let currentSlide = slide3
      let slideIndex = 0
      
      for (let i = 0; i < Math.min(chartImages.length, charts.length); i++) {
        const chartImage = chartImages[i]
        const chart = charts[i]
        
        if (chartImage && chartImage !== '') {
          // Create new slide if needed (after first 4 charts)
          if (i > 0 && i % chartsPerSlide === 0) {
            currentSlide = pptx.addSlide()
            currentSlide.background = { fill: 'FFFFFF' }
            currentSlide.addText('Data Visualizations (continued)', {
              x: 0.5,
              y: 0.5,
              w: 9,
              h: 0.8,
              fontSize: 28,
              bold: true,
              color: '333333'
            })
            slideIndex++
          }
          
          const positionIndex = i % chartsPerSlide
          const x = (positionIndex % 2) * 4.5 + 0.5
          const y = Math.floor(positionIndex / 2) * 3 + 1.5
          
          try {
            // Add chart title
            currentSlide.addText(chart.title || `Chart ${i + 1}`, {
              x: x,
              y: y,
              w: 4,
              h: 0.3,
              fontSize: 12,
              bold: true,
              color: '333333'
            })
            
            // Add chart image
            currentSlide.addImage({
              data: chartImage,
              x: x,
              y: y + 0.4,
              w: 4,
              h: 2.5
            })
          } catch (error) {
            console.warn(`Failed to add chart ${i} to PowerPoint:`, error)
            // Add placeholder text
            currentSlide.addText(`[Chart ${i + 1} not available]`, {
              x: x,
              y: y + 1,
              w: 4,
              h: 0.5,
              fontSize: 12,
              color: '999999',
              align: 'center'
            })
          }
        }
      }
    }
    
    // Slide 4: Key Insights
    const slide4 = pptx.addSlide()
    slide4.background = { fill: 'FFFFFF' }
    
    slide4.addText('Key AI Insights', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: '333333'
    })
    
    const topInsights = insights.slice(0, 5)
    topInsights.forEach((insight, index) => {
      const yPos = 1.5 + (index * 0.8)
      
      slide4.addText(`• ${insight.title}`, {
        x: 0.5,
        y: yPos,
        w: 9,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: '333333'
      })
      
      slide4.addText(`  ${insight.description.substring(0, 100)}...`, {
        x: 0.7,
        y: yPos + 0.3,
        w: 8.5,
        h: 0.4,
        fontSize: 12,
        color: '666666'
      })
    })
    
    // Slide 5: Recommendations
    const recommendations = insights.filter(insight => insight.type === 'recommendation')
    if (recommendations.length > 0) {
      const slide5 = pptx.addSlide()
      slide5.background = { fill: 'FFFFFF' }
      
      slide5.addText('Recommendations', {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.8,
        fontSize: 28,
        bold: true,
        color: '333333'
      })
      
      recommendations.slice(0, 4).forEach((rec, index) => {
        const yPos = 1.5 + (index * 1)
        
        slide5.addText(`${index + 1}. ${rec.title}`, {
          x: 0.5,
          y: yPos,
          w: 9,
          h: 0.4,
          fontSize: 16,
          bold: true,
          color: '667EEA'
        })
        
        slide5.addText(rec.description, {
          x: 0.7,
          y: yPos + 0.4,
          w: 8.5,
          h: 0.5,
          fontSize: 12,
          color: '333333'
        })
      })
    }
    
    // Save the presentation
    const cleanFileName = fileName.replace(/\.[^/.]+$/, '')
    await pptx.writeFile({ fileName: `${cleanFileName}_analysis_presentation.pptx` })
    
  } catch (error) {
    console.error('PPTX generation error:', error)
    throw new Error('Failed to generate PowerPoint presentation')
  }
}

// Fallback export functions for when libraries are not available
export function exportToCSV(data: any[], fileName: string): void {
  if (!data || data.length === 0) {
    throw new Error('No data to export')
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${fileName.replace(/\.[^/.]+$/, '')}_data.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportInsightsToText(insights: any[], fileName: string): void {
  if (!insights || insights.length === 0) {
    throw new Error('No insights to export')
  }

  const content = [
    `AI Analysis Insights - ${fileName}`,
    `Generated on: ${new Date().toLocaleDateString()}`,
    '='.repeat(50),
    '',
    ...insights.map((insight, index) => [
      `${index + 1}. ${insight.title}`,
      `Type: ${insight.type}`,
      `Confidence: ${Math.round(insight.confidence * 100)}%`,
      `Description: ${insight.description}`,
      `Affected Columns: ${insight.affectedColumns?.join(', ') || 'None'}`,
      ''
    ]).flat()
  ].join('\n')

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${fileName.replace(/\.[^/.]+$/, '')}_insights.txt`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}