import { BaseRepository } from './BaseRepository'

export interface Report {
  id: string
  identifier_type: string
  identifier_value: string
  category: string
  narrative: string
  amount_lost: number
  currency: string
  status: 'pending' | 'verified' | 'rejected' | 'under_review'
  risk_score: number
  reporter_user_id: string
  reporter_email: string
  incident_date?: Date
  incident_channel?: string
  contact_method?: string
  suspected_links?: string
  additional_info?: string
  status_reason?: string
  created_at: Date
  updated_at: Date
}

export interface CreateReportData {
  identifier_type: string
  identifier_value: string
  category: string
  narrative: string
  amount_lost?: number
  currency?: string
  reporter_user_id: string
  reporter_email: string
  incident_date?: Date
  incident_channel?: string
}

export interface UpdateReportData {
  identifier_type?: string
  identifier_value?: string
  category?: string
  narrative?: string
  amount_lost?: number
  currency?: string
  status?: 'pending' | 'verified' | 'rejected' | 'under_review'
  risk_score?: number
  incident_date?: Date
  incident_channel?: string
  contact_method?: string
  suspected_links?: string
  additional_info?: string
  status_reason?: string
}

export interface Comment {
  id: string
  report_id: string
  user_id: string
  userEmail: string
  userName?: string
  userProfileImage?: string
  content: string
  parent_id?: string
  created_at: Date
  updated_at: Date
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

export interface Reaction {
  id: string
  comment_id: string
  user_id: string
  type: 'like' | 'love' | 'support'
  created_at: Date
}

export interface ReportFilters {
  status?: string
  category?: string
  search?: string
  risk_score_min?: number
  risk_score_max?: number
  date_from?: string
  date_to?: string
  reporter_user_id?: string
}

export class ReportRepository extends BaseRepository<Report> {
  constructor() {
    super('reports')
  }

  // Create new report
  async createReport(reportData: CreateReportData): Promise<Report> {
    const fields = [
      'identifier_type',
      'identifier_value',
      'category',
      'narrative',
      'amount_lost',
      'currency',
      'reporter_user_id',
      'reporter_email',
      'incident_date',
      'incident_channel'
    ]
    
    const values = [
      reportData.identifier_type,
      reportData.identifier_value,
      reportData.category,
      reportData.narrative,
      reportData.amount_lost || 0,
      reportData.currency || 'NPR',
      reportData.reporter_user_id,
      reportData.reporter_email,
      reportData.incident_date || null,
      reportData.incident_channel || null
    ]
    
    return this.create(fields, values)
  }



  // Update report status with history tracking
  async updateReportStatus(id: string, newStatus: string, changedBy?: string, reason?: string, notes?: string): Promise<Report | null> {
    // Get current report to track old status
    const currentReport = await this.findById(id)
    if (!currentReport) {
      return null
    }

    // Update the report status
    const updatedReport = await this.update(id, ['status'], [newStatus])
    
    // Track status change in history
    if (currentReport.status !== newStatus) {
      await this.addStatusHistory(id, currentReport.status, newStatus, changedBy, reason, notes)
    }
    
    return updatedReport
  }

  // Add status change to history
  async addStatusHistory(reportId: string, oldStatus: string, newStatus: string, changedBy?: string, reason?: string, notes?: string): Promise<void> {
    await this.query(
      `INSERT INTO report_status_history (report_id, old_status, new_status, changed_by, reason, notes) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [reportId, oldStatus, newStatus, changedBy, reason, notes]
    )
  }

  // Get status history for a report
  async getStatusHistory(reportId: string): Promise<any[]> {
    const result = await this.query(
      `SELECT 
        rsh.*,
        u.email as changed_by_email,
        u.name as changed_by_name
       FROM report_status_history rsh
       LEFT JOIN users u ON rsh.changed_by = u.id
       WHERE rsh.report_id = $1
       ORDER BY rsh.created_at ASC`,
      [reportId]
    )
    return result.rows
  }

  async updateReport(id: string, updateData: UpdateReportData, updatedBy?: string): Promise<Report | null> {
    const currentReport = await this.findById(id)
    if (!currentReport) {
      return null
    }

    // Build dynamic update query
    const fields = Object.keys(updateData).filter(key => updateData[key as keyof UpdateReportData] !== undefined)
    if (fields.length === 0) {
      return currentReport
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
    const values = [id, ...fields.map(field => updateData[field as keyof UpdateReportData])]

    const query = `
      UPDATE reports 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `

    const result = await this.query(query, values)
    
    if (result.rows.length === 0) {
      return null
    }

    const updatedReport = result.rows[0]

    // Add to status history if status changed
    if (updateData.status && currentReport.status !== updateData.status) {
      await this.addStatusHistory(
        id, 
        currentReport.status, 
        updateData.status, 
        updatedBy, 
        updateData.status_reason || 'Report updated',
        `Report updated by ${updatedBy || 'system'}`
      )
    }

    return updatedReport
  }

  // Get reports with filters and pagination
  async getReportsWithFilters(
    filters: ReportFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: Report[], total: number }> {
    const offset = (page - 1) * limit
    const whereConditions: string[] = []
    const params: any[] = []
    let paramIndex = 1
    
    if (filters.status && filters.status !== 'all') {
      whereConditions.push(`status = $${paramIndex}`)
      params.push(filters.status)
      paramIndex++
    }
    
    if (filters.category && filters.category !== 'all') {
      whereConditions.push(`category = $${paramIndex}`)
      params.push(filters.category)
      paramIndex++
    }
    
    if (filters.reporter_user_id) {
      whereConditions.push(`reporter_user_id = $${paramIndex}`)
      params.push(filters.reporter_user_id)
      paramIndex++
    }
    
    if (filters.risk_score_min !== undefined) {
      whereConditions.push(`risk_score >= $${paramIndex}`)
      params.push(filters.risk_score_min)
      paramIndex++
    }
    
    if (filters.risk_score_max !== undefined) {
      whereConditions.push(`risk_score <= $${paramIndex}`)
      params.push(filters.risk_score_max)
      paramIndex++
    }
    
    if (filters.date_from) {
      whereConditions.push(`created_at >= $${paramIndex}`)
      params.push(filters.date_from)
      paramIndex++
    }
    
    if (filters.date_to) {
      whereConditions.push(`created_at <= $${paramIndex}`)
      params.push(filters.date_to)
      paramIndex++
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
    
    // Count total with filters
    const countQuery = `SELECT COUNT(*) FROM reports ${whereClause}`
    const countResult = await this.query(countQuery, params)
    const total = parseInt(countResult.rows[0].count)
    
    // Get paginated results with filters
    const dataQuery = `
      SELECT * FROM reports 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    const dataParams = [...params, limit, offset]
    const result = await this.query(dataQuery, dataParams)
    
    return {
      data: result.rows,
      total
    }
  }

  // Search reports with full-text search
  async searchReports(
    query: string,
    filters: ReportFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: Report[], total: number }> {
    const offset = (page - 1) * limit
    const whereConditions: string[] = []
    const params: any[] = []
    let paramIndex = 1
    
    // Full-text search
    whereConditions.push(`
      to_tsvector('english', 
        COALESCE(identifier_value, '') || ' ' || 
        COALESCE(category, '') || ' ' || 
        COALESCE(narrative, '')
      ) @@ plainto_tsquery('english', $${paramIndex})
    `)
    params.push(query)
    paramIndex++
    
    // Apply additional filters
    if (filters.status && filters.status !== 'all') {
      whereConditions.push(`status = $${paramIndex}`)
      params.push(filters.status)
      paramIndex++
    }
    
    if (filters.category && filters.category !== 'all') {
      whereConditions.push(`category = $${paramIndex}`)
      params.push(filters.category)
      paramIndex++
    }
    
    if (filters.risk_score_min !== undefined) {
      whereConditions.push(`risk_score >= $${paramIndex}`)
      params.push(filters.risk_score_min)
      paramIndex++
    }
    
    if (filters.risk_score_max !== undefined) {
      whereConditions.push(`risk_score <= $${paramIndex}`)
      params.push(filters.risk_score_max)
      paramIndex++
    }
    
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`
    
    // Count total with search
    const countQuery = `SELECT COUNT(*) FROM reports ${whereClause}`
    const countResult = await this.query(countQuery, params)
    const total = parseInt(countResult.rows[0].count)
    
    // Get paginated search results
    const dataQuery = `
      SELECT *, 
        ts_rank(
          to_tsvector('english', 
            COALESCE(identifier_value, '') || ' ' || 
            COALESCE(category, '') || ' ' || 
            COALESCE(narrative, '')
          ), 
          plainto_tsquery('english', $1)
        ) as relevance
      FROM reports 
      ${whereClause}
      ORDER BY relevance DESC, created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    const dataParams = [query, ...params, limit, offset]
    const result = await this.query(dataQuery, dataParams)
    
    return {
      data: result.rows,
      total
    }
  }

  // Get reports by user
  async getReportsByUser(userId: string, page: number = 1, limit: number = 20): Promise<{ data: Report[], total: number }> {
    return this.getReportsWithFilters({ reporter_user_id: userId }, page, limit)
  }

  // Get report statistics
  async getReportStats(): Promise<{
    total: number
    byStatus: Record<string, number>
    byCategory: Record<string, number>
    averageRiskScore: number
    totalAmountLost: number
  }> {
    const result = await this.query(`
      SELECT 
        COUNT(*) as total,
        status,
        category,
        AVG(risk_score) as avg_risk_score,
        SUM(amount_lost) as total_amount_lost
      FROM reports 
      GROUP BY status, category
    `)
    
    const total = parseInt(result.rows[0]?.total || '0')
    const byStatus: Record<string, number> = {}
    const byCategory: Record<string, number> = {}
    let totalRiskScore = 0
    let totalAmountLost = 0
    let reportCount = 0
    
    result.rows.forEach(row => {
      byStatus[row.status] = (byStatus[row.status] || 0) + parseInt(row.count || '0')
      byCategory[row.category] = (byCategory[row.category] || 0) + parseInt(row.count || '0')
      totalRiskScore += parseFloat(row.avg_risk_score || '0') * parseInt(row.count || '0')
      totalAmountLost += parseFloat(row.total_amount_lost || '0')
      reportCount += parseInt(row.count || '0')
    })
    
    const averageRiskScore = reportCount > 0 ? totalRiskScore / reportCount : 0
    
    return {
      total,
      byStatus,
      byCategory,
      averageRiskScore: Math.round(averageRiskScore * 100) / 100,
      totalAmountLost
    }
  }

  // Get trending categories
  async getTrendingCategories(limit: number = 10): Promise<Array<{ category: string, count: number }>> {
    const result = await this.query(`
      SELECT 
        category,
        COUNT(*) as count
      FROM reports 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY category
      ORDER BY count DESC
      LIMIT $1
    `, [limit])
    
    return result.rows.map(row => ({
      category: row.category,
      count: parseInt(row.count)
    }))
  }

  // Additional methods needed by server.ts
  async findAllReports(): Promise<Report[]> {
    const result = await this.query('SELECT * FROM reports ORDER BY created_at DESC')
    return result.rows
  }

  async findReportsByReporterId(reporterId: string): Promise<Report[]> {
    const result = await this.query(
      'SELECT * FROM reports WHERE reporter_user_id = $1 ORDER BY created_at DESC',
      [reporterId]
    )
    return result.rows
  }

  async findReportsByStatus(status: string): Promise<Report[]> {
    const result = await this.query(
      'SELECT * FROM reports WHERE status = $1 ORDER BY created_at DESC',
      [status]
    )
    return result.rows
  }

  async findReportsByCategory(category: string): Promise<Report[]> {
    const result = await this.query(
      'SELECT * FROM reports WHERE category = $1 ORDER BY created_at DESC',
      [category]
    )
    return result.rows
  }

  async countReports(): Promise<number> {
    const result = await this.query('SELECT COUNT(*) FROM reports')
    return parseInt(result.rows[0].count)
  }

  async countReportsByStatus(status: string): Promise<number> {
    const result = await this.query(
      'SELECT COUNT(*) FROM reports WHERE status = $1',
      [status]
    )
    return parseInt(result.rows[0].count)
  }

  async countReportsByCategory(category: string): Promise<number> {
    const result = await this.query(
      'SELECT COUNT(*) FROM reports WHERE category = $1',
      [category]
    )
    return parseInt(result.rows[0].count)
  }

  async sumAmountLostByReportId(reportId: string): Promise<number> {
    const result = await this.query(
      'SELECT COALESCE(SUM(amount_lost), 0) as total FROM reports WHERE id = $1',
      [reportId]
    )
    return parseFloat(result.rows[0].total)
  }

  async addFilesToReport(reportId: string, files: any[]): Promise<void> {
    for (const file of files) {
      await this.query(
        `INSERT INTO evidence (report_id, filename, original_name, file_path, file_size, mime_type) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [reportId, file.fileName, file.fileName, file.storageUrl, file.fileSize, file.mimeType]
      )
    }
    console.log(`Added ${files.length} files to report ${reportId}`)
  }

  async getFilesForReport(reportId: string): Promise<any[]> {
    const result = await this.query(
      'SELECT * FROM evidence WHERE report_id = $1 ORDER BY uploaded_at DESC',
      [reportId]
    )
    return result.rows.map(row => ({
      id: row.id,
      fileName: row.original_name,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      storageUrl: row.file_path,
      uploadedAt: row.uploaded_at
    }))
  }

  // Find similar reports based on filters
  async findSimilarReports(filters: any, sinceDate?: Date): Promise<Report[]> {
    let query = 'SELECT * FROM reports WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (filters.category) {
      query += ` AND category = $${paramIndex}`
      params.push(filters.category)
      paramIndex++
    }

    if (filters.channel) {
      query += ` AND incident_channel = $${paramIndex}`
      params.push(filters.channel)
      paramIndex++
    }

    if (filters.amount) {
      // Find reports with similar amounts (±20% of the specified amount)
      const minAmount = filters.amount * 0.8
      const maxAmount = filters.amount * 1.2
      query += ` AND amount_lost BETWEEN $${paramIndex} AND $${paramIndex + 1}`
      params.push(minAmount, maxAmount)
      paramIndex += 2
    }

    if (sinceDate) {
      query += ` AND created_at >= $${paramIndex}`
      params.push(sinceDate)
      paramIndex++
    }

    query += ' ORDER BY created_at DESC LIMIT 20'

    const result = await this.query(query, params)
    return result.rows
  }

  // Comment methods
  async getComments(reportId: string, page: number = 1, limit: number = 20, userId?: string | null): Promise<{ comments: Comment[], total: number }> {
    const offset = (page - 1) * limit

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM comments 
      WHERE report_id = $1 AND parent_id IS NULL
    `
    const countResult = await this.query(countQuery, [reportId])
    const total = parseInt(countResult.rows[0].total)

    // Get comments with user info and reactions
    const commentsQuery = `
      SELECT 
        c.id,
        c.report_id,
        c.user_id,
        c.content,
        c.parent_id,
        c.created_at,
        c.updated_at,
        u.email as user_email,
        u.name as user_name,
        u.profile_image as user_profile_image,
        COALESCE(like_count.like_count, 0) as like_count,
        COALESCE(love_count.love_count, 0) as love_count,
        COALESCE(support_count.support_count, 0) as support_count,
        COALESCE(user_like.user_like, false) as user_like,
        COALESCE(user_love.user_love, false) as user_love,
        COALESCE(user_support.user_support, false) as user_support
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN (
        SELECT comment_id, COUNT(*) as like_count
        FROM comment_reactions 
        WHERE type = 'like'
        GROUP BY comment_id
      ) like_count ON c.id = like_count.comment_id
      LEFT JOIN (
        SELECT comment_id, COUNT(*) as love_count
        FROM comment_reactions 
        WHERE type = 'love'
        GROUP BY comment_id
      ) love_count ON c.id = love_count.comment_id
      LEFT JOIN (
        SELECT comment_id, COUNT(*) as support_count
        FROM comment_reactions 
        WHERE type = 'support'
        GROUP BY comment_id
      ) support_count ON c.id = support_count.comment_id
      LEFT JOIN (
        SELECT comment_id, true as user_like
        FROM comment_reactions 
        WHERE type = 'like' AND user_id = $2
      ) user_like ON c.id = user_like.comment_id
      LEFT JOIN (
        SELECT comment_id, true as user_love
        FROM comment_reactions 
        WHERE type = 'love' AND user_id = $2
      ) user_love ON c.id = user_love.comment_id
      LEFT JOIN (
        SELECT comment_id, true as user_support
        FROM comment_reactions 
        WHERE type = 'support' AND user_id = $2
      ) user_support ON c.id = user_support.comment_id
      WHERE c.report_id = $1 AND c.parent_id IS NULL
      ORDER BY c.created_at DESC
      LIMIT $3 OFFSET $4
    `

    const commentsResult = await this.query(commentsQuery, [reportId, userId, limit, offset])
    
    const comments = await Promise.all(commentsResult.rows.map(async (row) => {
      // Get total reply count for this comment
      const replyCountQuery = `
        SELECT COUNT(*) as reply_count
        FROM comments 
        WHERE parent_id = $1
      `
      const replyCountResult = await this.query(replyCountQuery, [row.id])
      const replyCount = parseInt(replyCountResult.rows[0].reply_count)

      // Get top 3 most liked replies for this comment
      const repliesQuery = `
        SELECT 
          c.id,
          c.report_id,
          c.user_id,
          c.content,
          c.parent_id,
          c.created_at,
          c.updated_at,
          u.email as user_email,
          u.profile_image as user_profile_image,
          COALESCE(like_count.like_count, 0) as like_count,
          COALESCE(love_count.love_count, 0) as love_count,
          COALESCE(support_count.support_count, 0) as support_count,
          COALESCE(user_like.user_like, false) as user_like,
          COALESCE(user_love.user_love, false) as user_love,
          COALESCE(user_support.user_support, false) as user_support
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN (
          SELECT comment_id, COUNT(*) as like_count
          FROM comment_reactions 
          WHERE type = 'like'
          GROUP BY comment_id
        ) like_count ON c.id = like_count.comment_id
        LEFT JOIN (
          SELECT comment_id, COUNT(*) as love_count
          FROM comment_reactions 
          WHERE type = 'love'
          GROUP BY comment_id
        ) love_count ON c.id = love_count.comment_id
        LEFT JOIN (
          SELECT comment_id, COUNT(*) as support_count
          FROM comment_reactions 
          WHERE type = 'support'
          GROUP BY comment_id
        ) support_count ON c.id = support_count.comment_id
        LEFT JOIN (
          SELECT comment_id, true as user_like
          FROM comment_reactions 
          WHERE type = 'like' AND user_id = $2
        ) user_like ON c.id = user_like.comment_id
        LEFT JOIN (
          SELECT comment_id, true as user_love
          FROM comment_reactions 
          WHERE type = 'love' AND user_id = $2
        ) user_love ON c.id = user_love.comment_id
        LEFT JOIN (
          SELECT comment_id, true as user_support
          FROM comment_reactions 
          WHERE type = 'support' AND user_id = $2
        ) user_support ON c.id = user_support.comment_id
        WHERE c.parent_id = $1
        ORDER BY c.created_at DESC
        LIMIT 3
      `
      
      const repliesResult = await this.query(repliesQuery, [row.id, userId])
      const replies = repliesResult.rows.map(replyRow => ({
        id: replyRow.id,
        report_id: replyRow.report_id,
        user_id: replyRow.user_id,
        userEmail: replyRow.user_email,
        userName: replyRow.user_name,
        userProfileImage: replyRow.user_profile_image,
        content: replyRow.content,
        parent_id: replyRow.parent_id,
        created_at: replyRow.created_at,
        updated_at: replyRow.updated_at,
        reactions: {
          like: parseInt(replyRow.like_count),
          love: parseInt(replyRow.love_count),
          support: parseInt(replyRow.support_count)
        },
        userReactions: {
          like: replyRow.user_like,
          love: replyRow.user_love,
          support: replyRow.user_support
        }
      }))

      return {
        id: row.id,
        report_id: row.report_id,
        user_id: row.user_id,
        userEmail: row.user_email,
        userName: row.user_name,
        userProfileImage: row.user_profile_image,
        content: row.content,
        parent_id: row.parent_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        reactions: {
          like: parseInt(row.like_count),
          love: parseInt(row.love_count),
          support: parseInt(row.support_count)
        },
        userReactions: {
          like: row.user_like,
          love: row.user_love,
          support: row.user_support
        },
        replies: replies,
        replyCount: replyCount
      }
    }))

    return { comments, total }
  }

  async getCommentReplies(commentId: string, page: number = 1, limit: number = 20, userId?: string | null): Promise<{ replies: Comment[], total: number }> {
    const offset = (page - 1) * limit

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM comments 
      WHERE parent_id = $1
    `
    const countResult = await this.query(countQuery, [commentId])
    const total = parseInt(countResult.rows[0].total)

    // Get all replies for this comment
    const repliesQuery = `
      SELECT 
        c.id,
        c.report_id,
        c.user_id,
        c.content,
        c.parent_id,
        c.created_at,
        c.updated_at,
        u.email as user_email,
        u.name as user_name,
        u.profile_image as user_profile_image,
        COALESCE(like_count.like_count, 0) as like_count,
        COALESCE(love_count.love_count, 0) as love_count,
        COALESCE(support_count.support_count, 0) as support_count,
        COALESCE(user_like.user_like, false) as user_like,
        COALESCE(user_love.user_love, false) as user_love,
        COALESCE(user_support.user_support, false) as user_support
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN (
        SELECT comment_id, COUNT(*) as like_count
        FROM comment_reactions 
        WHERE type = 'like'
        GROUP BY comment_id
      ) like_count ON c.id = like_count.comment_id
      LEFT JOIN (
        SELECT comment_id, COUNT(*) as love_count
        FROM comment_reactions 
        WHERE type = 'love'
        GROUP BY comment_id
      ) love_count ON c.id = love_count.comment_id
      LEFT JOIN (
        SELECT comment_id, COUNT(*) as support_count
        FROM comment_reactions 
        WHERE type = 'support'
        GROUP BY comment_id
      ) support_count ON c.id = support_count.comment_id
      LEFT JOIN (
        SELECT comment_id, true as user_like
        FROM comment_reactions 
        WHERE type = 'like' AND user_id = $2
      ) user_like ON c.id = user_like.comment_id
      LEFT JOIN (
        SELECT comment_id, true as user_love
        FROM comment_reactions 
        WHERE type = 'love' AND user_id = $2
      ) user_love ON c.id = user_love.comment_id
      LEFT JOIN (
        SELECT comment_id, true as user_support
        FROM comment_reactions 
        WHERE type = 'support' AND user_id = $2
      ) user_support ON c.id = user_support.comment_id
      WHERE c.parent_id = $1
      ORDER BY (COALESCE(like_count.like_count, 0) + COALESCE(love_count.love_count, 0) + COALESCE(support_count.support_count, 0)) DESC, c.created_at ASC
      LIMIT $3 OFFSET $4
    `
    
    const repliesResult = await this.query(repliesQuery, [commentId, userId, limit, offset])
    const replies = repliesResult.rows.map(replyRow => ({
      id: replyRow.id,
      report_id: replyRow.report_id,
      user_id: replyRow.user_id,
      userEmail: replyRow.user_email,
      userName: replyRow.user_name,
      userProfileImage: replyRow.user_profile_image,
      content: replyRow.content,
      parent_id: replyRow.parent_id,
      created_at: replyRow.created_at,
      updated_at: replyRow.updated_at,
      reactions: {
        like: parseInt(replyRow.like_count),
        love: parseInt(replyRow.love_count),
        support: parseInt(replyRow.support_count)
      },
      userReactions: {
        like: replyRow.user_like,
        love: replyRow.user_love,
        support: replyRow.user_support
      }
    }))

    return { replies, total }
  }

  async addComment(reportId: string, userId: string, content: string, parentId?: string): Promise<Comment> {
    const query = `
      INSERT INTO comments (id, report_id, user_id, content, parent_id, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `
    
    const result = await this.query(query, [reportId, userId, content, parentId])
    const comment = result.rows[0]

    // Get user info
    const userQuery = `SELECT email, name, profile_image FROM users WHERE id = $1`
    const userResult = await this.query(userQuery, [userId])
    const user = userResult.rows[0]

    return {
      id: comment.id,
      report_id: comment.report_id,
      user_id: comment.user_id,
      userEmail: user.email,
      userName: user.name,
      userProfileImage: user.profile_image,
      content: comment.content,
      parent_id: comment.parent_id,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      reactions: { like: 0, love: 0, support: 0 },
      userReactions: { like: false, love: false, support: false }
    }
  }

  async toggleReaction(commentId: string, userId: string, type: 'like' | 'love' | 'support'): Promise<{ action: 'added' | 'removed' }> {
    // Check if this specific reaction already exists
    const checkQuery = `
      SELECT id FROM comment_reactions 
      WHERE comment_id = $1 AND user_id = $2 AND type = $3
    `
    const checkResult = await this.query(checkQuery, [commentId, userId, type])

    if (checkResult.rows.length > 0) {
      // Remove this specific reaction
      const deleteQuery = `
        DELETE FROM comment_reactions 
        WHERE comment_id = $1 AND user_id = $2 AND type = $3
      `
      await this.query(deleteQuery, [commentId, userId, type])
      return { action: 'removed' }
    } else {
      // Remove any existing reactions from this user for this comment (mutually exclusive)
      const deleteAllQuery = `
        DELETE FROM comment_reactions 
        WHERE comment_id = $1 AND user_id = $2
      `
      await this.query(deleteAllQuery, [commentId, userId])
      
      // Add the new reaction
      const insertQuery = `
        INSERT INTO comment_reactions (id, comment_id, user_id, type, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3, NOW())
      `
      await this.query(insertQuery, [commentId, userId, type])
      return { action: 'added' }
    }
  }
}
