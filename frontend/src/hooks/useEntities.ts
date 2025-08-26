import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EntityService, EntityFilters } from '@/lib/api/services/entities'
import { Entity } from '@/types'

// Get all entities with filters
export const useEntities = (
  filters?: EntityFilters,
  page: number = 1,
  limit: number = 20
) => {
  return useQuery({
    queryKey: ['entities', filters, page, limit],
    queryFn: () => EntityService.getAll(filters, page, limit),
    enabled: true,
  })
}

// Get single entity by ID
export const useEntity = (id: string) => {
  return useQuery({
    queryKey: ['entity', id],
    queryFn: () => EntityService.getById(id),
    enabled: !!id,
  })
}

// Get entity statistics
export const useEntityStats = () => {
  return useQuery({
    queryKey: ['entity-stats'],
    queryFn: () => EntityService.getStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Create new entity
export const useCreateEntity = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<Entity>) => EntityService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] })
      queryClient.invalidateQueries({ queryKey: ['entity-stats'] })
    },
  })
}

// Update entity
export const useUpdateEntity = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Entity> }) => 
      EntityService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['entity', id] })
      queryClient.invalidateQueries({ queryKey: ['entities'] })
    },
  })
}

// Delete entity
export const useDeleteEntity = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => EntityService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] })
      queryClient.invalidateQueries({ queryKey: ['entity-stats'] })
    },
  })
}
