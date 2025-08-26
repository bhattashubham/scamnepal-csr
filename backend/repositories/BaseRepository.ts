import { dbPool } from '../config/database'
import { QueryResult } from 'pg'

export abstract class BaseRepository<T> {
  protected tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  // Generic query method
  protected async query(text: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now()
    try {
      const result = await dbPool.query(text, params)
      const duration = Date.now() - start
      console.log(`Executed query on ${this.tableName}:`, { text, duration, rows: result.rowCount })
      return result
    } catch (error) {
      console.error(`Database query error on ${this.tableName}:`, error)
      throw error
    }
  }

  // Generic find by ID
  async findById(id: string): Promise<T | null> {
    const result = await this.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    )
    return result.rows[0] || null
  }

  // Generic find all with pagination
  async findAll(page: number = 1, limit: number = 20): Promise<{ data: T[], total: number }> {
    const offset = (page - 1) * limit
    
    const countResult = await this.query(
      `SELECT COUNT(*) FROM ${this.tableName}`
    )
    const total = parseInt(countResult.rows[0].count)

    const result = await this.query(
      `SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    )

    return {
      data: result.rows,
      total
    }
  }

  // Generic create method
  protected async create(fields: string[], values: any[]): Promise<T> {
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ')
    const fieldNames = fields.join(', ')
    
    const result = await this.query(
      `INSERT INTO ${this.tableName} (${fieldNames}) VALUES (${placeholders}) RETURNING *`,
      values
    )
    
    return result.rows[0]
  }

  // Generic update method
  protected async update(id: string, fields: string[], values: any[]): Promise<T | null> {
    const setClause = fields.map((_, index) => `${fields[index]} = $${index + 2}`).join(', ')
    
    const result = await this.query(
      `UPDATE ${this.tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, ...values]
    )
    
    return result.rows[0] || null
  }

  // Generic delete method
  async delete(id: string): Promise<boolean> {
    const result = await this.query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [id]
    )
    
    return (result.rowCount || 0) > 0
  }

  // Generic count method
  async count(whereClause?: string, params?: any[]): Promise<number> {
    let query = `SELECT COUNT(*) FROM ${this.tableName}`
    if (whereClause) {
      query += ` WHERE ${whereClause}`
    }
    
    const result = await this.query(query, params || [])
    return parseInt(result.rows[0].count)
  }

  // Generic exists method
  async exists(id: string): Promise<boolean> {
    const result = await this.query(
      `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1)`,
      [id]
    )
    return result.rows[0].exists
  }

  // Transaction support
  async withTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await dbPool.connect()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}
