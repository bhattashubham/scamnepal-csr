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
  Send,
  FileText,
  BarChart3
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
  const [rejectionNotes, setRejectionNotes] = useState('')
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
      <div className="max-w-6xl mx-auto space-y-8">
      {/* Modern Header with Gradient Background */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-100">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="relative p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <Button 
                onClick={onBack} 
                variant="outline" 
                size="sm"
                className="bg-white/80 backdrop-blur-sm border-blue-200 hover:bg-white hover:border-blue-300 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-white/80 rounded-lg shadow-sm">
                    <AlertTriangle className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{report.category}</h1>
                    <p className="text-sm text-gray-600 font-mono">ID: {report.id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Reported {formatRelativeTime(report.createdAt)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>by {report.reporterEmail}</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Report Status</p>
                <div className={`${getStatusColor(report.status)} flex items-center space-x-2 px-4 py-2 text-sm font-medium shadow-sm rounded-md border cursor-default`}>
                  {getStatusIcon(report.status)}
                  <span className="capitalize">{report.status.replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Last updated {formatRelativeTime(report.updatedAt || report.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Risk Assessment</p>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-red-600">{report.riskScore}</span>
                <Badge variant="outline" className={`text-xs ${riskScoreInfo?.bgColor} ${riskScoreInfo?.color}`}>
                  {riskScoreInfo?.label} Risk
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {(user?.role === 'admin' || user?.role === 'moderator') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStatusModal(true)}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
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
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Report
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareModal(true)}
            className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Report
          </Button>
        </div>
      </div>

      {/* Main Report Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Summary Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <span>Report Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Identifier Details */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Suspected Scammer</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">Contact:</span>
                    <span className="text-base font-medium text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded-md">
                      {report.identifierValue}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">Method:</span>
                    <span className="text-base font-medium text-gray-900">{report.identifierType}</span>
                  </div>
                </div>
              </div>

              {/* Incident Details */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Scam Details</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-red-500" />
                    <div>
                      <span className="text-sm text-gray-500">Money Lost: </span>
                      <span className="text-lg font-bold text-red-600">{formatCurrency(report.amountLost, report.currency)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div>
                      <span className="text-sm text-gray-500">When it happened: </span>
                      <span className="text-base font-semibold text-gray-900">{formatDate(report.incidentDate)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    <div>
                      <span className="text-sm text-gray-500">How they contacted: </span>
                      <span className="text-base font-semibold text-gray-900">{report.incidentChannel || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Narrative */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <span>What Happened</span>
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed text-base">{report.narrative}</p>
                </div>
              </div>

              {/* Evidence & Links */}
              {report.incidentChannel && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <div className="p-1.5 bg-indigo-100 rounded-lg">
                      <ExternalLink className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span>Evidence & Links</span>
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <MessageSquare className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Contact Channel</p>
                        <p className="text-base font-semibold text-gray-900">{report.incidentChannel}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}


            </CardContent>
          </Card>
        </div>



        {/* Right Column - Community Discussion */}
        <div className="space-y-6">
          {/* Community Discussion - Smaller */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl pb-2">
              <CardTitle className="flex items-center space-x-2 text-base">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                </div>
                <span>Community Discussion ({comments.length})</span>
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                Share your thoughts about this report
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3 p-3">
              {/* Add Comment */}
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex space-x-2">
                  <Avatar className="h-6 w-6 ring-1 ring-white shadow-sm">
                    <AvatarImage src={user?.profileImage ? `http://localhost:3001${user.profileImage}` : undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-xs">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="Share your thoughts..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                      className="bg-white border-gray-200 focus:border-blue-300 focus:ring-blue-200 text-sm h-8"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || addCommentMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-6 px-2"
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              {commentsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <div className="p-2 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm">No comments yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      {/* Main Comment */}
                      <div className="flex space-x-2">
                        <Avatar className="h-6 w-6 ring-1 ring-white shadow-sm">
                          <AvatarImage src={comment.userProfileImage ? `http://localhost:3001${comment.userProfileImage}` : undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-xs">
                            {comment.userEmail?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 space-y-1">
                          <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-xs text-gray-900">{comment.userName || comment.userEmail || 'Unknown User'}</span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                {formatRelativeTime(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed">{comment.content}</p>
                          </div>
                          
                          {/* Reactions */}
                          <div className="flex items-center space-x-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleToggleReaction(comment.id, 'like')}
                                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                    comment.userReactions?.like 
                                      ? 'bg-blue-100 text-blue-600' 
                                      : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
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
                                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                    comment.userReactions?.love 
                                      ? 'bg-red-100 text-red-600' 
                                      : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
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
                                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                    comment.userReactions?.support 
                                      ? 'bg-green-100 text-green-600' 
                                      : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
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
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Reply
                            </button>
                            
                            {/* Reply Count */}
                            {comment.replyCount && comment.replyCount > 0 && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                              </span>
                            )}
                          </div>
                          
                          {/* Reply Input */}
                          {replyingTo === comment.id && (
                            <div className="bg-gray-50 rounded-lg p-2">
                              <div className="flex space-x-2">
                                <Input
                                  placeholder="Write a reply..."
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && handleAddReply(comment.id)}
                                  className="bg-white border-gray-200 focus:border-blue-300 focus:ring-blue-200 text-xs h-7"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleAddReply(comment.id)}
                                  disabled={!replyContent.trim()}
                                  className="bg-blue-600 hover:bg-blue-700 text-white h-7 px-2"
                                >
                                  <Send className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-8 space-y-2">
                          {/* Show top 2 replies initially */}
                          {comment.replies.slice(0, 2).map((reply) => (
                            <div key={reply.id} className="flex space-x-2">
                              <Avatar className="h-5 w-5 ring-1 ring-white shadow-sm">
                                <AvatarImage src={reply.userProfileImage ? `http://localhost:3001${reply.userProfileImage}` : undefined} />
                                <AvatarFallback className="bg-green-100 text-green-600 font-semibold text-xs">
                                  {reply.userEmail?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 space-y-1">
                                <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-semibold text-xs text-gray-900">{reply.userName || reply.userEmail || 'Unknown User'}</span>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                      {formatRelativeTime(reply.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-700 leading-relaxed">{reply.content}</p>
                                </div>
                                
                                {/* Reply Reactions */}
                                <div className="flex items-center space-x-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => handleToggleReaction(reply.id, 'like')}
                                        className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                          reply.userReactions?.like 
                                            ? 'bg-blue-100 text-blue-600' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                                        }`}
                                      >
                                        <ThumbsUp className="h-2.5 w-2.5" />
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
                                        className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                          reply.userReactions?.love 
                                            ? 'bg-red-100 text-red-600' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                                        }`}
                                      >
                                        <Heart className="h-2.5 w-2.5" />
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
                                        className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                          reply.userReactions?.support 
                                            ? 'bg-green-100 text-green-600' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                                        }`}
                                      >
                                        <Shield className="h-2.5 w-2.5" />
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
                          
                          {/* View More/Less Button */}
                          {comment.replyCount && comment.replyCount > 2 && (
                            <div className="ml-7">
                              {!expandedReplies.has(comment.id) ? (
                                <button
                                  onClick={() => handleViewMoreReplies(comment.id)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-full transition-colors"
                                >
                                  View {comment.replyCount - 2} more replies
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleViewLessReplies(comment.id)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-full transition-colors"
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

          {/* Timeline Section - Admin/Moderator Only - Smaller */}
          {(user?.role === 'admin' || user?.role === 'moderator') && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-xl pb-2">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <Clock className="h-4 w-4 text-purple-600" />
                  </div>
                  <span>Report Timeline</span>
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm">
                  Track all changes and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 max-h-[400px] overflow-y-auto">
                {historyData?.data && historyData.data.length > 0 ? (
                  <div className="space-y-3">
                    {historyData.data.map((entry: any, index: number) => (
                      <div key={entry.id || index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                          {index < (historyData.data?.length || 0) - 1 && (
                            <div className="w-px h-6 bg-gray-200 ml-1 mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-gray-900 text-sm">
                                {entry.old_status ? `${entry.old_status} → ${entry.new_status}` : `Status: ${entry.new_status}`}
                              </h4>
                              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                {formatRelativeTime(entry.created_at)}
                              </span>
                            </div>
                            {entry.reason && (
                              <p className="text-xs text-gray-600 mb-1">{entry.reason}</p>
                            )}
                            {entry.notes && (
                              <div className="bg-gray-50 rounded-lg p-2 mb-1">
                                <p className="text-xs text-gray-700 italic">"{entry.notes}"</p>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <span className="text-xs font-medium text-gray-700">
                                {entry.changed_by_name || entry.changed_by_email || 'System'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <div className="p-2 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-xs">No timeline data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>




      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Update Report Status</h3>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  updateStatusMutation.mutate({
                    id: report.id,
                    status: 'pending',
                    notes: `Status updated to pending by ${user?.name || user?.email || 'Unknown User'}`
                  })
                  setShowStatusModal(false)
                  setRejectionNotes('')
                }}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                disabled={updateStatusMutation.isPending}
              >
                <Clock className="h-4 w-4 mr-2" />
                Mark as Pending
              </Button>
              <Button
                onClick={() => {
                  updateStatusMutation.mutate({
                    id: report.id,
                    status: 'under_review',
                    notes: `Status updated to under review by ${user?.name || user?.email || 'Unknown User'}`
                  })
                  setShowStatusModal(false)
                  setRejectionNotes('')
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={updateStatusMutation.isPending}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Mark as Under Review
              </Button>
              <Button
                onClick={() => {
                  updateStatusMutation.mutate({
                    id: report.id,
                    status: 'verified',
                    notes: `Status updated to verified by ${user?.name || user?.email || 'Unknown User'}`
                  })
                  setShowStatusModal(false)
                  setRejectionNotes('')
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={updateStatusMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Verified
              </Button>
              
              {/* Rejection with Notes */}
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    if (!rejectionNotes.trim()) {
                      alert('Please provide a reason for rejection')
                      return
                    }
                    updateStatusMutation.mutate({
                      id: report.id,
                      status: 'rejected',
                      notes: `Status updated to rejected by ${user?.name || user?.email || 'Unknown User'}. Reason: ${rejectionNotes}`
                    })
                    setShowStatusModal(false)
                    setRejectionNotes('')
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={updateStatusMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark as Rejected
                </Button>
                <Input
                  placeholder="Reason for rejection (required)"
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
            <Button
              onClick={() => {
                setShowStatusModal(false)
                setRejectionNotes('')
              }}
              variant="outline"
              className="w-full mt-4"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Share Report Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Share Report</h3>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  // Generate PDF
                  const generatePDF = () => {
                    const reportContent = `
SCAM REPORT - ${report.category}
Report ID: ${report.id}
Generated: ${new Date().toLocaleDateString()}

SUSPECTED SCAMMER:
Contact: ${report.identifierValue}
Method: ${report.identifierType}

SCAM DETAILS:
Money Lost: ${formatCurrency(report.amountLost, report.currency)}
When it happened: ${formatDate(report.incidentDate)}
How they contacted: ${report.incidentChannel || 'Not specified'}

NARRATIVE:
${report.narrative}

Reported by: ${report.reporterEmail}
Status: ${report.status.replace('_', ' ')}
Risk Score: ${report.riskScore}

---
Generated by ScamNepal Community Scam Registry
Visit: ${window.location.origin}/dashboard/reports/${report.id}
                    `
                    
                    const blob = new Blob([reportContent], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `scam-report-${report.id}.txt`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                  }
                  
                  generatePDF()
                  setShowShareModal(false)
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download as Text File
              </Button>
              <Button
                onClick={() => {
                  const url = `${window.location.origin}/dashboard/reports/${report.id}`
                  navigator.clipboard.writeText(url)
                  setShowShareModal(false)
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button
                onClick={() => {
                  const url = `${window.location.origin}/dashboard/reports/${report.id}`
                  if (navigator.share) {
                    navigator.share({
                      title: `Scam Report: ${report.category}`,
                      text: `Check out this scam report: ${report.category}`,
                      url: url
                    })
                  }
                  setShowShareModal(false)
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share via Device
              </Button>
            </div>
            <Button
              onClick={() => setShowShareModal(false)}
              variant="outline"
              className="w-full mt-4"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Edit Report Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Report</h3>
            <p className="text-gray-600 mb-4">Edit functionality will be implemented here.</p>
            <Button
              onClick={() => setShowEditModal(false)}
              variant="outline"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </TooltipProvider>
  )
}
