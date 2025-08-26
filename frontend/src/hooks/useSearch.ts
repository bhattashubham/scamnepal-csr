import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SearchService } from '@/lib/api/services/search'
import { SearchFilters } from '@/types'

// Main search hook
export const useSearch = (
  text?: string,
  filters?: SearchFilters,
  page: number = 1,
  limit: number = 20,
  sortBy: 'relevance' | 'date' | 'risk_score' | 'title' = 'relevance',
  sortOrder: 'ASC' | 'DESC' = 'DESC'
) => {
  return useQuery({
    queryKey: ['search', text, filters, page, limit, sortBy, sortOrder],
    queryFn: () => SearchService.search(text, filters, page, limit, sortBy, sortOrder),
    enabled: !!(text && text.length > 2) || !!(filters && Object.keys(filters).length > 0),
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Autocomplete hook
export const useAutocomplete = (query: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['autocomplete', query, limit],
    queryFn: () => SearchService.autocomplete(query, limit),
    enabled: query.length > 1,
    staleTime: 60 * 1000, // 1 minute
  })
}

// Find similar items
export const useFindSimilar = (itemId: string, type: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['similar', itemId, type, limit],
    queryFn: () => SearchService.findSimilar(itemId, type, limit),
    enabled: !!(itemId && type),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get trending searches
export const useTrending = (
  timeframe: 'hour' | 'day' | 'week' | 'month' = 'day',
  limit: number = 20
) => {
  return useQuery({
    queryKey: ['trending', timeframe, limit],
    queryFn: () => SearchService.getTrending(timeframe, limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get search analytics
export const useSearchAnalytics = (
  timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
) => {
  return useQuery({
    queryKey: ['search-analytics', timeframe],
    queryFn: () => SearchService.getAnalytics(timeframe),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get saved searches
export const useSavedSearches = () => {
  return useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => SearchService.getSavedSearches(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Save search mutation
export const useSaveSearch = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      query, 
      filters, 
      name 
    }: { 
      query: string; 
      filters?: SearchFilters; 
      name?: string 
    }) => SearchService.saveSearch(query, filters, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] })
    },
  })
}

// Delete saved search mutation
export const useDeleteSavedSearch = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => SearchService.deleteSavedSearch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] })
    },
  })
}

// Search hook with debouncing for real-time search
export const useSearchWithDebounce = (
  text: string,
  filters?: SearchFilters,
  debounceMs: number = 300
) => {
  const [debouncedText, setDebouncedText] = React.useState(text)
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(text)
    }, debounceMs)
    
    return () => clearTimeout(timer)
  }, [text, debounceMs])
  
  return useSearch(debouncedText, filters)
}
