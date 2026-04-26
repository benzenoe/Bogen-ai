# Bogen.AI - Data Migration Mapping
## From Fragmented Tables → Unified CRM

**Generated:** April 15, 2026
**Purpose:** Map existing fragmented data to new unified CRM structure

---

## 📊 CURRENT FRAGMENTED TABLES (6+ tables with contact data)

### 1. **clients** (schema.sql)
- Contains: name, email, phone, company, industry, services_interested, monthly_budget
- Status: lead, proposal_sent, active, churned
- Links: referred_by_partner_id

### 2. **mastermind_registrations** (schema.sql)
- Contains: first_name, last_name, email, phone, company, event_date
- Status: registered, attended, no_show, cancelled

### 3. **chat_leads** (migrations/003)
- Contains: name, email, phone, business_type, revenue_range, main_bottleneck
- Status: new, contacted, qualified, converted, not_qualified
- Qualification score tracked

### 4. **book_leads** (migrations/005)
- Contains: name, email, resource (book download type)
- UTM tracking: utm_source, utm_medium

### 5. **speaker_inquiries** (migrations/006)
- Contains: first_name, last_name, email, phone, message
- Status: new (default)

### 6. **service_inquiries** (migrations/008)
- Contains: name, email, phone, industry, challenge, team_size
- Status: new (default)

### 7. **referrals** (schema.sql)
- Links partners → clients
- Contains: client_name, client_email, services_subscribed, MRR

---

## 🎯 NEW UNIFIED CRM TABLES

### 1. **companies** (NEW)
Auto-created from email domains

### 2. **contacts** (NEW - REPLACES all above)
Single source of truth for all people

### 3. **interactions** (NEW)
Complete timeline of all touchpoints

### 4. **opportunities** (NEW)
Sales pipeline tracking

---

## 🔄 MIGRATION MAPPING

### **PHASE 1: Migrate to `contacts` table**

All 6 fragmented tables → **contacts**

#### **Source: clients**
```sql
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
  -- Split name field if exists, otherwise NULL
  SPLIT_PART(name, ' ', 1) as first_name,
  CASE
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1
    THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
    ELSE NULL
  END as last_name,
  phone,
  company,
  -- Map old status to new lifecycle_stage
  CASE status
    WHEN 'lead' THEN 'lead'
    WHEN 'proposal_sent' THEN 'qualified'
    WHEN 'active' THEN 'customer'
    WHEN 'churned' THEN 'churned'
    ELSE 'lead'
  END as lifecycle_stage,
  'client_table_migration' as source,
  -- Store additional data in JSONB
  jsonb_build_object(
    'industry', industry,
    'services_interested', services_interested,
    'monthly_budget', monthly_budget,
    'business_description', business_description,
    'referral_source', referral_source,
    'original_table', 'clients',
    'original_id', client_id
  ) as custom_fields,
  created_at as first_interaction_date,
  updated_at as last_interaction_date
FROM clients
ON CONFLICT (email) DO UPDATE SET
  -- On duplicate email, merge data if null
  phone = COALESCE(contacts.phone, EXCLUDED.phone),
  company_name_raw = COALESCE(contacts.company_name_raw, EXCLUDED.company_name_raw),
  custom_fields = contacts.custom_fields || EXCLUDED.custom_fields;
```

#### **Source: mastermind_registrations**
```sql
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
  'lead' as lifecycle_stage, -- All registrations start as leads
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
  custom_fields = contacts.custom_fields || EXCLUDED.custom_fields;
```

#### **Source: chat_leads**
```sql
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
  custom_fields = contacts.custom_fields || EXCLUDED.custom_fields;
```

#### **Source: book_leads**
```sql
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
  custom_fields = contacts.custom_fields || EXCLUDED.custom_fields;
```

#### **Source: speaker_inquiries**
```sql
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
  'qualified' as lifecycle_stage, -- Speaker inquiries are qualified leads
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
  custom_fields = contacts.custom_fields || EXCLUDED.custom_fields;
```

#### **Source: service_inquiries**
```sql
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
  'qualified' as lifecycle_stage, -- Service inquiries are qualified
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
  custom_fields = contacts.custom_fields || EXCLUDED.custom_fields;
```

---

### **PHASE 2: Create `companies` from email domains**

After contacts are migrated, extract unique email domains:

```sql
-- Extract and create companies from contact email domains
INSERT INTO companies (
  domain,
  company_name,
  lifecycle_stage,
  total_contacts_count,
  source
)
SELECT
  LOWER(SUBSTRING(email FROM '@(.*)$')) as domain,
  -- Use company_name_raw if available, otherwise generate from domain
  COALESCE(
    MODE() WITHIN GROUP (ORDER BY company_name_raw), -- Most common company name for this domain
    INITCAP(REPLACE(SUBSTRING(email FROM '@(.*)$'), '.com', ''))
  ) as company_name,
  'lead' as lifecycle_stage,
  COUNT(*) as total_contacts_count,
  'email_domain_extraction' as source
FROM contacts
WHERE email LIKE '%@%.%' -- Valid email format
  AND email NOT LIKE '%@gmail.%' -- Exclude personal emails
  AND email NOT LIKE '%@yahoo.%'
  AND email NOT LIKE '%@hotmail.%'
  AND email NOT LIKE '%@outlook.%'
  AND email NOT LIKE '%@aol.%'
GROUP BY LOWER(SUBSTRING(email FROM '@(.*)$'))
HAVING COUNT(*) >= 1 -- At least 1 contact
ON CONFLICT (domain) DO NOTHING;
```

---

### **PHASE 3: Link contacts to companies**

```sql
-- Link contacts to companies by email domain
UPDATE contacts SET company_id = companies.company_id
FROM companies
WHERE LOWER(SUBSTRING(contacts.email FROM '@(.*)$')) = companies.domain
  AND contacts.email NOT LIKE '%@gmail.%'
  AND contacts.email NOT LIKE '%@yahoo.%'
  AND contacts.email NOT LIKE '%@hotmail.%'
  AND contacts.email NOT LIKE '%@outlook.%'
  AND contacts.email NOT LIKE '%@aol.%';
```

---

### **PHASE 4: Migrate to `interactions` table**

Create interaction records for each historical touchpoint:

#### **From: mastermind_registrations**
```sql
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
    'Status: ', m.registration_status, '. ',
    CASE WHEN m.how_heard IS NOT NULL
      THEN CONCAT('How they heard: ', m.how_heard)
      ELSE ''
    END
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
```

#### **From: chat_leads**
```sql
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
    'Chatbot lead captured. ',
    'Business type: ', cl.business_type, '. ',
    'Revenue range: ', cl.revenue_range, '. ',
    'Main bottleneck: ', cl.main_bottleneck, '. ',
    CASE WHEN cl.notes IS NOT NULL
      THEN CONCAT('Notes: ', cl.notes)
      ELSE ''
    END
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
```

#### **From: book_leads**
```sql
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
  CONCAT('Downloaded resource: ', bl.resource) as body,
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
```

#### **From: speaker_inquiries**
```sql
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
  si.message as body,
  jsonb_build_object(
    'source_table', 'speaker_inquiries',
    'source_id', si.id
  ) as metadata
FROM speaker_inquiries si
JOIN contacts c ON c.email = si.email;
```

#### **From: service_inquiries**
```sql
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
    'Team size: ', si.team_size, '. ',
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
```

---

### **PHASE 5: Handle `partners` and `referrals`**

Partners table stays mostly the same, but update referrals to link to new contacts:

```sql
-- Update referrals to link to unified contacts table
ALTER TABLE referrals ADD COLUMN contact_id INTEGER REFERENCES contacts(contact_id);

UPDATE referrals r
SET contact_id = c.contact_id
FROM contacts c
WHERE r.client_email = c.email;

-- Optionally: drop old client_id column after verification
-- ALTER TABLE referrals DROP COLUMN client_id;
```

---

## 📋 DEDUPLICATION STRATEGY

### Email is the Primary Key

**Rule:** One email = one contact record

**Conflict Resolution Priority:**
1. Keep most recent `lifecycle_stage` (customer > qualified > lead)
2. Merge `custom_fields` JSONB (union all data)
3. Keep earliest `first_interaction_date`
4. Keep latest `last_interaction_date`
5. Prefer non-null phone numbers
6. Prefer non-null company names

### Example Deduplication:
```sql
-- If john@kw.com appears in 3 tables:
-- clients (status=active, company=KW)
-- mastermind_registrations (phone=555-1234)
-- chat_leads (business_type=real_estate)

-- Result: ONE contact record with:
-- email: john@kw.com
-- lifecycle_stage: customer (from clients.status=active)
-- phone: 555-1234 (from mastermind_registrations)
-- company: KW (from clients)
-- custom_fields: {
--   "business_type": "real_estate",
--   "original_tables": ["clients", "mastermind_registrations", "chat_leads"]
-- }
```

---

## 🔢 ESTIMATED DATA VOLUMES

Based on Notion document:

| Table | Est. Records | Notes |
|-------|-------------|-------|
| **clients** | 500-1000 | Active client database |
| **mastermind_registrations** | 200-500 | Event attendees |
| **chat_leads** | 1000-2000 | Chatbot conversations |
| **book_leads** | 5000-10000 | Book downloads |
| **speaker_inquiries** | 50-100 | Speaking requests |
| **service_inquiries** | 100-300 | Quiz submissions |
| **TOTAL BEFORE DEDUP** | ~7,000-14,000 | |
| **TOTAL AFTER DEDUP** | ~5,000-10,000 | 30-40% duplication expected |

---

## ⚠️ MIGRATION RISKS & VALIDATION

### Pre-Migration Validation:
```sql
-- 1. Count total records before migration
SELECT 'clients' as table_name, COUNT(*) as count FROM clients
UNION ALL
SELECT 'mastermind_registrations', COUNT(*) FROM mastermind_registrations
UNION ALL
SELECT 'chat_leads', COUNT(*) FROM chat_leads
UNION ALL
SELECT 'book_leads', COUNT(*) FROM book_leads
UNION ALL
SELECT 'speaker_inquiries', COUNT(*) FROM speaker_inquiries
UNION ALL
SELECT 'service_inquiries', COUNT(*) FROM service_inquiries;

-- 2. Identify duplicate emails across tables
SELECT email, COUNT(*) as table_count
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
) all_emails
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY table_count DESC;
```

### Post-Migration Validation:
```sql
-- 1. Verify all emails migrated
SELECT COUNT(*) as total_contacts FROM contacts;

-- 2. Check for missing data
SELECT
  source,
  COUNT(*) as count
FROM contacts
GROUP BY source
ORDER BY count DESC;

-- 3. Verify company linkage
SELECT
  COUNT(*) as contacts_with_company
FROM contacts
WHERE company_id IS NOT NULL;

-- 4. Verify interactions created
SELECT
  interaction_type,
  COUNT(*) as count
FROM interactions
GROUP BY interaction_type
ORDER BY count DESC;
```

---

## 🚦 MIGRATION EXECUTION ORDER

1. ✅ **Phase 0:** Create new tables (companies, contacts, interactions, opportunities)
2. ✅ **Phase 1:** Migrate all 6 tables → contacts (with deduplication)
3. ✅ **Phase 2:** Extract companies from email domains
4. ✅ **Phase 3:** Link contacts → companies
5. ✅ **Phase 4:** Create interaction records from historical data
6. ✅ **Phase 5:** Update referrals table linkages
7. ✅ **Phase 6:** Validation & verification
8. ⚠️ **Phase 7:** Archive old tables (DO NOT DROP - keep for 90 days)

---

## 📝 POST-MIGRATION CLEANUP

### Archive Strategy (DO NOT DELETE)
```sql
-- Rename old tables with _archived suffix
ALTER TABLE clients RENAME TO clients_archived_20260415;
ALTER TABLE mastermind_registrations RENAME TO mastermind_registrations_archived_20260415;
ALTER TABLE chat_leads RENAME TO chat_leads_archived_20260415;
ALTER TABLE book_leads RENAME TO book_leads_archived_20260415;
ALTER TABLE speaker_inquiries RENAME TO speaker_inquiries_archived_20260415;
ALTER TABLE service_inquiries RENAME TO service_inquiries_archived_20260415;

-- Keep for 90 days, then drop after verification
```

---

## 🎯 NEXT STEPS

1. Review this mapping document
2. Create backup of production database
3. Run migration on staging/dev environment first
4. Validate data integrity
5. Execute on production
6. Monitor for 30 days
7. Archive old tables after 90 days
