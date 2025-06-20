import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Login } from './pages/auth/Login'
import { Signup } from './pages/auth/Signup'
import { Dashboard } from './pages/Dashboard'
import { Upload } from './pages/Upload'
import { Insights } from './pages/Insights'
import { History } from './pages/History'
import { Settings } from './pages/Settings'
import { Subscription } from './pages/Subscription'
import { SQLGenerator } from './pages/SQLGenerator'
import { SchemaManager } from './pages/SchemaManager'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected routes */}
        {user ? (
          <>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/sql-generator" element={<SQLGenerator />} />
            <Route path="/schemas" element={<SchemaManager />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/subscription" element={<Subscription />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  )
}

export default App