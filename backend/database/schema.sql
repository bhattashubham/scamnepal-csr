-- ScamNepal CSR Database Schema
-- PostgreSQL database schema for Community Scam Registry

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
    name VARCHAR(255),
    phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier_type VARCHAR(100) NOT NULL,
    identifier_value TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    narrative TEXT NOT NULL,
    amount_lost DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'NPR',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'under_review')),
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reporter_email VARCHAR(255) NOT NULL,
    incident_date DATE,
    incident_channel VARCHAR(100),
    status_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Evidence files table
CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Entities table (scammer profiles)
CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    display_name TEXT NOT NULL,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    status VARCHAR(50) DEFAULT 'alleged' CHECK (status IN ('alleged', 'confirmed', 'disputed', 'cleared')),
    report_count INTEGER DEFAULT 0,
    total_amount_lost DECIMAL(15,2) DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Moderation tasks table
CREATE TABLE IF NOT EXISTS moderation_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('report', 'entity', 'identifier', 'comment')),
    item_id UUID NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'requires_info', 'escalated', 'completed')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    risk_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Moderation decisions table
CREATE TABLE IF NOT EXISTS moderation_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES moderation_tasks(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    decision VARCHAR(50) NOT NULL CHECK (decision IN ('approve', 'reject', 'escalate', 'require_info')),
    reason TEXT,
    notes TEXT,
    action_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Search analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    results_count INTEGER DEFAULT 0,
    execution_time_ms INTEGER DEFAULT 0,
    filters JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Saved searches table
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    query TEXT NOT NULL,
    filters JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_reporter_user_id ON reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_risk_score ON reports(risk_score);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_identifier_value ON reports USING gin(to_tsvector('english', identifier_value));
CREATE INDEX IF NOT EXISTS idx_reports_narrative ON reports USING gin(to_tsvector('english', narrative));

CREATE INDEX IF NOT EXISTS idx_evidence_report_id ON evidence(report_id);
CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status);
CREATE INDEX IF NOT EXISTS idx_entities_risk_score ON entities(risk_score);
CREATE INDEX IF NOT EXISTS idx_moderation_tasks_status ON moderation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_moderation_tasks_assigned_to ON moderation_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_moderation_tasks_priority ON moderation_tasks(priority);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_moderation_tasks_updated_at BEFORE UPDATE ON moderation_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_reports_fulltext ON reports USING gin(
    to_tsvector('english', 
        COALESCE(identifier_value, '') || ' ' || 
        COALESCE(category, '') || ' ' || 
        COALESCE(narrative, '')
    )
);

-- Create materialized view for dashboard stats
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT 
    COUNT(*) as total_reports,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
    COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_reports,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_reports,
    COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review_reports,
    AVG(risk_score) as average_risk_score,
    SUM(amount_lost) as total_amount_lost,
    COUNT(DISTINCT reporter_user_id) as unique_reporters,
    DATE_TRUNC('day', created_at) as date
FROM reports
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
