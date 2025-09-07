/**
 * Offline Indicator Component
 * Standalone component for showing offline status and sync information
 */

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { WifiOff, Wifi, RefreshCw, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

interface OfflineIndicatorProps {
  variant?: 'banner' | 'card' | 'toast' | 'minimal'
  showSyncStatus?: boolean
  showRetryButton?: boolean
  onRetry?: () => void
  className?: string
}

export function OfflineIndicator({ 
  variant = 'banner',
  showSyncStatus = true,
  showRetryButton = true,
  onRetry,
  className 
}: OfflineIndicatorProps) {
  const { 
    isOnline, 
    isOffline, 
    offlineDuration, 
    reconnectAttempts,
    retryConnection 
  } = useNetworkStatus()
  
  const [isVisible, setIsVisible] = useState(false)
  const [pendingRequests, setPendingRequests] = useState(0)

  // Show indicator when offline or when there are pending requests
  useEffect(() => {
    setIsVisible(isOffline || pendingRequests > 0)
  }, [isOffline, pendingRequests])

  // Simulate pending requests (in real app, this would come from API client)
  useEffect(() => {
    if (isOffline) {
      // Simulate some pending requests when going offline
      setPendingRequests(3)
    } else {
      // Clear pending requests when back online
      setPendingRequests(0)
    }
  }, [isOffline])

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      retryConnection()
    }
  }

  if (!isVisible) return null

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center space-x-2 text-xs", className)}>
        {isOffline ? (
          <>
            <WifiOff className="h-3 w-3 text-destructive" />
            <span className="text-destructive">Offline</span>
          </>
        ) : (
          <>
            <Wifi className="h-3 w-3 text-success" />
            <span className="text-success">Online</span>
          </>
        )}
      </div>
    )
  }

  if (variant === 'toast') {
    return (
      <div className={cn(
        "fixed top-4 right-4 z-50 max-w-sm",
        isOffline ? "bg-destructive-muted border-destructive/20" : "bg-success-muted border-success/20",
        "border rounded-lg p-3 shadow-lg",
        className
      )}>
        <div className="flex items-center space-x-2">
          {isOffline ? (
            <WifiOff className="h-4 w-4 text-destructive" />
          ) : (
            <Wifi className="h-4 w-4 text-success" />
          )}
          <div className="flex-1">
            <p className={cn(
              "text-sm font-medium",
              isOffline ? "text-destructive" : "text-success"
            )}>
              {isOffline ? 'You\'re offline' : 'Back online'}
            </p>
            {isOffline && (
              <p className="text-xs text-muted-foreground">
                Offline for {formatDuration(offlineDuration)}
              </p>
            )}
          </div>
          {isOffline && showRetryButton && (
            <Button
              onClick={handleRetry}
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
            >
              Retry
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <Card className={cn(
        "border",
        isOffline ? "border-destructive/20 bg-destructive-muted" : "border-success/20 bg-success-muted",
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            {isOffline ? (
              <WifiOff className="h-5 w-5 text-destructive" />
            ) : (
              <Wifi className="h-5 w-5 text-success" />
            )}
            <div className="flex-1">
              <h3 className={cn(
                "font-medium",
                isOffline ? "text-destructive" : "text-success"
              )}>
                {isOffline ? 'You\'re offline' : 'Connection restored'}
              </h3>
              {isOffline && (
                <p className="text-sm text-muted-foreground">
                  Offline for {formatDuration(offlineDuration)}
                </p>
              )}
            </div>
            {isOffline && showRetryButton && (
              <Button
                onClick={handleRetry}
                size="sm"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default banner variant
  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 p-3 text-center",
      isOffline ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground",
      className
    )}>
      <div className="flex items-center justify-center space-x-2">
        {isOffline ? (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="font-medium">You're offline</span>
            <span className="text-sm opacity-90">
              • Offline for {formatDuration(offlineDuration)}
            </span>
            {reconnectAttempts > 0 && (
              <span className="text-sm opacity-90">
                • {reconnectAttempts} reconnect attempts
              </span>
            )}
            {showRetryButton && (
              <Button
                onClick={handleRetry}
                size="sm"
                variant="secondary"
                className="ml-2 h-6 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4" />
            <span className="font-medium">Connection restored</span>
            <span className="text-sm opacity-90">
              • Syncing your data...
            </span>
          </>
        )}
      </div>
    </div>
  )
}

// Sync status component
interface SyncStatusProps {
  pendingRequests: number
  lastSync?: Date
  isSyncing?: boolean
  className?: string
}

export function SyncStatus({ 
  pendingRequests, 
  lastSync, 
  isSyncing = false,
  className 
}: SyncStatusProps) {
  const getSyncIcon = () => {
    if (isSyncing) return RefreshCw
    if (pendingRequests > 0) return Clock
    return CheckCircle
  }

  const getSyncMessage = () => {
    if (isSyncing) return 'Syncing...'
    if (pendingRequests > 0) return `${pendingRequests} pending`
    return 'All synced'
  }

  const getSyncColor = () => {
    if (isSyncing) return 'text-info'
    if (pendingRequests > 0) return 'text-warning'
    return 'text-success'
  }

  const Icon = getSyncIcon()

  return (
    <div className={cn("flex items-center space-x-2 text-xs", className)}>
      <Icon className={cn("h-3 w-3", getSyncColor(), isSyncing && "animate-spin")} />
      <span className={getSyncColor()}>{getSyncMessage()}</span>
      {lastSync && (
        <span className="text-muted-foreground">
          ({lastSync.toLocaleTimeString()})
        </span>
      )}
    </div>
  )
}

// Network quality indicator
interface NetworkQualityProps {
  connectionType: string
  effectiveType: string
  downlink: number
  rtt: number
  className?: string
}

export function NetworkQuality({ 
  connectionType, 
  effectiveType, 
  downlink, 
  rtt,
  className 
}: NetworkQualityProps) {
  const getQualityColor = () => {
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'text-destructive'
    if (effectiveType === '3g') return 'text-warning'
    return 'text-success'
  }

  const getQualityIcon = () => {
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return AlertTriangle
    if (effectiveType === '3g') return Clock
    return CheckCircle
  }

  const Icon = getQualityIcon()

  return (
    <div className={cn("flex items-center space-x-2 text-xs", className)}>
      <Icon className={cn("h-3 w-3", getQualityColor())} />
      <span className={getQualityColor()}>
        {effectiveType.toUpperCase()} • {downlink.toFixed(1)}Mbps
      </span>
    </div>
  )
}
