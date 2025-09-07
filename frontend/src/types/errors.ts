/**
 * Comprehensive Error Handling Types
 * Defines error classification, severity, and recovery actions
 */

// Error Types - Categories of errors that can occur
export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS_LOGIC = 'business_logic',
  FILE_UPLOAD = 'file_upload',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

// Error Severity - Impact level of the error
export enum ErrorSeverity {
  LOW = 'low',        // Info/warning - doesn't block user
  MEDIUM = 'medium',  // User action required - minor impact
  HIGH = 'high',      // Critical - blocks user workflow
  CRITICAL = 'critical' // System failure - app unusable
}

// Recovery Action Types
export enum RecoveryActionType {
  RETRY = 'retry',
  REFRESH = 'refresh',
  CONTACT_SUPPORT = 'contact_support',
  REPORT_ISSUE = 'report_issue',
  GO_BACK = 'go_back',
  CLEAR_CACHE = 'clear_cache',
  LOGOUT = 'logout',
  RELOAD_PAGE = 'reload_page',
  CUSTOM = 'custom'
}

// Recovery Action Interface
export interface RecoveryAction {
  type: RecoveryActionType
  label: string
  description?: string
  action: () => void | Promise<void>
  primary?: boolean
  destructive?: boolean
  disabled?: boolean
}

// Processed Error Interface
export interface ProcessedError {
  id: string
  type: ErrorType
  severity: ErrorSeverity
  message: string
  userMessage: string
  technicalMessage?: string
  code?: string | number
  context?: string
  timestamp: Date
  stack?: string
  originalError?: any
  recoveryActions: RecoveryAction[]
  metadata?: Record<string, any>
}

// Error Context Interface
export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  sessionId?: string
  url?: string
  userAgent?: string
  timestamp?: Date
  additionalData?: Record<string, any>
}

// API Error Response Interface
export interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code?: string | number
    details?: any
    field?: string
    type?: ErrorType
  }
}

// Form Validation Error Interface
export interface ValidationError {
  field: string
  message: string
  code?: string
  value?: any
}

// Network Error Interface
export interface NetworkError {
  status?: number
  statusText?: string
  url?: string
  method?: string
  timeout?: boolean
  offline?: boolean
}

// Authentication Error Interface
export interface AuthError {
  type: 'token_expired' | 'invalid_credentials' | 'account_locked' | 'email_not_verified' | 'otp_expired' | 'otp_invalid' | 'session_expired'
  message: string
  code?: string
  retryAfter?: number
}

// File Upload Error Interface
export interface FileUploadError {
  fileName?: string
  fileSize?: number
  fileType?: string
  reason: 'size_exceeded' | 'invalid_type' | 'upload_timeout' | 'storage_quota' | 'virus_detected' | 'network_error'
  maxSize?: number
  allowedTypes?: string[]
}

// Business Logic Error Interface
export interface BusinessLogicError {
  type: 'duplicate_report' | 'invalid_identifier' | 'suspicious_content' | 'rate_limited' | 'moderation_required'
  message: string
  code?: string
  details?: any
}

// Error Handler Configuration
export interface ErrorHandlerConfig {
  enableLogging: boolean
  enableReporting: boolean
  enableRecovery: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  maxRetries: number
  retryDelay: number
  reportEndpoint?: string
  logEndpoint?: string
}

// Error Boundary State
export interface ErrorBoundaryState {
  hasError: boolean
  error?: ProcessedError
  errorInfo?: any
  retryCount: number
  lastRetry?: Date
}

// Error Monitoring Event
export interface ErrorMonitoringEvent {
  error: ProcessedError
  context: ErrorContext
  userAction?: string
  recoveryAttempted?: boolean
  recoverySuccessful?: boolean
}

// Error Analytics Data
export interface ErrorAnalytics {
  errorId: string
  type: ErrorType
  severity: ErrorSeverity
  frequency: number
  firstOccurrence: Date
  lastOccurrence: Date
  affectedUsers: number
  recoveryRate: number
  averageResolutionTime: number
}

// Error Recovery Result
export interface ErrorRecoveryResult {
  success: boolean
  action: RecoveryActionType
  duration: number
  error?: ProcessedError
  retryCount: number
}

// Error Handler Hook Return Type
export interface UseErrorHandlerReturn {
  handleError: (error: any, context?: ErrorContext) => ProcessedError
  clearError: (errorId: string) => void
  retryError: (errorId: string) => Promise<ErrorRecoveryResult>
  getError: (errorId: string) => ProcessedError | undefined
  getAllErrors: () => ProcessedError[]
  isRecovering: boolean
  lastError?: ProcessedError
}

// Error Display Props
export interface ErrorDisplayProps {
  error: ProcessedError
  showRecoveryActions?: boolean
  showTechnicalDetails?: boolean
  variant?: 'inline' | 'card' | 'modal' | 'toast'
  className?: string
  onRecovery?: (action: RecoveryAction) => void
  onDismiss?: () => void
}

// Error Toast Props
export interface ErrorToastProps {
  error: ProcessedError
  duration?: number
  position?: 'top' | 'bottom' | 'top-right' | 'bottom-right'
  showProgress?: boolean
  onClose?: () => void
  onAction?: (action: RecoveryAction) => void
}

// Error Modal Props
export interface ErrorModalProps {
  error: ProcessedError
  open: boolean
  onClose: () => void
  onRecovery?: (action: RecoveryAction) => void
  showTechnicalDetails?: boolean
  allowDismiss?: boolean
}

// Error State Hook Return Type
export interface UseErrorStateReturn {
  errors: ProcessedError[]
  addError: (error: ProcessedError) => void
  removeError: (errorId: string) => void
  clearAllErrors: () => void
  hasError: (type?: ErrorType, severity?: ErrorSeverity) => boolean
  getErrorsByType: (type: ErrorType) => ProcessedError[]
  getErrorsBySeverity: (severity: ErrorSeverity) => ProcessedError[]
  isErrorRecovering: (errorId: string) => boolean
}
