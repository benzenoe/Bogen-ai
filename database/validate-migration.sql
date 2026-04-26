-- ============================================
-- CRM MIGRATION VALIDATION QUERIES
-- Run these BEFORE and AFTER migration
-- ============================================

-- ============================================
-- PRE-MIGRATION: Baseline Counts
-- ============================================

\echo '\n=========================================='
\echo 'PRE-MIGRATION BASELINE COUNTS'
\echo '==========================================\n'

-- Total records in each source table
SELECT 'clients' as table_name, COUNT(*) as record_count FROM clients
UNION ALL
SELECT 'mastermind_registrations', COUNT(*) FROM mastermind_registrations
UNION ALL
SELECT 'chat_leads', COUNT(*) FROM chat_leads
UNION ALL
SELECT 'book_leads', COUNT(*) FROM book_leads
UNION ALL
SELECT 'speaker_inquiries', COUNT(*) FROM speaker_inquiries
UNION ALL
SELECT 'service_inquiries', COUNT(*) FROM service_inquiries
ORDER BY record_count DESC;

-- Total unique emails across all tables
\echo '\nTOTAL UNIQUE EMAILS (pre-deduplication):'
SELECT COUNT(DISTINCT email) as unique_emails
FROM (
  SELECT email FROM clients
  UNION ALL
  SELECT email FROM mastermind_registrations
  UNION ALL
  SELECT email FROM chat_leads
  UNION ALL
  SELECT email FROM book_leads
  UNION ALL
  SELECT email FROM speaker_inquiries
  UNION ALL
  SELECT email FROM service_inquiries
) all_emails;

-- Emails appearing in multiple tables
\echo '\nEMAILS IN MULTIPLE TABLES (duplication analysis):'
SELECT
  email,
  COUNT(DISTINCT table_source) as table_count,
  STRING_AGG(DISTINCT table_source, ', ') as tables
FROM (
  SELECT email, 'clients' as table_source FROM clients
  UNION ALL
  SELECT email, 'mastermind_registrations' FROM mastermind_registrations
  UNION ALL
  SELECT email, 'chat_leads' FROM chat_leads
  UNION ALL
  SELECT email, 'book_leads' FROM book_leads
  UNION ALL
  SELECT email, 'speaker_inquiries' FROM speaker_inquiries
  UNION ALL
  SELECT email, 'service_inquiries' FROM service_inquiries
) all_data
GROUP BY email
HAVING COUNT(DISTINCT table_source) > 1
ORDER BY table_count DESC
LIMIT 20;

-- ============================================
-- POST-MIGRATION: Validation Checks
-- ============================================

\echo '\n=========================================='
\echo 'POST-MIGRATION VALIDATION'
\echo '==========================================\n'

-- 1. Total contacts migrated
\echo '1. TOTAL CONTACTS MIGRATED:'
SELECT COUNT(*) as total_contacts FROM contacts;

-- 2. Contacts by source
\echo '\n2. CONTACTS BY SOURCE:'
SELECT
  source,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contacts), 2) as percentage
FROM contacts
GROUP BY source
ORDER BY count DESC;

-- 3. Lifecycle stage distribution
\echo '\n3. LIFECYCLE STAGE DISTRIBUTION:'
SELECT
  lifecycle_stage,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contacts), 2) as percentage
FROM contacts
GROUP BY lifecycle_stage
ORDER BY count DESC;

-- 4. Companies created
\echo '\n4. COMPANIES CREATED:'
SELECT COUNT(*) as total_companies FROM companies;

SELECT
  lifecycle_stage,
  COUNT(*) as count
FROM companies
GROUP BY lifecycle_stage
ORDER BY count DESC;

-- 5. Contacts linked to companies
\echo '\n5. CONTACTS LINKED TO COMPANIES:'
SELECT
  CASE WHEN company_id IS NOT NULL THEN 'Linked' ELSE 'Not Linked' END as status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contacts), 2) as percentage
FROM contacts
GROUP BY company_id IS NOT NULL
ORDER BY count DESC;

-- 6. Top companies by contact count
\echo '\n6. TOP 20 COMPANIES BY CONTACT COUNT:'
SELECT
  co.company_name,
  co.domain,
  co.total_contacts_count,
  co.lifecycle_stage
FROM companies co
ORDER BY co.total_contacts_count DESC
LIMIT 20;

-- 7. Interactions created
\echo '\n7. INTERACTIONS CREATED BY TYPE:'
SELECT
  interaction_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM interactions), 2) as percentage
FROM interactions
GROUP BY interaction_type
ORDER BY count DESC;

-- 8. Total interactions
\echo '\n8. TOTAL INTERACTIONS:'
SELECT COUNT(*) as total_interactions FROM interactions;

-- 9. Contacts with interactions
\echo '\n9. CONTACTS WITH INTERACTIONS:'
SELECT
  COUNT(DISTINCT contact_id) as contacts_with_interactions,
  (SELECT COUNT(*) FROM contacts) as total_contacts,
  ROUND(COUNT(DISTINCT contact_id) * 100.0 / (SELECT COUNT(*) FROM contacts), 2) as percentage
FROM interactions;

-- 10. Contacts without interactions (potential orphans)
\echo '\n10. CONTACTS WITHOUT INTERACTIONS (potential orphans):'
SELECT COUNT(*) as contacts_without_interactions
FROM contacts c
WHERE NOT EXISTS (
  SELECT 1 FROM interactions i WHERE i.contact_id = c.contact_id
);

-- List some examples
SELECT
  email,
  source,
  lifecycle_stage,
  created_at
FROM contacts c
WHERE NOT EXISTS (
  SELECT 1 FROM interactions i WHERE i.contact_id = c.contact_id
)
LIMIT 10;

-- 11. Referrals linked to contacts
\echo '\n11. REFERRALS LINKED TO NEW CONTACTS TABLE:'
SELECT
  COUNT(*) as total_referrals,
  COUNT(contact_id) as linked_to_contacts,
  ROUND(COUNT(contact_id) * 100.0 / COUNT(*), 2) as percentage_linked
FROM referrals;

-- 12. Data quality checks
\echo '\n12. DATA QUALITY CHECKS:'

-- Contacts without email (should be 0)
SELECT 'Contacts without email' as check_name, COUNT(*) as count
FROM contacts WHERE email IS NULL OR email = ''
UNION ALL
-- Contacts with invalid email format
SELECT 'Contacts with invalid email', COUNT(*)
FROM contacts WHERE email NOT LIKE '%@%.%'
UNION ALL
-- Contacts without names
SELECT 'Contacts without names', COUNT(*)
FROM contacts WHERE (first_name IS NULL OR first_name = '') AND (last_name IS NULL OR last_name = '')
UNION ALL
-- Interactions without contact
SELECT 'Interactions without contact', COUNT(*)
FROM interactions WHERE contact_id NOT IN (SELECT contact_id FROM contacts)
UNION ALL
-- Companies without contacts
SELECT 'Companies without contacts', COUNT(*)
FROM companies WHERE total_contacts_count = 0;

-- 13. Most active contacts (by interaction count)
\echo '\n13. TOP 20 MOST ACTIVE CONTACTS:'
SELECT
  c.email,
  c.first_name,
  c.last_name,
  c.lifecycle_stage,
  COUNT(i.interaction_id) as interaction_count,
  MAX(i.interaction_date) as last_interaction
FROM contacts c
JOIN interactions i ON c.contact_id = i.contact_id
GROUP BY c.contact_id, c.email, c.first_name, c.last_name, c.lifecycle_stage
ORDER BY interaction_count DESC
LIMIT 20;

-- 14. Migration completeness check
\echo '\n14. MIGRATION COMPLETENESS:'
WITH source_counts AS (
  SELECT
    (SELECT COUNT(*) FROM clients) +
    (SELECT COUNT(*) FROM mastermind_registrations) +
    (SELECT COUNT(*) FROM chat_leads) +
    (SELECT COUNT(*) FROM book_leads) +
    (SELECT COUNT(*) FROM speaker_inquiries) +
    (SELECT COUNT(*) FROM service_inquiries) as total_source_records
),
migrated_counts AS (
  SELECT COUNT(*) as total_contacts FROM contacts
)
SELECT
  s.total_source_records,
  m.total_contacts,
  s.total_source_records - m.total_contacts as deduplication_savings,
  ROUND((s.total_source_records - m.total_contacts) * 100.0 / s.total_source_records, 2) as dedup_percentage
FROM source_counts s, migrated_counts m;

-- 15. Email domain distribution
\echo '\n15. TOP 20 EMAIL DOMAINS:'
SELECT
  SUBSTRING(email FROM '@(.*)$') as domain,
  COUNT(*) as contact_count,
  COUNT(DISTINCT CASE WHEN company_id IS NOT NULL THEN company_id END) as linked_companies
FROM contacts
GROUP BY SUBSTRING(email FROM '@(.*)$')
ORDER BY contact_count DESC
LIMIT 20;

\echo '\n=========================================='
\echo 'VALIDATION COMPLETE'
\echo '==========================================\n'
