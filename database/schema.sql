-- Bogen.ai Database Schema
-- PostgreSQL 12+

-- Drop existing tables (cascade to handle foreign keys)
DROP TABLE IF EXISTS commission_payments CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS featured_videos CASCADE;

-- Partners Table
CREATE TABLE partners (
    partner_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    linkedin_url VARCHAR(500),
    password_hash VARCHAR(255) NOT NULL,
    unique_referral_code VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
    commission_rate DECIMAL(5,2) DEFAULT 20.00,
    total_lifetime_earnings DECIMAL(10,2) DEFAULT 0.00,
    industries TEXT[], -- Array of industries they work with
    how_they_know_businesses TEXT,
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients Table
CREATE TABLE clients (
    client_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    industry VARCHAR(100),
    services_interested TEXT[], -- Array of service categories
    monthly_budget VARCHAR(50),
    business_description TEXT,
    status VARCHAR(20) DEFAULT 'lead' CHECK (status IN ('lead', 'proposal_sent', 'active', 'churned')),
    referred_by_partner_id INTEGER REFERENCES partners(partner_id) ON DELETE SET NULL,
    referral_source VARCHAR(255), -- UTM tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Referrals Table (tracks relationship between partners and clients)
CREATE TABLE referrals (
    referral_id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES partners(partner_id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_company VARCHAR(255),
    services_subscribed JSONB, -- Flexible storage for service details
    monthly_recurring_revenue DECIMAL(10,2) DEFAULT 0.00,
    partner_commission_rate DECIMAL(5,2) NOT NULL,
    partner_monthly_commission DECIMAL(10,2) GENERATED ALWAYS AS (monthly_recurring_revenue * partner_commission_rate / 100) STORED,
    status VARCHAR(20) DEFAULT 'lead' CHECK (status IN ('lead', 'proposal_sent', 'active', 'churned')),
    start_date DATE,
    end_date DATE,
    referral_source VARCHAR(255), -- UTM parameters
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(partner_id, client_id)
);

-- Commission Payments Table
CREATE TABLE commission_payments (
    payment_id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES partners(partner_id) ON DELETE CASCADE,
    payment_period VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    total_commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_date DATE,
    payment_method VARCHAR(50) DEFAULT 'xero',
    xero_invoice_id VARCHAR(255),
    xero_payment_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(partner_id, payment_period)
);

-- Admin Users Table
CREATE TABLE admin_users (
    admin_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Featured Videos Table
CREATE TABLE featured_videos (
    video_id SERIAL PRIMARY KEY,
    youtube_video_id VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255),
    description TEXT,
    thumbnail_url VARCHAR(500),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_partners_email ON partners(email);
CREATE INDEX idx_partners_referral_code ON partners(unique_referral_code);
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_referred_by ON clients(referred_by_partner_id);
CREATE INDEX idx_referrals_partner ON referrals(partner_id);
CREATE INDEX idx_referrals_client ON referrals(client_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_commission_payments_partner ON commission_payments(partner_id);
CREATE INDEX idx_commission_payments_period ON commission_payments(payment_period);
CREATE INDEX idx_featured_videos_display_order ON featured_videos(display_order);
CREATE INDEX idx_featured_videos_youtube_id ON featured_videos(youtube_video_id);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commission_payments_updated_at BEFORE UPDATE ON commission_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_featured_videos_updated_at BEFORE UPDATE ON featured_videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123 - CHANGE THIS!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO admin_users (email, password_hash, name)
VALUES ('admin@bogen.ai', '$2a$10$X7XmXmXyGtJ7YqLz5bKxOeRMq.RXjXKXJqXqXqXqXqXqXqXqXqXqX', 'Admin User');
-- NOTE: This is a placeholder hash. You'll need to generate a real one when setting up.
