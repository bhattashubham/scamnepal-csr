/**
 * Network Error Component
 * Specialized component for displaying network and API errors
 */

import React from 'react'
import { ProcessedError, NetworkError as NetworkErrorType } from '@/types/errors'
import { cn } from '@/lib/utils'
import { Wifi, WifiOff, AlertTriangle, RefreshCw, Clock } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

interface NetworkErrorProps {
  error: ProcessedError | NetworkErrorType
  variant?: 'inline' | 'card' | 'toast'
  showRetryButton?: boolean
  onRetry?: () => void
  className?: string
}

export function NetworkError({ 
  error, 
  variant = 'card',
  showRetryButton = true,
  onRetry,
  className 
}: NetworkErrorProps) {
  // Handle both ProcessedError and NetworkErrorType
  const message = 'message' in error ? error.message : (error as ProcessedError).userMessage
  const isOffline = typeof window !== 'undefined' ? !navigator.onLine : false
  const isTimeout = 'timeout' in error ? error.timeout : message.includes('timeout')
  const status = 'status' in error ? error.status : undefined

  const getNetworkIcon = () => {
    if (isOffline) return WifiOff
    if (isTimeout) return Clock
    if (status && status >= 500) return AlertTriangle
    return Wifi
  }

  const getNetworkMessage = () => {
    if (isOffline) {
      return 'You appear to be offline. Please check your internet connection.'
    }
    if (isTimeout) {
      return 'Request timed out. The server is taking too long to respond.'
    }
    if (status === 429) {
      return 'Too many requests. Please wait a moment before trying again.'
    }
    if (status && status >= 500) {
      return 'Server error. Please try again later.'
    }
    if (status === 404) {
      return 'The requested resource was not found.'
    }
    return message
  }

  const getRetryDelay = () => {
    if (status === 429) return 5000 // 5 seconds for rate limiting
    if (isTimeout) return 2000 // 2 seconds for timeout
    return 1000 // 1 second for other errors
  }

  const Icon = getNetworkIcon()

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Icon className="h-4 w-4 text-destructive flex-shrink-0" />
        <p className="text-sm text-destructive">
          {getNetworkMessage()}
        </p>
        {showRetryButton && onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    )
  }

  if (variant === 'toast') {
    return (
      <div className={cn("flex items-center space-x-2 p-3 bg-destructive-muted border border-destructive/20 rounded-lg", className)}>
        <Icon className="h-4 w-4 text-destructive flex-shrink-0" />
        <p className="text-sm text-destructive flex-1">
          {getNetworkMessage()}
        </p>
        {showRetryButton && onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10"
          >
            Retry
          </Button>
        )}
      </div>
    )
  }

  // Default card variant
  return (
    <Card className={cn("border-destructive/20 bg-destructive-muted", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-destructive" />
          <CardTitle className="text-lg text-destructive">
            Network Error
          </CardTitle>
        </div>
        <CardDescription className="text-destructive/80">
          {getNetworkMessage()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Details */}
        <div className="bg-background/50 rounded-lg p-3">
          <div className="space-y-2 text-sm">
            {status && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status Code:</span>
                <span className="font-mono text-foreground">{status}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connection:</span>
              <span className="text-foreground">
                {isOffline ? 'Offline' : 'Online'}
              </span>
            </div>
            {isTimeout && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issue:</span>
                <span className="text-foreground">Request Timeout</span>
              </div>
            )}
          </div>
        </div>

        {/* Recovery Actions */}
        {showRetryButton && onRetry && (
          <div className="flex gap-2">
            <Button
              onClick={onRetry}
              variant="default"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Request
            </Button>
            
            {isOffline && (
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            )}
          </div>
        )}

        {/* Network Status Indicator */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Network Status:</span>
          <div className="flex items-center space-x-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isOffline ? "bg-destructive" : "bg-success"
            )} />
            <span>{isOffline ? 'Offline' : 'Online'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Network status indicator component
interface NetworkStatusProps {
  className?: string
}

export function NetworkStatus({ className }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = React.useState(typeof window !== 'undefined' ? navigator.onLine : true)
  const [showOfflineMessage, setShowOfflineMessage] = React.useState(false)

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showOfflineMessage && isOnline) return null

  return (
    <div className={cn("fixed top-4 right-4 z-50", className)}>
      <NetworkError
        error={{
          message: 'You are currently offline',
          timeout: false,
          offline: !isOnline
        }}
        variant="toast"
        showRetryButton={false}
      />
    </div>
  )
}

// Connection retry component
interface ConnectionRetryProps {
  onRetry: () => void
  isRetrying?: boolean
  retryCount?: number
  maxRetries?: number
  className?: string
}

export function ConnectionRetry({ 
  onRetry, 
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  className 
}: ConnectionRetryProps) {
  const canRetry = retryCount < maxRetries
  const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000) // Exponential backoff, max 10s

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        onClick={onRetry}
        disabled={!canRetry || isRetrying}
        size="sm"
        variant="outline"
      >
        {isRetrying ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Retrying...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </>
        )}
      </Button>
      
      {retryCount > 0 && (
        <span className="text-xs text-muted-foreground">
          Attempt {retryCount + 1} of {maxRetries + 1}
        </span>
      )}
      
      {!canRetry && (
        <span className="text-xs text-destructive">
          Max retries reached
        </span>
      )}
    </div>
  )
}
