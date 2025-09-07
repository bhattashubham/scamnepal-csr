/**
 * Enhanced API Client with Retry Logic, Offline Detection, and Request Queuing
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ErrorHandler } from '@/lib/error-handler'
import { ErrorType, ErrorContext } from '@/types/errors'
import { ApiResponse } from '@/types'
import { API_CONFIG } from '@/lib/config'

// Request queue for offline mode
interface QueuedRequest {
  id: string
  config: AxiosRequestConfig
  resolve: (value: any) => void
  reject: (error: any) => void
  timestamp: number
  retryCount: number
}

// Enhanced API client configuration
interface EnhancedApiConfig {
  baseURL: string
  timeout: number
  maxRetries: number
  retryDelay: number
  retryMultiplier: number
  maxRetryDelay: number
  enableOfflineQueue: boolean
  maxQueueSize: number
  queueTimeout: number
}

// Default configuration
const DEFAULT_CONFIG: EnhancedApiConfig = {
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  maxRetries: API_CONFIG.retryAttempts,
  retryDelay: API_CONFIG.retryDelay,
  retryMultiplier: 2,
  maxRetryDelay: 10000,
  enableOfflineQueue: true,
  maxQueueSize: 50,
  queueTimeout: 300000, // 5 minutes
}

export class EnhancedApiClient {
  private api: AxiosInstance
  private config: EnhancedApiConfig
  private requestQueue: QueuedRequest[] = []
  private isOnline: boolean = typeof window !== 'undefined' ? navigator.onLine : true
  private isProcessingQueue: boolean = false
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map()

  constructor(config: Partial<EnhancedApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.api = this.createAxiosInstance()
    this.setupInterceptors()
    this.setupNetworkListeners()
  }

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Add request ID for tracking
        (config as any).metadata = {
          requestId: this.generateRequestId(),
          timestamp: Date.now(),
          retryCount: 0,
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      async (error: AxiosError) => {
        const config = error.config as AxiosRequestConfig & { metadata?: any }
        const requestId = config?.metadata?.requestId
        const retryCount = config?.metadata?.retryCount || 0

        // Handle authentication errors
        if (error.response?.status === 401) {
          this.handleAuthError(error)
          return Promise.reject(error)
        }

        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after']
          if (retryAfter) {
            await this.delay(parseInt(retryAfter) * 1000)
            return this.api.request(config)
          }
        }

        // Retry logic for transient errors
        if (this.shouldRetry(error, retryCount)) {
          const delay = this.calculateRetryDelay(retryCount)
          
          if (requestId) {
            this.retryTimeouts.set(requestId, setTimeout(() => {
              config.metadata.retryCount = retryCount + 1
              this.api.request(config)
            }, delay))
          }
          
          return Promise.reject(error)
        }

        // Log error for monitoring
        this.logError(error, config)

        return Promise.reject(error)
      }
    )
  }

  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      this.isOnline = true
      this.processQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  private shouldRetry(error: AxiosError, retryCount: number): boolean {
    if (retryCount >= this.config.maxRetries) return false

    // Don't retry on client errors (4xx) except for specific cases
    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
      // Retry on 408 (timeout), 429 (rate limit), 423 (locked)
      return [408, 429, 423].includes(error.response.status)
    }

    // Retry on network errors and server errors (5xx)
    return !error.response || error.response.status >= 500
  }

  private calculateRetryDelay(retryCount: number): number {
    const delay = this.config.retryDelay * Math.pow(this.config.retryMultiplier, retryCount)
    return Math.min(delay, this.config.maxRetryDelay)
  }

  private handleAuthError(error: AxiosError): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Use ErrorHandler to process the auth error
      const context: ErrorContext = {
        component: 'EnhancedApiClient',
        action: 'handleAuthError',
        url: window.location.href,
        timestamp: new Date(),
      }
      
      ErrorHandler.handle(error, context)
    }
  }

  private logError(error: AxiosError, config?: AxiosRequestConfig): void {
            const context: ErrorContext = {
          component: 'EnhancedApiClient',
          action: 'logError',
          url: config?.url,
          timestamp: new Date(),
          additionalData: {
            method: config?.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            requestId: (config as any)?.metadata?.requestId,
            retryCount: (config as any)?.metadata?.retryCount,
          }
        }

    ErrorHandler.handle(error, context)
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || !this.isOnline || this.requestQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    while (this.requestQueue.length > 0 && this.isOnline) {
      const queuedRequest = this.requestQueue.shift()
      if (!queuedRequest) break

      try {
        const response = await this.api.request(queuedRequest.config)
        queuedRequest.resolve(response)
      } catch (error) {
        // If it's a transient error and we haven't exceeded retries, re-queue
        if (this.shouldRetry(error as AxiosError, queuedRequest.retryCount)) {
          queuedRequest.retryCount++
          this.requestQueue.unshift(queuedRequest)
        } else {
          queuedRequest.reject(error)
        }
      }

      // Small delay between requests to avoid overwhelming the server
      await this.delay(100)
    }

    this.isProcessingQueue = false
  }

  private queueRequest(config: AxiosRequestConfig): Promise<AxiosResponse> {
    return new Promise((resolve, reject) => {
      if (this.requestQueue.length >= this.config.maxQueueSize) {
        reject(new Error('Request queue is full'))
        return
      }

      const queuedRequest: QueuedRequest = {
        id: this.generateRequestId(),
        config,
        resolve,
        reject,
        timestamp: Date.now(),
        retryCount: 0,
      }

      this.requestQueue.push(queuedRequest)

      // Set timeout for queued request
      setTimeout(() => {
        const index = this.requestQueue.findIndex(req => req.id === queuedRequest.id)
        if (index !== -1) {
          this.requestQueue.splice(index, 1)
          reject(new Error('Request queue timeout'))
        }
      }, this.config.queueTimeout)
    })
  }

  // Public API methods
  async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      let response: AxiosResponse

      if (!this.isOnline && this.config.enableOfflineQueue) {
        // Queue request for when we're back online
        response = await this.queueRequest(config)
      } else {
        // Make request immediately
        response = await this.api.request(config)
      }

      // Process successful response
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return response.data
      }

      return {
        success: true,
        data: response.data,
        metadata: {
          executionTime: response.headers['x-execution-time'],
          requestId: (config as any).metadata?.requestId,
        } as any,
      }
    } catch (error: any) {
      const context: ErrorContext = {
        component: 'EnhancedApiClient',
        action: 'request',
        url: config.url,
        timestamp: new Date(),
        additionalData: {
          method: config.method,
          requestId: (config as any).metadata?.requestId,
          retryCount: (config as any).metadata?.retryCount,
        }
      }

      const processedError = ErrorHandler.handle(error, context)

      return {
        success: false,
        error: {
          message: processedError.userMessage,
          code: processedError.code?.toString(),
          details: processedError.metadata,
        },
      }
    }
  }

  // HTTP method shortcuts
  get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, ...config })
  }

  post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, ...config })
  }

  put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, ...config })
  }

  patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data, ...config })
  }

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, ...config })
  }

  // Utility methods
  getQueueStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.requestQueue.length,
      isProcessingQueue: this.isProcessingQueue,
      maxQueueSize: this.config.maxQueueSize,
    }
  }

  clearQueue(): void {
    this.requestQueue.forEach(request => {
      request.reject(new Error('Queue cleared'))
    })
    this.requestQueue = []
  }

  updateConfig(newConfig: Partial<EnhancedApiConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// Create singleton instance
export const enhancedApiClient = new EnhancedApiClient()

// Export for backward compatibility
export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) => enhancedApiClient.get<T>(url, config),
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => enhancedApiClient.post<T>(url, data, config),
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => enhancedApiClient.put<T>(url, data, config),
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => enhancedApiClient.patch<T>(url, data, config),
  delete: <T>(url: string, config?: AxiosRequestConfig) => enhancedApiClient.delete<T>(url, config),
}

export default enhancedApiClient
