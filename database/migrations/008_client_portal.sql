-- Client Portal Database Migration
-- Migration 008: Add tables for client portal functionality

-- ============================================
-- 1. PORTAL CLIENTS TABLE (Client User Accounts)
-- ============================================
-- Separate from existing 'clients' table which tracks inquiries/leads
-- This table stores authenticated client accounts for the portal

CREATE TABLE IF NOT EXISTS portal_clients (
    portal_client_id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(client_id) ON DELETE SET NULL, -- Link to existing client record
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portal_clients_email ON portal_clients(email);
CREATE INDEX IF NOT EXISTS idx_portal_clients_client_id ON portal_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_portal_clients_status ON portal_clients(status);

-- ============================================
-- 2. TRANSACTIONS TABLE (Client Deals/Projects)
-- ============================================
-- Tracks active deals, projects, or services for each client

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id SERIAL PRIMARY KEY,
    portal_client_id INTEGER NOT NULL REFERENCES portal_clients(portal_client_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    service_type VARCHAR(100), -- e.g., 'real_estate_sale', 'real_estate_purchase', 'ai_automation', etc.
    property_address VARCHAR(500), -- For real estate transactions
    property_value DECIMAL(12,2), -- For real estate transactions
    status VARCHAR(50) DEFAULT 'initiated' CHECK (status IN (
        'initiated',
        'proposal_sent',
        'contract_signed',
        'in_progress',
        'under_review',
        'pending_closing',
        'completed',
        'on_hold',
        'cancelled'
    )),
    assigned_to VARCHAR(100), -- Team member name
    start_date DATE,
    estimated_completion DATE,
    actual_completion DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_portal_client ON transactions(portal_client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_service_type ON transactions(service_type);

-- ============================================
-- 3. TRANSACTION TIMELINE TABLE (Progress Steps)
-- ============================================
-- Visual timeline with steps for each transaction

CREATE TABLE IF NOT EXISTS transaction_timeline (
    timeline_id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    step_name VARCHAR(100) NOT NULL,
    step_description TEXT,
    step_order INTEGER NOT NULL,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    completed_at TIMESTAMP,
    completed_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_timeline_transaction ON transaction_timeline(transaction_id);
CREATE INDEX IF NOT EXISTS idx_timeline_status ON transaction_timeline(status);

-- ============================================
-- 4. CLIENT RESOURCES TABLE (Resources Library)
-- ============================================
-- Market reports, guides, neighborhood info, etc.

CREATE TABLE IF NOT EXISTS client_resources (
    resource_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'market_report',
        'buying_guide',
        'selling_guide',
        'neighborhood_info',
        'template',
        'video',
        'general'
    )),
    file_url VARCHAR(500), -- For downloadable files
    external_link VARCHAR(500), -- For external resources
    thumbnail_url VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE, -- If true, visible to all clients; if false, can be assigned
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resources_category ON client_resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_is_public ON client_resources(is_public);

-- ============================================
-- 5. CLIENT MESSAGES TABLE (Communication Hub)
-- ============================================
-- Two-way messaging between clients and team

CREATE TABLE IF NOT EXISTS client_messages (
    message_id SERIAL PRIMARY KEY,
    portal_client_id INTEGER NOT NULL REFERENCES portal_clients(portal_client_id) ON DELETE CASCADE,
    transaction_id INTEGER REFERENCES transactions(transaction_id) ON DELETE SET NULL, -- Optional link to specific transaction
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('client', 'admin')),
    sender_id INTEGER, -- portal_client_id if client, admin_id if admin
    sender_name VARCHAR(255), -- Display name
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_portal_client ON client_messages(portal_client_id);
CREATE INDEX IF NOT EXISTS idx_messages_transaction ON client_messages(transaction_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON client_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON client_messages(created_at DESC);

-- ============================================
-- 6. CLIENT DOCUMENTS TABLE (Shared Files)
-- ============================================
-- Documents shared between clients and team

CREATE TABLE IF NOT EXISTS client_documents (
    document_id SERIAL PRIMARY KEY,
    portal_client_id INTEGER NOT NULL REFERENCES portal_clients(portal_client_id) ON DELETE CASCADE,
    transaction_id INTEGER REFERENCES transactions(transaction_id) ON DELETE SET NULL, -- Optional link to specific transaction
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50), -- e.g., 'pdf', 'doc', 'jpg'
    file_size INTEGER, -- bytes
    uploaded_by VARCHAR(20) CHECK (uploaded_by IN ('client', 'admin')),
    uploader_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_portal_client ON client_documents(portal_client_id);
CREATE INDEX IF NOT EXISTS idx_documents_transaction ON client_documents(transaction_id);

-- ============================================
-- 7. CLIENT APPOINTMENTS TABLE (Scheduling)
-- ============================================
-- Appointment scheduling between clients and team

CREATE TABLE IF NOT EXISTS client_appointments (
    appointment_id SERIAL PRIMARY KEY,
    portal_client_id INTEGER NOT NULL REFERENCES portal_clients(portal_client_id) ON DELETE CASCADE,
    transaction_id INTEGER REFERENCES transactions(transaction_id) ON DELETE SET NULL, -- Optional link to specific transaction
    title VARCHAR(255) NOT NULL,
    description TEXT,
    appointment_type VARCHAR(50), -- e.g., 'phone_call', 'video_call', 'in_person', 'property_showing'
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    location VARCHAR(500), -- Physical address or 'Virtual'
    meeting_link VARCHAR(500), -- Zoom/Teams/etc link
    status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no_show')),
    reminder_sent BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_portal_client ON client_appointments(portal_client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_transaction ON client_appointments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON client_appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON client_appointments(status);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================
-- Apply update_updated_at_column trigger (defined in schema.sql) to new tables

CREATE TRIGGER update_portal_clients_updated_at
    BEFORE UPDATE ON portal_clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_updated_at
    BEFORE UPDATE ON transaction_timeline
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON client_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON client_appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: Default Timeline Templates
-- ============================================
-- These are examples that can be copied when creating new transactions

-- Example: Real Estate Purchase Timeline Steps (for reference when creating transactions)
-- 1. Initial Consultation (step_order: 1)
-- 2. Pre-Approval Verification (step_order: 2)
-- 3. Property Search & Showings (step_order: 3)
-- 4. Offer Submitted (step_order: 4)
-- 5. Offer Accepted (step_order: 5)
-- 6. Inspection Period (step_order: 6)
-- 7. Appraisal (step_order: 7)
-- 8. Final Walkthrough (step_order: 8)
-- 9. Closing Day (step_order: 9)
-- 10. Keys Delivered (step_order: 10)

-- Example: Real Estate Sale Timeline Steps (for reference when creating transactions)
-- 1. Initial Listing Consultation (step_order: 1)
-- 2. Home Preparation & Staging (step_order: 2)
-- 3. Professional Photography (step_order: 3)
-- 4. Active on MLS (step_order: 4)
-- 5. Showings & Open Houses (step_order: 5)
-- 6. Offer Received (step_order: 6)
-- 7. Under Contract (step_order: 7)
-- 8. Buyer Inspection (step_order: 8)
-- 9. Appraisal Complete (step_order: 9)
-- 10. Final Closing (step_order: 10)

-- Seed some default resources
INSERT INTO client_resources (title, description, category, is_public, sort_order) VALUES
('First-Time Buyer Guide', 'Everything you need to know about buying your first home in South Florida', 'buying_guide', TRUE, 1),
('Selling Your Home Checklist', 'Step-by-step checklist to prepare your home for a successful sale', 'selling_guide', TRUE, 2),
('South Florida Market Report', 'Current market trends, pricing data, and insights for luxury real estate', 'market_report', TRUE, 3),
('Boca Raton Neighborhood Guide', 'Explore the premier communities and neighborhoods in Boca Raton', 'neighborhood_info', TRUE, 4),
('Closing Cost Breakdown', 'Understanding the fees and costs involved in real estate transactions', 'general', TRUE, 5)
ON CONFLICT DO NOTHING;
