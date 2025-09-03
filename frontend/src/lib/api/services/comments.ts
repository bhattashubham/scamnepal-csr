import { ApiResponse, Comment } from '@/types'
import { apiClient } from '../client'

export class CommentService {
  static async getComments(reportId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<{ comments: Comment[], total: number }>> {
    return apiClient.get<{ comments: Comment[], total: number }>(`/reports/${reportId}/comments?page=${page}&limit=${limit}`)
  }

  static async addComment(reportId: string, content: string, parentId?: string): Promise<ApiResponse<Comment>> {
    return apiClient.post<Comment>(`/reports/${reportId}/comments`, {
      content,
      parentId
    })
  }

  static async getCommentReplies(commentId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<{ replies: Comment[], total: number }>> {
    return apiClient.get<{ replies: Comment[], total: number }>(`/comments/${commentId}/replies?page=${page}&limit=${limit}`)
  }

  static async toggleReaction(commentId: string, type: 'like' | 'love' | 'support'): Promise<ApiResponse<{ action: 'added' | 'removed' }>> {
    return apiClient.post<{ action: 'added' | 'removed' }>(`/comments/${commentId}/reactions`, {
      type
    })
  }
}
