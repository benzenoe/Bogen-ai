# Kajabi → CRM Migration Plan

## Current State: Kajabi

### What's in Kajabi:
- **80 paid subscribers** across membership tiers
- **~20,000 leads** (email list + course registrations)
- **8-10 active 1-on-1 coaching clients**
- Subscription billing (recurring revenue)
- Email sequences and automations
- Course/mastermind session access control

### Kajabi Membership Tiers:
| Tier | Price | Type |
|------|-------|------|
| Basic Access | $20/month | Recurring subscription |
| REIGNmaker | $70/month | Recurring subscription |
| REIGNmaker Yearly | $70/month (annual) | Recurring subscription |
| 1-on-1 Coaching | $900/month | Recurring subscription |
| Bogen.ai Services | $197-$2,497/month | Recurring subscription |

---

## Enhanced CRM Schema for Subscriptions

### **subscriptions** table (NEW):
```sql
CREATE TABLE subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    contact_id INTEGER NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,

    -- Subscription Details
    plan_name VARCHAR(255) NOT NULL,  -- 'Basic Access', 'REIGNmaker', '1-on-1 Coaching', etc.
    plan_type VARCHAR(100),  -- 'membership', 'coaching', 'bogen_ai_service'

    -- Pricing
    price_monthly DECIMAL(10,2),
    billing_frequency VARCHAR(50),  -- 'monthly', 'annual'
    currency VARCHAR(3) DEFAULT 'USD',

    -- Status
    status VARCHAR(50) DEFAULT 'active',  -- active, paused, cancelled, past_due, expired

    -- Dates
    start_date DATE NOT NULL,
    end_date DATE,  -- NULL for active subscriptions
    next_billing_date DATE,
    cancellation_date DATE,

    -- Payment Integration
    kajabi_subscription_id VARCHAR(255),  -- Link to Kajabi subscription
    stripe_subscription_id VARCHAR(255),  -- If migrating to Stripe

    -- Cancellation Tracking
    cancellation_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'cancelled', 'past_due', 'expired'))
);

CREATE INDEX idx_subscriptions_contact ON subscriptions(contact_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_name);
```

### **coaching_sessions** table (NEW):
```sql
CREATE TABLE coaching_sessions (
    session_id SERIAL PRIMARY KEY,
    contact_id INTEGER NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES subscriptions(subscription_id) ON DELETE SET NULL,

    -- Session Details
    session_type VARCHAR(100),  -- '1-on-1', 'group', 'mastermind'
    session_date TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 60,

    -- Session Info
    topic VARCHAR(500),
    notes TEXT,
    recording_url TEXT,

    -- Status
    status VARCHAR(50) DEFAULT 'scheduled',  -- scheduled, completed, cancelled, no_show

    -- Assignment
    coach VARCHAR(100),  -- 'Edmund', 'Eytan', etc.

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_status CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show'))
);

CREATE INDEX idx_coaching_contact ON coaching_sessions(contact_id);
CREATE INDEX idx_coaching_date ON coaching_sessions(session_date);
CREATE INDEX idx_coaching_status ON coaching_sessions(status);
```

### **mastermind_attendance** table (NEW):
```sql
CREATE TABLE mastermind_attendance (
    attendance_id SERIAL PRIMARY KEY,
    contact_id INTEGER NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,

    -- Session Info
    session_date TIMESTAMP NOT NULL,
    session_number INTEGER,  -- Edmund's Mastermind Session #123
    session_topic VARCHAR(500),

    -- Attendance
    attended BOOLEAN DEFAULT false,
    watched_recording BOOLEAN DEFAULT false,
    engagement_score INTEGER,  -- 1-10 rating

    -- Content
    recording_url TEXT,
    transcript_url TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(contact_id, session_date)
);

CREATE INDEX idx_attendance_contact ON mastermind_attendance(contact_id);
CREATE INDEX idx_attendance_date ON mastermind_attendance(session_date);
```

---

## Kajabi Data Migration Strategy

### Phase 1: Export from Kajabi

**Export these datasets:**
1. **All members** → contacts
   - Email, name, phone, join date, subscription tier
   - Custom fields, tags, notes

2. **Subscription data** → subscriptions
   - Plan name, price, billing frequency
   - Start date, status, next billing date

3. **Email list (leads)** → contacts
   - All email addresses from campaigns
   - Lead magnets, course registrations

4. **Purchase history** → opportunities
   - One-time purchases, course sales

5. **Coaching client info** → coaching_sessions
   - Session history, notes

### Phase 2: Import to New CRM

**Step 1: Import 20,000 leads**
```sql
-- Create contacts from Kajabi email list
INSERT INTO contacts (email, first_name, last_name, lifecycle_stage, source, created_at)
SELECT
    email,
    first_name,
    last_name,
    CASE
        WHEN is_subscriber THEN 'customer'
        WHEN engaged_score > 50 THEN 'qualified'
        ELSE 'lead'
    END as lifecycle_stage,
    'kajabi_import',
    signup_date
FROM kajabi_export_leads;
```

**Step 2: Import 80 paid subscribers**
```sql
-- Create contacts + subscriptions
INSERT INTO subscriptions (contact_id, plan_name, plan_type, price_monthly, billing_frequency, status, start_date, kajabi_subscription_id, next_billing_date)
SELECT
    c.contact_id,
    k.subscription_tier,
    'membership',
    k.monthly_price,
    k.billing_cycle,
    CASE
        WHEN k.status = 'active' THEN 'active'
        WHEN k.status = 'canceled' THEN 'cancelled'
        ELSE k.status
    END,
    k.start_date,
    k.kajabi_sub_id,
    k.next_billing_date
FROM kajabi_export_subscriptions k
JOIN contacts c ON c.email = k.email;
```

**Step 3: Import coaching clients**
```sql
-- Import 8-10 coaching clients
INSERT INTO coaching_sessions (contact_id, session_type, session_date, status, coach, topic, notes)
SELECT
    c.contact_id,
    '1-on-1',
    k.session_date,
    k.status,
    k.coach_name,
    k.topic,
    k.notes
FROM kajabi_export_coaching k
JOIN contacts c ON c.email = k.client_email;
```

### Phase 3: Data Validation

**Validation checklist:**
- ✅ All 80 subscribers imported with active subscriptions
- ✅ All 20,000 leads have unique email addresses
- ✅ Coaching clients have correct subscription tier ($900/month)
- ✅ No duplicate contacts
- ✅ Revenue numbers match (MRR calculation)

**MRR Validation Query:**
```sql
SELECT
    SUM(price_monthly) as total_mrr,
    plan_name,
    COUNT(*) as subscriber_count
FROM subscriptions
WHERE status = 'active'
GROUP BY plan_name;
```

---

## Opportunity Types for Edmund's Business

### Updated opportunity_type values:
```javascript
// B2C Memberships
'basic_access_membership'        // $20/month
'reignmaker_monthly'             // $70/month
'reignmaker_yearly'              // $840/year
'one_on_one_coaching'            // $900/month

// Bogen.ai Services
'bogen_ai_starter'               // $197/month
'bogen_ai_professional'          // $997/month
'bogen_ai_enterprise'            // $2,497/month

// One-Time Products
'chatgpt_prompts_pdf'            // $50
'listing_page_single'            // $249
'listing_page_5pack'             // $699
'speaker_booking'                // $999

// B2B Opportunities
'company_wide_mastermind'        // Brokerage-wide membership
'enterprise_coaching_package'    // Multiple team members
'bogen_ai_team_license'          // Company-wide AI services
```

---

## Dashboard Enhancements for Subscriptions

### Subscription Analytics View:
```
┌─────────────────────────────────────────────────────────────┐
│ Monthly Recurring Revenue (MRR)                   $18,240   │
├─────────────────────────────────────────────────────────────┤
│ Active Subscriptions by Tier:                               │
│ • Basic Access ($20): 15 subscribers = $300/month           │
│ • REIGNmaker ($70): 50 subscribers = $3,500/month           │
│ • 1-on-1 Coaching ($900): 8 subscribers = $7,200/month      │
│ • Bogen.ai Services: 7 subscribers = $7,240/month           │
├─────────────────────────────────────────────────────────────┤
│ Churn Rate: 5.2% (4 cancellations this month)              │
│ New Subscribers: 12 this month                             │
│ Net Growth: +8 subscribers (+$640 MRR)                      │
└─────────────────────────────────────────────────────────────┘
```

### Coaching Client Dashboard:
```
┌─────────────────────────────────────────────────────────────┐
│ Active Coaching Clients: 9                                  │
├─────────────────────────────────────────────────────────────┤
│ This Week's Sessions:                                        │
│ • Monday 2pm - John Smith (Topic: Facebook Ads)             │
│ • Wednesday 10am - Maria Garcia (Topic: Listing Strategy)   │
│ • Friday 3pm - Steve Johnson (Topic: AI Automation)         │
├─────────────────────────────────────────────────────────────┤
│ Session Stats This Month:                                    │
│ • Completed: 24 sessions                                     │
│ • No-shows: 2 sessions                                       │
│ • Rescheduled: 3 sessions                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints for Subscriptions

### Subscription Management:
```javascript
POST /api/crm/subscriptions
{
  contact_id: 123,
  plan_name: "REIGNmaker",
  price_monthly: 70,
  billing_frequency: "monthly",
  status: "active"
}

GET /api/crm/subscriptions?status=active
GET /api/crm/subscriptions?contact_id=123
PATCH /api/crm/subscriptions/:id/cancel
PATCH /api/crm/subscriptions/:id/pause
PATCH /api/crm/subscriptions/:id/reactivate

// Subscription Analytics
GET /api/crm/analytics/mrr
GET /api/crm/analytics/churn-rate
GET /api/crm/analytics/subscriber-growth
```

### Coaching Sessions:
```javascript
POST /api/crm/coaching-sessions
{
  contact_id: 123,
  session_type: "1-on-1",
  session_date: "2026-04-20T14:00:00Z",
  coach: "Edmund",
  topic: "Listing Page Optimization"
}

GET /api/crm/coaching-sessions?status=scheduled
GET /api/crm/coaching-sessions?contact_id=123
GET /api/crm/coaching-sessions/upcoming
PATCH /api/crm/coaching-sessions/:id/complete
PATCH /api/crm/coaching-sessions/:id/cancel
```

---

## Migration Timeline

**Week 1: Preparation**
- Export all data from Kajabi
- Set up new database tables
- Create import scripts

**Week 2: Data Import**
- Import 20,000 leads
- Import 80 subscribers
- Import coaching clients
- Validate data integrity

**Week 3: Testing**
- Test subscription workflows
- Test coaching session scheduling
- Verify MRR calculations
- Test cancellation/reactivation flows

**Week 4: Parallel Run**
- Run both Kajabi + new CRM side-by-side
- Sync new subscribers to both systems
- Compare reports and analytics

**Week 5: Full Migration**
- Make new CRM primary system
- Disable Kajabi billing (optionally keep for email/courses)
- Train team on new dashboard

---

## Key Benefits for Edmund's Business

✅ **Unified view of all 20,000+ contacts** - See entire journey from lead → subscriber → coaching client

✅ **Subscription health tracking** - Monitor MRR, churn, growth in real-time

✅ **Coaching session management** - Schedule, track, and analyze all 1-on-1 sessions

✅ **Mastermind attendance** - Track engagement across 6 monthly sessions

✅ **B2B upsell opportunities** - Automatically detect when multiple people from same company subscribe → pitch brokerage-wide package

✅ **Better retention** - Identify at-risk subscribers before they cancel

✅ **Revenue forecasting** - Predict MRR based on subscription trends
