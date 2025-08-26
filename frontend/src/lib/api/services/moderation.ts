import { apiClient } from '../client'
import { ModerationTask, ApiResponse, PaginatedResponse } from '@/types'

export interface QueueFilters {
  type?: 'report' | 'entity' | 'identifier' | 'comment'
  status?: string
  priority?: string
  assignedTo?: string
  category?: string
  dateFrom?: string
  dateTo?: string
  riskScoreMin?: number
  riskScoreMax?: number
}

export interface QueueStats {
  pending: number
  underReview: number
  requiresInfo: number
  escalated: number
  completed: number
  total: number
  averageProcessingTime: number
  overdueTasks: number
}

export interface DecisionData {
  decision: 'approve' | 'reject' | 'escalate' | 'require_info'
  reason: string
  notes?: string
  actionData?: Record<string, any>
}

export interface ModerationAnalytics {
  totalDecisions: number
  decisionsByType: Record<string, number>
  decisionsByItemType: Record<string, number>
  averageDecisionTime: number
  escalationRate: number
  topModerators: Array<{
    moderatorId: string
    decisions: number
    averageTime: number
  }>
}

export class ModerationService {
  static async getQueue(
    filters?: QueueFilters,
    page: number = 1,
    limit: number = 20,
    sortBy: 'created_at' | 'priority' | 'risk_score' | 'due_date' = 'created_at',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Promise<ApiResponse<{
    tasks: ModerationTask[]
    total: number
    page: number
    limit: number
    stats: QueueStats
  }>> {
    return apiClient.get('/moderation/queue', {
      params: { ...filters, page, limit, sortBy, sortOrder }
    })
  }

  static async getTask(id: string): Promise<ApiResponse<ModerationTask>> {
    return apiClient.get<ModerationTask>(`/moderation/queue/${id}`)
  }

  static async assignTask(taskId: string, moderatorId: string): Promise<ApiResponse<ModerationTask>> {
    return apiClient.post<ModerationTask>(`/moderation/queue/${taskId}/assign`, {
      moderatorId
    })
  }

  static async unassignTask(taskId: string): Promise<ApiResponse<ModerationTask>> {
    return apiClient.post<ModerationTask>(`/moderation/queue/${taskId}/unassign`)
  }

  static async updateTaskStatus(
    taskId: string,
    status: ModerationTask['status'],
    reason?: string
  ): Promise<ApiResponse<ModerationTask>> {
    return apiClient.patch<ModerationTask>(`/moderation/queue/${taskId}/status`, {
      status,
      reason
    })
  }

  static async updateTaskPriority(
    taskId: string,
    priority: ModerationTask['priority'],
    reason?: string
  ): Promise<ApiResponse<ModerationTask>> {
    return apiClient.patch<ModerationTask>(`/moderation/queue/${taskId}/priority`, {
      priority,
      reason
    })
  }

  static async makeDecision(
    taskId: string,
    decision: DecisionData
  ): Promise<ApiResponse<{
    success: boolean
    actionTaken: string
    updatedItem?: any
  }>> {
    return apiClient.post(`/moderation/decisions`, {
      taskId,
      ...decision
    })
  }

  static async bulkMakeDecisions(
    decisions: Array<{ taskId: string } & DecisionData>
  ): Promise<ApiResponse<{
    successful: number
    failed: number
    results: Array<{
      taskId: string
      success: boolean
      actionTaken?: string
      error?: string
    }>
  }>> {
    return apiClient.post('/moderation/decisions/bulk', { decisions })
  }

  static async bulkUpdateTasks(
    taskIds: string[],
    updates: Partial<Pick<ModerationTask, 'status' | 'priority' | 'assignedTo'>>
  ): Promise<ApiResponse<{ updatedCount: number }>> {
    return apiClient.patch('/moderation/queue/bulk', {
      taskIds,
      updates
    })
  }

  static async getAssignedTasks(moderatorId?: string): Promise<ApiResponse<ModerationTask[]>> {
    return apiClient.get<ModerationTask[]>('/moderation/assigned', {
      params: { moderatorId }
    })
  }

  static async getOverdueTasks(): Promise<ApiResponse<ModerationTask[]>> {
    return apiClient.get<ModerationTask[]>('/moderation/overdue')
  }

  static async getQueueStats(filters?: QueueFilters): Promise<ApiResponse<QueueStats>> {
    return apiClient.get<QueueStats>('/moderation/stats', {
      params: filters
    })
  }

  static async getDecisionHistory(taskId: string): Promise<ApiResponse<any[]>> {
    return apiClient.get(`/moderation/tasks/${taskId}/history`)
  }

  static async getModeratorStats(
    moderatorId?: string,
    timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<ApiResponse<{
    totalDecisions: number
    approvals: number
    rejections: number
    escalations: number
    infoRequests: number
    averageDecisionTime: number
    accuracyScore?: number
  }>> {
    return apiClient.get('/moderation/moderator-stats', {
      params: { moderatorId, timeframe }
    })
  }

  static async getAnalytics(
    timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<ApiResponse<ModerationAnalytics>> {
    return apiClient.get('/moderation/analytics', {
      params: { timeframe }
    })
  }

  static async getDashboardData(
    timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<ApiResponse<{
    queueStats: QueueStats
    decisionAnalytics: ModerationAnalytics
    auditSummary: any
    performanceMetrics: any
    recentActivity: any[]
  }>> {
    return apiClient.get('/moderation/dashboard', {
      params: { timeframe }
    })
  }
}
