#!/usr/bin/env node

const { Client } = require('pg');
const Redis = require('redis');

// Test database connection
async function testDatabase() {
  console.log('🔍 Testing database connection...');
  
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'scam_registry',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('📅 Database time:', result.rows[0].current_time);
    
    await client.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

// Test Redis connection
async function testRedis() {
  console.log('\n🔍 Testing Redis connection...');
  
  const client = Redis.createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
  });

  try {
    await client.connect();
    console.log('✅ Redis connection successful');
    
    // Test a simple operation
    await client.set('test:connection', 'success');
    const value = await client.get('test:connection');
    console.log('🔑 Redis test value:', value);
    
    await client.del('test:connection');
    await client.quit();
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.log('⚠️  Redis is optional for development, continuing...');
  }
}

// Test environment variables
function testEnvironment() {
  console.log('\n🔍 Testing environment configuration...');
  
  const requiredVars = [
    'DB_HOST',
    'DB_NAME', 
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.log('💡 Please check your .env file');
    process.exit(1);
  }
  
  console.log('✅ Environment configuration complete');
}

// Main test function
async function runTests() {
  console.log('🚀 Starting connection tests...\n');
  
  try {
    testEnvironment();
    await testDatabase();
    await testRedis();
    
    console.log('\n🎉 All connection tests completed successfully!');
    console.log('✨ You can now start the application with: npm run dev:backend');
  } catch (error) {
    console.error('\n💥 Connection tests failed:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests();
}

module.exports = { testDatabase, testRedis, testEnvironment };
