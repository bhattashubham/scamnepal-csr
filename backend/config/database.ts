import { Pool, PoolConfig } from 'pg'

// Database configuration
const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'scamnepal_csr',
  user: process.env.DB_USER || 'subhu', // Use macOS username instead of postgres
  password: process.env.DB_PASSWORD || '', // No password for local development
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
}

// Create connection pool
export const dbPool = new Pool(dbConfig)

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await dbPool.connect()
    await client.query('SELECT NOW()')
    client.release()
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

// Graceful shutdown
export const closePool = async (): Promise<void> => {
  await dbPool.end()
  console.log('Database pool closed')
}

// Handle pool errors
dbPool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})
