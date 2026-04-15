# Bogen.ai CRM - Hybrid B2C + B2B Model

## The Real Estate Brokerage Use Case

### Current Reality:
```
Fuck-U-Money Realty (Brokerage)
├── Steve Beach (Agent) - Buys 1 listing page ($249) ← B2C sale
├── Maria Johnson (Agent) - Buys 5 listing pages ($699) ← B2C sale
├── John Doe (Agent) - Buys speaker session ($999) ← B2C sale
└── ... 47 more agents

Total Individual Sales: $1,947
OPPORTUNITY: Sell to entire brokerage (50 agents × $249 = $12,450) ← B2B sale
```

### Upsell Strategy:
1. Start with individual realtors (B2C)
2. Track which brokerage they work for
3. When you have 3-5 agents from same brokerage → pitch company-wide deal
4. Convert to B2B customer

---

## Enhanced Schema for Hybrid Model

### **companies** table:
```sql
CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    website VARCHAR(500),
    
    -- Business Type
    company_type VARCHAR(50) DEFAULT 'business',  -- 'brokerage', 'business', 'agency', etc.
    industry VARCHAR(100),  -- 'real_estate', 'consulting', 'technology', etc.
    company_size VARCHAR(50),  -- '1-10', '11-50', '51-200', '201-500', '501+'
    employee_count INTEGER,  -- Actual number for precise calculations
    
    -- Location
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    
    -- Status
    lifecycle_stage VARCHAR(50) DEFAULT 'lead',
    -- Stages: lead, b2c_customers (has individual buyers), b2b_prospect, b2b_customer, churned
    
    -- B2B Specific
    decision_maker_contact_id INTEGER REFERENCES contacts(contact_id),  -- Who signs company deals
    
    -- Metadata
    tags TEXT[],
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_domain UNIQUE(domain)
);

CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_type ON companies(company_type);
CREATE INDEX idx_companies_lifecycle ON companies(lifecycle_stage);
```

### **contacts** table (Hybrid):
```sql
CREATE TABLE contacts (
    contact_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    
    -- Company Relationship (OPTIONAL)
    company_id INTEGER REFERENCES companies(company_id) ON DELETE SET NULL,
    job_title VARCHAR(255),
    department VARCHAR(100),
    
    -- Individual vs Company Buyer
    contact_type VARCHAR(50) DEFAULT 'individual',  
    -- Types: 'individual' (B2C), 'company_employee', 'decision_maker'
    
    is_decision_maker BOOLEAN DEFAULT false,  -- Can sign company-wide deals?
    
    industry VARCHAR(100),
    
    -- Lifecycle (INDIVIDUAL lifecycle, separate from company)
    lifecycle_stage VARCHAR(50) DEFAULT 'lead',
    -- Stages: lead, qualified, customer, advocate, churned
    
    -- Source tracking
    source VARCHAR(100),
    referred_by_partner_id INTEGER REFERENCES partners(partner_id),
    referral_source VARCHAR(255),
    
    -- Metadata
    tags TEXT[],
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_contacted_at TIMESTAMP,
    
    CONSTRAINT unique_email UNIQUE(email),
    CONSTRAINT valid_lifecycle CHECK (lifecycle_stage IN ('lead', 'qualified', 'customer', 'advocate', 'churned'))
);

CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_type ON contacts(contact_type);
CREATE INDEX idx_contacts_decision_maker ON contacts(is_decision_maker);
```

### **opportunities** table (B2C + B2B):
```sql
CREATE TABLE opportunities (
    opportunity_id SERIAL PRIMARY KEY,
    contact_id INTEGER NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES companies(company_id) ON DELETE SET NULL,
    
    -- Deal Classification
    deal_type VARCHAR(50) NOT NULL,  -- 'b2c', 'b2b'
    opportunity_type VARCHAR(100) NOT NULL,  -- 'listing_page', 'speaker_booking', etc.
    
    -- Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Financial
    value DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- B2B Specific Fields
    seats INTEGER,  -- For B2B: number of users/agents
    per_seat_value DECIMAL(12,2),  -- Price per seat
    is_recurring BOOLEAN DEFAULT false,  -- Subscription vs one-time
    billing_frequency VARCHAR(50),  -- 'monthly', 'annual', 'one_time'
    
    -- Pipeline
    stage VARCHAR(50) DEFAULT 'new',
    probability INTEGER DEFAULT 50,
    
    -- Dates
    expected_close_date DATE,
    actual_close_date DATE,
    
    -- Assignment
    owner VARCHAR(100),
    
    -- Source
    source_interaction_id INTEGER REFERENCES interactions(interaction_id),
    
    -- Upsell Tracking
    upsell_from_opportunity_id INTEGER REFERENCES opportunities(opportunity_id),  -- Track B2C → B2B conversions
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_stage CHECK (stage IN ('new', 'qualified', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost')),
    CONSTRAINT valid_deal_type CHECK (deal_type IN ('b2c', 'b2b'))
);

CREATE INDEX idx_opportunities_contact ON opportunities(contact_id);
CREATE INDEX idx_opportunities_company ON opportunities(company_id);
CREATE INDEX idx_opportunities_deal_type ON opportunities(deal_type);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
```

---

## Smart B2C → B2B Upsell Detection

### Automatic Company Opportunity Detection:

```javascript
// Trigger: After any B2C sale closes
async function checkForB2BOpportunity(closedB2COpportunity) {
  const contact = await getContact(closedB2COpportunity.contact_id);
  
  if (!contact.company_id) return; // No company to upsell to
  
  const company = await getCompany(contact.company_id);
  
  // Count individual buyers from this company
  const stats = await db.query(`
    SELECT 
      COUNT(DISTINCT c.contact_id) as buyer_count,
      SUM(o.value) as total_b2c_revenue,
      COUNT(DISTINCT o.opportunity_type) as product_variety
    FROM contacts c
    JOIN opportunities o ON o.contact_id = c.contact_id
    WHERE c.company_id = $1
      AND o.deal_type = 'b2c'
      AND o.stage = 'closed_won'
  `, [company.company_id]);
  
  // Upsell Trigger Conditions:
  const shouldCreateB2BOpportunity = 
    stats.buyer_count >= 3 ||  // 3+ individuals bought
    stats.total_b2c_revenue >= 1500 ||  // $1,500+ in individual sales
    stats.product_variety >= 2;  // Bought different products
  
  if (shouldCreateB2BOpportunity) {
    // Create B2B opportunity
    await createOpportunity({
      contact_id: company.decision_maker_contact_id || contact.contact_id,
      company_id: company.company_id,
      deal_type: 'b2b',
      opportunity_type: 'company_wide_' + closedB2COpportunity.opportunity_type,
      title: `${company.name} - Company-Wide ${closedB2COpportunity.opportunity_type}`,
      value: calculateB2BValue(company, closedB2COpportunity),
      seats: company.employee_count || 50,
      per_seat_value: closedB2COpportunity.value,
      stage: 'qualified',
      probability: 60,  // Higher than cold lead
      notes: `Auto-generated: ${stats.buyer_count} agents already purchased individually. Total B2C revenue: $${stats.total_b2c_revenue}`
    });
    
    // Alert admin
    await sendAlert('b2b_opportunity_detected', {
      company: company.name,
      buyer_count: stats.buyer_count,
      revenue: stats.total_b2c_revenue
    });
  }
}

function calculateB2BValue(company, b2cOpportunity) {
  const estimatedSeats = company.employee_count || 50;
  const perSeatPrice = b2cOpportunity.value;
  
  // B2B discount: 20% off for company-wide
  const discountMultiplier = 0.8;
  
  return estimatedSeats * perSeatPrice * discountMultiplier;
}
```

---

## Real Estate Brokerage Example

### Scenario: Fuck-U-Money Realty

**Step 1: First B2C Sale (Steve Beach)**
```javascript
// Steve submits listing page form
Contact: Steve Beach (steve@fuck-u-money.re)
Company: Fuck-U-Money Realty (auto-created)
Opportunity: B2C - Listing Page ($249)
Status: Closed Won

Company Status: lead (1 buyer)
```

**Step 2: Second B2C Sale (Maria Johnson)**
```javascript
Contact: Maria Johnson (maria@fuck-u-money.re)
Company: Fuck-U-Money Realty (auto-matched by domain)
Opportunity: B2C - Listing Pages Starter Pack ($699)
Status: Closed Won

Company Status: b2c_customers (2 buyers, $948 revenue)
```

**Step 3: Third B2C Sale (John Doe)**
```javascript
Contact: John Doe (john@fuck-u-money.re)
Company: Fuck-U-Money Realty
Opportunity: B2C - Speaker Booking ($999)
Status: Closed Won

Company Status: b2b_prospect (3 buyers, $1,947 revenue)

🚨 TRIGGER: Auto-create B2B opportunity!
```

**Step 4: Auto-Generated B2B Opportunity**
```javascript
Opportunity: {
  title: "Fuck-U-Money Realty - Company-Wide Listing Pages",
  deal_type: "b2b",
  contact_id: steve.contact_id (or broker_owner if identified),
  company_id: fuck_u_money.company_id,
  value: $9,960,  // 50 agents × $249 × 0.8 discount
  seats: 50,
  per_seat_value: $249,
  stage: "qualified",
  probability: 60%,
  notes: "3 agents already purchased. Total B2C: $1,947. 
         Reach out to broker/owner about company-wide package."
}

Alert sent to: sales@reignation.com
Subject: "B2B Opportunity Detected: Fuck-U-Money Realty"
```

---

## Dashboard Views for Hybrid Model

### Company Detail - Brokerage View:
```
┌─────────────────────────────────────────────────────────┐
│ Fuck-U-Money Realty                     [Email Broker]  │
├─────────────────────────────────────────────────────────┤
│ 🏢 Real Estate Brokerage • ~50 agents                   │
│ 🏷️  B2B Prospect (3 individual buyers)                  │
│ 💰 B2C Revenue: $1,947  |  B2B Potential: $9,960        │
├─────────────────────────────────────────────────────────┤
│ INDIVIDUAL BUYERS (3) - B2C Customers                    │
│ • Steve Beach - Agent ($249) ✓                          │
│ • Maria Johnson - Agent ($699) ✓                        │
│ • John Doe - Agent ($999) ✓                             │
├─────────────────────────────────────────────────────────┤
│ B2B OPPORTUNITIES (1)                                    │
│ • Company-Wide Listing Pages ($9,960) - Qualified       │
│   [Send Proposal] [Schedule Demo]                       │
├─────────────────────────────────────────────────────────┤
│ UPSELL STRATEGY                                          │
│ ⚡ 3/50 agents purchased (6% penetration)                │
│ 💡 Next: Reach out to broker/owner                      │
│ 📧 Decision maker: TBD (identify owner)                 │
└─────────────────────────────────────────────────────────┘
```

### Pipeline - Hybrid View:
```
┌───────────────────────────────────────────────────────────┐
│ Filter: [All Deal Types ▼] [B2C | B2B | Both]            │
├─────────────┬──────────────┬──────────────┬──────────────┤
│ New         │ Qualified    │ Proposal     │ Closed Won   │
├─────────────┼──────────────┼──────────────┼──────────────┤
│ B2C DEALS                                                 │
│ Steve       │ Alex P       │ Jane K       │ Maria J      │
│ $249        │ $999         │ $699         │ $699 ✓       │
├─────────────┼──────────────┼──────────────┼──────────────┤
│ B2B DEALS                                                 │
│             │ Fuck-U-Money │ Keller Wms   │              │
│             │ $9,960       │ $15,000      │              │
│             │ (50 seats)   │ (60 seats)   │              │
└─────────────┴──────────────┴──────────────┴──────────────┘
```

### Reports - B2C → B2B Conversion Funnel:
```
Companies with Individual Buyers Ready for B2B Upsell:
┌──────────────────┬────────┬──────────┬────────────┬─────────┐
│ Company          │ Buyers │ B2C Rev  │ B2B Oppty  │ Status  │
├──────────────────┼────────┼──────────┼────────────┼─────────┤
│ Fuck-U-Money...  │ 3      │ $1,947   │ $9,960     │ Created │
│ Keller Williams  │ 5      │ $3,245   │ $14,940    │ Created │
│ RE/MAX Pros      │ 2      │ $948     │ -          │ Watch   │
│ Century 21       │ 1      │ $249     │ -          │ Monitor │
└──────────────────┴────────┴──────────┴────────────┴─────────┘

Recommendation: 
• Reach out to Fuck-U-Money & Keller Williams (high priority)
• Monitor RE/MAX (1 more buyer → auto-create B2B oppty)
```

---

## API Examples

### Submit B2C Order (Individual Agent):
```javascript
POST /api/crm/submit
{
  email: "steve@fuck-u-money.re",
  first_name: "Steve",
  last_name: "Beach",
  phone: "7867775555",
  company: "Fuck-U-Money Realty",
  job_title: "Real Estate Agent",
  contact_type: "individual",  // B2C buyer
  interaction: {
    source: "listing_page_order",
    content: { package: "Single Page — $249" }
  }
}

Backend:
1. Extract domain: fuck-u-money.re
2. Find/create company "Fuck-U-Money Realty"
3. Create contact as "individual" type, linked to company
4. Create B2C opportunity ($249)
5. Check if B2B opportunity should be auto-created (3+ buyers?)
```

### Create B2B Opportunity (Company-Wide Deal):
```javascript
POST /api/crm/opportunities
{
  contact_id: 123,  // Decision maker or main contact
  company_id: 456,
  deal_type: "b2b",
  opportunity_type: "listing_pages_company_wide",
  title: "Fuck-U-Money Realty - Company-Wide Listing Pages",
  value: 9960,
  seats: 50,
  per_seat_value: 249,
  is_recurring: false,
  billing_frequency: "one_time",
  stage: "qualified"
}
```

### Get Company Upsell Readiness:
```javascript
GET /api/crm/companies/:id/upsell-score

Response:
{
  company_id: 456,
  name: "Fuck-U-Money Realty",
  individual_buyers_count: 3,
  total_b2c_revenue: 1947,
  estimated_company_size: 50,
  b2b_potential_value: 9960,
  upsell_readiness: "high",  // low, medium, high
  recommendation: "Create B2B opportunity - 3 agents purchased",
  decision_maker_identified: false,
  next_steps: [
    "Identify broker/owner contact",
    "Send company-wide proposal",
    "Offer demo for management team"
  ]
}
```

---

## Key Benefits of Hybrid Model:

✅ **Track individuals AND companies** - B2C + B2B in one system
✅ **Automatic upsell detection** - 3+ individual buyers → B2B opportunity
✅ **Real estate brokerage model** - Designed for your primary market
✅ **Flexible for expansion** - Works for any industry (B2C/B2B hybrid)
✅ **Decision maker tracking** - Identify who signs company deals
✅ **Conversion funnel** - B2C → B2B revenue path
✅ **Dual lifecycle stages** - Individual customer + Company prospect

---

## Expansion Beyond Real Estate

### Same model works for:

**Consulting Firms:**
- Individual consultants buy tools (B2C)
- Upsell to entire firm (B2B)

**Marketing Agencies:**
- Individual marketers buy services (B2C)
- Upsell to agency-wide package (B2B)

**Law Firms:**
- Individual attorneys buy (B2C)
- Upsell to firm-wide (B2B)

**The pattern is universal:**
```
Individual Professional → Company/Firm
       B2C Sale         →   B2B Upsell
```

