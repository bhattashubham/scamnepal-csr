'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth'
import { AuthService } from '@/lib/api/services/auth'
import { Shield, AlertTriangle, Users, Search, FileText } from 'lucide-react'

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore()
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking')

  useEffect(() => {
    // Test API connectivity
    const testConnection = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const backendUrl = baseUrl.includes('/api') ? baseUrl.replace('/api', '') : baseUrl
        const response = await fetch(`${backendUrl}/health`)
        if (response.ok) {
          setApiStatus('connected')
        } else {
          setApiStatus('error')
        }
      } catch (error) {
        setApiStatus('error')
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Community Scam Registry</h1>
            </div>
            
            {/* API Status Indicator */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${
                  apiStatus === 'connected' ? 'bg-green-500' : 
                  apiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="text-sm text-gray-600">
                  {apiStatus === 'connected' ? 'API Connected' : 
                   apiStatus === 'error' ? 'API Disconnected' : 'Checking API...'}
                </span>
              </div>
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
                  <button 
                    onClick={() => useAuthStore.getState().logout()}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link href="/auth">
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    Sign In
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Protect Yourself and Others from Scams
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A community-driven platform for tracking, reporting, and verifying scams. 
            Together, we can build a safer digital world.
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => window.location.href = '/dashboard/reports/new'}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Report a Scam
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard/search'}
              className="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
            >
              Search Registry
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="bg-red-100 p-3 rounded-lg w-fit mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Scams</h3>
            <p className="text-gray-600">
              Quickly report scams you've encountered to warn others and build our database.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Search & Verify</h3>
            <p className="text-gray-600">
              Search our database to verify suspicious entities before engaging.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="bg-green-100 p-3 rounded-lg w-fit mb-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Driven</h3>
            <p className="text-gray-600">
              Join a community of users working together to identify and prevent scams.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="bg-purple-100 p-3 rounded-lg w-fit mb-4">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Verified Data</h3>
            <p className="text-gray-600">
              Our moderation system ensures data quality and prevents false reports.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-sm border">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Community Impact
          </h3>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">1,247</div>
              <div className="text-gray-600">Reports Submitted</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">892</div>
              <div className="text-gray-600">Scams Verified</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">₹2.4M</div>
              <div className="text-gray-600">Potential Losses Prevented</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">5,683</div>
              <div className="text-gray-600">Community Members</div>
            </div>
          </div>
        </div>

        {/* Debug Info (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-100 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Development Info</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div>API URL: {process.env.NEXT_PUBLIC_API_URL}</div>
              <div>Auth Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
              <div>API Status: {apiStatus}</div>
              <div>User: {user ? user.email : 'None'}</div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}