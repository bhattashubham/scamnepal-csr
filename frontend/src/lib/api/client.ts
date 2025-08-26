import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiResponse } from '@/types'

// Create base axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  }
)

// Generic API request wrapper
export async function apiRequest<T>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await api(config)
    
    // If the backend already returns a structured response, use it directly
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return response.data
    }
    
    // Otherwise, wrap it in our standard format
    return {
      success: true,
      data: response.data,
      metadata: {
        executionTime: response.headers['x-execution-time'],
      },
    }
  } catch (error: any) {
    console.error('API Request Error:', error)
    
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred'
    const errorCode = error.response?.data?.code || error.code
    
    return {
      success: false,
      error: {
        message: errorMessage,
        code: errorCode,
        details: error.response?.data,
      },
    }
  }
}

// Typed HTTP methods
export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({ method: 'GET', url, ...config }),
  
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiRequest<T>({ method: 'POST', url, data, ...config }),
  
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiRequest<T>({ method: 'PUT', url, data, ...config }),
  
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiRequest<T>({ method: 'PATCH', url, data, ...config }),
  
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({ method: 'DELETE', url, ...config }),
}

export default api
