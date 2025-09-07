/**
 * Centralized Configuration
 * All environment variables and configuration values
 */

// API Configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
} as const

// App Configuration
export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Community Scam Registry',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  description: 'A comprehensive platform for tracking and reporting scams with community-driven verification',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const

// Support Configuration
export const SUPPORT_CONFIG = {
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@scamnepal.com',
  bugsEmail: process.env.NEXT_PUBLIC_BUGS_EMAIL || 'bugs@scamnepal.com',
  adminEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@scamnepal.com',
  domain: process.env.NEXT_PUBLIC_DOMAIN || 'scamnepal.com',
} as const

// Feature Flags
export const FEATURE_FLAGS = {
  enableDevtools: process.env.NEXT_PUBLIC_ENABLE_DEVTOOLS === 'true',
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableErrorReporting: process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true',
  enableOfflineMode: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_MODE === 'true',
} as const

// File Upload Configuration
export const UPLOAD_CONFIG = {
  maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760'), // 10MB
  allowedTypes: (process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf,text/plain').split(','),
  maxFiles: parseInt(process.env.NEXT_PUBLIC_MAX_FILES || '5'),
} as const

// Security Configuration
export const SECURITY_CONFIG = {
  sessionTimeout: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT || '3600000'), // 1 hour
  maxLoginAttempts: parseInt(process.env.NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS || '5'),
  lockoutDuration: parseInt(process.env.NEXT_PUBLIC_LOCKOUT_DURATION || '900000'), // 15 minutes
} as const

// Utility functions
export const getApiUrl = (path: string = '') => {
  const baseUrl = API_CONFIG.baseURL.replace('/api', '')
  return `${baseUrl}${path}`
}

export const getImageUrl = (path: string) => {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  return `${getApiUrl()}${path}`
}

export const getSupportEmail = (type: 'support' | 'bugs' | 'admin' = 'support') => {
  switch (type) {
    case 'bugs':
      return SUPPORT_CONFIG.bugsEmail
    case 'admin':
      return SUPPORT_CONFIG.adminEmail
    default:
      return SUPPORT_CONFIG.supportEmail
  }
}

export const createSupportMailto = (subject: string, body: string, type: 'support' | 'bugs' | 'admin' = 'support') => {
  const email = getSupportEmail(type)
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
