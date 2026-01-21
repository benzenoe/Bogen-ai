-- Migration: 007_claude_code_mastermind
-- Claude Code Mastermind Program Registrations Table
-- Created: 2025-01-14

-- Create Claude Code Mastermind Registrations Table
CREATE TABLE IF NOT EXISTS claude_code_mastermind_registrations (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    company VARCHAR(255),
    experience_level VARCHAR(50) DEFAULT 'none',
    discount_code VARCHAR(50),
    final_price DECIMAL(10,2) NOT NULL DEFAULT 1100.00,
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'paid', 'active', 'completed', 'cancelled', 'refunded')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    stripe_payment_id VARCHAR(255),
    coaching_call_scheduled BOOLEAN DEFAULT FALSE,
    coaching_call_date TIMESTAMP,
    sessions_attended INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ccm_registrations_email ON claude_code_mastermind_registrations(email);
CREATE INDEX IF NOT EXISTS idx_ccm_registrations_status ON claude_code_mastermind_registrations(status);
CREATE INDEX IF NOT EXISTS idx_ccm_registrations_discount ON claude_code_mastermind_registrations(discount_code);
CREATE INDEX IF NOT EXISTS idx_ccm_registrations_created ON claude_code_mastermind_registrations(created_at);

-- Update trigger
CREATE TRIGGER update_ccm_registrations_updated_at
    BEFORE UPDATE ON claude_code_mastermind_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE claude_code_mastermind_registrations IS 'Registrations for the 5-week Claude Code Mastermind training program';
COMMENT ON COLUMN claude_code_mastermind_registrations.experience_level IS 'Technical experience level: none, basic, some';
COMMENT ON COLUMN claude_code_mastermind_registrations.discount_code IS 'Applied discount code: MASTERMIND20, CLIENT15, PARTNER25, EARLYBIRD';
COMMENT ON COLUMN claude_code_mastermind_registrations.final_price IS 'Final price after any discounts applied';
COMMENT ON COLUMN claude_code_mastermind_registrations.sessions_attended IS 'Number of live sessions attended (0-5)';
