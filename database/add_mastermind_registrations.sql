-- Add Mastermind Registrations Table
-- Run this on Neon database to create the new table

CREATE TABLE IF NOT EXISTS mastermind_registrations (
    registration_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    how_heard VARCHAR(255),
    event_date DATE NOT NULL,
    registration_status VARCHAR(20) DEFAULT 'registered' CHECK (registration_status IN ('registered', 'attended', 'no_show', 'cancelled')),
    email_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mastermind_registrations_email ON mastermind_registrations(email);
CREATE INDEX IF NOT EXISTS idx_mastermind_registrations_event_date ON mastermind_registrations(event_date);
CREATE INDEX IF NOT EXISTS idx_mastermind_registrations_status ON mastermind_registrations(registration_status);

-- Add update trigger
CREATE TRIGGER update_mastermind_registrations_updated_at
BEFORE UPDATE ON mastermind_registrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
