#!/usr/bin/env ts-node

import { dbPool, testConnection } from '../config/database'
import * as fs from 'fs'
import * as path from 'path'

async function runMigrations() {
  try {
    console.log('🔄 Starting database migration...')
    
    // Test connection
    const isConnected = await testConnection()
    if (!isConnected) {
      console.error('❌ Cannot connect to database. Exiting...')
      process.exit(1)
    }
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement && statement.trim()) {
        try {
          await dbPool.query(statement)
          console.log(`✅ Executed statement ${i + 1}/${statements.length}`)
        } catch (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error)
          // Continue with other statements
        }
      }
    }
    
    console.log('🎉 Database migration completed successfully!')
    
    // Insert initial data
    await insertInitialData()
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await dbPool.end()
  }
}

async function insertInitialData() {
  try {
    console.log('📊 Inserting initial data...')
    
    // Check if users already exist
    const userCount = await dbPool.query('SELECT COUNT(*) FROM users')
    if (parseInt(userCount.rows[0].count) > 0) {
      console.log('ℹ️  Users already exist, skipping initial data insertion')
      return
    }
    
    // Insert default users
    const users = [
      {
        email: 'bhattashubham@gmail.com',
        password: '121212',
        role: 'moderator',
        name: 'Bhatta Shubham',
        is_verified: true
      },
      {
        email: 'admin@scamnepal.com',
        password: 'admin123',
        role: 'admin',
        name: 'System Admin',
        is_verified: true
      }
    ]
    
    for (const user of users) {
      const bcrypt = require('bcryptjs')
      const passwordHash = await bcrypt.hash(user.password, 12)
      
      await dbPool.query(`
        INSERT INTO users (email, password_hash, role, name, is_verified)
        VALUES ($1, $2, $3, $4, $5)
      `, [user.email, passwordHash, user.role, user.name, user.is_verified])
    }
    
    console.log('✅ Initial users created successfully')
    
    // Insert sample reports
    const reports = [
      {
        identifier_type: 'phone',
        identifier_value: '+977-98XXXXXXXX',
        category: 'phishing',
        narrative: 'Received suspicious SMS asking for personal information and bank details',
        amount_lost: 0,
        currency: 'NPR',
        status: 'pending',
        risk_score: 75,
        reporter_user_id: '1', // Will be replaced with actual UUID
        reporter_email: 'bhattashubham@gmail.com',
        incident_date: '2025-08-20',
        incident_channel: 'SMS'
      },
      {
        identifier_type: 'website',
        identifier_value: 'fakebank-nepal.com',
        category: 'phishing',
        narrative: 'Fake banking website targeting Nepali users',
        amount_lost: 0,
        currency: 'NPR',
        status: 'verified',
        risk_score: 90,
        reporter_user_id: '1', // Will be replaced with actual UUID
        reporter_email: 'bhattashubham@gmail.com',
        incident_date: '2025-08-18',
        incident_channel: 'Website'
      }
    ]
    
    // Get actual user IDs
    const userResult = await dbPool.query('SELECT id FROM users WHERE email = $1', ['bhattashubham@gmail.com'])
    const userId = userResult.rows[0].id
    
    for (const report of reports) {
      await dbPool.query(`
        INSERT INTO reports (
          identifier_type, identifier_value, category, narrative, 
          amount_lost, currency, status, risk_score, 
          reporter_user_id, reporter_email, incident_date, incident_channel
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        report.identifier_type, report.identifier_value, report.category, report.narrative,
        report.amount_lost, report.currency, report.status, report.risk_score,
        userId, report.reporter_email, report.incident_date, report.incident_channel
      ])
    }
    
    console.log('✅ Sample reports created successfully')
    
  } catch (error) {
    console.error('❌ Error inserting initial data:', error)
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
}

export { runMigrations }
