import { BaseRepository } from './BaseRepository'
import bcrypt from 'bcryptjs'

export interface User {
  id: string
  email: string
  password_hash: string
  role: 'member' | 'moderator' | 'admin'
  name?: string
  phone?: string
  is_verified: boolean
  created_at: Date
  updated_at: Date
}

export interface CreateUserData {
  email: string
  password: string
  role?: 'member' | 'moderator' | 'admin'
  name?: string
  phone?: string
}

export interface UpdateUserData {
  email?: string
  password?: string
  role?: 'member' | 'moderator' | 'admin'
  name?: string
  phone?: string
  is_verified?: boolean
}

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users')
  }

  // Create new user with password hashing
  async createUser(userData: CreateUserData): Promise<User> {
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(userData.password, saltRounds)
    
    const fields = ['email', 'password_hash', 'role', 'name', 'phone']
    const values = [
      userData.email,
      passwordHash,
      userData.role || 'member',
      userData.name || null,
      userData.phone || null
    ]
    
    return this.create(fields, values)
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    const result = await this.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )
    return result.rows[0] || null
  }

  // Find users by role
  async findByRole(role: string): Promise<User[]> {
    const result = await this.query(
      'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC',
      [role]
    )
    return result.rows
  }

  // Update user data
  async updateUser(id: string, userData: UpdateUserData): Promise<User | null> {
    const fields: string[] = []
    const values: any[] = []
    
    if (userData.email !== undefined) {
      fields.push('email')
      values.push(userData.email)
    }
    
    if (userData.password !== undefined) {
      const saltRounds = 12
      const passwordHash = await bcrypt.hash(userData.password, saltRounds)
      fields.push('password_hash')
      values.push(passwordHash)
    }
    
    if (userData.role !== undefined) {
      fields.push('role')
      values.push(userData.role)
    }
    
    if (userData.name !== undefined) {
      fields.push('name')
      values.push(userData.name)
    }
    
    if (userData.phone !== undefined) {
      fields.push('phone')
      values.push(userData.phone)
    }
    
    if (userData.is_verified !== undefined) {
      fields.push('is_verified')
      values.push(userData.is_verified)
    }
    
    if (fields.length === 0) {
      return this.findById(id)
    }
    
    return this.update(id, fields, values)
  }

  // Verify user password
  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email)
    if (!user) {
      return null
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash)
    return isValid ? user : null
  }

  // Get user statistics
  async getUserStats(): Promise<{ total: number, byRole: Record<string, number> }> {
    const result = await this.query(`
      SELECT 
        COUNT(*) as total,
        role,
        COUNT(*) as count
      FROM users 
      GROUP BY role
    `)
    
    const total = parseInt(result.rows[0]?.total || '0')
    const byRole: Record<string, number> = {}
    
    result.rows.forEach(row => {
      byRole[row.role] = parseInt(row.count)
    })
    
    return { total, byRole }
  }

  // Search users
  async searchUsers(query: string, page: number = 1, limit: number = 20): Promise<{ data: User[], total: number }> {
    const offset = (page - 1) * limit
    
    const countResult = await this.query(`
      SELECT COUNT(*) FROM users 
      WHERE email ILIKE $1 OR name ILIKE $1
    `, [`%${query}%`])
    
    const total = parseInt(countResult.rows[0].count)
    
    const result = await this.query(`
      SELECT * FROM users 
      WHERE email ILIKE $1 OR name ILIKE $1
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `, [`%${query}%`, limit, offset])
    
    return {
      data: result.rows,
      total
    }
  }

  // Additional methods needed by server.ts
  async findByEmailOrPhone(email?: string, phone?: string): Promise<User | null> {
    if (email) {
      return this.findByEmail(email)
    }
    if (phone) {
      const result = await this.query(
        'SELECT * FROM users WHERE phone = $1',
        [phone]
      )
      return result.rows[0] || null
    }
    return null
  }

  async findSavedSearchesByUserId(userId: string): Promise<any[]> {
    // This would typically fetch from a saved_searches table
    // For now, return empty array
    return []
  }

  async saveSearch(searchData: any): Promise<any> {
    // This would typically insert into a saved_searches table
    // For now, return mock data
    return {
      id: `search_${Date.now()}`,
      ...searchData
    }
  }

  async findAssignedTasksByModeratorId(moderatorId: string): Promise<any[]> {
    // This would typically fetch from a moderation_tasks table
    // For now, return empty array
    return []
  }

  async findOverdueTasksByModeratorId(moderatorId: string): Promise<any[]> {
    // This would typically fetch from a moderation_tasks table
    // For now, return empty array
    return []
  }

  async findDecisionHistoryByTaskId(taskId: string): Promise<any[]> {
    // This would typically fetch from a moderation_decisions table
    // For now, return mock data
    return [
      {
        id: `decision_${Date.now()}`,
        decision: 'created',
        reason: 'Report submitted',
        moderatorId: 'system',
        timestamp: new Date().toISOString(),
        notes: 'Initial report submission'
      }
    ]
  }

  async bulkUpdateTasks(taskIds: string[], action: string, data: any): Promise<any[]> {
    // This would typically perform bulk updates
    // For now, return mock data
    return taskIds.map(id => ({
      id,
      updated: true,
      action,
      data
    }))
  }
}
