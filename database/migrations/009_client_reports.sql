-- Client Reports Database Migration
-- Migration 009: Add table for client reports (Claude artifact HTML reports)

-- ============================================
-- CLIENT REPORTS TABLE
-- ============================================
-- Stores personalized HTML reports generated from Claude artifacts
-- that Edmund uploads for individual clients to view in their portal

CREATE TABLE IF NOT EXISTS client_reports (
    report_id SERIAL PRIMARY KEY,
    portal_client_id INTEGER NOT NULL REFERENCES portal_clients(portal_client_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    report_html TEXT NOT NULL, -- Full Claude artifact HTML content
    report_type VARCHAR(50) DEFAULT 'general' CHECK (report_type IN (
        'market_analysis',
        'property_report',
        'investment_summary',
        'neighborhood_report',
        'comparative_market_analysis',
        'annual_review',
        'general'
    )),
    is_published BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'Edmund Bogen',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_reports_portal_client ON client_reports(portal_client_id);
CREATE INDEX IF NOT EXISTS idx_client_reports_type ON client_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_client_reports_published ON client_reports(is_published);
CREATE INDEX IF NOT EXISTS idx_client_reports_created_at ON client_reports(created_at DESC);

-- Apply update trigger
CREATE TRIGGER update_client_reports_updated_at
    BEFORE UPDATE ON client_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
