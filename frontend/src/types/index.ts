// Shared types from backend
export interface User {
  id: string
  email: string
  name?: string
  phoneNumber?: string
  role: 'user' | 'moderator' | 'admin'
  isVerified: boolean
  profileImage?: string
  createdAt: string
  lastLogin?: string
}

export interface Report {
  id: string
  identifierType: string
  identifierValue: string
  category: string
  amountLost: number
  currency: string
  incidentDate: string
  incidentChannel: string
  narrative: string
  status: 'pending' | 'verified' | 'rejected' | 'under_review'
  riskScore: number
  reporterUserId: string
  reporterEmail: string
  createdAt: string
  updatedAt: string
}

export interface Entity {
  id: string
  displayName: string
  riskScore: number
  status: 'alleged' | 'confirmed' | 'disputed' | 'cleared'
  reportCount: number
  totalAmountLost: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Identifier {
  id: string
  type: string
  value: string
  status: 'unverified' | 'verified' | 'flagged' | 'rejected'
  riskScore: number
  reportCount: number
  createdAt: string
  updatedAt: string
}

export interface SearchResult {
  id: string
  type: 'identifier' | 'entity' | 'report'
  title: string
  description: string
  relevance: number
  metadata: Record<string, any>
  url: string
  timestamp: string
}

export interface ModerationTask {
  id: string
  type: 'report' | 'entity' | 'identifier' | 'comment'
  itemId: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'under_review' | 'requires_more_info' | 'escalated' | 'completed'
  assignedTo?: string
  title?: string
  riskScore?: number
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  reportId: string
  userId: string
  userEmail: string
  userName?: string
  userProfileImage?: string
  content: string
  parentId?: string
  createdAt: string
  updatedAt: string
  reactions: {
    like: number
    love: number
    support: number
  }
  userReactions: {
    like: boolean
    love: boolean
    support: boolean
  }
  replies?: Comment[]
  replyCount?: number
}

export interface ReportStats {
  totalReports: number
  pendingReports: number
  approvedReports: number
  rejectedReports: number
  totalAmountLost: number
  averageAmount: number
  totalUsers: number
  recentActivity: Array<{
    id: string
    type: string
    title: string
    description: string
    timestamp: string
    status: string
  }>
  categoryBreakdown: Record<string, number>
  currencyBreakdown: Record<string, { count: number, totalAmount: number }>
}

export interface Reaction {
  id: string
  commentId: string
  userId: string
  type: 'like' | 'love' | 'support'
  createdAt: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
  metadata?: {
    total?: number
    page?: number
    limit?: number
    executionTime?: number
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// Form types
export interface LoginForm {
  email: string
  password?: string
  phoneNumber?: string
}

export interface CreateReportForm {
  identifierType: string
  identifierValue: string
  scamCategory: string
  amountLost: number
  currency: string
  incidentDate: string
  incidentChannel: string
  narrative: string
  suspectedLinks: string[]
  contactMethod: string
  additionalInfo?: Record<string, any>
}

export interface SearchFilters {
  types?: string[]
  categories?: string[]
  statuses?: string[]
  riskScoreMin?: number
  riskScoreMax?: number
  dateFrom?: string
  dateTo?: string
}
