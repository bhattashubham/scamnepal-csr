import { apiClient } from '../client'
import { Report, CreateReportForm, ApiResponse, PaginatedResponse, SearchFilters } from '@/types'

export interface ReportFilters extends SearchFilters {
  reporterUserId?: string
  amountMin?: number
  amountMax?: number
}

export interface ReportStats {
  totalReports: number
  totalAmountLost: number
  byCategory: Record<string, number>
  byChannel: Record<string, number>
  byStatus: Record<string, number>
  recentTrends: Array<{
    date: string
    count: number
    amount: number
  }>
}

export class ReportService {
  static async create(data: CreateReportForm): Promise<ApiResponse<Report>> {
    return apiClient.post<Report>('/reports', data)
  }

  static async getAll(
    filters?: ReportFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Report>>> {
    return apiClient.get<PaginatedResponse<Report>>('/reports', {
      params: { ...filters, page, limit }
    })
  }

  static async getDashboardReports(
    filters?: ReportFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Report>>> {
    return apiClient.get<PaginatedResponse<Report>>('/reports/dashboard', {
      params: { ...filters, page, limit }
    })
  }

  static async getById(id: string): Promise<ApiResponse<Report>> {
    return apiClient.get<Report>(`/reports/${id}`)
  }

  static async getDetailedById(id: string): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`/reports/${id}/detailed`)
  }

  static async update(id: string, data: Partial<Report>): Promise<ApiResponse<Report>> {
    return apiClient.put<Report>(`/reports/${id}`, data)
  }

  static async delete(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/reports/${id}`)
  }

  static async updateStatus(
    id: string, 
    status: Report['status'], 
    notes?: string
  ): Promise<ApiResponse<Report>> {
    return apiClient.patch<Report>(`/reports/${id}/status`, { status, notes })
  }

  static async getStats(timeframe?: string): Promise<ApiResponse<ReportStats>> {
    return apiClient.get<ReportStats>('/reports/stats', {
      params: { timeframe }
    })
  }

  static async getSimilar(id: string): Promise<ApiResponse<Report[]>> {
    return apiClient.get<Report[]>(`/reports/${id}/similar`)
  }

  static async addEvidence(
    id: string, 
    files: File[]
  ): Promise<ApiResponse<{ message: string }>> {
    const formData = new FormData()
    files.forEach(file => formData.append('evidence', file))
    
    return apiClient.post<{ message: string }>(`/reports/${id}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }

  static async getEvidence(id: string): Promise<ApiResponse<any[]>> {
    return apiClient.get<any[]>(`/reports/${id}/evidence`)
  }

  static async getHistory(id: string): Promise<ApiResponse<any[]>> {
    return apiClient.get<any[]>(`/reports/${id}/history`)
  }

  static async export(
    filters?: ReportFilters,
    format: 'csv' | 'json' = 'csv'
  ): Promise<ApiResponse<{ downloadUrl: string }>> {
    return apiClient.post<{ downloadUrl: string }>('/reports/export', {
      filters,
      format
    })
  }
}
