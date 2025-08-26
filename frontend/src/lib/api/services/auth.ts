import { apiClient } from '../client'
import { User, LoginForm, ApiResponse } from '@/types'

export interface AuthResponse {
  token: string
  refreshToken: string
  user: User
  expiresIn: number
}

export interface RegisterForm {
  email: string
  phoneNumber?: string
  password?: string
}

export interface VerifyOTPForm {
  email?: string
  phoneNumber?: string
  otp: string
}

export class AuthService {
  static async login(data: LoginForm): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/auth/login', data)
  }

  static async register(data: RegisterForm): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/register', data)
  }

  static async verifyOTP(data: VerifyOTPForm): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/auth/verify-otp', data)
  }

  static async refreshToken(refreshToken: string): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/auth/refresh', { refreshToken })
  }

  static async logout(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/logout')
  }

  static async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/auth/profile')
  }

  static async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.patch<User>('/auth/profile', data)
  }

  static async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/forgot-password', { email })
  }

  static async resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/auth/reset-password', { token, newPassword })
  }

  // Utility methods
  static saveToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
  }

  static removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
  }

  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token')
    }
    return null
  }

  static isAuthenticated(): boolean {
    return !!this.getToken()
  }
}
