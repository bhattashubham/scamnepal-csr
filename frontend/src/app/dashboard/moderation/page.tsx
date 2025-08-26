'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar,
  Filter,
  MoreHorizontal,
  Eye,
  Flag,
  MessageSquare,
  TrendingUp,
  Users,
  FileText,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  useModerationQueue, 
  useQueueStats, 
  useAssignedTasks, 
  useAssignTask,
  useUnassignTask,
  useUpdateTaskStatus,
  useUpdateTaskPriority,
  useMakeDecision,
  useBulkUpdateTasks
} from '@/hooks/useModeration'
import { formatRelativeTime, formatRiskScore } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import { ModerationTask } from '@/types'
import { QueueFilters } from '@/lib/api/services/moderation'

export default function ModerationPage() {
  const { user } = useAuthStore()
  const [filters, setFilters] = useState<QueueFilters>({})
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showDecisionModal, setShowDecisionModal] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // API hooks
  const { data: queueData, isLoading } = useModerationQueue(filters, page, 20)
  const { data: statsData } = useQueueStats(filters)
  const { data: assignedTasksData } = useAssignedTasks(user?.id)
  
  const assignTaskMutation = useAssignTask()
  const unassignTaskMutation = useUnassignTask()
  const updateStatusMutation = useUpdateTaskStatus()
  const updatePriorityMutation = useUpdateTaskPriority()
  const makeDecisionMutation = useMakeDecision()
  const bulkUpdateMutation = useBulkUpdateTasks()

  const tasks = queueData?.data?.tasks || []
  const stats = queueData?.data?.stats || statsData?.data
  const assignedTasks = assignedTasksData?.data || []

  const handleSelectTask = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const handleSelectAll = () => {
    setSelectedTasks(
      selectedTasks.length === tasks.length 
        ? [] 
        : tasks.map(task => task.id)
    )
  }

  const handleAssignToMe = async (taskId: string) => {
    if (user?.id) {
      try {
        await assignTaskMutation.mutateAsync({ taskId, moderatorId: user.id })
      } catch (error) {
        console.error('Failed to assign task:', error)
      }
    }
  }

  const handleUnassign = async (taskId: string) => {
    try {
      await unassignTaskMutation.mutateAsync(taskId)
    } catch (error) {
      console.error('Failed to unassign task:', error)
    }
  }

  const handleUpdatePriority = async (taskId: string, priority: ModerationTask['priority']) => {
    try {
      await updatePriorityMutation.mutateAsync({ taskId, priority })
    } catch (error) {
      console.error('Failed to update priority:', error)
    }
  }

  const handleBulkAssign = async () => {
    if (user?.id && selectedTasks.length > 0) {
      try {
        await bulkUpdateMutation.mutateAsync({
          taskIds: selectedTasks,
          updates: { assignedTo: user.id }
        })
        setSelectedTasks([])
        setShowBulkActions(false)
      } catch (error) {
        console.error('Failed to bulk assign:', error)
      }
    }
  }

  const handleBulkUpdateStatus = async (status: ModerationTask['status']) => {
    if (selectedTasks.length > 0) {
      try {
        await bulkUpdateMutation.mutateAsync({
          taskIds: selectedTasks,
          updates: { status }
        })
        setSelectedTasks([])
        setShowBulkActions(false)
      } catch (error) {
        console.error('Failed to bulk update status:', error)
      }
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-700 bg-red-100 border-red-200'
      case 'high':
        return 'text-orange-700 bg-orange-100 border-orange-200'
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'low':
        return 'text-green-700 bg-green-100 border-green-200'
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'under_review':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'escalated':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'requires_more_info':
        return <MessageSquare className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'report':
        return <FileText className="h-4 w-4 text-blue-600" />
      case 'entity':
        return <Shield className="h-4 w-4 text-red-600" />
      case 'identifier':
        return <Flag className="h-4 w-4 text-orange-600" />
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-green-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  useEffect(() => {
    setShowBulkActions(selectedTasks.length > 0)
  }, [selectedTasks])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Shield className="h-8 w-8 text-indigo-600 mr-3" />
              Moderation Center
            </h1>
            <p className="text-gray-600">
              Review and manage content quality across the platform
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/dashboard/reports/new'}
            >
              <FileText className="h-4 w-4 mr-2" />
              New Report
            </Button>
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button>
              <Zap className="h-4 w-4 mr-2" />
              Quick Review
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Under Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.underReview || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Escalated</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.escalated || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.completed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">My Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{assignedTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Queue */}
        <div className="lg:col-span-3 space-y-6">
          {/* Filters and Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <select
                    value={filters.type || 'all'}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value === 'all' ? undefined : e.target.value as any })}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="report">Reports</option>
                    <option value="entity">Entities</option>
                    <option value="identifier">Identifiers</option>
                    <option value="comment">Comments</option>
                  </select>

                  <select
                    value={filters.status || 'all'}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value === 'all' ? undefined : e.target.value })}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="requires_more_info">Needs Info</option>
                    <option value="escalated">Escalated</option>
                  </select>

                  <select
                    value={filters.priority || 'all'}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value === 'all' ? undefined : e.target.value })}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {tasks.length} tasks
                  </span>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </div>

              {/* Bulk Actions */}
              {showBulkActions && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-indigo-900">
                      {selectedTasks.length} tasks selected
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" onClick={handleBulkAssign}>
                        Assign to Me
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkUpdateStatus('under_review')}>
                        Start Review
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkUpdateStatus('escalated')}>
                        Escalate
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setSelectedTasks([])}>
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Queue */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Moderation Queue</CardTitle>
                  <CardDescription>
                    Tasks requiring review and action
                  </CardDescription>
                </div>
                <Button size="sm" onClick={handleSelectAll}>
                  {selectedTasks.length === tasks.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading queue...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Queue is empty!</h3>
                  <p className="text-gray-600">All tasks have been processed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => {
                    const riskInfo = task.riskScore ? formatRiskScore(task.riskScore) : null
                    
                    return (
                      <div
                        key={task.id}
                        className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                          selectedTasks.includes(task.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedTasks.includes(task.id)}
                              onChange={() => handleSelectTask(task.id)}
                              className="mt-1"
                            />
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                {getTypeIcon(task.type)}
                                <div className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                                  {task.priority} priority
                                </div>
                                {riskInfo && (
                                  <div className={`px-2 py-1 rounded text-xs font-medium border ${riskInfo.bgColor} ${riskInfo.color}`}>
                                    Risk: {task.riskScore}
                                  </div>
                                )}
                                <div className="text-xs text-gray-500">
                                  {formatRelativeTime(task.createdAt)}
                                </div>
                              </div>

                              <h4 className="font-medium text-gray-900 mb-1">
                                {task.title || `${task.type} Review`}
                              </h4>
                              
                              <p className="text-sm text-gray-600 mb-2">
                                Item ID: {task.itemId}
                              </p>

                              <div className="flex items-center space-x-4 text-sm">
                                <div className="flex items-center">
                                  {getStatusIcon(task.status)}
                                  <span className="ml-1 capitalize">{task.status.replace('_', ' ')}</span>
                                </div>
                                
                                {task.assignedTo && (
                                  <div className="flex items-center text-gray-600">
                                    <User className="h-4 w-4 mr-1" />
                                    <span>Assigned</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {!task.assignedTo ? (
                              <Button 
                                size="sm" 
                                onClick={() => handleAssignToMe(task.id)}
                                disabled={assignTaskMutation.isPending}
                              >
                                Assign to Me
                              </Button>
                            ) : task.assignedTo === user?.id ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleUnassign(task.id)}
                                disabled={unassignTaskMutation.isPending}
                              >
                                Unassign
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-500">Assigned to other</span>
                            )}

                            <div className="relative">
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* My Assigned Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                My Tasks
              </CardTitle>
              <CardDescription>
                {assignedTasks.length} tasks assigned to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignedTasks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No tasks assigned
                </p>
              ) : (
                <div className="space-y-3">
                  {assignedTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium capitalize">{task.type}</p>
                          <p className="text-xs text-gray-500">{formatRelativeTime(task.createdAt)}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Review High Priority
              </Button>
              
              <Button className="w-full justify-start" variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Check Overdue
              </Button>
              
              <Button className="w-full justify-start" variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Bulk Decision
              </Button>
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Your Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Today's Reviews</span>
                  <span className="text-sm font-medium">12</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg. Decision Time</span>
                  <span className="text-sm font-medium">2.4 min</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Accuracy Score</span>
                  <span className="text-sm font-medium text-green-600">94%</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Queue Position</span>
                  <span className="text-sm font-medium">#3 of 15</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
