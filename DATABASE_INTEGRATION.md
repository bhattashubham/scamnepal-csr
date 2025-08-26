# 🗄️ ScamNepal CSR - Database Integration Guide

## 📋 **OVERVIEW**

This guide covers the complete PostgreSQL database integration for the ScamNepal Community Scam Registry system, replacing the in-memory data stores with a robust, scalable database solution.

---

## 🏗️ **DATABASE ARCHITECTURE**

### **Technology Stack**
- **Database**: PostgreSQL 15 (Alpine)
- **Connection Pool**: Node.js `pg` library
- **ORM Pattern**: Repository pattern with custom repositories
- **Migrations**: Custom migration scripts
- **Full-Text Search**: PostgreSQL native full-text search

### **Database Schema**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      users      │    │     reports     │    │     evidence    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (UUID)       │    │ id (UUID)       │    │ id (UUID)       │
│ email           │    │ identifier_type │    │ report_id (FK)  │
│ password_hash   │    │ identifier_value│    │ filename        │
│ role            │    │ category        │    │ original_name   │
│ name            │    │ narrative       │    │ file_path       │
│ phone           │    │ amount_lost     │    │ file_size       │
│ is_verified     │    │ currency        │    │ mime_type       │
│ created_at      │    │ status          │    │ uploaded_at     │
│ updated_at      │    │ risk_score      │    └─────────────────┘
└─────────────────┘    │ reporter_user_id│
                       │ reporter_email  │    ┌─────────────────┐
                       │ incident_date   │    │    entities     │
                       │ incident_channel│    ├─────────────────┤
                       │ status_reason   │    │ id (UUID)       │
                       │ created_at      │    │ display_name    │
                       │ updated_at      │    │ risk_score      │
                       └─────────────────┘    │ status          │
                                              │ report_count    │
                                              │ total_amount_lost│
                                              │ tags            │
                                              │ created_at      │
                                              │ updated_at      │
                                              └─────────────────┘
```

---

## 🚀 **SETUP INSTRUCTIONS**

### **1. Install PostgreSQL**

#### **macOS (using Homebrew)**
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### **Ubuntu/Debian**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### **Windows**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### **2. Create Database**
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE scamnepal_csr;
CREATE USER scamnepal_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE scamnepal_csr TO scamnepal_user;
\q
```

### **3. Environment Configuration**
Create `.env` file in the backend directory:
```bash
cp backend/env.example backend/.env
```

Edit `.env` with your database credentials:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=scamnepal_csr
DB_USER=scamnepal_user
DB_PASSWORD=your_password
DB_SSL=false
```

### **4. Install Dependencies**
```bash
cd backend
npm install
```

### **5. Run Database Migration**
```bash
# Setup database schema
npm run db:setup

# Or reset and setup (WARNING: This will delete all data)
npm run db:reset
```

---

## 🔧 **REPOSITORY PATTERN IMPLEMENTATION**

### **Base Repository**
```typescript
// backend/repositories/BaseRepository.ts
export abstract class BaseRepository<T> {
  protected tableName: string
  
  // Generic CRUD operations
  async findById(id: string): Promise<T | null>
  async findAll(page: number, limit: number): Promise<{ data: T[], total: number }>
  protected async create(fields: string[], values: any[]): Promise<T>
  protected async update(id: string, fields: string[], values: any[]): Promise<T | null>
  async delete(id: string): Promise<boolean>
  
  // Transaction support
  async withTransaction<T>(callback: (client: any) => Promise<T>): Promise<T>
}
```

### **User Repository**
```typescript
// backend/repositories/UserRepository.ts
export class UserRepository extends BaseRepository<User> {
  async createUser(userData: CreateUserData): Promise<User>
  async findByEmail(email: string): Promise<User | null>
  async verifyPassword(email: string, password: string): Promise<User | null>
  async updateUser(id: string, userData: UpdateUserData): Promise<User | null>
  async getUserStats(): Promise<{ total: number, byRole: Record<string, number> }>
}
```

### **Report Repository**
```typescript
// backend/repositories/ReportRepository.ts
export class ReportRepository extends BaseRepository<Report> {
  async createReport(reportData: CreateReportData): Promise<Report>
  async getReportsWithFilters(filters: ReportFilters, page: number, limit: number)
  async searchReports(query: string, filters: ReportFilters, page: number, limit: number)
  async getReportsByUser(userId: string, page: number, limit: number)
  async getReportStats(): Promise<ReportStats>
}
```

---

## 🔍 **FULL-TEXT SEARCH IMPLEMENTATION**

### **Search Indexes**
```sql
-- Full-text search index for reports
CREATE INDEX idx_reports_fulltext ON reports USING gin(
  to_tsvector('english', 
    COALESCE(identifier_value, '') || ' ' || 
    COALESCE(category, '') || ' ' || 
    COALESCE(narrative, '')
  )
);

-- Individual field indexes
CREATE INDEX idx_reports_identifier_value ON reports USING gin(to_tsvector('english', identifier_value));
CREATE INDEX idx_reports_narrative ON reports USING gin(to_tsvector('english', narrative));
```

### **Search Query Example**
```typescript
// Search reports with full-text search
async searchReports(query: string, filters: ReportFilters = {}) {
  const whereConditions = [
    `to_tsvector('english', 
      COALESCE(identifier_value, '') || ' ' || 
      COALESCE(category, '') || ' ' || 
      COALESCE(narrative, '')
    ) @@ plainto_tsquery('english', $1)`
  ]
  
  // Apply additional filters...
  
  const result = await this.query(`
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
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY relevance DESC, created_at DESC
  `, [query, ...filterParams])
  
  return result.rows
}
```

---

## 📊 **PERFORMANCE OPTIMIZATION**

### **Database Indexes**
```sql
-- Primary indexes
CREATE INDEX idx_reports_reporter_user_id ON reports(reporter_user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_risk_score ON reports(risk_score);
CREATE INDEX idx_reports_created_at ON reports(created_at);

-- Composite indexes for common queries
CREATE INDEX idx_reports_status_category ON reports(status, category);
CREATE INDEX idx_reports_user_status ON reports(reporter_user_id, status);
```

### **Materialized Views**
```sql
-- Dashboard statistics materialized view
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT 
  COUNT(*) as total_reports,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
  COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_reports,
  AVG(risk_score) as average_risk_score,
  SUM(amount_lost) as total_amount_lost,
  DATE_TRUNC('day', created_at) as date
FROM reports
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW dashboard_stats;
END;
$$ LANGUAGE plpgsql;
```

---

## 🐳 **DOCKER INTEGRATION**

### **Docker Compose Configuration**
```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: scamnepal_csr
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql

  backend:
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=scamnepal_csr
      - DB_USER=postgres
      - DB_PASSWORD=postgres
    depends_on:
      - postgres
```

### **Running with Docker**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f postgres
docker-compose logs -f backend

# Stop services
docker-compose down
```

---

## 🔒 **SECURITY FEATURES**

### **Password Hashing**
```typescript
import bcrypt from 'bcryptjs'

// Hash password with salt rounds
const saltRounds = 12
const passwordHash = await bcrypt.hash(password, saltRounds)

// Verify password
const isValid = await bcrypt.compare(password, passwordHash)
```

### **SQL Injection Prevention**
```typescript
// Use parameterized queries
await this.query(
  'SELECT * FROM users WHERE email = $1 AND role = $2',
  [email, role]
)

// Never concatenate strings
// ❌ WRONG: `SELECT * FROM users WHERE email = '${email}'`
// ✅ CORRECT: `SELECT * FROM users WHERE email = $1`
```

### **Connection Security**
```typescript
const dbConfig: PoolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Connection pool limit
  idleTimeoutMillis: 30000, // Close idle connections
  connectionTimeoutMillis: 2000, // Connection timeout
}
```

---

## 📈 **MONITORING & MAINTENANCE**

### **Database Health Check**
```typescript
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
```

### **Connection Pool Monitoring**
```typescript
// Monitor pool status
dbPool.on('connect', (client) => {
  console.log('🔌 New client connected to database')
})

dbPool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err)
  process.exit(-1)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...')
  await closePool()
  process.exit(0)
})
```

### **Performance Monitoring**
```typescript
// Query execution time logging
protected async query(text: string, params?: any[]): Promise<QueryResult> {
  const start = Date.now()
  try {
    const result = await dbPool.query(text, params)
    const duration = Date.now() - start
    console.log(`Executed query on ${this.tableName}:`, { 
      text, duration, rows: result.rowCount 
    })
    return result
  } catch (error) {
    console.error(`Database query error on ${this.tableName}:`, error)
    throw error
  }
}
```

---

## 🧪 **TESTING DATABASE INTEGRATION**

### **Test Database Connection**
```bash
# Test connection
cd backend
npm run db:setup

# Check if tables were created
psql -U postgres -d scamnepal_csr -c "\dt"

# Check if initial data was inserted
psql -U postgres -d scamnepal_csr -c "SELECT * FROM users;"
psql -U postgres -d scamnepal_csr -c "SELECT * FROM reports;"
```

### **Test API Endpoints**
```bash
# Test authentication
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bhattashubham@gmail.com","password":"121212"}'

# Test reports endpoint
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bhattashubham@gmail.com","password":"121212"}' \
  | jq -r '.data.token')

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/dashboard/reports"
```

---

## 🔮 **FUTURE ENHANCEMENTS**

### **Planned Features**
- [ ] **Database Migrations**: Version-controlled schema changes
- [ ] **Connection Pooling**: Advanced connection management
- [ ] **Read Replicas**: Scale read operations
- [ ] **Database Sharding**: Horizontal scaling for large datasets
- [ ] **Backup & Recovery**: Automated backup strategies
- [ ] **Performance Tuning**: Query optimization and monitoring

### **Advanced Search Features**
- [ ] **Elasticsearch Integration**: Advanced search capabilities
- [ ] **Fuzzy Matching**: Typo-tolerant search
- [ ] **Search Analytics**: Track search patterns and performance
- [ ] **Search Suggestions**: Intelligent autocomplete

---

## 🎯 **CONCLUSION**

The PostgreSQL database integration provides:

- **Scalability**: Handle thousands of reports and users
- **Performance**: Optimized queries with proper indexing
- **Security**: Password hashing and SQL injection prevention
- **Reliability**: ACID compliance and transaction support
- **Search**: Full-text search capabilities
- **Monitoring**: Connection health and performance tracking

**The system is now production-ready with enterprise-grade database capabilities!** 🚀

---

*Last Updated: August 26, 2025*
*Database: PostgreSQL 15*
*Status: Production Ready* 🗄️
