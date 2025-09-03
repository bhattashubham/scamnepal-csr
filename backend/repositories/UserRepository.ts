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
  profile_image?: string
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
  isVerified?: boolean
  profileImage?: string
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

  async countUsers(): Promise<number> {
    const result = await this.query('SELECT COUNT(*) as count FROM users')
    return parseInt(result.rows[0].count)
  }

  async updateUser(id: string, updateData: UpdateUserData): Promise<User | null> {
    const fields = Object.keys(updateData).filter(key => updateData[key as keyof UpdateUserData] !== undefined)
    if (fields.length === 0) return null

    // Map camelCase to snake_case for database columns
    const fieldMapping: Record<string, string> = {
      'isVerified': 'is_verified',
      'profileImage': 'profile_image'
    }

    const dbFields = fields.map(field => fieldMapping[field] || field)
    const setClause = dbFields.map((field, index) => `${field} = $${index + 2}`).join(', ')
    const values = [id, ...fields.map(field => updateData[field as keyof UpdateUserData])]
    
    const query = `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`
    const result = await this.query(query, values)
    return result.rows[0] || null
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.query('DELETE FROM users WHERE id = $1', [id])
    return result.rowCount > 0
  }

  async getAllUsers(page: number = 1, limit: number = 20): Promise<{ users: User[], total: number }> {
    const offset = (page - 1) * limit
    
    // Get total count
    const countResult = await this.query('SELECT COUNT(*) as count FROM users')
    const total = parseInt(countResult.rows[0].count)
    
    // Get users with pagination
    const usersResult = await this.query(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    )
    
    return {
      users: usersResult.rows,
      total
    }
  }
}
