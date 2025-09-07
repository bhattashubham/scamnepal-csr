/**
 * Error Logging and Monitoring Service
 * Handles error logging, monitoring, and user feedback collection
 */

import { ProcessedError, ErrorContext, ErrorMonitoringEvent } from '@/types/errors'

interface ErrorLogEntry {
  id: string
  error: ProcessedError
  context: ErrorContext
  timestamp: Date
  userAgent: string
  url: string
  userId?: string
  sessionId: string
  userAction?: string
  recoveryAttempted?: boolean
  recoverySuccessful?: boolean
}

interface UserFeedback {
  errorId: string
  rating: number // 1-5
  comment?: string
  helpful: boolean
  timestamp: Date
  userId?: string
}

interface MonitoringConfig {
  enableLogging: boolean
  enableReporting: boolean
  enableUserFeedback: boolean
  logEndpoint?: string
  reportEndpoint?: string
  feedbackEndpoint?: string
  batchSize: number
  flushInterval: number
  maxRetries: number
}

const DEFAULT_CONFIG: MonitoringConfig = {
  enableLogging: true,
  enableReporting: false,
  enableUserFeedback: true,
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  maxRetries: 3,
}

export class ErrorMonitoringService {
  private config: MonitoringConfig
  private errorLogs: ErrorLogEntry[] = []
  private userFeedback: UserFeedback[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private sessionId: string
  private userId: string | null = null

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.sessionId = this.generateSessionId()
    this.userId = this.getUserId()
    
    this.setupFlushTimer()
    this.setupPageUnloadHandler()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getUserId(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('userId') || null
  }

  private setupFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    this.flushTimer = setInterval(() => {
      this.flushLogs()
      this.flushFeedback()
    }, this.config.flushInterval)
  }

  private setupPageUnloadHandler(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('beforeunload', () => {
      this.flushLogs()
      this.flushFeedback()
    })

    // Handle page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushLogs()
        this.flushFeedback()
      }
    })
  }

  // Log error
  logError(error: ProcessedError, context: ErrorContext, userAction?: string): void {
    if (!this.config.enableLogging) return

    const logEntry: ErrorLogEntry = {
      id: this.generateLogId(),
      error,
      context,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.userId || undefined,
      sessionId: this.sessionId,
      userAction,
    }

    this.errorLogs.push(logEntry)

    // Flush immediately for critical errors
    if (error.severity === 'critical' || error.severity === 'high') {
      this.flushLogs()
    }

    // Flush when batch size is reached
    if (this.errorLogs.length >= this.config.batchSize) {
      this.flushLogs()
    }
  }

  // Record error monitoring event
  recordEvent(event: ErrorMonitoringEvent): void {
    const logEntry: ErrorLogEntry = {
      id: this.generateLogId(),
      error: event.error,
      context: event.context,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.userId || undefined,
      sessionId: this.sessionId,
      userAction: event.userAction,
      recoveryAttempted: event.recoveryAttempted,
      recoverySuccessful: event.recoverySuccessful,
    }

    this.errorLogs.push(logEntry)
  }

  // Collect user feedback
  collectFeedback(errorId: string, rating: number, comment?: string, helpful?: boolean): void {
    if (!this.config.enableUserFeedback) return

    const feedback: UserFeedback = {
      errorId,
      rating,
      comment,
      helpful: helpful ?? rating >= 3,
      timestamp: new Date(),
      userId: this.userId || undefined,
    }

    this.userFeedback.push(feedback)

    // Send feedback immediately
    this.sendFeedback(feedback)
  }

  // Flush error logs
  private async flushLogs(): Promise<void> {
    if (this.errorLogs.length === 0 || !this.config.enableReporting) return

    const logsToSend = [...this.errorLogs]
    this.errorLogs = []

    try {
      await this.sendLogs(logsToSend)
    } catch (error) {
      // Re-add logs to queue if sending failed
      this.errorLogs.unshift(...logsToSend)
      console.error('Failed to send error logs:', error)
    }
  }

  // Flush user feedback
  private async flushFeedback(): Promise<void> {
    if (this.userFeedback.length === 0 || !this.config.enableUserFeedback) return

    const feedbackToSend = [...this.userFeedback]
    this.userFeedback = []

    try {
      await this.sendFeedbackBatch(feedbackToSend)
    } catch (error) {
      // Re-add feedback to queue if sending failed
      this.userFeedback.unshift(...feedbackToSend)
      console.error('Failed to send user feedback:', error)
    }
  }

  // Send logs to monitoring service
  private async sendLogs(logs: ErrorLogEntry[]): Promise<void> {
    if (!this.config.reportEndpoint) {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.group('Error Logs')
        logs.forEach(log => {
          console.log('Error Log:', log)
        })
        console.groupEnd()
      }
      return
    }

    const response = await fetch(this.config.reportEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        logs,
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to send logs: ${response.statusText}`)
    }
  }

  // Send single feedback
  private async sendFeedback(feedback: UserFeedback): Promise<void> {
    if (!this.config.feedbackEndpoint) {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('User Feedback:', feedback)
      }
      return
    }

    const response = await fetch(this.config.feedbackEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedback),
    })

    if (!response.ok) {
      throw new Error(`Failed to send feedback: ${response.statusText}`)
    }
  }

  // Send feedback batch
  private async sendFeedbackBatch(feedback: UserFeedback[]): Promise<void> {
    if (!this.config.feedbackEndpoint) {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('User Feedback Batch:', feedback)
      }
      return
    }

    const response = await fetch(this.config.feedbackEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feedback,
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to send feedback batch: ${response.statusText}`)
    }
  }

  // Generate unique log ID
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get error statistics
  getErrorStats(): {
    totalErrors: number
    errorsByType: Record<string, number>
    errorsBySeverity: Record<string, number>
    recentErrors: ErrorLogEntry[]
    averageRating: number
    feedbackCount: number
  } {
    const errorsByType: Record<string, number> = {}
    const errorsBySeverity: Record<string, number> = {}
    let totalRating = 0
    let feedbackCount = 0

    this.errorLogs.forEach(log => {
      errorsByType[log.error.type] = (errorsByType[log.error.type] || 0) + 1
      errorsBySeverity[log.error.severity] = (errorsBySeverity[log.error.severity] || 0) + 1
    })

    this.userFeedback.forEach(feedback => {
      totalRating += feedback.rating
      feedbackCount++
    })

    return {
      totalErrors: this.errorLogs.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: this.errorLogs.slice(-10), // Last 10 errors
      averageRating: feedbackCount > 0 ? totalRating / feedbackCount : 0,
      feedbackCount,
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.setupFlushTimer()
  }

  // Set user ID
  setUserId(userId: string | null): void {
    this.userId = userId
    if (typeof window !== 'undefined') {
      if (userId) {
        localStorage.setItem('userId', userId)
      } else {
        localStorage.removeItem('userId')
      }
    }
  }

  // Clear all data
  clearData(): void {
    this.errorLogs = []
    this.userFeedback = []
  }

  // Destroy service
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    this.flushLogs()
    this.flushFeedback()
  }
}

// Create singleton instance
export const errorMonitoringService = new ErrorMonitoringService()

// Export for use in components
export function useErrorMonitoring() {
  return {
    logError: (error: ProcessedError, context: ErrorContext, userAction?: string) => 
      errorMonitoringService.logError(error, context, userAction),
    recordEvent: (event: ErrorMonitoringEvent) => 
      errorMonitoringService.recordEvent(event),
    collectFeedback: (errorId: string, rating: number, comment?: string, helpful?: boolean) => 
      errorMonitoringService.collectFeedback(errorId, rating, comment, helpful),
    getErrorStats: () => errorMonitoringService.getErrorStats(),
    setUserId: (userId: string | null) => errorMonitoringService.setUserId(userId),
  }
}
