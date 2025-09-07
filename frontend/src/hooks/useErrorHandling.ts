/**
 * Comprehensive Error Handling Hook
 * Integrates all error handling services and provides a unified interface
 */

import { useState, useCallback, useEffect } from 'react'
import { ProcessedError, ErrorContext, ErrorMonitoringEvent } from '@/types/errors'
import { ErrorHandler } from '@/lib/error-handler'
import { errorMonitoringService } from '@/lib/error-monitoring'
import { accessibilityUtils } from '@/lib/accessibility'
import { useNetworkStatus } from './useNetworkStatus'

interface UseErrorHandlingReturn {
  // Error state
  errors: ProcessedError[]
  currentError: ProcessedError | null
  isErrorVisible: boolean
  
  // Error handling
  handleError: (error: any, context?: ErrorContext) => ProcessedError
  clearError: (errorId: string) => void
  clearAllErrors: () => void
  showError: (error: ProcessedError) => void
  hideError: () => void
  
  // Error recovery
  retryError: (errorId: string) => Promise<void>
  isRetrying: boolean
  
  // Error monitoring
  logError: (error: ProcessedError, context: ErrorContext, userAction?: string) => void
  recordEvent: (event: ErrorMonitoringEvent) => void
  collectFeedback: (errorId: string, rating: number, comment?: string, helpful?: boolean) => void
  
  // Accessibility
  announceError: (error: ProcessedError) => void
  focusError: (errorId: string) => void
  
  // Network status
  isOnline: boolean
  isOffline: boolean
  retryConnection: () => void
  
  // Error statistics
  getErrorStats: () => any
}

export function useErrorHandling(): UseErrorHandlingReturn {
  const [errors, setErrors] = useState<ProcessedError[]>([])
  const [currentError, setCurrentError] = useState<ProcessedError | null>(null)
  const [isErrorVisible, setIsErrorVisible] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  
  const { isOnline, isOffline, retryConnection } = useNetworkStatus()

  // Handle error
  const handleError = useCallback((error: any, context?: ErrorContext): ProcessedError => {
    const processedError = ErrorHandler.handle(error, context)
    
    // Add to local state
    setErrors(prev => [...prev, processedError])
    
    // Log to monitoring service
    errorMonitoringService.logError(processedError, context || {})
    
    // Announce to screen readers
    accessibilityUtils.announceError(processedError)
    
    // Show error if it's high severity
    if (processedError.severity === 'high' || processedError.severity === 'critical') {
      showError(processedError)
    }
    
    return processedError
  }, [])

  // Clear error
  const clearError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(error => error.id !== errorId))
    ErrorHandler.clearError(errorId)
    
    if (currentError?.id === errorId) {
      setCurrentError(null)
      setIsErrorVisible(false)
    }
  }, [currentError])

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors([])
    setCurrentError(null)
    setIsErrorVisible(false)
    ErrorHandler.clearAllErrors()
  }, [])

  // Show error
  const showError = useCallback((error: ProcessedError) => {
    setCurrentError(error)
    setIsErrorVisible(true)
    
    // Focus the error
    setTimeout(() => {
      const errorElement = document.getElementById(`error-${error.id}`)
      if (errorElement) {
        accessibilityUtils.focusElement(errorElement)
      }
    }, 100)
  }, [])

  // Hide error
  const hideError = useCallback(() => {
    setIsErrorVisible(false)
    setCurrentError(null)
  }, [])

  // Retry error
  const retryError = useCallback(async (errorId: string) => {
    const error = errors.find(e => e.id === errorId)
    if (!error) return

    setIsRetrying(true)
    
    try {
      // Find and execute retry action
      const retryAction = error.recoveryActions.find(action => action.type === 'retry')
      if (retryAction) {
        await retryAction.action()
      }
      
      // Clear the error on successful retry
      clearError(errorId)
      
      // Record successful recovery
      errorMonitoringService.recordEvent({
        error,
        context: { component: 'useErrorHandling', action: 'retryError' },
        recoveryAttempted: true,
        recoverySuccessful: true,
      })
      
    } catch (retryError) {
      // Handle retry failure
      const context: ErrorContext = {
        component: 'useErrorHandling',
        action: 'retryError',
        timestamp: new Date(),
        additionalData: {
          originalErrorId: errorId,
          retryError: retryError,
        }
      }
      
      handleError(retryError, context)
      
      // Record failed recovery
      errorMonitoringService.recordEvent({
        error,
        context: { component: 'useErrorHandling', action: 'retryError' },
        recoveryAttempted: true,
        recoverySuccessful: false,
      })
      
    } finally {
      setIsRetrying(false)
    }
  }, [errors, clearError, handleError])

  // Log error
  const logError = useCallback((error: ProcessedError, context: ErrorContext, userAction?: string) => {
    errorMonitoringService.logError(error, context, userAction)
  }, [])

  // Record event
  const recordEvent = useCallback((event: ErrorMonitoringEvent) => {
    errorMonitoringService.recordEvent(event)
  }, [])

  // Collect feedback
  const collectFeedback = useCallback((errorId: string, rating: number, comment?: string, helpful?: boolean) => {
    errorMonitoringService.collectFeedback(errorId, rating, comment, helpful)
  }, [])

  // Announce error
  const announceError = useCallback((error: ProcessedError) => {
    accessibilityUtils.announceError(error)
  }, [])

  // Focus error
  const focusError = useCallback((errorId: string) => {
    const errorElement = document.getElementById(`error-${errorId}`)
    if (errorElement) {
      accessibilityUtils.focusElement(errorElement)
    }
  }, [])

  // Get error statistics
  const getErrorStats = useCallback(() => {
    return errorMonitoringService.getErrorStats()
  }, [])

  // Auto-clear errors after a certain time
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      setErrors(prev => prev.filter(error => {
        const errorAge = now - error.timestamp.getTime()
        return errorAge < 300000 // Keep errors for 5 minutes
      }))
    }, 60000) // Check every minute

    return () => clearInterval(timer)
  }, [])

  // Handle network status changes
  useEffect(() => {
    if (isOnline && errors.length > 0) {
      // Try to retry network errors when back online
      const networkErrors = errors.filter(error => error.type === 'network')
      networkErrors.forEach(error => {
        retryError(error.id)
      })
    }
  }, [isOnline, errors, retryError])

  return {
    // Error state
    errors,
    currentError,
    isErrorVisible,
    
    // Error handling
    handleError,
    clearError,
    clearAllErrors,
    showError,
    hideError,
    
    // Error recovery
    retryError,
    isRetrying,
    
    // Error monitoring
    logError,
    recordEvent,
    collectFeedback,
    
    // Accessibility
    announceError,
    focusError,
    
    // Network status
    isOnline,
    isOffline,
    retryConnection,
    
    // Error statistics
    getErrorStats,
  }
}

// Hook for simple error handling
export function useSimpleErrorHandling() {
  const [error, setError] = useState<ProcessedError | null>(null)
  
  const handleError = useCallback((error: any, context?: ErrorContext) => {
    const processedError = ErrorHandler.handle(error, context)
    setError(processedError)
    return processedError
  }, [])
  
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  
  return {
    error,
    handleError,
    clearError,
  }
}

// Hook for form error handling
export function useFormErrorHandling() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  
  const setError = useCallback((field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }))
  }, [])
  
  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])
  
  const clearAllErrors = useCallback(() => {
    setErrors({})
    setTouched({})
  }, [])
  
  const setFieldTouched = useCallback((field: string, isTouched: boolean) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }))
  }, [])
  
  const getFieldError = useCallback((field: string) => {
    return touched[field] ? errors[field] : undefined
  }, [errors, touched])
  
  const hasErrors = Object.keys(errors).length > 0
  
  return {
    errors,
    touched,
    setError,
    clearError,
    clearAllErrors,
    setFieldTouched,
    getFieldError,
    hasErrors,
  }
}
