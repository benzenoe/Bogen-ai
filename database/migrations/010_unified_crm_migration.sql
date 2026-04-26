-- ============================================
-- UNIFIED CRM MIGRATION
-- Created: 2026-04-15
-- Purpose: Migrate fragmented tables → Unified CRM
-- ============================================

-- PHASE 0: Create New CRM Tables
-- ============================================

-- Table: companies
CREATE TABLE IF NOT EXISTS companies (
  company_id SERIAL PRIMARY KEY,
  domain VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  company_size VARCHAR(50), -- 1-10, 11-50, 51-200, 201-500, 500+
  lifecycle_stage VARCHAR(50) DEFAULT 'lead', -- lead, b2c_customers, b2b_prospect, b2b_customer, churned
  industry VARCHAR(100),
  location_city VARCHAR(100),
  location_state VARCHAR(100),
  location_country VARCHAR(100) DEFAULT 'USA',
  decision_maker_contact_id INTEGER, -- FK set later
  total_contacts_count INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0.00,
  is_b2b_target BOOLEAN DEFAULT false,
  source VARCHAR(100),
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_domain ON companies(domain);
CREATE INDEX idx_companies_lifecycle_stage ON companies(lifecycle_stage);
CREATE INDEX idx_companies_is_b2b_target ON companies(is_b2b_target);

-- Table: contacts (UNIFIED)
CREATE TABLE IF NOT EXISTS contacts (
  contact_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(50),
  company_id INTEGER REFERENCES companies(company_id) ON DELETE SET NULL,
  company_name_raw VARCHAR(255), -- Temp field before company matching
  lifecycle_stage VARCHAR(50) DEFAULT 'lead', -- lead, qualified, customer, advocate, churned
  source VARCHAR(100),
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  first_interaction_date TIMESTAMP,
  last_interaction_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_lifecycle_stage ON contacts(lifecycle_stage);
CREATE INDEX idx_contacts_source ON contacts(source);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);

-- Table: interactions
CREATE TABLE IF NOT EXISTS interactions (
  interaction_id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,
  company_id INTEGER REFERENCES companies(company_id) ON DELETE SET NULL,
  interaction_type VARCHAR(100) NOT NULL, -- form_submission, email, call, meeting, mastermind_registration, purchase, etc.
  interaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subject VARCHAR(500),
  body TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by INTEGER REFERENCES admin_users(admin_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interactions_contact_id ON interactions(contact_id);
CREATE INDEX idx_interactions_company_id ON interactions(company_id);
CREATE INDEX idx_interactions_type ON interactions(interaction_type);
CREATE INDEX idx_interactions_date ON interactions(interaction_date DESC);

-- Table: opportunities
CREATE TABLE IF NOT EXISTS opportunities (
  opportunity_id SERIAL PRIMARY KEY,
  opportunity_name VARCHAR(255) NOT NULL,
  contact_id INTEGER NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,
  company_id INTEGER REFERENCES companies(company_id) ON DELETE SET NULL,
  opportunity_type VARCHAR(20) DEFAULT 'b2c', -- b2c, b2b
  stage VARCHAR(50) DEFAULT 'lead', -- lead, qualified, proposal, negotiation, closed_won, closed_lost
  value DECIMAL(10,2) DEFAULT 0.00,
  probability INTEGER DEFAULT 50, -- 0-100%
  expected_close_date DATE,
  products JSONB DEFAULT '[]'::jsonb, -- Array of product IDs
  upsell_from_opportunity_id INTEGER REFERENCES opportunities(opportunity_id),
  is_auto_created BOOLEAN DEFAULT false,
  close_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP
);

CREATE INDEX idx_opportunities_contact_id ON opportunities(contact_id);
CREATE INDEX idx_opportunities_company_id ON opportunities(company_id);
CREATE INDEX idx_opportunities_type ON opportunities(opportunity_type);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_expected_close ON opportunities(expected_close_date);

-- Update timestamp triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PHASE 1: Migrate to CONTACTS Table
-- ============================================

-- 1.1: Migrate from clients
INSERT INTO contacts (
  email,
  first_name,
  last_name,
  phone,
  company_name_raw,
  lifecycle_stage,
  source,
  custom_fields,
  first_interaction_date,
  last_interaction_date
)
SELECT
  email,
  SPLIT_PART(name, ' ', 1) as first_name,
  CASE
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1
    THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
    ELSE NULL
  END as last_name,
  phone,
  company,
  CASE status
    WHEN 'lead' THEN 'lead'
    WHEN 'proposal_sent' THEN 'qualified'
    WHEN 'active' THEN 'customer'
    WHEN 'churned' THEN 'churned'
    ELSE 'lead'
  END as lifecycle_stage,
  'client_table_migration' as source,
  jsonb_build_object(
    'industry', industry,
    'services_interested', services_interested,
    'monthly_budget', monthly_budget,
    'business_description', business_description,
    'referral_source', referral_source,
    'original_table', 'clients',
    'original_id', client_id,
    'referred_by_partner_id', referred_by_partner_id
  ) as custom_fields,
  created_at as first_interaction_date,
  updated_at as last_interaction_date
FROM clients
ON CONFLICT (email) DO UPDATE SET
  phone = COALESCE(contacts.phone, EXCLUDED.phone),
  company_name_raw = COALESCE(contacts.company_name_raw, EXCLUDED.company_name_raw),
  lifecycle_stage = CASE
    WHEN EXCLUDED.lifecycle_stage = 'customer' THEN 'customer'
    WHEN EXCLUDED.lifecycle_stage = 'qualified' AND contacts.lifecycle_stage = 'lead' THEN 'qualified'
    ELSE contacts.lifecycle_stage
  END,
  first_interaction_date = LEAST(contacts.first_interaction_date, EXCLUDED.first_interaction_date),
  last_interaction_date = GREATEST(contacts.last_interaction_date, EXCLUDED.last_interaction_date),
  custom_fields = contacts.custom_fields || EXCLUDED.custom_fields;

-- 1.2: Migrate from mastermind_registrations
INSERT INTO contacts (
  email,
  first_name,
  last_name,
  phone,
  company_name_raw,
  lifecycle_stage,
  source,
  custom_fields,
  first_interaction_date,
  last_interaction_date
)
SELECT
  email,
  first_name,
  last_name,
  phone,
  company,
  'lead' as lifecycle_stage,
  'mastermind_registration' as source,
  jsonb_build_object(
    'how_heard', how_heard,
    'original_table', 'mastermind_registrations',
    'original_id', registration_id
  ) as custom_fields,
  created_at as first_interaction_date,
  updated_at as last_interaction_date
FROM mastermind_registrations
ON CONFLICT (email) DO UPDATE SET
  phone = COALESCE(contacts.phone, EXCLUDED.phone),
  company_name_raw = COALESCE(contacts.company_name_raw, EXCLUDED.company_name_raw),
  first_interaction_date = LEAST(contacts.first_interaction_date, EXCLUDED.first_interaction_date),
  last_interaction_date = GREATEST(contacts.last_interaction_date, EXCLUDED.last_interaction_date),
  custom_fields = contacts.custom_fields || EXCLUDED.custom_fields;

-- 1.3: Migrate from chat_leads
INSERT INTO contacts (
  email,
  first_name,
  last_name,
  phone,
  lifecycle_stage,
  source,
  custom_fields,
  first_interaction_date,
  last_interaction_date
)
SELECT
  email,
  SPLIT_PART(name, ' ', 1) as first_name,
  CASE
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1
    THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
    ELSE NULL
  END as last_name,
  phone,
  CASE status
    WHEN 'new' THEN 'lead'
    WHEN 'contacted' THEN 'lead'
    WHEN 'qualified' THEN 'qualified'
    WHEN 'converted' THEN 'customer'
    WHEN 'not_qualified' THEN 'lead'
    ELSE 'lead'
  END as lifecycle_stage,
  'chatbot' as source,
  jsonb_build_object(
    'business_type', business_type,
    'revenue_range', revenue_range,
    'main_bottleneck', main_bottleneck,
    'leads_per_month', leads_per_month,
    'qualification_score', qualification_score,
    'notes', notes,
    'original_table', 'chat_leads',
    'original_id', id,
    'conversation_id', conversation_id
  ) as custom_fields,
  created_at as first_interaction_date,
  updated_at as last_interaction_date
FROM chat_leads
ON CONFLICT (email) DO UPDATE SET
  phone = COALESCE(contacts.phone, EXCLUDED.phone),
  lifecycle_stage = CASE
    WHEN EXCLUDED.lifecycle_stage IN ('customer', 'qualified') THEN EXCLUDED.lifecycle_stage
    ELSE contacts.lifecycle_stage
  END,
  first_interaction_date = LEAST(contacts.first_interaction_date, EXCLUDED.first_interaction_date),
  last_interaction_date = GREATEST(contacts.last_interaction_date, EXCLUDED.last_interaction_date),
  custom_fields = contacts.custom_fields || EXCLUDED.custom_fields;

-- 1.4: Migrate from book_leads
INSERT INTO contacts (
  email,
  first_name,
  last_name,
  lifecycle_stage,
  source,
  custom_fields,
  first_interaction_date,
  last_interaction_date
)
SELECT
  email,
  SPLIT_PART(name, ' ', 1) as first_name,
  CASE
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1
    THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
    ELSE NULL
  END as last_name,
  'lead' as lifecycle_stage,
  CONCAT('book_download_', resource) as source,
  jsonb_build_object(
    'resource_downloaded', resource,
    'utm_source', utm_source,
    'utm_medium', utm_medium,
    'opted_in', opted_in,
    'original_table', 'book_leads',
    'original_id', id
  ) as custom_fields,
  created_at as first_interaction_date,
  created_at as last_interaction_date
FROM book_leads
ON CONFLICT (email) DO UPDATE SET
  first_interaction_date = LEAST(contacts.first_interaction_date, EXCLUDED.first_interaction_date),
  last_interaction_date = GREATEST(contacts.last_interaction_date, EXCLUDED.last_interaction_date),
  custom_fields = contacts.custom_fields || EXCLUDED.custom_fields;

-- 1.5: Migrate from speaker_inquiries
INSERT INTO contacts (
  email,
  first_name,
  last_name,
  phone,
  lifecycle_stage,
  source,
  custom_fields,
  first_interaction_date,
  last_interaction_date
)
SELECT
  email,
  first_name,
  last_name,
  phone,
  'qualified' as lifecycle_stage,
  'speaker_inquiry' as source,
  jsonb_build_object(
    'inquiry_message', message,
    'original_table', 'speaker_inquiries',
    'original_id', id
  ) as custom_fields,
  created_at as first_interaction_date,
  created_at as last_interaction_date
FROM speaker_inquiries
ON CONFLICT (email) DO UPDATE SET
  phone = COALESCE(contacts.phone, EXCLUDED.phone),
  lifecycle_stage = CASE
    WHEN contacts.lifecycle_stage = 'lead' THEN 'qualified'
    ELSE contacts.lifecycle_stage
  END,
  first_interaction_date = LEAST(contacts.first_interaction_date, EXCLUDED.first_interaction_date),
  last_interaction_date = GREATEST(contacts.last_interaction_date, EXCLUDED.last_interaction_date),
  custom_fields = contacts.custom_fields || EXCLUDED.custom_fields;

-- 1.6: Migrate from service_inquiries
INSERT INTO contacts (
  email,
  first_name,
  last_name,
  phone,
  lifecycle_stage,
  source,
  custom_fields,
  first_interaction_date,
  last_interaction_date
)
SELECT
  email,
  SPLIT_PART(name, ' ', 1) as first_name,
  CASE
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1
    THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
    ELSE NULL
  END as last_name,
  phone,
  'qualified' as lifecycle_stage,
  'service_inquiry' as source,
  jsonb_build_object(
    'industry', industry,
    'challenge', challenge,
    'team_size', team_size,
    'original_table', 'service_inquiries',
    'original_id', id
  ) as custom_fields,
  created_at as first_interaction_date,
  created_at as last_interaction_date
FROM service_inquiries
ON CONFLICT (email) DO UPDATE SET
  phone = COALESCE(contacts.phone, EXCLUDED.phone),
  lifecycle_stage = CASE
    WHEN contacts.lifecycle_stage = 'lead' THEN 'qualified'
    ELSE contacts.lifecycle_stage
  END,
  first_interaction_date = LEAST(contacts.first_interaction_date, EXCLUDED.first_interaction_date),
  last_interaction_date = GREATEST(contacts.last_interaction_date, EXCLUDED.last_interaction_date),
  custom_fields = contacts.custom_fields || EXCLUDED.custom_fields;

-- ============================================
-- PHASE 2: Create COMPANIES from Email Domains
-- ============================================

INSERT INTO companies (
  domain,
  company_name,
  lifecycle_stage,
  total_contacts_count,
  source
)
SELECT
  LOWER(SUBSTRING(email FROM '@(.*)$')) as domain,
  COALESCE(
    MODE() WITHIN GROUP (ORDER BY company_name_raw),
    INITCAP(REPLACE(REPLACE(SUBSTRING(email FROM '@(.*)$'), '.com', ''), '.', ' '))
  ) as company_name,
  'lead' as lifecycle_stage,
  COUNT(*) as total_contacts_count,
  'email_domain_extraction' as source
FROM contacts
WHERE email LIKE '%@%.%'
  AND email NOT LIKE '%@gmail.%'
  AND email NOT LIKE '%@yahoo.%'
  AND email NOT LIKE '%@hotmail.%'
  AND email NOT LIKE '%@outlook.%'
  AND email NOT LIKE '%@aol.%'
  AND email NOT LIKE '%@icloud.%'
  AND company_name_raw IS NOT NULL
GROUP BY LOWER(SUBSTRING(email FROM '@(.*)$'))
HAVING COUNT(*) >= 1
ON CONFLICT (domain) DO NOTHING;

-- ============================================
-- PHASE 3: Link Contacts to Companies
-- ============================================

UPDATE contacts SET company_id = companies.company_id
FROM companies
WHERE LOWER(SUBSTRING(contacts.email FROM '@(.*)$')) = companies.domain
  AND contacts.email NOT LIKE '%@gmail.%'
  AND contacts.email NOT LIKE '%@yahoo.%'
  AND contacts.email NOT LIKE '%@hotmail.%'
  AND contacts.email NOT LIKE '%@outlook.%'
  AND contacts.email NOT LIKE '%@aol.%'
  AND contacts.email NOT LIKE '%@icloud.%';

-- Update company contact counts
UPDATE companies SET total_contacts_count = (
  SELECT COUNT(*) FROM contacts WHERE contacts.company_id = companies.company_id
);

-- ============================================
-- PHASE 4: Create INTERACTIONS from Historical Data
-- ============================================

-- 4.1: From mastermind_registrations
INSERT INTO interactions (
  contact_id,
  interaction_type,
  interaction_date,
  subject,
  body,
  metadata
)
SELECT
  c.contact_id,
  'mastermind_registration' as interaction_type,
  m.created_at as interaction_date,
  CONCAT('Mastermind Registration - ', m.event_date) as subject,
  CONCAT(
    'Registered for mastermind event on ', m.event_date, '. ',
    'Status: ', m.registration_status,
    CASE WHEN m.how_heard IS NOT NULL THEN CONCAT('. How heard: ', m.how_heard) ELSE '' END
  ) as body,
  jsonb_build_object(
    'event_date', m.event_date,
    'registration_status', m.registration_status,
    'email_sent', m.email_sent,
    'source_table', 'mastermind_registrations',
    'source_id', m.registration_id
  ) as metadata
FROM mastermind_registrations m
JOIN contacts c ON c.email = m.email;

-- 4.2: From chat_leads
INSERT INTO interactions (
  contact_id,
  interaction_type,
  interaction_date,
  subject,
  body,
  metadata
)
SELECT
  c.contact_id,
  'chatbot_conversation' as interaction_type,
  cl.created_at as interaction_date,
  'AI Chatbot Qualification' as subject,
  CONCAT(
    'Business: ', COALESCE(cl.business_type, 'N/A'), '. ',
    'Revenue: ', COALESCE(cl.revenue_range, 'N/A'), '. ',
    'Bottleneck: ', COALESCE(cl.main_bottleneck, 'N/A'),
    CASE WHEN cl.notes IS NOT NULL THEN CONCAT('. Notes: ', cl.notes) ELSE '' END
  ) as body,
  jsonb_build_object(
    'qualification_score', cl.qualification_score,
    'leads_per_month', cl.leads_per_month,
    'conversation_id', cl.conversation_id,
    'source_table', 'chat_leads',
    'source_id', cl.id
  ) as metadata
FROM chat_leads cl
JOIN contacts c ON c.email = cl.email;

-- 4.3: From book_leads
INSERT INTO interactions (
  contact_id,
  interaction_type,
  interaction_date,
  subject,
  body,
  metadata
)
SELECT
  c.contact_id,
  'resource_download' as interaction_type,
  bl.created_at as interaction_date,
  CONCAT('Downloaded: ', bl.resource) as subject,
  CONCAT('Resource download: ', bl.resource) as body,
  jsonb_build_object(
    'resource', bl.resource,
    'utm_source', bl.utm_source,
    'utm_medium', bl.utm_medium,
    'opted_in', bl.opted_in,
    'source_table', 'book_leads',
    'source_id', bl.id
  ) as metadata
FROM book_leads bl
JOIN contacts c ON c.email = bl.email;

-- 4.4: From speaker_inquiries
INSERT INTO interactions (
  contact_id,
  interaction_type,
  interaction_date,
  subject,
  body,
  metadata
)
SELECT
  c.contact_id,
  'speaker_inquiry' as interaction_type,
  si.created_at as interaction_date,
  'Speaker Inquiry' as subject,
  COALESCE(si.message, 'Speaker inquiry submitted') as body,
  jsonb_build_object(
    'source_table', 'speaker_inquiries',
    'source_id', si.id
  ) as metadata
FROM speaker_inquiries si
JOIN contacts c ON c.email = si.email;

-- 4.5: From service_inquiries
INSERT INTO interactions (
  contact_id,
  interaction_type,
  interaction_date,
  subject,
  body,
  metadata
)
SELECT
  c.contact_id,
  'service_inquiry' as interaction_type,
  si.created_at as interaction_date,
  'AI Solution Quiz Submission' as subject,
  CONCAT(
    'Industry: ', si.industry, '. ',
    'Team: ', si.team_size, '. ',
    'Challenge: ', si.challenge
  ) as body,
  jsonb_build_object(
    'industry', si.industry,
    'team_size', si.team_size,
    'source_table', 'service_inquiries',
    'source_id', si.id
  ) as metadata
FROM service_inquiries si
JOIN contacts c ON c.email = si.email;

-- Update company_id on interactions
UPDATE interactions i
SET company_id = c.company_id
FROM contacts c
WHERE i.contact_id = c.contact_id
  AND c.company_id IS NOT NULL;

-- ============================================
-- PHASE 5: Update Referrals Table
-- ============================================

-- Add contact_id column to referrals
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS contact_id INTEGER REFERENCES contacts(contact_id);

-- Link referrals to unified contacts
UPDATE referrals r
SET contact_id = c.contact_id
FROM contacts c
WHERE r.client_email = c.email;

-- ============================================
-- VALIDATION QUERIES
-- ============================================

-- Run these manually after migration:
/*
-- 1. Total contacts migrated
SELECT COUNT(*) as total_contacts FROM contacts;

-- 2. Contacts by source
SELECT source, COUNT(*) as count FROM contacts GROUP BY source ORDER BY count DESC;

-- 3. Companies created
SELECT COUNT(*) as total_companies FROM companies;

-- 4. Contacts linked to companies
SELECT COUNT(*) as linked,
       (SELECT COUNT(*) FROM contacts) as total,
       ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contacts), 2) as percentage
FROM contacts WHERE company_id IS NOT NULL;

-- 5. Interactions created
SELECT interaction_type, COUNT(*) as count FROM interactions GROUP BY interaction_type ORDER BY count DESC;

-- 6. Total interactions
SELECT COUNT(*) as total_interactions FROM interactions;
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
