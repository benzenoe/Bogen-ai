# CRM Update: Add Companies Table

## Enhanced Schema with Companies

### **companies** table (NEW):
```sql
CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),  -- website domain for auto-matching
    website VARCHAR(500),
    industry VARCHAR(100),
    company_size VARCHAR(50),  -- 1-10, 11-50, 51-200, 201-500, 501+
    
    -- Location
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    
    -- Status
    lifecycle_stage VARCHAR(50) DEFAULT 'lead',  -- lead, customer, partner, churned
    
    -- Metadata
    tags TEXT[],
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_domain UNIQUE(domain)
);

CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_domain ON companies(domain);
CREATE INDEX idx_companies_lifecycle ON companies(lifecycle_stage);
```

### **Updated contacts** table:
```sql
CREATE TABLE contacts (
    contact_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    
    -- COMPANY RELATIONSHIP (NEW)
    company_id INTEGER REFERENCES companies(company_id) ON DELETE SET NULL,
    job_title VARCHAR(255),  -- "CEO", "VP of Sales", "Real Estate Agent"
    department VARCHAR(100),  -- "Sales", "Marketing", "Operations"
    
    -- Keep legacy company field for backwards compatibility during migration
    company_name VARCHAR(255),  -- Deprecated, use company_id
    
    industry VARCHAR(100),
    
    -- Lifecycle
    lifecycle_stage VARCHAR(50) DEFAULT 'lead',
    
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
    CONSTRAINT valid_lifecycle CHECK (lifecycle_stage IN ('lead', 'qualified', 'opportunity', 'customer', 'churned'))
);

CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_lifecycle ON contacts(lifecycle_stage);
```

### **Updated opportunities** table:
```sql
CREATE TABLE opportunities (
    opportunity_id SERIAL PRIMARY KEY,
    contact_id INTEGER NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES companies(company_id) ON DELETE SET NULL,  -- NEW: Link to company
    
    -- Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    opportunity_type VARCHAR(100) NOT NULL,
    
    -- Financial
    value DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'USD',
    
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
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_stage CHECK (stage IN ('new', 'qualified', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost'))
);

CREATE INDEX idx_opportunities_contact ON opportunities(contact_id);
CREATE INDEX idx_opportunities_company ON opportunities(company_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
```

---

## Smart Company Auto-Creation

### Logic for Form Submissions:

**1. When contact submits form with company name:**
```javascript
async function createContactWithCompany(formData) {
  let companyId = null;
  
  // If company provided
  if (formData.company) {
    // Try to find existing company by name (fuzzy match)
    let company = await findCompany(formData.company, formData.website);
    
    if (!company) {
      // Auto-create company
      company = await createCompany({
        name: formData.company,
        domain: extractDomain(formData.website || formData.email),
        industry: formData.industry
      });
    }
    
    companyId = company.company_id;
  }
  
  // Create or update contact
  const contact = await upsertContact({
    email: formData.email,
    first_name: formData.first_name,
    last_name: formData.last_name,
    company_id: companyId,
    job_title: formData.job_title,  // if provided
    source: formData.source
  });
  
  return { contact, company };
}
```

**2. Email domain matching:**
```javascript
// Extract domain from email: steve@benzeno.com → benzeno.com
const emailDomain = formData.email.split('@')[1];

// Check if company exists with this domain
const existingCompany = await findCompanyByDomain(emailDomain);

if (existingCompany) {
  // Automatically associate contact with this company
  companyId = existingCompany.company_id;
}
```

**Example:**
```
Contact 1: steve@fuck-u-money.re submits form
→ Create company "Fuck-U-Money Realty" with domain "fuck-u-money.re"
→ Create contact "Steve Beach" linked to this company

Contact 2: maria@fuck-u-money.re submits form later
→ Find existing company by domain "fuck-u-money.re"
→ Create contact "Maria Johnson" linked to SAME company

Result: Both contacts now linked to same company!
```

---

## Enhanced UI Views

### Company Detail Page:
```
┌─────────────────────────────────────────────────────────┐
│ Fuck-U-Money Realty                      [Edit] [Email] │
├─────────────────────────────────────────────────────────┤
│ 🌐 https://Fuck-U-Money.re                              │
│ 🏢 Real Estate • 11-50 employees                        │
│ 🏷️  Customer  •  Source: Listing Page                   │
├─────────────────────────────────────────────────────────┤
│ CONTACTS (2)                                             │
│ • Steve Beach - Real Estate Agent                       │
│ • Maria Johnson - Marketing Director                    │
├─────────────────────────────────────────────────────────┤
│ OPPORTUNITIES (3)                            Total: $1,947│
│ • Listing Page Order ($249) - New                       │
│ • Speaker Booking ($999) - Proposal Sent                │
│ • Website Redesign ($699) - Qualified                   │
├─────────────────────────────────────────────────────────┤
│ TIMELINE                                                 │
│ ⬇️  Form Submission - Steve - 2 min ago                  │
│ 📧  Email sent - Maria - 2 days ago                      │
│ 📞  Call logged - Steve - 1 week ago                     │
└─────────────────────────────────────────────────────────┘
```

### Contact Detail (Enhanced):
```
┌─────────────────────────────────────────────────────────┐
│ Steve Beach                              [Edit] [Email] │
├─────────────────────────────────────────────────────────┤
│ 📧 steve@benzeno.com  📞 7867775555                     │
│ 🏢 Real Estate Agent at Fuck-U-Money Realty            │
│    [View Company] →                                     │
│ 🏷️  Lead  •  Source: Listing Page                       │
├─────────────────────────────────────────────────────────┤
│ OPPORTUNITIES (1)                                        │
│ • Listing Page - Fuck-U-Money ($249) - New              │
└─────────────────────────────────────────────────────────┘
```

### Companies List View:
```
┌─────────────────────────────────────────────────────────┐
│ Companies                                   [+ New]      │
├─────────────────────────────────────────────────────────┤
│ Filters: [All Stages ▼] [All Industries ▼]             │
│ Search: [________________]                   [Search]   │
├──────────────┬─────────┬──────────┬──────────┬─────────┤
│ Company      │Contacts │ Deals    │ Value    │ Stage   │
├──────────────┼─────────┼──────────┼──────────┼─────────┤
│ Fuck-U-Mo... │ 2       │ 3        │ $1,947   │Customer │
│ Acme Corp    │ 1       │ 1        │ $5,000   │Lead     │
│ Tech Start.. │ 3       │ 2        │ $12,000  │Customer │
└──────────────┴─────────┴──────────┴──────────┴─────────┘
```

---

## Updated API Endpoints

### Company Management:
```javascript
GET /api/crm/companies
  ?lifecycle_stage=customer
  &industry=real_estate
  &search=fuck
  
GET /api/crm/companies/:id
  // Returns company + all contacts + all opportunities

POST /api/crm/companies
  // Create new company

PATCH /api/crm/companies/:id
  // Update company info

GET /api/crm/companies/:id/contacts
  // All contacts at this company

GET /api/crm/companies/:id/opportunities
  // All opportunities for this company
```

### Enhanced Contact Endpoints:
```javascript
POST /api/crm/submit
{
  email: "steve@fuck-u-money.re",
  first_name: "Steve",
  last_name: "Beach",
  phone: "7867775555",
  company: "Fuck-U-Money Realty",  // Auto-creates or links company
  job_title: "Real Estate Agent",  // NEW
  website: "https://Fuck-U-Money.re",
  interaction: {
    source: "listing_page_order",
    content: { package: "Single Page — $249" }
  }
}

// Backend logic:
1. Extract domain from email or website: fuck-u-money.re
2. Check if company exists with that domain
3. If not, create company with name "Fuck-U-Money Realty"
4. Create/update contact linked to company_id
5. Store job_title "Real Estate Agent"
```

---

## Reporting Benefits

### With Companies Table:

**Revenue by Company:**
```sql
SELECT 
  c.name,
  COUNT(DISTINCT o.opportunity_id) as deal_count,
  SUM(o.value) as total_value
FROM companies c
LEFT JOIN opportunities o ON o.company_id = c.company_id
WHERE o.stage = 'closed_won'
GROUP BY c.company_id
ORDER BY total_value DESC;
```

**Multi-Contact Companies:**
```sql
SELECT 
  c.name,
  COUNT(DISTINCT co.contact_id) as contact_count,
  STRING_AGG(co.first_name || ' ' || co.last_name, ', ') as contacts
FROM companies c
JOIN contacts co ON co.company_id = c.company_id
GROUP BY c.company_id
HAVING COUNT(DISTINCT co.contact_id) > 1;
```

**Find Decision Makers:**
```sql
SELECT 
  c.name as company,
  co.first_name || ' ' || co.last_name as contact,
  co.job_title
FROM companies c
JOIN contacts co ON co.company_id = c.company_id
WHERE co.job_title ILIKE '%CEO%' 
   OR co.job_title ILIKE '%Owner%'
   OR co.job_title ILIKE '%President%';
```

---

## Migration Strategy

### Add Companies Support:

**Phase 1: Create companies table**
```sql
-- Add new table
CREATE TABLE companies (...);
```

**Phase 2: Add company_id to existing tables**
```sql
ALTER TABLE contacts ADD COLUMN company_id INTEGER REFERENCES companies(company_id);
ALTER TABLE contacts ADD COLUMN job_title VARCHAR(255);
ALTER TABLE opportunities ADD COLUMN company_id INTEGER REFERENCES companies(company_id);
```

**Phase 3: Migrate existing data (if any)**
```sql
-- Extract unique companies from existing contacts
INSERT INTO companies (name, domain, industry)
SELECT DISTINCT 
  company_name,
  NULL as domain,  -- Will be populated later
  industry
FROM contacts
WHERE company_name IS NOT NULL
  AND company_name != '';

-- Link contacts to companies
UPDATE contacts c
SET company_id = (
  SELECT company_id 
  FROM companies co 
  WHERE co.name = c.company_name
  LIMIT 1
)
WHERE c.company_name IS NOT NULL;
```

---

## Benefits of Companies Table:

✅ **Track multiple contacts at same company**
✅ **Company-level lifecycle (lead → customer)**
✅ **See all deals across company**
✅ **Better B2B CRM structure**
✅ **Automatic domain-based company matching**
✅ **Track company size, industry, location**
✅ **Account-based reporting**
✅ **Integration-ready** (all major CRMs use companies)

