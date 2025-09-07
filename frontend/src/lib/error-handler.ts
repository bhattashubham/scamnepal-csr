/**
 * Centralized Error Handler Service
 * Processes, categorizes, and manages all application errors
 */

import { 
  ErrorType, 
  ErrorSeverity, 
  ProcessedError, 
  RecoveryAction, 
  RecoveryActionType,
  ErrorContext,
  ApiErrorResponse,
  ValidationError,
  NetworkError,
  AuthError,
  FileUploadError,
  BusinessLogicError,
  ErrorHandlerConfig,
  ErrorRecoveryResult
} from '@/types/errors'

// Default configuration
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  enableLogging: true,
  enableReporting: false,
  enableRecovery: true,
  logLevel: 'error',
  maxRetries: 3,
  retryDelay: 1000,
}

// Error message templates
const ERROR_MESSAGES = {
  [ErrorType.VALIDATION]: {
    [ErrorSeverity.LOW]: 'Please check your input and try again.',
    [ErrorSeverity.MEDIUM]: 'There are some issues with your form. Please review and correct them.',
    [ErrorSeverity.HIGH]: 'Form validation failed. Please fix the errors before continuing.',
    [ErrorSeverity.CRITICAL]: 'Critical validation error. Please contact support.',
  },
  [ErrorType.NETWORK]: {
    [ErrorSeverity.LOW]: 'Network request completed with warnings.',
    [ErrorSeverity.MEDIUM]: 'Network request failed. Please check your connection.',
    [ErrorSeverity.HIGH]: 'Unable to connect to the server. Please try again.',
    [ErrorSeverity.CRITICAL]: 'Network connection lost. Please check your internet connection.',
  },
  [ErrorType.AUTHENTICATION]: {
    [ErrorSeverity.LOW]: 'Authentication issue detected.',
    [ErrorSeverity.MEDIUM]: 'Please log in again to continue.',
    [ErrorSeverity.HIGH]: 'Your session has expired. Please log in again.',
    [ErrorSeverity.CRITICAL]: 'Authentication failed. Please contact support.',
  },
  [ErrorType.AUTHORIZATION]: {
    [ErrorSeverity.LOW]: 'Limited access to this feature.',
    [ErrorSeverity.MEDIUM]: 'You don\'t have permission to perform this action.',
    [ErrorSeverity.HIGH]: 'Access denied. Please contact your administrator.',
    [ErrorSeverity.CRITICAL]: 'Unauthorized access attempt detected.',
  },
  [ErrorType.BUSINESS_LOGIC]: {
    [ErrorSeverity.LOW]: 'Request completed with warnings.',
    [ErrorSeverity.MEDIUM]: 'Unable to complete your request. Please try again.',
    [ErrorSeverity.HIGH]: 'Request failed due to business rules. Please review your input.',
    [ErrorSeverity.CRITICAL]: 'Critical business logic error. Please contact support.',
  },
  [ErrorType.FILE_UPLOAD]: {
    [ErrorSeverity.LOW]: 'File upload completed with warnings.',
    [ErrorSeverity.MEDIUM]: 'File upload failed. Please check the file and try again.',
    [ErrorSeverity.HIGH]: 'Unable to upload file. Please check file size and format.',
    [ErrorSeverity.CRITICAL]: 'File upload system error. Please contact support.',
  },
  [ErrorType.SYSTEM]: {
    [ErrorSeverity.LOW]: 'System warning detected.',
    [ErrorSeverity.MEDIUM]: 'System issue encountered. Please try again.',
    [ErrorSeverity.HIGH]: 'System error occurred. Please refresh the page.',
    [ErrorSeverity.CRITICAL]: 'Critical system failure. Please contact support immediately.',
  },
  [ErrorType.UNKNOWN]: {
    [ErrorSeverity.LOW]: 'An unexpected issue occurred.',
    [ErrorSeverity.MEDIUM]: 'Something went wrong. Please try again.',
    [ErrorSeverity.HIGH]: 'An error occurred. Please refresh the page.',
    [ErrorSeverity.CRITICAL]: 'Critical error. Please contact support.',
  },
}

export class ErrorHandler {
  private static config: ErrorHandlerConfig = DEFAULT_CONFIG
  private static errorStore: Map<string, ProcessedError> = new Map()
  private static recoveryAttempts: Map<string, number> = new Map()

  /**
   * Configure the error handler
   */
  static configure(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Process and categorize an error
   */
  static handle(error: any, context?: ErrorContext): ProcessedError {
    const processedError = this.processError(error, context)
    
    // Store the error
    this.errorStore.set(processedError.id, processedError)
    
    // Log the error
    if (this.config.enableLogging) {
      this.log(processedError)
    }
    
    // Report the error
    if (this.config.enableReporting) {
      this.report(processedError)
    }
    
    return processedError
  }

  /**
   * Process raw error into structured format
   */
  private static processError(error: any, context?: ErrorContext): ProcessedError {
    const errorId = this.generateErrorId()
    const { type, severity } = this.categorizeError(error)
    const message = this.extractMessage(error)
    const userMessage = this.getUserMessage(type, severity)
    const recoveryActions = this.getRecoveryActions(type, severity, error)
    
    return {
      id: errorId,
      type,
      severity,
      message,
      userMessage,
      technicalMessage: this.getTechnicalMessage(error),
      code: this.extractCode(error),
      context: context?.component || 'unknown',
      timestamp: new Date(),
      stack: error?.stack,
      originalError: error,
      recoveryActions,
      metadata: {
        ...context,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      }
    }
  }

  /**
   * Categorize error by type and severity
   */
  private static categorizeError(error: any): { type: ErrorType; severity: ErrorSeverity } {
    // Check for specific error types
    if (this.isValidationError(error)) {
      return { type: ErrorType.VALIDATION, severity: ErrorSeverity.MEDIUM }
    }
    
    if (this.isNetworkError(error)) {
      return { type: ErrorType.NETWORK, severity: this.getNetworkErrorSeverity(error) }
    }
    
    if (this.isAuthError(error)) {
      return { type: ErrorType.AUTHENTICATION, severity: this.getAuthErrorSeverity(error) }
    }
    
    if (this.isFileUploadError(error)) {
      return { type: ErrorType.FILE_UPLOAD, severity: ErrorSeverity.MEDIUM }
    }
    
    if (this.isBusinessLogicError(error)) {
      return { type: ErrorType.BUSINESS_LOGIC, severity: ErrorSeverity.MEDIUM }
    }
    
    if (this.isSystemError(error)) {
      return { type: ErrorType.SYSTEM, severity: ErrorSeverity.HIGH }
    }
    
    // Default categorization
    return { type: ErrorType.UNKNOWN, severity: ErrorSeverity.MEDIUM }
  }

  /**
   * Check if error is a validation error
   */
  private static isValidationError(error: any): boolean {
    return (
      error?.name === 'ValidationError' ||
      error?.type === 'validation' ||
      error?.response?.status === 422 ||
      error?.response?.data?.type === 'validation' ||
      (error?.response?.data?.errors && Array.isArray(error.response.data.errors))
    )
  }

  /**
   * Check if error is a network error
   */
  private static isNetworkError(error: any): boolean {
    return (
      error?.name === 'NetworkError' ||
      error?.code === 'NETWORK_ERROR' ||
      error?.message?.includes('Network Error') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('ECONNREFUSED') ||
      typeof window !== 'undefined' && !navigator.onLine
    )
  }

  /**
   * Check if error is an authentication error
   */
  private static isAuthError(error: any): boolean {
    return (
      error?.response?.status === 401 ||
      error?.response?.status === 403 ||
      error?.type === 'authentication' ||
      error?.message?.includes('token') ||
      error?.message?.includes('unauthorized') ||
      error?.message?.includes('forbidden')
    )
  }

  /**
   * Check if error is a file upload error
   */
  private static isFileUploadError(error: any): boolean {
    return (
      error?.type === 'file_upload' ||
      error?.message?.includes('upload') ||
      error?.message?.includes('file') ||
      error?.code === 'FILE_TOO_LARGE' ||
      error?.code === 'INVALID_FILE_TYPE'
    )
  }

  /**
   * Check if error is a business logic error
   */
  private static isBusinessLogicError(error: any): boolean {
    return (
      error?.response?.status === 409 ||
      error?.response?.status === 400 ||
      error?.type === 'business_logic' ||
      error?.code === 'DUPLICATE_REPORT' ||
      error?.code === 'RATE_LIMITED'
    )
  }

  /**
   * Check if error is a system error
   */
  private static isSystemError(error: any): boolean {
    return (
      error?.response?.status >= 500 ||
      error?.name === 'Error' ||
      error?.type === 'system' ||
      error?.message?.includes('Internal Server Error')
    )
  }

  /**
   * Get network error severity
   */
  private static getNetworkErrorSeverity(error: any): ErrorSeverity {
    if (typeof window !== 'undefined' && !navigator.onLine) return ErrorSeverity.HIGH
    if (error?.response?.status >= 500) return ErrorSeverity.HIGH
    if (error?.response?.status === 429) return ErrorSeverity.MEDIUM
    return ErrorSeverity.MEDIUM
  }

  /**
   * Get auth error severity
   */
  private static getAuthErrorSeverity(error: any): ErrorSeverity {
    if (error?.response?.status === 401) return ErrorSeverity.HIGH
    if (error?.response?.status === 403) return ErrorSeverity.MEDIUM
    return ErrorSeverity.MEDIUM
  }

  /**
   * Extract error message
   */
  private static extractMessage(error: any): string {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    if (error?.response?.data?.message) return error.response.data.message
    if (error?.response?.statusText) return error.response.statusText
    return 'An unexpected error occurred'
  }

  /**
   * Extract error code
   */
  private static extractCode(error: any): string | number | undefined {
    if (error?.code) return error.code
    if (error?.response?.data?.code) return error.response.data.code
    if (error?.response?.status) return error.response.status
    return undefined
  }

  /**
   * Get user-friendly error message
   */
  private static getUserMessage(type: ErrorType, severity: ErrorSeverity): string {
    return ERROR_MESSAGES[type]?.[severity] || ERROR_MESSAGES[ErrorType.UNKNOWN][severity]
  }

  /**
   * Get technical error message for debugging
   */
  private static getTechnicalMessage(error: any): string {
    if (error?.response?.data?.details) {
      return JSON.stringify(error.response.data.details)
    }
    if (error?.stack) {
      return error.stack
    }
    return this.extractMessage(error)
  }

  /**
   * Get recovery actions for error type and severity
   */
  private static getRecoveryActions(type: ErrorType, severity: ErrorSeverity, error: any): RecoveryAction[] {
    const actions: RecoveryAction[] = []

    // Common recovery actions
    if (type === ErrorType.NETWORK) {
      actions.push({
        type: RecoveryActionType.RETRY,
        label: 'Retry',
        description: 'Try the request again',
        action: () => this.retryError(error),
        primary: true
      })
    }

    if (type === ErrorType.AUTHENTICATION) {
      actions.push({
        type: RecoveryActionType.LOGOUT,
        label: 'Log In Again',
        description: 'Your session has expired',
        action: () => this.handleLogout(),
        primary: true
      })
    }

    if (severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL) {
      actions.push({
        type: RecoveryActionType.RELOAD_PAGE,
        label: 'Refresh Page',
        description: 'Reload the page to reset the application',
        action: () => window.location.reload()
      })
    }

    // Always provide contact support option for high severity errors
    if (severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL) {
      actions.push({
        type: RecoveryActionType.CONTACT_SUPPORT,
        label: 'Contact Support',
        description: 'Get help from our support team',
        action: () => this.contactSupport(error)
      })
    }

    return actions
  }

  /**
   * Generate unique error ID
   */
  private static generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Log error to console or external service
   */
  private static log(error: ProcessedError): void {
    const logLevel = this.config.logLevel
    const logMessage = `[${error.type.toUpperCase()}] ${error.message}`
    
    switch (logLevel) {
      case 'debug':
        console.debug(logMessage, error)
        break
      case 'info':
        console.info(logMessage, error)
        break
      case 'warn':
        console.warn(logMessage, error)
        break
      case 'error':
      default:
        console.error(logMessage, error)
        break
    }
  }

  /**
   * Report error to external monitoring service
   */
  private static report(error: ProcessedError): void {
    if (!this.config.reportEndpoint) return

    // In a real implementation, this would send to monitoring service
    // For now, we'll just log it
    console.log('Reporting error to monitoring service:', error)
  }

  /**
   * Retry error recovery
   */
  private static async retryError(error: any): Promise<void> {
    const errorId = this.generateErrorId()
    const retryCount = this.recoveryAttempts.get(errorId) || 0
    
    if (retryCount >= this.config.maxRetries) {
      this.handle(new Error('Max retries exceeded'), { component: 'ErrorHandler' })
      return
    }

    this.recoveryAttempts.set(errorId, retryCount + 1)
    
    // Simulate retry delay
    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (retryCount + 1)))
  }

  /**
   * Handle logout action
   */
  private static handleLogout(): void {
    // Clear authentication data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth'
    }
  }

  /**
   * Contact support action
   */
  private static contactSupport(error: ProcessedError): void {
    // In a real implementation, this would open a support form or redirect to support
    console.log('Contacting support for error:', error.id)
    
    // For now, we'll just show an alert
    if (typeof window !== 'undefined') {
      alert(`Please contact support with error ID: ${error.id}`)
    }
  }

  /**
   * Get error by ID
   */
  static getError(errorId: string): ProcessedError | undefined {
    return this.errorStore.get(errorId)
  }

  /**
   * Get all errors
   */
  static getAllErrors(): ProcessedError[] {
    return Array.from(this.errorStore.values())
  }

  /**
   * Clear error by ID
   */
  static clearError(errorId: string): void {
    this.errorStore.delete(errorId)
    this.recoveryAttempts.delete(errorId)
  }

  /**
   * Clear all errors
   */
  static clearAllErrors(): void {
    this.errorStore.clear()
    this.recoveryAttempts.clear()
  }

  /**
   * Check if there are errors of specific type/severity
   */
  static hasError(type?: ErrorType, severity?: ErrorSeverity): boolean {
    const errors = this.getAllErrors()
    
    if (type && severity) {
      return errors.some(error => error.type === type && error.severity === severity)
    }
    
    if (type) {
      return errors.some(error => error.type === type)
    }
    
    if (severity) {
      return errors.some(error => error.severity === severity)
    }
    
    return errors.length > 0
  }

  /**
   * Get errors by type
   */
  static getErrorsByType(type: ErrorType): ProcessedError[] {
    return this.getAllErrors().filter(error => error.type === type)
  }

  /**
   * Get errors by severity
   */
  static getErrorsBySeverity(severity: ErrorSeverity): ProcessedError[] {
    return this.getAllErrors().filter(error => error.severity === severity)
  }
}
