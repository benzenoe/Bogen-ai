# Bogen.ai Products & Services Catalog

## Products/Services Table Schema

### **products** table:
```sql
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,

    -- Basic Info
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,  -- Product SKU/Code
    category VARCHAR(100),  -- 'web_development', 'automation', 'cms', 'crm', 'social_media', 'marketing', 'ai_solutions', 'coaching', 'memberships'
    description TEXT,

    -- Pricing
    pricing_model VARCHAR(50) NOT NULL,  -- 'one_time', 'recurring', 'usage_based', 'tiered'
    base_price DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'USD',

    -- Recurring Pricing
    billing_frequency VARCHAR(50),  -- 'monthly', 'annual', 'quarterly', NULL for one-time

    -- Deal Type
    available_for VARCHAR(50) DEFAULT 'both',  -- 'b2c', 'b2b', 'both'

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,

    -- Delivery
    delivery_timeline VARCHAR(100),  -- '3-5 business days', '2 weeks', 'immediate', etc.
    requires_onboarding BOOLEAN DEFAULT false,

    -- Metadata
    features JSONB,  -- Flexible storage for feature lists
    tags TEXT[],

    -- Sales Info
    commission_rate DECIMAL(5,2),  -- Percentage for partner referrals

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_pricing_model CHECK (pricing_model IN ('one_time', 'recurring', 'usage_based', 'tiered')),
    CONSTRAINT valid_available_for CHECK (available_for IN ('b2c', 'b2b', 'both'))
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_pricing_model ON products(pricing_model);
```

### **product_tiers** table (for tiered pricing):
```sql
CREATE TABLE product_tiers (
    tier_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,

    -- Tier Info
    tier_name VARCHAR(100) NOT NULL,  -- 'Starter', 'Professional', 'Enterprise'
    tier_level INTEGER,  -- 1, 2, 3 for ordering

    -- Pricing
    price DECIMAL(12,2) NOT NULL,
    billing_frequency VARCHAR(50),  -- 'monthly', 'annual'

    -- Limits/Features
    features JSONB,  -- Tier-specific features
    max_users INTEGER,  -- For B2B: how many seats
    max_usage INTEGER,  -- For usage-based: limits

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_tiers_product ON product_tiers(product_id);
```

### **Updated opportunities** table (links to products):
```sql
CREATE TABLE opportunities (
    opportunity_id SERIAL PRIMARY KEY,
    contact_id INTEGER NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES companies(company_id) ON DELETE SET NULL,

    -- Product/Service (NEW)
    product_id INTEGER REFERENCES products(product_id) ON DELETE SET NULL,
    product_tier_id INTEGER REFERENCES product_tiers(tier_id) ON DELETE SET NULL,

    -- Deal Classification
    deal_type VARCHAR(50) NOT NULL,  -- 'b2c', 'b2b'

    -- Details
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Financial
    value DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'USD',

    -- B2B Specific
    seats INTEGER,
    per_seat_value DECIMAL(12,2),
    is_recurring BOOLEAN DEFAULT false,
    billing_frequency VARCHAR(50),

    -- Customization
    custom_pricing BOOLEAN DEFAULT false,  -- If price differs from product catalog
    custom_requirements JSONB,  -- Special requirements, customizations

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
    upsell_from_opportunity_id INTEGER REFERENCES opportunities(opportunity_id),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_stage CHECK (stage IN ('new', 'qualified', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost')),
    CONSTRAINT valid_deal_type CHECK (deal_type IN ('b2c', 'b2b'))
);

CREATE INDEX idx_opportunities_product ON opportunities(product_id);
CREATE INDEX idx_opportunities_product_tier ON opportunities(product_tier_id);
```

### **Updated subscriptions** table (links to products):
```sql
CREATE TABLE subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    contact_id INTEGER NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,

    -- Product (NEW)
    product_id INTEGER REFERENCES products(product_id) ON DELETE SET NULL,
    product_tier_id INTEGER REFERENCES product_tiers(tier_id) ON DELETE SET NULL,

    -- Subscription Details (legacy fields for Kajabi migration)
    plan_name VARCHAR(255) NOT NULL,
    plan_type VARCHAR(100),

    -- Pricing
    price_monthly DECIMAL(10,2),
    billing_frequency VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'USD',

    -- Status
    status VARCHAR(50) DEFAULT 'active',

    -- Dates
    start_date DATE NOT NULL,
    end_date DATE,
    next_billing_date DATE,
    cancellation_date DATE,

    -- Payment Integration
    kajabi_subscription_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),

    -- Cancellation
    cancellation_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'cancelled', 'past_due', 'expired'))
);

CREATE INDEX idx_subscriptions_product ON subscriptions(product_id);
```

---

## Bogen.ai Product Catalog

### Category: Web Development

| Product | SKU | Pricing Model | Base Price | Category |
|---------|-----|---------------|------------|----------|
| Single Listing Page | WEB-LP-001 | One-time | $249 | web_development |
| Listing Pages Starter Pack (5 pages) | WEB-LP-005 | One-time | $699 | web_development |
| Custom Website Development | WEB-CUSTOM-001 | One-time | $2,500+ | web_development |
| Website Maintenance | WEB-MAINT-001 | Recurring | $99/month | web_development |

### Category: Automation

| Product | SKU | Pricing Model | Base Price | Category |
|---------|-----|---------------|------------|----------|
| Workflow Automation - Starter | AUTO-FLOW-S | Recurring | $197/month | automation |
| Workflow Automation - Professional | AUTO-FLOW-P | Recurring | $497/month | automation |
| Workflow Automation - Enterprise | AUTO-FLOW-E | Recurring | $997/month | automation |
| Custom Automation Build | AUTO-CUSTOM-001 | One-time | $1,500+ | automation |

### Category: CRM Systems

| Product | SKU | Pricing Model | Base Price | Category |
|---------|-----|---------------|------------|----------|
| CRM Setup & Configuration | CRM-SETUP-001 | One-time | $997 | crm |
| CRM - Starter (Up to 1,000 contacts) | CRM-TIER-S | Recurring | $97/month | crm |
| CRM - Professional (Up to 10,000 contacts) | CRM-TIER-P | Recurring | $297/month | crm |
| CRM - Enterprise (Unlimited contacts) | CRM-TIER-E | Recurring | $997/month | crm |

### Category: Content Management

| Product | SKU | Pricing Model | Base Price | Category |
|---------|-----|---------------|------------|----------|
| CMS Setup & Training | CMS-SETUP-001 | One-time | $497 | cms |
| CMS Hosting & Maintenance | CMS-HOST-001 | Recurring | $49/month | cms |
| Content Migration Services | CMS-MIGRATE-001 | One-time | $299+ | cms |

### Category: Social Media Management

| Product | SKU | Pricing Model | Base Price | Category |
|---------|-----|---------------|------------|----------|
| Social Media Publishing - Basic | SOCIAL-PUB-B | Recurring | $97/month | social_media |
| Social Media Publishing - Pro | SOCIAL-PUB-P | Recurring | $297/month | social_media |
| Social Media Publishing - Agency | SOCIAL-PUB-A | Recurring | $697/month | social_media |
| Social Media Strategy Consultation | SOCIAL-CONSULT-001 | One-time | $497 | social_media |

### Category: Marketing & Advertising

| Product | SKU | Pricing Model | Base Price | Category |
|---------|-----|---------------|------------|----------|
| Landing Page Design (Single) | MKT-LP-001 | One-time | $349 | marketing |
| Landing Pages Pack (5 pages) | MKT-LP-005 | One-time | $999 | marketing |
| Ad Campaign Management - Starter | MKT-ADS-S | Recurring | $497/month | marketing |
| Ad Campaign Management - Professional | MKT-ADS-P | Recurring | $997/month | marketing |
| Ad Campaign Management - Enterprise | MKT-ADS-E | Recurring | $2,497/month | marketing |

### Category: AI Solutions

| Product | SKU | Pricing Model | Base Price | Category |
|---------|-----|---------------|------------|----------|
| AI Chatbot Setup | AI-CHAT-001 | One-time | $997 | ai_solutions |
| AI Content Generation - Basic | AI-CONTENT-B | Recurring | $197/month | ai_solutions |
| AI Content Generation - Professional | AI-CONTENT-P | Recurring | $497/month | ai_solutions |
| Custom AI Integration | AI-CUSTOM-001 | One-time | $2,500+ | ai_solutions |

### Category: Coaching & Consulting

| Product | SKU | Pricing Model | Base Price | Category |
|---------|-----|---------------|------------|----------|
| 1-on-1 Coaching (3 sessions/month) | COACH-1ON1-001 | Recurring | $900/month | coaching |
| Group Coaching Session | COACH-GROUP-001 | One-time | $199 | coaching |
| Strategy Consultation (1 hour) | CONSULT-STRATEGY-001 | One-time | $299 | coaching |
| Speaker Booking | SPEAK-BOOK-001 | One-time | $999 | coaching |

### Category: Memberships

| Product | SKU | Pricing Model | Base Price | Category |
|---------|-----|---------------|------------|----------|
| Basic Access Membership | MBR-BASIC-001 | Recurring | $20/month | memberships |
| REIGNmaker Membership (Monthly) | MBR-REIGN-M | Recurring | $70/month | memberships |
| REIGNmaker Membership (Annual) | MBR-REIGN-Y | Recurring | $70/month (billed annually) | memberships |
| Edmund's Mastermind | MBR-MASTERMIND-001 | Recurring | $70/month | memberships |

---

## Product Features (JSONB Examples)

### Workflow Automation - Professional:
```json
{
  "features": [
    "Up to 50 active workflows",
    "Integration with 100+ apps",
    "Advanced conditional logic",
    "Email notifications",
    "Priority support",
    "Custom API webhooks"
  ],
  "integrations": ["Zapier", "Make.com", "n8n", "Custom APIs"],
  "support_level": "Priority",
  "onboarding_included": true
}
```

### CRM - Enterprise:
```json
{
  "features": [
    "Unlimited contacts",
    "Unlimited custom fields",
    "Advanced automation",
    "API access",
    "White-label option",
    "Dedicated account manager",
    "Custom integrations",
    "Advanced reporting"
  ],
  "max_contacts": null,
  "max_users": 50,
  "support_level": "Dedicated",
  "sla_uptime": "99.9%"
}
```

### Social Media Publishing - Agency:
```json
{
  "features": [
    "Unlimited social accounts",
    "10 team members",
    "Content calendar",
    "AI-powered content suggestions",
    "Analytics & reporting",
    "White-label reports",
    "Client portal access",
    "Priority queue"
  ],
  "platforms": ["Facebook", "Instagram", "Twitter", "LinkedIn", "TikTok"],
  "max_scheduled_posts": 500,
  "analytics_retention": "12 months"
}
```

---

## API Endpoints for Product Catalog

### Product Management:
```javascript
GET /api/crm/products
  ?category=automation
  &is_active=true
  &pricing_model=recurring

GET /api/crm/products/:id
  // Returns product details + all tiers

GET /api/crm/products/:id/tiers
  // Get all pricing tiers for a product

POST /api/crm/products
  // Create new product

PATCH /api/crm/products/:id
  // Update product info

GET /api/crm/products/categories
  // Get all product categories
```

### Creating Opportunities with Products:
```javascript
POST /api/crm/opportunities
{
  contact_id: 123,
  company_id: 456,
  product_id: 789,  // Links to products table
  product_tier_id: 12,  // If tiered pricing
  deal_type: "b2b",
  title: "Fuck-U-Money Realty - CRM Enterprise",
  value: 997,
  seats: 50,
  stage: "qualified"
}
```

### Product Analytics:
```javascript
GET /api/crm/analytics/products/revenue
  // Revenue breakdown by product category

GET /api/crm/analytics/products/popular
  // Most purchased products

GET /api/crm/analytics/products/conversion-rates
  // Conversion rates by product
```

---

## Benefits of Product Catalog:

✅ **Centralized pricing** - Single source of truth for all products/services

✅ **Easy price updates** - Change base price, updates across all quotes

✅ **Product-level reporting** - Which products sell best? What's the average deal size?

✅ **Tiered pricing support** - Starter/Pro/Enterprise packages

✅ **Cross-sell tracking** - See what products customers buy together

✅ **Commission tracking** - Calculate partner referral commissions automatically

✅ **Custom vs. catalog pricing** - Track when deals deviate from standard pricing

✅ **Feature comparison** - Show feature differences between tiers

✅ **Subscription management** - Link subscriptions to product catalog for consistency

---

## Migration Strategy

### Seed Initial Product Catalog:
```sql
-- Insert all current Bogen.ai products
INSERT INTO products (name, sku, category, pricing_model, base_price, billing_frequency, available_for, is_active)
VALUES
  ('Single Listing Page', 'WEB-LP-001', 'web_development', 'one_time', 249.00, NULL, 'both', true),
  ('Listing Pages Starter Pack', 'WEB-LP-005', 'web_development', 'one_time', 699.00, NULL, 'both', true),
  ('Workflow Automation - Starter', 'AUTO-FLOW-S', 'automation', 'recurring', 197.00, 'monthly', 'both', true),
  ('CRM - Enterprise', 'CRM-TIER-E', 'crm', 'recurring', 997.00, 'monthly', 'b2b', true),
  ('1-on-1 Coaching', 'COACH-1ON1-001', 'coaching', 'recurring', 900.00, 'monthly', 'b2c', true),
  -- ... etc
;

-- Create product tiers for tiered products
INSERT INTO product_tiers (product_id, tier_name, tier_level, price, billing_frequency, features)
SELECT
  p.product_id,
  'Starter',
  1,
  197.00,
  'monthly',
  '{"features": ["Up to 10 workflows", "Basic integrations", "Email support"]}'::jsonb
FROM products p
WHERE p.sku = 'AUTO-FLOW-S';
```

### Link Existing Opportunities to Products:
```sql
-- Map existing opportunity_type to product_id
UPDATE opportunities o
SET product_id = p.product_id
FROM products p
WHERE o.opportunity_type = 'listing_page_order'
  AND p.sku = 'WEB-LP-001';
```

---

## Dashboard Enhancements

### Product Performance View:
```
┌─────────────────────────────────────────────────────────┐
│ Product Revenue Report - March 2026                     │
├─────────────────────────────────────────────────────────┤
│ Category: Web Development                               │
│ • Single Listing Page: 45 sales = $11,205              │
│ • Listing Pages Pack: 12 sales = $8,388                │
│ Total: $19,593                                          │
├─────────────────────────────────────────────────────────┤
│ Category: Automation (MRR)                              │
│ • Starter: 23 subscriptions = $4,531/month              │
│ • Professional: 8 subscriptions = $3,976/month          │
│ • Enterprise: 3 subscriptions = $2,991/month            │
│ Total MRR: $11,498                                      │
├─────────────────────────────────────────────────────────┤
│ Top Performer: Workflow Automation - Starter            │
│ Highest Value: Ad Campaign Management - Enterprise      │
│ Best Conversion Rate: Single Listing Page (68%)         │
└─────────────────────────────────────────────────────────┘
```
