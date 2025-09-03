import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserService, CreateUserData, UpdateUserData } from '@/lib/api/services/users'

// Get all users with pagination
export const useUsers = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: ['users', page, limit],
    queryFn: () => UserService.getUsers(page, limit),
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Create user mutation
export const useCreateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userData: CreateUserData) => UserService.createUser(userData),
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// Update user mutation
export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, userData }: { id: string, userData: UpdateUserData }) => 
      UserService.updateUser(id, userData),
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// Delete user mutation
export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => UserService.deleteUser(id),
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// Upload profile image mutation
export const useUploadProfileImage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (file: File) => UserService.uploadProfileImage(file),
    onSuccess: () => {
      // Invalidate user-related queries to refresh profile data
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}
