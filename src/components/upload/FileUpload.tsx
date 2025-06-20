import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, AlertCircle, Sparkles, Zap, CheckCircle, Brain } from 'lucide-react'
import { Card } from '../ui/Card'
import { useSubscription } from '../../hooks/useSubscription'

interface FileUploadProps {
  onFileUpload: (file: File) => void
  loading?: boolean
  error?: string
}

export function FileUpload({ onFileUpload, loading, error }: FileUploadProps) {
  const { limits } = useSubscription()


  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      
      // Check file size limit
      const fileSizeMB = file.size / (1024 * 1024)
      if (fileSizeMB > limits.maxFileSize) {
        // Create a custom error event
        const errorEvent = new CustomEvent('fileUploadError', {
          detail: `File size (${fileSizeMB.toFixed(1)}MB) exceeds the ${limits.maxFileSize}MB limit for your plan. Please upgrade to Premium for larger file uploads.`
        })
        window.dispatchEvent(errorEvent)
        return
      }
      
      onFileUpload(file)
    }
  }, [onFileUpload, limits.maxFileSize])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    disabled: loading,
    maxSize: limits.maxFileSize * 1024 * 1024 // Convert MB to bytes
  })

  return (
    <Card variant="glass" className="text-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary-400/20 to-secondary-400/20 rounded-full blur-2xl animate-float" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-accent-400/20 to-primary-400/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div
        {...getRootProps()}
        className={`
          relative z-10 border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all duration-300
          ${isDragActive 
            ? 'border-primary-400 bg-gradient-to-br from-primary-50/80 to-secondary-50/80 scale-105' 
            : 'border-neutral-300 hover:border-primary-400 hover:bg-gradient-to-br hover:from-primary-50/50 hover:to-secondary-50/50'
          }
          ${loading && 'opacity-50 cursor-not-allowed'}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-6">
          {loading ? (
            <div className="animate-bounce-light">
              <div className="h-20 w-20 mx-auto bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-glow relative">
                <div className="animate-spin h-8 w-8 border-3 border-white border-t-transparent rounded-full" />
                <div className="absolute -top-2 -right-2 h-6 w-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="h-20 w-20 mx-auto bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-glow hover:shadow-glow-lg transition-all duration-300 group">
                <Upload className="h-10 w-10 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="absolute -top-2 -right-2 h-6 w-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-3">
              {loading ? (
                <span className="loading-dots flex items-center justify-center space-x-2">
                  <span>AI is analyzing your data</span>
                  <Brain className="h-5 w-5 animate-pulse" />
                </span>
              ) : (
                'Upload your data file'
              )}
            </h3>
            <p className="text-neutral-600 mb-6 text-lg">
              {isDragActive 
                ? 'Drop your file here to start the magic...'
                : `Drag & drop your CSV or Excel file here, or click to browse (max ${limits.maxFileSize}MB)`
              }
            </p>
            
            <div className="flex items-center justify-center space-x-8 text-neutral-500">
              <div className="flex items-center space-x-2 p-3 bg-white/50 backdrop-blur-xl rounded-xl border border-white/30">
                <FileSpreadsheet className="h-6 w-6 text-green-600" />
                <span className="font-medium">CSV</span>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-white/50 backdrop-blur-xl rounded-xl border border-white/30">
                <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                <span className="font-medium">Excel</span>
              </div>
            </div>
          </div>

          {!loading && (
            <div className="p-4 bg-gradient-to-r from-primary-50/80 to-secondary-50/80 rounded-xl border border-primary-200/50">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Brain className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-medium text-primary-800">AI-Powered Analysis</span>
              </div>
              <p className="text-xs text-primary-700">
                Woodcrest AI will automatically detect patterns, generate insights, and create visualizations.
                File size limit: {limits.maxFileSize}MB
              </p>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl flex items-center space-x-3 text-red-700 animate-slide-down">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
    </Card>
  )
}