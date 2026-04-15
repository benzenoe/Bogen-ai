# Bogen.ai CRM Consolidation Plan

## Current State Analysis

### Fragmented Tables (The Problem):
1. **clients** - Contact form submissions
   - Fields: name, email, phone, company, industry, services_interested, monthly_budget, business_description
   - Status tracking
   - Partner referral tracking

2. **service_inquiries** - AI solution quiz
   - Fields: industry, challenge, team_size, name, email, phone

3. **speaker_inquiries** - Speaker booking
   - Fields: (need to check schema)

4. **book_leads** - Book downloads
   - Fields: (need to check schema)

5. **chat_leads** - Chatbot captures
   - Fields: (need to check schema)

6. **MISSING: listing_page_orders** - Not even saved to database!

### Issues with Current System:
- ❌ No unified view of a contact across different touchpoints
- ❌ Duplicate contacts if same person submits multiple forms
- ❌ Can't track customer journey across channels
- ❌ Impossible to see all interactions with one person
- ❌ No proper sales pipeline management
- ❌ Reporting nightmare - need to query 6+ tables

---

## Proposed Unified CRM Schema

### Core Tables:

#### 1. **contacts** (Single source of truth)
```sql
CREATE TABLE contacts (
    contact_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    company VARCHAR(255),
    industry VARCHAR(100),
    
    -- Tracking
    source VARCHAR(100),  -- first_touch: contact_form, listing_page, speaker_inquiry, etc.
    lifecycle_stage VARCHAR(50) DEFAULT 'lead',  -- lead, mql, sql, opportunity, customer, churned
    
    -- Partner/Referral
    referred_by_partner_id INTEGER REFERENCES partners(partner_id),
    referral_source VARCHAR(255),  -- UTM tracking
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_contacted_at TIMESTAMP,
    
    -- Metadata
    tags TEXT[],  -- Flexible tagging
    notes TEXT,
    
    CONSTRAINT unique_email UNIQUE(email)
);
```

#### 2. **interactions** (All touchpoints)
```sql
CREATE TABLE interactions (
    interaction_id SERIAL PRIMARY KEY,
    contact_id INTEGER NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,
    
    -- Type & Channel
    type VARCHAR(100) NOT NULL,  -- form_submission, email_sent, email_received, meeting, call, chat
    channel VARCHAR(100),  -- website, chatbot, email, phone, in_person
    source VARCHAR(100),  -- Specific form: contact_form, listing_page_order, speaker_inquiry, etc.
    
    -- Content
    subject VARCHAR(500),
    content JSONB,  -- Flexible storage for any form data/conversation
    
    -- Direction & Status
    direction VARCHAR(20),  -- inbound, outbound
    status VARCHAR(50),  -- new, read, replied, archived
    
    -- Assignment
    assigned_to VARCHAR(100),  -- Team member handling this
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexing
    CREATE INDEX idx_interactions_contact ON interactions(contact_id),
    CREATE INDEX idx_interactions_type ON interactions(type),
    CREATE INDEX idx_interactions_created ON interactions(created_at)
);
```

**Example interaction content (listing page order):**
```json
{
  "package": "Single Page — $249",
  "brokerage": "Fuck-U-Money Realty",
  "website": "https://Fuck-U-Money.re",
  "details": "Bla bla bala.. bla!"
}
```

#### 3. **opportunities** (Sales pipeline)
```sql
CREATE TABLE opportunities (
    opportunity_id SERIAL PRIMARY KEY,
    contact_id INTEGER NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,
    
    -- Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    opportunity_type VARCHAR(100),  -- listing_page, speaker_booking, consulting_project, etc.
    
    -- Financial
    value DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Pipeline
    stage VARCHAR(50) DEFAULT 'lead',  -- lead, qualified, proposal, negotiation, closed_won, closed_lost
    probability INTEGER,  -- 0-100%
    
    -- Dates
    expected_close_date DATE,
    actual_close_date DATE,
    
    -- Assignment
    owner VARCHAR(100),
    
    -- Metadata
    source_interaction_id INTEGER REFERENCES interactions(interaction_id),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CREATE INDEX idx_opportunities_contact ON opportunities(contact_id),
    CREATE INDEX idx_opportunities_stage ON opportunities(stage)
);
```

#### 4. **opportunity_history** (Stage changes)
```sql
CREATE TABLE opportunity_history (
    history_id SERIAL PRIMARY KEY,
    opportunity_id INTEGER NOT NULL REFERENCES opportunities(opportunity_id) ON DELETE CASCADE,
    old_stage VARCHAR(50),
    new_stage VARCHAR(50),
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);
```

---

## Data Migration Strategy

### Phase 1: Create New Tables
- Create contacts, interactions, opportunities tables
- Keep old tables intact during migration

### Phase 2: Migrate Data

**From `clients` table:**
```sql
-- Create contact
INSERT INTO contacts (email, first_name, last_name, phone, company, industry, source, lifecycle_stage, created_at)
SELECT 
    email,
    split_part(name, ' ', 1) as first_name,
    split_part(name, ' ', 2) as last_name,
    phone,
    company,
    industry,
    'contact_form' as source,
    status as lifecycle_stage,
    created_at
FROM clients;

-- Create interaction
INSERT INTO interactions (contact_id, type, channel, source, content, direction, status, created_at)
SELECT 
    c.contact_id,
    'form_submission' as type,
    'website' as channel,
    'contact_form' as source,
    jsonb_build_object(
        'services_interested', old.services_interested,
        'monthly_budget', old.monthly_budget,
        'business_description', old.business_description
    ) as content,
    'inbound' as direction,
    'new' as status,
    old.created_at
FROM clients old
JOIN contacts c ON c.email = old.email;
```

**From `service_inquiries`, `speaker_inquiries`, `book_leads`, etc.:**
- Similar pattern: contact + interaction
- Handle duplicates by email (update existing contact, add new interaction)

**From `listing_page_orders` (currently email-only):**
- FIRST: Save current submissions to temporary tracking
- THEN: Update endpoint to save to new CRM

### Phase 3: Update Code
- Update all form endpoints to use new CRM tables
- Update admin dashboard to query new structure
- Keep old tables as read-only backup for 30 days

### Phase 4: Cleanup
- After verification, drop old fragmented tables
- Update all documentation

---

## API Design

### Unified Endpoints:

**POST /api/crm/contact** (replaces all form endpoints)
```json
{
  "email": "required",
  "first_name": "optional",
  "last_name": "optional", 
  "phone": "optional",
  "company": "optional",
  "interaction": {
    "type": "form_submission",
    "source": "listing_page_order",
    "content": { /* flexible form data */ }
  }
}
```

**GET /api/crm/contacts** (unified contact list)
- Filter by lifecycle_stage, source, tags
- Search by name, email, company
- Sort by created_at, last_contacted_at

**GET /api/crm/contacts/:id** (complete contact view)
- Contact details
- All interactions (timeline)
- All opportunities
- Activity history

**POST /api/crm/opportunities** (create opportunity)
**PATCH /api/crm/opportunities/:id/stage** (move through pipeline)

---

## Admin Dashboard Design

### Unified Contact View:
1. **Contacts List**
   - Filter by lifecycle stage
   - Search across all fields
   - View source/channel breakdown
   - Tag management

2. **Contact Detail Page**
   - Contact info card
   - Interaction timeline (all touchpoints)
   - Opportunities list
   - Quick actions (send email, add note, create opportunity)

3. **Pipeline View**
   - Kanban board by opportunity stage
   - Drag & drop to change stages
   - Value totals per stage
   - Win rate metrics

4. **Reports**
   - Lead source analysis
   - Conversion funnel
   - Pipeline forecast
   - Lifecycle stage distribution

---

## Benefits of Unified CRM:

✅ Single view of every contact
✅ Track complete customer journey
✅ No duplicate data
✅ Proper sales pipeline
✅ Better reporting & analytics
✅ Scalable for future growth
✅ Standard CRM best practices

---

## Implementation Timeline Estimate:

- Database schema design: 2-4 hours
- Migration scripts: 4-6 hours
- API endpoint updates: 4-6 hours
- Admin dashboard: 8-12 hours
- Testing & validation: 4-6 hours

**Total: ~25-35 hours of development**

---

## Questions to Answer:

1. Do you want to preserve ALL historical data from fragmented tables?
2. Should we create opportunities automatically for certain interaction types?
3. What lifecycle stages make sense for your business? (lead, MQL, SQL, customer, etc.)
4. Who should have access to CRM admin? (just you, or team members too?)
5. Do you want email integration (send emails from CRM)?
6. Should we integrate with any external CRM later? (HubSpot, Salesforce, etc.)

