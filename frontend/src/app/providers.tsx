'use client'

import React, { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/stores/auth'
import { ThemeProvider } from '@/components/theme-provider'

// Component to initialize auth state
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initialize, isInitialized } = useAuthStore()

  useEffect(() => {
    if (!isInitialized) {
      console.log('🚀 App: Initializing auth state')
      initialize()
    }
  }, [initialize, isInitialized])

  return <>{children}</>
}

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer>
          {children}
        </AuthInitializer>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ThemeProvider>
  )
}
