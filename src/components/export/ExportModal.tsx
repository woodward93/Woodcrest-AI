import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Download, FileText, Presentation, X, Crown, Lock } from 'lucide-react'
import { useSubscription } from '../../hooks/useSubscription'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  analysis: any
  onExport: (format: 'pdf' | 'ppt') => Promise<void>
}

export function ExportModal({ isOpen, onClose, analysis, onExport }: ExportModalProps) {
  const { limits, subscriptionPlan } = useSubscription()
  const [exporting, setExporting] = useState<'pdf' | 'ppt' | null>(null)

  if (!isOpen) return null

  const handleExport = async (format: 'pdf' | 'ppt') => {
    if (!limits.canExport) return

    setExporting(format)
    try {
      await onExport(format)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Export Analysis</h3>
              <p className="text-gray-600 text-sm">{analysis?.file_name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!limits.canExport ? (
          <div className="text-center py-8">
            <div className="h-16 w-16 mx-auto bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Premium Feature</h4>
            <p className="text-gray-600 text-sm mb-6">
              Export functionality is available exclusively for Woodcrest AI Premium users. 
              Upgrade your plan to export your analyses in PDF or PowerPoint format.
            </p>
            <Button 
              className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700"
              onClick={onClose}
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm mb-6">
              Choose your preferred export format. Your analysis will include all charts, insights, and data summaries.
            </p>

            <div className="grid grid-cols-1 gap-4">
              {/* PDF Export */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">PDF Report</h4>
                      <p className="text-gray-600 text-sm">Professional document format</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleExport('pdf')}
                    loading={exporting === 'pdf'}
                    disabled={exporting !== null}
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  • Includes all charts and visualizations
                  • AI insights and recommendations
                  • Data summary and statistics
                  • Professional formatting
                </div>
              </div>

              {/* PowerPoint Export */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Presentation className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">PowerPoint Presentation</h4>
                      <p className="text-gray-600 text-sm">Ready-to-present slides</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleExport('ppt')}
                    loading={exporting === 'ppt'}
                    disabled={exporting !== null}
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PPT
                  </Button>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  • Structured presentation slides
                  • Charts optimized for presentations
                  • Executive summary slide
                  • Editable PowerPoint format
                </div>
              </div>
            </div>

            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Download className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <p className="text-blue-900 text-sm font-medium">Export Information</p>
                  <p className="text-blue-800 text-xs mt-1">
                    Exports include all analysis data, charts, and AI-generated insights. 
                    Files will be downloaded to your device automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}