-- Initial Database Schema for Community Scam Registry
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('visitor', 'member', 'verified_member', 'moderator', 'admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'banned')),
    is_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    last_login_at TIMESTAMP,
    email_verified_at TIMESTAMP,
    phone_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Identifiers table
CREATE TABLE identifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('phone', 'email', 'whatsapp', 'instagram', 'twitter', 'facebook', 'website')),
    value_raw TEXT NOT NULL,
    value_normalized TEXT NOT NULL,
    country_code CHAR(2),
    metadata JSONB DEFAULT '{}',
    verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'suspicious', 'blocked')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for identifiers
CREATE INDEX idx_identifiers_normalized ON identifiers(type, value_normalized);
CREATE INDEX idx_identifiers_type ON identifiers(type);
CREATE INDEX idx_identifiers_country ON identifiers(country_code);
CREATE INDEX idx_identifiers_verification ON identifiers(verification_status);

-- Entities table
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_identifier_id UUID REFERENCES identifiers(id),
    display_name VARCHAR(255),
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    confidence_score FLOAT DEFAULT 0.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    status VARCHAR(20) DEFAULT 'alleged' CHECK (status IN ('alleged', 'confirmed', 'disputed', 'removed')),
    report_count INTEGER DEFAULT 0,
    total_amount_lost DECIMAL(15,2) DEFAULT 0,
    first_reported DATE,
    last_reported DATE,
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Entity identifiers linking table
CREATE TABLE entity_identifiers (
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    identifier_id UUID REFERENCES identifiers(id) ON DELETE CASCADE,
    confidence_score FLOAT DEFAULT 1.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    linked_by_user_id UUID REFERENCES users(id),
    linked_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (entity_id, identifier_id)
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID REFERENCES entities(id),
    reporter_user_id UUID REFERENCES users(id),
    identifier_type VARCHAR(20) NOT NULL CHECK (identifier_type IN ('phone', 'email', 'whatsapp', 'instagram', 'twitter', 'facebook', 'website')),
    identifier_value TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('phishing', 'romance', 'investment', 'tech_support', 'lottery', 'job_scam', 'rental', 'crypto', 'other')),
    amount_lost DECIMAL(12,2),
    currency CHAR(3),
    incident_date DATE NOT NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('call', 'sms', 'email', 'social_dm', 'website', 'app', 'other')),
    narrative TEXT NOT NULL CHECK (char_length(narrative) >= 500 AND char_length(narrative) <= 5000),
    suspected_links JSONB DEFAULT '[]',
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    status VARCHAR(20) DEFAULT 'pending_moderation' CHECK (status IN ('pending_moderation', 'approved', 'rejected', 'more_info_needed', 'escalated')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for reports
CREATE INDEX idx_reports_entity ON reports(entity_id);
CREATE INDEX idx_reports_reporter ON reports(reporter_user_id);
CREATE INDEX idx_reports_identifier ON reports(identifier_type, identifier_value);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_date ON reports(incident_date);
CREATE INDEX idx_reports_risk ON reports(risk_score);

-- Evidence table
CREATE TABLE evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'pdf', 'text')),
    file_size BIGINT NOT NULL,
    storage_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_hash CHAR(64) NOT NULL,
    perceptual_hash TEXT,
    ocr_text TEXT,
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    flags JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for evidence
CREATE INDEX idx_evidence_report ON evidence(report_id);
CREATE INDEX idx_evidence_file_hash ON evidence(file_hash);
CREATE INDEX idx_evidence_processing ON evidence(processing_status);

-- Moderation queue table
CREATE TABLE moderation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    assigned_moderator_id UUID REFERENCES users(id),
    priority INTEGER DEFAULT 50 CHECK (priority >= 1 AND priority <= 100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_review', 'completed')),
    created_at TIMESTAMP DEFAULT NOW(),
    assigned_at TIMESTAMP,
    completed_at TIMESTAMP,
    sla_deadline TIMESTAMP
);

-- Create indexes for moderation queue
CREATE INDEX idx_moderation_queue_report ON moderation_queue(report_id);
CREATE INDEX idx_moderation_queue_moderator ON moderation_queue(assigned_moderator_id);
CREATE INDEX idx_moderation_queue_priority ON moderation_queue(priority);
CREATE INDEX idx_moderation_queue_status ON moderation_queue(status);

-- Moderation decisions table
CREATE TABLE moderation_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    moderator_id UUID REFERENCES users(id),
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('approved', 'rejected', 'more_info', 'escalated')),
    reason_code VARCHAR(50),
    notes TEXT,
    evidence_reviewed JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for moderation decisions
CREATE INDEX idx_moderation_decisions_report ON moderation_decisions(report_id);
CREATE INDEX idx_moderation_decisions_moderator ON moderation_decisions(moderator_id);
CREATE INDEX idx_moderation_decisions_decision ON moderation_decisions(decision);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES comments(id),
    entity_id UUID REFERENCES entities(id),
    report_id UUID REFERENCES reports(id),
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL CHECK (char_length(content) > 0),
    is_anonymous BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    flags_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'deleted')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for comments
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_entity ON comments(entity_id);
CREATE INDEX idx_comments_report ON comments(report_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_status ON comments(status);

-- Comment votes table
CREATE TABLE comment_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Comment flags table
CREATE TABLE comment_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    flagger_id UUID REFERENCES users(id),
    reason VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    identifier_id UUID REFERENCES identifiers(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    notification_types JSONB DEFAULT '["new_report", "status_update"]',
    delivery_channels JSONB DEFAULT '["email", "in_app"]',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, identifier_id),
    UNIQUE(user_id, entity_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    channels JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'read')),
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP
);

-- Create indexes for notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Processing jobs table
CREATE TABLE processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evidence_id UUID REFERENCES evidence(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for processing jobs
CREATE INDEX idx_processing_jobs_evidence ON processing_jobs(evidence_id);
CREATE INDEX idx_processing_jobs_stage ON processing_jobs(stage);
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);

-- Extracted data table
CREATE TABLE extracted_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evidence_id UUID REFERENCES evidence(id) ON DELETE CASCADE,
    extraction_type VARCHAR(50) NOT NULL,
    extracted_content JSONB NOT NULL,
    confidence_score FLOAT CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for extracted data
CREATE INDEX idx_extracted_data_evidence ON extracted_data(evidence_id);
CREATE INDEX idx_extracted_data_type ON extracted_data(extraction_type);

-- Search analytics table
CREATE TABLE search_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_text TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    results_count INTEGER,
    clicked_result_id UUID,
    search_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for search analytics
CREATE INDEX idx_search_analytics_query ON search_analytics(query_text);
CREATE INDEX idx_search_analytics_user ON search_analytics(user_id);
CREATE INDEX idx_search_analytics_time ON search_analytics(created_at);

-- Scam trends table
CREATE TABLE scam_trends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time_period DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    region VARCHAR(100),
    report_count INTEGER DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    trend_direction VARCHAR(10) CHECK (trend_direction IN ('up', 'down', 'stable')),
    calculated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for scam trends
CREATE INDEX idx_scam_trends_period ON scam_trends(time_period);
CREATE INDEX idx_scam_trends_category ON scam_trends(category);
CREATE INDEX idx_scam_trends_region ON scam_trends(region);

-- Audit log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_time ON audit_log(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create full-text search indexes
CREATE INDEX idx_reports_narrative_fts ON reports USING gin(to_tsvector('english', narrative));
CREATE INDEX idx_comments_content_fts ON comments USING gin(to_tsvector('english', content));

-- Create composite indexes for common queries
CREATE INDEX idx_reports_identifier_status ON reports(identifier_type, identifier_value, status);
CREATE INDEX idx_entities_status_risk ON entities(status, risk_score);
CREATE INDEX idx_moderation_queue_priority_status ON moderation_queue(priority, status);

-- Add comments to tables
COMMENT ON TABLE users IS 'User accounts with role-based access control';
COMMENT ON TABLE identifiers IS 'Normalized identifiers (phone, email, social handles)';
COMMENT ON TABLE entities IS 'Scammer entities that can have multiple identifiers';
COMMENT ON TABLE reports IS 'Scam reports submitted by users';
COMMENT ON TABLE evidence IS 'Evidence files uploaded with reports';
COMMENT ON TABLE moderation_queue IS 'Queue for moderator review of reports';
COMMENT ON TABLE comments IS 'Community discussions on entities and reports';
COMMENT ON TABLE notifications IS 'User notifications for various events';
COMMENT ON TABLE audit_log IS 'Audit trail for all system actions';
