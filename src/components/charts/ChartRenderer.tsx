import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ScatterController,
  ArcElement,
  RadialLinearScale
} from 'chart.js'
import { Bar, Scatter, Line, Pie, Doughnut, PolarArea, Radar } from 'react-chartjs-2'
import { Card } from '../ui/Card'
import { TrendingUp } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ScatterController,
  ArcElement,
  RadialLinearScale
)

interface ChartRendererProps {
  config: any
}

export function ChartRenderer({ config }: ChartRendererProps) {
  // Normalize chart type to handle variations
  const normalizeChartType = (type: string): string => {
    const lowerType = type.toLowerCase().trim()
    
    // Handle common variations and aliases
    switch (lowerType) {
      case 'histogram':
      case 'column':
      case 'vertical-bar':
        return 'bar'
      case 'area':
      case 'line-area':
        return 'line'
      case 'donut':
      case 'doughnut':
        return 'doughnut'
      case 'polar':
      case 'polar-area':
        return 'polarArea'
      case 'radar':
      case 'spider':
        return 'radar'
      case 'scatter-plot':
      case 'scatterplot':
        return 'scatter'
      default:
        return lowerType
    }
  }

  const chartType = normalizeChartType(config.type || 'bar')

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      title: {
        display: true,
        text: config.title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: '#1f2937',
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
      }
    },
    scales: !['pie', 'doughnut', 'polarArea', 'radar'].includes(chartType) ? {
      x: {
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
          borderColor: 'rgba(156, 163, 175, 0.2)'
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
          borderColor: 'rgba(156, 163, 175, 0.2)'
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11
          }
        }
      }
    } : undefined,
    elements: {
      bar: {
        borderRadius: 8,
        borderSkipped: false,
      },
      point: {
        radius: 6,
        hoverRadius: 8,
        borderWidth: 2,
        hoverBorderWidth: 3
      },
      line: {
        borderWidth: 3,
        tension: 0.4
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const
    }
  }

  // Ensure chart data has proper structure
  const ensureChartData = (data: any) => {
    if (!data) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'No Data',
          data: [0],
          backgroundColor: 'rgba(156, 163, 175, 0.6)',
          borderColor: 'rgba(156, 163, 175, 1)',
          borderWidth: 1
        }]
      }
    }

    // Ensure datasets exist and have proper structure
    if (!data.datasets || !Array.isArray(data.datasets)) {
      data.datasets = [{
        label: 'Data',
        data: data.data || [0],
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }]
    }

    // Ensure each dataset has required properties
    data.datasets = data.datasets.map((dataset: any, index: number) => ({
      label: dataset.label || `Dataset ${index + 1}`,
      data: dataset.data || [0],
      backgroundColor: dataset.backgroundColor || `rgba(${59 + index * 40}, ${130 + index * 20}, 246, 0.6)`,
      borderColor: dataset.borderColor || `rgba(${59 + index * 40}, ${130 + index * 20}, 246, 1)`,
      borderWidth: dataset.borderWidth || 1,
      ...dataset
    }))

    return data
  }

  const chartData = ensureChartData(config.data)

  const renderChart = () => {
    try {
      switch (chartType) {
        case 'bar':
          return <Bar data={chartData} options={options} />
        case 'line':
          return <Line data={chartData} options={options} />
        case 'scatter':
          return <Scatter data={chartData} options={options} />
        case 'pie':
          return <Pie data={chartData} options={options} />
        case 'doughnut':
          return <Doughnut data={chartData} options={options} />
        case 'polarArea':
          return <PolarArea data={chartData} options={options} />
        case 'radar':
          return <Radar data={chartData} options={options} />
        default:
          // Fallback to bar chart for unknown types
          console.warn(`Unknown chart type: ${config.type}, falling back to bar chart`)
          return <Bar data={chartData} options={options} />
      }
    } catch (error) {
      console.error('Error rendering chart:', error)
      return (
        <div className="flex items-center justify-center h-full text-neutral-500">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Error rendering chart</p>
            Woodcrest AI
          </div>
        </div>
      )
    }
  }

  return (
    <Card className="chart-container group hover-lift relative overflow-hidden" data-chart-id={`chart-${Math.random().toString(36).substr(2, 9)}`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-32 h-32 bg-gradient-to-br from-primary-400/10 to-secondary-400/10 rounded-full blur-2xl animate-float" />
        <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-br from-accent-400/10 to-primary-400/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Chart header */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-neutral-900">{config.title}</h3>
        </div>
        <div className="px-3 py-1 bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 text-xs font-medium rounded-full">
          AI Generated
        </div>
      </div>

      {/* Chart container */}
      <div className="relative z-10 h-80 chart-canvas-container">
        {renderChart()}
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
    </Card>
  )
}