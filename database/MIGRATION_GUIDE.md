# Bogen.AI CRM Migration Guide

**Created:** April 15, 2026
**Purpose:** Step-by-step guide to migrate from fragmented tables to unified CRM

---

## 📁 Files Created

1. **MIGRATION_MAPPING.md** - Complete data mapping documentation
2. **migrations/010_unified_crm_migration.sql** - Executable migration script
3. **validate-migration.sql** - Pre/post validation queries
4. **MIGRATION_GUIDE.md** - This file

---

## 🎯 Migration Overview

### What This Migration Does:

**BEFORE:** 6+ fragmented tables with duplicate contact data
- `clients`
- `mastermind_registrations`
- `chat_leads`
- `book_leads`
- `speaker_inquiries`
- `service_inquiries`

**AFTER:** 4 unified CRM tables
- `companies` - Auto-created from email domains
- `contacts` - Single source of truth (email = unique)
- `interactions` - Complete timeline of all touchpoints
- `opportunities` - Sales pipeline (ready for Phase 2)

---

## ⚠️ IMPORTANT: Pre-Migration Checklist

- [ ] **Backup production database** (CRITICAL!)
- [ ] Test on dev/staging environment first
- [ ] Review `MIGRATION_MAPPING.md` for data transformations
- [ ] Notify team of planned maintenance window
- [ ] Ensure no active writes to source tables during migration

---

## 🚀 Migration Steps

### Step 1: Backup Database

```bash
# Local backup
pg_dump -h localhost -U your_user -d bogen_ai > backup_pre_migration_$(date +%Y%m%d).sql

# Or use Supabase CLI
supabase db dump -f backup_pre_migration_$(date +%Y%m%d).sql
```

### Step 2: Run Pre-Migration Validation

```bash
# Connect to your database
psql -h your_host -U your_user -d bogen_ai -f database/validate-migration.sql > pre_migration_report.txt

# Review the output
cat pre_migration_report.txt
```

**Expected Output:**
- Total records in each source table
- Unique email count
- Duplicate emails across tables
- Baseline metrics for comparison

### Step 3: Run Migration (DEV/STAGING FIRST!)

```bash
# Run on staging first
psql -h staging_host -U your_user -d bogen_ai_staging -f database/migrations/010_unified_crm_migration.sql
```

**Migration Phases:**
1. ✅ Creates 4 new tables (companies, contacts, interactions, opportunities)
2. ✅ Migrates 6 fragmented tables → contacts (with deduplication)
3. ✅ Extracts companies from email domains
4. ✅ Links contacts → companies
5. ✅ Creates interaction records from historical data
6. ✅ Updates referrals table linkages

**Estimated Time:**
- Small database (< 1,000 contacts): ~30 seconds
- Medium database (1,000-10,000 contacts): ~2-5 minutes
- Large database (10,000+ contacts): ~5-15 minutes

### Step 4: Post-Migration Validation

```bash
# Run validation queries
psql -h your_host -U your_user -d bogen_ai -f database/validate-migration.sql > post_migration_report.txt

# Compare with pre-migration
diff pre_migration_report.txt post_migration_report.txt
```

**What to Check:**
- [ ] Total contacts = unique emails from source tables ✅
- [ ] All sources represented in contacts.source ✅
- [ ] Companies created from corporate domains ✅
- [ ] Interactions created for each historical event ✅
- [ ] No orphaned records ✅
- [ ] Referrals linked to new contacts table ✅

### Step 5: Verify Sample Data

```sql
-- Pick a known email and verify all data migrated
SELECT * FROM contacts WHERE email = 'john@example.com';

-- Check their interactions
SELECT * FROM interactions WHERE contact_id = (
  SELECT contact_id FROM contacts WHERE email = 'john@example.com'
) ORDER BY interaction_date DESC;

-- Check if linked to company
SELECT c.*, co.company_name, co.domain
FROM contacts c
LEFT JOIN companies co ON c.company_id = co.company_id
WHERE c.email = 'john@example.com';
```

### Step 6: Run on Production

**Only after successful staging migration!**

```bash
# Schedule maintenance window
# Run migration
psql -h production_host -U your_user -d bogen_ai -f database/migrations/010_unified_crm_migration.sql

# Immediately validate
psql -h production_host -U your_user -d bogen_ai -f database/validate-migration.sql
```

---

## 📊 Expected Results

### Deduplication Savings

Based on typical patterns:

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| **Total Records** | ~7,000-14,000 | ~5,000-10,000 | 30-40% |
| **Duplicate Emails** | 2,000-4,000 | 0 | 100% |
| **Data Tables** | 6 fragmented | 4 unified | -33% |

### Data Distribution

**Contacts by Source:**
- `client_table_migration`: 500-1000
- `mastermind_registration`: 200-500
- `chatbot`: 1000-2000
- `book_download_*`: 5000-10000
- `speaker_inquiry`: 50-100
- `service_inquiry`: 100-300

**Companies Created:**
- Expected: 50-200 companies
- Threshold: 1+ contacts per domain (excluding Gmail, Yahoo, etc.)

**Interactions Created:**
- Expected: 7,000-14,000 interactions
- One interaction per source record

---

## 🔍 Common Issues & Solutions

### Issue 1: Migration Fails with "email already exists"

**Cause:** Duplicate emails in source tables
**Solution:** Migration script includes `ON CONFLICT` handling - this should not happen

### Issue 2: Contacts without companies

**Expected:** Personal email addresses (Gmail, Yahoo, etc.) won't create companies
**Action:** This is normal - only business domains create companies

### Issue 3: Interaction count lower than expected

**Cause:** Email mismatches between source tables
**Check:** Run this query:

```sql
SELECT
  'mastermind_registrations' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN email IN (SELECT email FROM contacts) THEN 1 END) as matched,
  COUNT(*) - COUNT(CASE WHEN email IN (SELECT email FROM contacts) THEN 1 END) as orphaned
FROM mastermind_registrations;
```

### Issue 4: Data loss or corruption

**Emergency Rollback:**

```bash
# Restore from backup
pg_restore -h your_host -U your_user -d bogen_ai backup_pre_migration_YYYYMMDD.sql

# Or use SQL dump
psql -h your_host -U your_user -d bogen_ai < backup_pre_migration_YYYYMMDD.sql
```

---

## 🗄️ Post-Migration Cleanup

### Archive Old Tables (After 90-Day Verification Period)

```sql
-- DO NOT run this immediately! Wait 90 days after successful migration

-- Rename old tables with timestamp
ALTER TABLE clients RENAME TO clients_archived_20260415;
ALTER TABLE mastermind_registrations RENAME TO mastermind_registrations_archived_20260415;
ALTER TABLE chat_leads RENAME TO chat_leads_archived_20260415;
ALTER TABLE book_leads RENAME TO book_leads_archived_20260415;
ALTER TABLE speaker_inquiries RENAME TO speaker_inquiries_archived_20260415;
ALTER TABLE service_inquiries RENAME TO service_inquiries_archived_20260415;

-- After 90 days, drop if everything is verified
-- DROP TABLE clients_archived_20260415;
-- DROP TABLE mastermind_registrations_archived_20260415;
-- ... etc
```

---

## 📈 Next Steps After Migration

### Phase 2: Enhance CRM

1. **Create product catalog tables**
   - See Notion doc: "Product & Services Catalog"
   - Build `products`, `subscriptions`, `coaching_sessions` tables

2. **Implement B2B auto-detection**
   - Trigger when company has 3+ buyers OR $1,500+ revenue
   - Auto-create B2B opportunities

3. **Build API endpoints**
   - REST API for CRUD operations
   - Search/filter endpoints
   - Webhook integrations

4. **Create admin dashboard**
   - Contact management UI
   - Company pages
   - Pipeline kanban board
   - Reports & analytics

5. **Kajabi migration**
   - Import 20,000+ leads
   - Import 80 subscribers
   - Import coaching clients
   - Import billing history

---

## 🆘 Support & Troubleshooting

### Logs

Monitor migration progress:

```sql
-- Count records during migration
SELECT 'contacts' as table, COUNT(*) FROM contacts
UNION ALL
SELECT 'companies', COUNT(*) FROM companies
UNION ALL
SELECT 'interactions', COUNT(*) FROM interactions;
```

### Rollback Plan

If anything goes wrong:

1. **Stop immediately**
2. **Restore from backup**
3. **Document the error**
4. **Review MIGRATION_MAPPING.md**
5. **Fix issue in staging first**
6. **Re-test before production retry**

---

## ✅ Success Criteria

Migration is successful when:

- [ ] All contacts migrated (0 data loss)
- [ ] Email deduplication working (1 email = 1 contact)
- [ ] Companies auto-created from domains
- [ ] All historical interactions preserved
- [ ] Referrals linked to new contacts table
- [ ] Validation queries pass
- [ ] Sample data verification confirms accuracy
- [ ] No orphaned records

---

## 📞 Migration Complete Checklist

- [ ] Backup created and verified
- [ ] Pre-migration validation run
- [ ] Migration executed successfully
- [ ] Post-migration validation passed
- [ ] Sample data verified
- [ ] Team notified of completion
- [ ] Old tables archived (not dropped)
- [ ] Documentation updated
- [ ] Application code updated to use new tables
- [ ] 90-day monitoring period scheduled

---

**Ready to migrate?** Start with Step 1 and follow the guide carefully!
