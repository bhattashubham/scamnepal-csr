import { ApiResponse } from '@/types'
import { apiClient } from '../client'

export interface User {
  id: string
  email: string
  role: 'member' | 'moderator' | 'admin'
  name?: string
  phone?: string
  isVerified: boolean
  profileImage?: string
  createdAt: string
  updatedAt: string
}

export interface CreateUserData {
  email: string
  password: string
  role: 'member' | 'moderator' | 'admin'
  name?: string
  phone?: string
}

export interface UpdateUserData {
  email?: string
  password?: string
  role?: 'member' | 'moderator' | 'admin'
  name?: string
  phone?: string
  isVerified?: boolean
}

export interface UsersResponse {
  users: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class UserService {
  private static baseUrl = '/api/admin/users'

  static async getUsers(page: number = 1, limit: number = 20): Promise<ApiResponse<UsersResponse>> {
    const response = await fetch(`${this.baseUrl}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch users')
    }

    return response.json()
  }

  static async createUser(userData: CreateUserData): Promise<ApiResponse<User>> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(userData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create user')
    }

    return response.json()
  }

  static async updateUser(id: string, userData: UpdateUserData): Promise<ApiResponse<User>> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(userData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update user')
    }

    return response.json()
  }

  static async deleteUser(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete user')
    }

    return response.json()
  }

  static async uploadProfileImage(file: File): Promise<ApiResponse<{ profileImage: string }>> {
    const formData = new FormData()
    formData.append('profileImage', file)

    return apiClient.post<{ profileImage: string }>('/profile/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }
}
