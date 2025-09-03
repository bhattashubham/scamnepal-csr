'use client'

import { useState } from 'react'
import { 
  ArrowLeft, 
  Edit, 
  Share2, 
  Flag, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  MapPin,
  Calendar,
  DollarSign,
  MessageSquare,
  ExternalLink,
  Download,
  Eye,
  Shield,
  Plus,
  Trash2,
  Heart,
  ThumbsUp,
  MessageCircle,
  Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useReport, useUpdateReportStatus, useSimilarReports, useReportHistory, useUpdateReport } from '@/hooks/useReports'
import { useComments, useAddComment, useToggleReaction, useCommentReplies } from '@/hooks/useComments'
import { formatCurrency, formatRelativeTime, formatRiskScore, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import { Report, Comment } from '@/types'

interface ReportDetailsProps {
  reportId: string
  onBack: () => void
}

export default function ReportDetails({ reportId, onBack }: ReportDetailsProps) {
  const { user } = useAuthStore()
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [allReplies, setAllReplies] = useState<Record<string, Comment[]>>({})

  const { data: reportData, isLoading: reportLoading } = useReport(reportId)
  const { data: commentsData, isLoading: commentsLoading } = useComments(reportId)
  const { data: similarReports } = useSimilarReports(reportId)
  const { data: historyData } = useReportHistory(reportId)
  
  const updateStatusMutation = useUpdateReportStatus()
  const updateReportMutation = useUpdateReport()
  const addCommentMutation = useAddComment()
  const toggleReactionMutation = useToggleReaction()

  const report = reportData?.data
  const comments = commentsData?.data?.comments || []
  const riskScoreInfo = report ? formatRiskScore(report.riskScore) : null

  const handleAddComment = async () => {
    if (!newComment.trim() || !report) return

    try {
      await addCommentMutation.mutateAsync({
        reportId: report.id,
        content: newComment.trim()
      })
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const handleAddReply = async (parentId: string) => {
    if (!replyContent.trim() || !report) return

    try {
      await addCommentMutation.mutateAsync({
        reportId: report.id,
        content: replyContent.trim(),
        parentId
      })
      setReplyContent('')
      setReplyingTo(null)
    } catch (error) {
      console.error('Failed to add reply:', error)
    }
  }

  const handleToggleReaction = async (commentId: string, type: 'like' | 'love' | 'support') => {
    try {
      await toggleReactionMutation.mutateAsync({ commentId, type })
    } catch (error) {
      console.error('Failed to toggle reaction:', error)
    }
  }

  const handleViewMoreReplies = async (commentId: string) => {
    try {
      // Fetch all replies for this comment
      const response = await fetch(`http://localhost:3001/api/comments/${commentId}/replies?page=1&limit=100`, {
        headers: {
          'Authorization': `Bearer ${btoa(JSON.stringify({ userId: user?.id, email: user?.email, role: user?.role }))}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAllReplies(prev => ({
          ...prev,
          [commentId]: data.data.replies
        }))
        setExpandedReplies(prev => new Set([...prev, commentId]))
      }
    } catch (error) {
      console.error('Failed to fetch more replies:', error)
    }
  }

  const handleViewLessReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev)
      newSet.delete(commentId)
      return newSet
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />
      case 'under_review': return <Clock className="h-5 w-5 text-yellow-500" />
      default: return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'under_review': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (reportLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Report not found</h3>
        <p className="text-gray-500 mb-4">The report you're looking for doesn't exist or has been removed.</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{report.category}</h1>
            <p className="text-sm text-gray-500">Report ID: {report.id}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className={`${getStatusColor(report.status)} flex items-center space-x-1`}>
            {getStatusIcon(report.status)}
            <span className="capitalize">{report.status.replace('_', ' ')}</span>
          </Badge>
        </div>
      </div>

      {/* Main Report Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>{report.category}</span>
                <Badge variant="outline" className={`text-xs ${riskScoreInfo?.bgColor} ${riskScoreInfo?.color}`}>
                  {riskScoreInfo?.label}
                </Badge>
              </CardTitle>
              <CardDescription>
                Reported by {report.reporterEmail} • {formatRelativeTime(report.createdAt)}
              </CardDescription>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              {(user?.role === 'admin' || user?.role === 'moderator') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStatusModal(true)}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
              )}
              
              {user?.id === report.reporterUserId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareModal(true)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Identifier Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Identifier Details</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Type:</span>
                  <span className="ml-2 font-medium">{report.identifierType}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Value:</span>
                  <span className="ml-2 font-medium break-all">{report.identifierValue}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Risk Assessment</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-red-600">{report.riskScore}</span>
                  <span className="text-sm text-gray-500">Risk Score</span>
                </div>
                <Badge variant="outline" className={`text-xs ${riskScoreInfo?.bgColor} ${riskScoreInfo?.color}`}>
                  {riskScoreInfo?.label} Risk
                </Badge>
              </div>
            </div>
          </div>

          {/* Incident Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Amount Lost</p>
                <p className="font-medium">{formatCurrency(report.amountLost, report.currency)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Incident Date</p>
                <p className="font-medium">{formatDate(report.incidentDate)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Contact Channel</p>
                <p className="font-medium">{report.incidentChannel || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Narrative */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">What Happened</h3>
            <p className="text-gray-700 leading-relaxed">{report.narrative}</p>
          </div>

          {/* Evidence & Links */}
          {report.incidentChannel && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Evidence & Links</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Contact Channel:</span>
                  <span className="ml-2 text-sm">{report.incidentChannel}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Comments ({comments.length})</span>
          </CardTitle>
          <CardDescription>
            Share your thoughts, experiences, or additional information about this report
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Add Comment */}
          <div className="flex space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImage ? `http://localhost:3001${user.profileImage}` : undefined} />
              <AvatarFallback>{user?.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Share your thoughts about this report..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Comment
                </Button>
              </div>
            </div>
          </div>

          {/* Comments List */}
          {commentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="space-y-3">
                  {/* Main Comment */}
                  <div className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.userProfileImage ? `http://localhost:3001${comment.userProfileImage}` : undefined} />
                      <AvatarFallback>{comment.userEmail?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">{comment.userName || comment.userEmail || 'Unknown User'}</span>
                          <span className="text-xs text-gray-500">{formatRelativeTime(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                      
                      {/* Reactions */}
                      <div className="flex items-center space-x-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleToggleReaction(comment.id, 'like')}
                              className={`flex items-center space-x-1 text-xs ${
                                comment.userReactions?.like ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                              }`}
                            >
                              <ThumbsUp className="h-3 w-3" />
                              <span>{comment.reactions?.like || 0}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs px-2 py-1">
                            <p>Like</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleToggleReaction(comment.id, 'love')}
                              className={`flex items-center space-x-1 text-xs ${
                                comment.userReactions?.love ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                              }`}
                            >
                              <Heart className="h-3 w-3" />
                              <span>{comment.reactions?.love || 0}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs px-2 py-1">
                            <p>Love</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleToggleReaction(comment.id, 'support')}
                              className={`flex items-center space-x-1 text-xs ${
                                comment.userReactions?.support ? 'text-green-600' : 'text-gray-500 hover:text-green-600'
                              }`}
                            >
                              <Shield className="h-3 w-3" />
                              <span>{comment.reactions?.support || 0}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs px-2 py-1">
                            <p>Support</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <button
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Reply
                        </button>
                        
                        {/* Reply Count */}
                        {comment.replyCount && comment.replyCount > 0 && (
                          <span className="text-xs text-gray-500">
                            {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                          </span>
                        )}
                      </div>
                      
                      {/* Reply Input */}
                      {replyingTo === comment.id && (
                        <div className="flex space-x-2 mt-2">
                          <Input
                            placeholder="Write a reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddReply(comment.id)}
                            className="h-8"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddReply(comment.id)}
                            disabled={!replyContent.trim()}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-11 space-y-3">
                      {/* Show top 3 replies initially */}
                      {comment.replies.slice(0, 3).map((reply) => (
                        <div key={reply.id} className="flex space-x-3">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={reply.userProfileImage ? `http://localhost:3001${reply.userProfileImage}` : undefined} />
                            <AvatarFallback className="text-xs">{reply.userEmail?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 space-y-2">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-sm">{reply.userName || reply.userEmail || 'Unknown User'}</span>
                                <span className="text-xs text-gray-500">{formatRelativeTime(reply.createdAt)}</span>
                              </div>
                              <p className="text-sm text-gray-700">{reply.content}</p>
                            </div>
                            
                            {/* Reply Reactions */}
                            <div className="flex items-center space-x-4">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleToggleReaction(reply.id, 'like')}
                                    className={`flex items-center space-x-1 text-xs ${
                                      reply.userReactions?.like ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                                    }`}
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                    <span>{reply.reactions?.like || 0}</span>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs px-2 py-1">
                                  <p>Like</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleToggleReaction(reply.id, 'love')}
                                    className={`flex items-center space-x-1 text-xs ${
                                      reply.userReactions?.love ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                                    }`}
                                  >
                                    <Heart className="h-3 w-3" />
                                    <span>{reply.reactions?.love || 0}</span>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs px-2 py-1">
                                  <p>Love</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleToggleReaction(reply.id, 'support')}
                                    className={`flex items-center space-x-1 text-xs ${
                                      reply.userReactions?.support ? 'text-green-600' : 'text-gray-500 hover:text-green-600'
                                    }`}
                                  >
                                    <Shield className="h-3 w-3" />
                                    <span>{reply.reactions?.support || 0}</span>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs px-2 py-1">
                                  <p>Support</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Show additional replies if expanded */}
                      {expandedReplies.has(comment.id) && allReplies[comment.id] && allReplies[comment.id].length > 3 && (
                        <>
                          {allReplies[comment.id].slice(3).map((reply) => (
                            <div key={reply.id} className="flex space-x-3">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={reply.userProfileImage ? `http://localhost:3001${reply.userProfileImage}` : undefined} />
                                <AvatarFallback className="text-xs">{reply.userEmail?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 space-y-2">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium text-sm">{reply.userName || reply.userEmail || 'Unknown User'}</span>
                                    <span className="text-xs text-gray-500">{formatRelativeTime(reply.createdAt)}</span>
                                  </div>
                                  <p className="text-sm text-gray-700">{reply.content}</p>
                                </div>
                                
                                {/* Reply Reactions */}
                                <div className="flex items-center space-x-4">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => handleToggleReaction(reply.id, 'like')}
                                        className={`flex items-center space-x-1 text-xs ${
                                          reply.userReactions?.like ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                                        }`}
                                      >
                                        <ThumbsUp className="h-3 w-3" />
                                        <span>{reply.reactions?.like || 0}</span>
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs px-2 py-1">
                                      <p>Like</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => handleToggleReaction(reply.id, 'love')}
                                        className={`flex items-center space-x-1 text-xs ${
                                          reply.userReactions?.love ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                                        }`}
                                      >
                                        <Heart className="h-3 w-3" />
                                        <span>{reply.reactions?.love || 0}</span>
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs px-2 py-1">
                                      <p>Love</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => handleToggleReaction(reply.id, 'support')}
                                        className={`flex items-center space-x-1 text-xs ${
                                          reply.userReactions?.support ? 'text-green-600' : 'text-gray-500 hover:text-green-600'
                                        }`}
                                      >
                                        <Shield className="h-3 w-3" />
                                        <span>{reply.reactions?.support || 0}</span>
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs px-2 py-1">
                                      <p>Support</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                      
                      {/* View More/Less Button */}
                      {comment.replyCount && comment.replyCount > 3 && (
                        <div className="ml-9">
                          {!expandedReplies.has(comment.id) ? (
                            <button
                              onClick={() => handleViewMoreReplies(comment.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View {comment.replyCount - 3} more replies
                            </button>
                          ) : (
                            <button
                              onClick={() => handleViewLessReplies(comment.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View less
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  )
}
