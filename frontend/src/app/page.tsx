'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth'
import { AuthService } from '@/lib/api/services/auth'
import { Shield, AlertTriangle, Users, Search, FileText } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { getApiUrl, APP_CONFIG } from '@/lib/config'

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore()
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking')

  useEffect(() => {
    // Test API connectivity
    const testConnection = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/health`)
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Community Scam Registry</h1>
            </div>
            
            {/* API Status Indicator */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${
                  apiStatus === 'connected' ? 'bg-success' : 
                  apiStatus === 'error' ? 'bg-destructive' : 'bg-warning'
                }`} />
                <span className="text-sm text-muted-foreground">
                  {apiStatus === 'connected' ? 'API Connected' : 
                   apiStatus === 'error' ? 'API Disconnected' : 'Checking API...'}
                </span>
              </div>
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Welcome, {user?.email}</span>
                  <button 
                    onClick={() => useAuthStore.getState().logout()}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link href="/auth">
                  <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
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
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Protect Yourself and Others from Scams
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            A community-driven platform for tracking, reporting, and verifying scams. 
            Together, we can build a safer digital world.
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => window.location.href = '/dashboard/reports/new'}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Report a Scam
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard/search'}
              className="border border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary/10 transition-colors"
            >
              Search Registry
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
            <div className="bg-destructive/10 p-3 rounded-lg w-fit mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Report Scams</h3>
            <p className="text-muted-foreground">
              Quickly report scams you've encountered to warn others and build our database.
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
            <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Search & Verify</h3>
            <p className="text-muted-foreground">
              Search our database to verify suspicious entities before engaging.
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
            <div className="bg-success/10 p-3 rounded-lg w-fit mb-4">
              <Users className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Community Driven</h3>
            <p className="text-muted-foreground">
              Join a community of users working together to identify and prevent scams.
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
            <div className="bg-info/10 p-3 rounded-lg w-fit mb-4">
              <FileText className="h-6 w-6 text-info" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Verified Data</h3>
            <p className="text-muted-foreground">
              Our moderation system ensures data quality and prevents false reports.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 bg-card rounded-2xl p-8 shadow-sm border border-border">
          <h3 className="text-2xl font-bold text-foreground text-center mb-8">
            Community Impact
          </h3>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">1,247</div>
              <div className="text-muted-foreground">Reports Submitted</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success">892</div>
              <div className="text-muted-foreground">Scams Verified</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-info">₹2.4M</div>
              <div className="text-muted-foreground">Potential Losses Prevented</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">5,683</div>
              <div className="text-muted-foreground">Community Members</div>
            </div>
          </div>
        </div>

        {/* Debug Info (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-muted rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-2">Development Info</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>API URL: {getApiUrl()}</div>
              <div>App Name: {APP_CONFIG.name}</div>
              <div>App Version: {APP_CONFIG.version}</div>
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