import { apiClient } from '../client'
import { SearchResult, SearchFilters, ApiResponse } from '@/types'

export interface SearchResponse {
  results: SearchResult[]
  total: number
  page: number
  limit: number
  executionTime: number
  facets?: {
    types: Record<string, number>
    categories: Record<string, number>
    statuses: Record<string, number>
    riskScores: Record<string, number>
  }
  suggestions?: string[]
  query: {
    text?: string
    filters?: SearchFilters
    processedQuery: string
  }
}

export interface AutocompleteResponse {
  suggestions: Array<{
    text: string
    type: string
    count: number
  }>
}

export class SearchService {
  static async search(
    text?: string,
    filters?: SearchFilters,
    page: number = 1,
    limit: number = 20,
    sortBy: 'relevance' | 'date' | 'risk_score' | 'title' = 'relevance',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Promise<ApiResponse<SearchResponse>> {
    return apiClient.get<SearchResponse>('/search', {
      params: {
        text,
        ...filters,
        page,
        limit,
        sortBy,
        sortOrder,
        includeFacets: true,
        includeSuggestions: true
      }
    })
  }

  static async autocomplete(
    query: string,
    limit: number = 10
  ): Promise<ApiResponse<AutocompleteResponse>> {
    return apiClient.get<AutocompleteResponse>('/search/autocomplete', {
      params: { query, limit }
    })
  }

  static async findSimilar(
    itemId: string,
    type: string,
    limit: number = 10
  ): Promise<ApiResponse<SearchResult[]>> {
    return apiClient.get<SearchResult[]>('/search/similar', {
      params: { itemId, type, limit }
    })
  }

  static async getTrending(
    timeframe: 'hour' | 'day' | 'week' | 'month' = 'day',
    limit: number = 20
  ): Promise<ApiResponse<Array<{
    value: string
    count: number
    type: string
  }>>> {
    return apiClient.get('/search/trending', {
      params: { timeframe, limit }
    })
  }

  static async getAnalytics(
    timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<ApiResponse<{
    totalSearches: number
    uniqueUsers: number
    topQueries: Array<{ query: string; count: number }>
    searchesByType: Record<string, number>
    averageResultsPerQuery: number
    averageExecutionTime: number
    popularFilters: Record<string, number>
    trendsOverTime: Array<{ date: string; searches: number }>
  }>> {
    return apiClient.get(`/search/analytics`, {
      params: { timeframe }
    })
  }

  static async saveSearch(
    query: string,
    filters?: SearchFilters,
    name?: string
  ): Promise<ApiResponse<{ id: string; message: string }>> {
    return apiClient.post('/search/saved', {
      query,
      filters,
      name
    })
  }

  static async getSavedSearches(): Promise<ApiResponse<Array<{
    id: string
    name: string
    query: string
    filters: SearchFilters
    createdAt: string
  }>>> {
    return apiClient.get('/search/saved')
  }

  static async deleteSavedSearch(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/search/saved/${id}`)
  }
}
