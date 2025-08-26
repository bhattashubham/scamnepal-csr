'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, user, isLoading, isInitialized, getProfile, initialize } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    console.log('🏠 Dashboard Layout: useEffect triggered', { isAuthenticated, user, isLoading, isInitialized })
    
    // Initialize auth state if not already done
    if (!isInitialized) {
      console.log('🏠 Dashboard Layout: Initializing auth state')
      initialize()
      return
    }
    
    // Check authentication status
    if (!isAuthenticated) {
      console.log('🏠 Dashboard Layout: Not authenticated, redirecting to /auth')
      router.push('/auth')
      return
    }

    // Load user profile if not already loaded
    if (!user && isAuthenticated) {
      console.log('🏠 Dashboard Layout: Loading user profile')
      getProfile()
    }
  }, [isAuthenticated, user, router, getProfile, initialize, isInitialized])

  // Show loading state while initializing or checking auth
  if (!isInitialized || isLoading || (!user && isAuthenticated)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600 mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
