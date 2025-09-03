import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CommentService } from '@/lib/api/services/comments'
import { Comment } from '@/types'

// Get comments for a report
export const useComments = (reportId: string, page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: ['comments', reportId, page, limit],
    queryFn: () => CommentService.getComments(reportId, page, limit),
    enabled: !!reportId,
  })
}

// Add a new comment
export const useAddComment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ reportId, content, parentId }: { reportId: string, content: string, parentId?: string }) =>
      CommentService.addComment(reportId, content, parentId),
    onSuccess: (data, variables) => {
      // Invalidate comments queries to show new comments/replies immediately
      queryClient.invalidateQueries({ queryKey: ['comments', variables.reportId] })
    },
  })
}

// Get replies for a specific comment
export const useCommentReplies = (commentId: string, page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: ['comment-replies', commentId, page, limit],
    queryFn: () => CommentService.getCommentReplies(commentId, page, limit),
    enabled: !!commentId
  })
}

// Toggle reaction on a comment
export const useToggleReaction = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ commentId, type }: { commentId: string, type: 'like' | 'love' | 'support' }) =>
      CommentService.toggleReaction(commentId, type),
    onSuccess: (data, variables) => {
      // Only invalidate comments queries to update reaction counts
      // This allows reaction counts to update immediately
      queryClient.invalidateQueries({ queryKey: ['comments'] })
    },
  })
}
