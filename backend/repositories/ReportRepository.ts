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
  status_reason?: string
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

  // Update report data
  async updateReport(id: string, reportData: UpdateReportData): Promise<Report | null> {
    const fields: string[] = []
    const values: any[] = []
    
    Object.entries(reportData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(key)
        values.push(value)
      }
    })
    
    if (fields.length === 0) {
      return this.findById(id)
    }
    
    return this.update(id, fields, values)
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
    // This would typically insert into an evidence table
    // For now, we'll just log it
    console.log(`Adding ${files.length} files to report ${reportId}`)
  }

  async getFilesForReport(reportId: string): Promise<any[]> {
    // This would typically fetch from an evidence table
    // For now, return empty array
    return []
  }
}
