import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ModerationService, QueueFilters, DecisionData } from '@/lib/api/services/moderation'
import { ModerationTask } from '@/types'

// Get moderation queue
export const useModerationQueue = (
  filters?: QueueFilters,
  page: number = 1,
  limit: number = 20,
  sortBy: 'created_at' | 'priority' | 'risk_score' | 'due_date' = 'created_at',
  sortOrder: 'ASC' | 'DESC' = 'DESC'
) => {
  return useQuery({
    queryKey: ['moderation-queue', filters, page, limit, sortBy, sortOrder],
    queryFn: () => ModerationService.getQueue(filters, page, limit, sortBy, sortOrder),
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  })
}

// Get single moderation task
export const useModerationTask = (id: string) => {
  return useQuery({
    queryKey: ['moderation-task', id],
    queryFn: () => ModerationService.getTask(id),
    enabled: !!id,
  })
}

// Get assigned tasks for current user
export const useAssignedTasks = (moderatorId?: string) => {
  return useQuery({
    queryKey: ['assigned-tasks', moderatorId],
    queryFn: () => ModerationService.getAssignedTasks(moderatorId),
    refetchInterval: 60 * 1000, // Refresh every minute
  })
}

// Get overdue tasks
export const useOverdueTasks = () => {
  return useQuery({
    queryKey: ['overdue-tasks'],
    queryFn: () => ModerationService.getOverdueTasks(),
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  })
}

// Get queue statistics
export const useQueueStats = (filters?: QueueFilters) => {
  return useQuery({
    queryKey: ['queue-stats', filters],
    queryFn: () => ModerationService.getQueueStats(filters),
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  })
}

// Get moderation analytics
export const useModerationAnalytics = (
  timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
) => {
  return useQuery({
    queryKey: ['moderation-analytics', timeframe],
    queryFn: () => ModerationService.getAnalytics(timeframe),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get moderator performance stats
export const useModeratorStats = (
  moderatorId?: string,
  timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
) => {
  return useQuery({
    queryKey: ['moderator-stats', moderatorId, timeframe],
    queryFn: () => ModerationService.getModeratorStats(moderatorId, timeframe),
    enabled: !!moderatorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get dashboard data
export const useModerationDashboard = (
  timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
) => {
  return useQuery({
    queryKey: ['moderation-dashboard', timeframe],
    queryFn: () => ModerationService.getDashboardData(timeframe),
    refetchInterval: 60 * 1000, // Refresh every minute
  })
}

// Get decision history for a task
export const useDecisionHistory = (taskId: string) => {
  return useQuery({
    queryKey: ['decision-history', taskId],
    queryFn: () => ModerationService.getDecisionHistory(taskId),
    enabled: !!taskId,
  })
}

// Assign task mutation
export const useAssignTask = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, moderatorId }: { taskId: string; moderatorId: string }) =>
      ModerationService.assignTask(taskId, moderatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] })
      queryClient.invalidateQueries({ queryKey: ['assigned-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] })
    },
  })
}

// Unassign task mutation
export const useUnassignTask = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (taskId: string) => ModerationService.unassignTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] })
      queryClient.invalidateQueries({ queryKey: ['assigned-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] })
    },
  })
}

// Update task status mutation
export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      taskId, 
      status, 
      reason 
    }: { 
      taskId: string; 
      status: ModerationTask['status']; 
      reason?: string 
    }) => ModerationService.updateTaskStatus(taskId, status, reason),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['moderation-task', taskId] })
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] })
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] })
    },
  })
}

// Update task priority mutation
export const useUpdateTaskPriority = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      taskId, 
      priority, 
      reason 
    }: { 
      taskId: string; 
      priority: ModerationTask['priority']; 
      reason?: string 
    }) => ModerationService.updateTaskPriority(taskId, priority, reason),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['moderation-task', taskId] })
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] })
    },
  })
}

// Make decision mutation
export const useMakeDecision = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, decision }: { taskId: string; decision: DecisionData }) =>
      ModerationService.makeDecision(taskId, decision),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['moderation-task', taskId] })
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] })
      queryClient.invalidateQueries({ queryKey: ['assigned-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] })
      queryClient.invalidateQueries({ queryKey: ['decision-history', taskId] })
    },
  })
}

// Bulk make decisions mutation
export const useBulkMakeDecisions = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (decisions: Array<{ taskId: string } & DecisionData>) =>
      ModerationService.bulkMakeDecisions(decisions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] })
      queryClient.invalidateQueries({ queryKey: ['assigned-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] })
    },
  })
}

// Bulk update tasks mutation
export const useBulkUpdateTasks = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      taskIds, 
      updates 
    }: { 
      taskIds: string[]; 
      updates: Partial<Pick<ModerationTask, 'status' | 'priority' | 'assignedTo'>> 
    }) => ModerationService.bulkUpdateTasks(taskIds, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] })
      queryClient.invalidateQueries({ queryKey: ['assigned-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] })
    },
  })
}
