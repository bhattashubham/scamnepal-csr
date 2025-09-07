/**
 * Network Status Monitoring Hook
 * Provides real-time network status and offline mode handling
 */

import { useState, useEffect, useCallback } from 'react'
import { ErrorHandler } from '@/lib/error-handler'
import { ErrorContext } from '@/types/errors'

interface NetworkStatus {
  isOnline: boolean
  isSlowConnection: boolean
  connectionType: string
  effectiveType: string
  downlink: number
  rtt: number
  lastOnlineTime: Date | null
  lastOfflineTime: Date | null
  offlineDuration: number
  reconnectAttempts: number
}

interface UseNetworkStatusReturn {
  networkStatus: NetworkStatus
  isOnline: boolean
  isOffline: boolean
  isSlowConnection: boolean
  connectionType: string
  effectiveType: string
  downlink: number
  rtt: number
  lastOnlineTime: Date | null
  lastOfflineTime: Date | null
  offlineDuration: number
  reconnectAttempts: number
  retryConnection: () => void
  clearOfflineDuration: () => void
}

const INITIAL_STATUS: NetworkStatus = {
  isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
  isSlowConnection: false,
  connectionType: 'unknown',
  effectiveType: 'unknown',
  downlink: 0,
  rtt: 0,
  lastOnlineTime: typeof window !== 'undefined' && navigator.onLine ? new Date() : null,
  lastOfflineTime: typeof window !== 'undefined' && !navigator.onLine ? new Date() : null,
  offlineDuration: 0,
  reconnectAttempts: 0,
}

export function useNetworkStatus(): UseNetworkStatusReturn {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(INITIAL_STATUS)
  const [offlineStartTime, setOfflineStartTime] = useState<Date | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  // Update network status
  const updateNetworkStatus = useCallback(() => {
    if (typeof window === 'undefined') return
    
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    const isOnline = navigator.onLine
    const now = new Date()

    setNetworkStatus(prevStatus => {
      const newStatus = { ...prevStatus }

      // Update online status
      if (isOnline !== prevStatus.isOnline) {
        newStatus.isOnline = isOnline
        
        if (isOnline) {
          newStatus.lastOnlineTime = now
          newStatus.offlineDuration = offlineStartTime ? now.getTime() - offlineStartTime.getTime() : 0
          setOfflineStartTime(null)
        } else {
          newStatus.lastOfflineTime = now
          setOfflineStartTime(now)
        }
      }

      // Update connection information if available
      if (connection) {
        newStatus.connectionType = connection.type || 'unknown'
        newStatus.effectiveType = connection.effectiveType || 'unknown'
        newStatus.downlink = connection.downlink || 0
        newStatus.rtt = connection.rtt || 0
        
        // Determine if connection is slow
        newStatus.isSlowConnection = connection.effectiveType === 'slow-2g' || 
                                   connection.effectiveType === '2g' ||
                                   connection.downlink < 0.5
      }

      // Update offline duration if currently offline
      if (!isOnline && offlineStartTime) {
        newStatus.offlineDuration = now.getTime() - offlineStartTime.getTime()
      }

      newStatus.reconnectAttempts = reconnectAttempts

      return newStatus
    })
  }, [offlineStartTime, reconnectAttempts])

  // Retry connection
  const retryConnection = useCallback(() => {
    if (typeof window === 'undefined') return
    
    setReconnectAttempts(prev => prev + 1)
    
    // Try to make a simple request to test connectivity
    fetch('/api/health', { 
      method: 'HEAD',
      cache: 'no-cache',
      mode: 'no-cors'
    }).then(() => {
      // If successful, update status
      updateNetworkStatus()
    }).catch(() => {
      // If failed, log the error
      const context: ErrorContext = {
        component: 'useNetworkStatus',
        action: 'retryConnection',
        timestamp: new Date(),
        additionalData: {
          attempt: reconnectAttempts + 1,
          offlineDuration: networkStatus.offlineDuration,
        }
      }
      
      ErrorHandler.handle(new Error('Connection retry failed'), context)
    })
  }, [reconnectAttempts, networkStatus.offlineDuration, updateNetworkStatus])

  // Clear offline duration
  const clearOfflineDuration = useCallback(() => {
    setOfflineStartTime(null)
    setNetworkStatus(prev => ({
      ...prev,
      offlineDuration: 0,
    }))
  }, [])

  // Set up event listeners
  useEffect(() => {
    const handleOnline = () => {
      updateNetworkStatus()
      
      // Log network recovery
      const context: ErrorContext = {
        component: 'useNetworkStatus',
        action: 'networkRecovered',
        timestamp: new Date(),
        additionalData: {
          offlineDuration: networkStatus.offlineDuration,
          reconnectAttempts,
        }
      }
      
      ErrorHandler.handle(new Error('Network connection restored'), context)
    }

    const handleOffline = () => {
      updateNetworkStatus()
      
      // Log network loss
      const context: ErrorContext = {
        component: 'useNetworkStatus',
        action: 'networkLost',
        timestamp: new Date(),
        additionalData: {
          connectionType: networkStatus.connectionType,
          effectiveType: networkStatus.effectiveType,
        }
      }
      
      ErrorHandler.handle(new Error('Network connection lost'), context)
    }

    const handleConnectionChange = () => {
      updateNetworkStatus()
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Add connection change listener if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (connection) {
      connection.addEventListener('change', handleConnectionChange)
    }

    // Initial status update
    updateNetworkStatus()

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange)
      }
    }
  }, [updateNetworkStatus, networkStatus.offlineDuration, reconnectAttempts, networkStatus.connectionType, networkStatus.effectiveType])

  // Update offline duration periodically
  useEffect(() => {
    if (!networkStatus.isOnline && offlineStartTime) {
      const interval = setInterval(() => {
        updateNetworkStatus()
      }, 1000) // Update every second

      return () => clearInterval(interval)
    }
  }, [networkStatus.isOnline, offlineStartTime, updateNetworkStatus])

  return {
    networkStatus,
    isOnline: networkStatus.isOnline,
    isOffline: !networkStatus.isOnline,
    isSlowConnection: networkStatus.isSlowConnection,
    connectionType: networkStatus.connectionType,
    effectiveType: networkStatus.effectiveType,
    downlink: networkStatus.downlink,
    rtt: networkStatus.rtt,
    lastOnlineTime: networkStatus.lastOnlineTime,
    lastOfflineTime: networkStatus.lastOfflineTime,
    offlineDuration: networkStatus.offlineDuration,
    reconnectAttempts: networkStatus.reconnectAttempts,
    retryConnection,
    clearOfflineDuration,
  }
}

// Hook for simple online/offline status
export function useOnlineStatus(): boolean {
  const { isOnline } = useNetworkStatus()
  return isOnline
}

// Hook for connection quality
export function useConnectionQuality(): {
  isSlowConnection: boolean
  connectionType: string
  effectiveType: string
  downlink: number
  rtt: number
} {
  const { isSlowConnection, connectionType, effectiveType, downlink, rtt } = useNetworkStatus()
  
  return {
    isSlowConnection,
    connectionType,
    effectiveType,
    downlink,
    rtt,
  }
}
