import { apiClient } from '../client'
import { Entity, ApiResponse, PaginatedResponse } from '@/types'

export interface EntityFilters {
  status?: string
  search?: string
  riskScoreMin?: number
  riskScoreMax?: number
}

export interface EntityStats {
  totalEntities: number
  highRisk: number
  underReview: number
  communityReports: number
}

export class EntityService {
  static async getAll(
    filters?: EntityFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Entity>>> {
    return apiClient.get<PaginatedResponse<Entity>>('/entities', {
      params: { ...filters, page, limit }
    })
  }

  static async getById(id: string): Promise<ApiResponse<Entity>> {
    return apiClient.get<Entity>(`/entities/${id}`)
  }

  static async getStats(): Promise<ApiResponse<EntityStats>> {
    return apiClient.get<EntityStats>('/entities/stats')
  }

  static async create(data: Partial<Entity>): Promise<ApiResponse<Entity>> {
    return apiClient.post<Entity>('/entities', data)
  }

  static async update(id: string, data: Partial<Entity>): Promise<ApiResponse<Entity>> {
    return apiClient.put<Entity>(`/entities/${id}`, data)
  }

  static async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/entities/${id}`)
  }
}
