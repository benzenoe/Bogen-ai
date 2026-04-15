# Partner & Referral Program

## Overview

Allow existing members to refer new members and earn commissions. Track referrals, calculate payouts, and manage partner relationships.

---

## Database Schema

### **partners** table:
```sql
CREATE TABLE partners (
    partner_id SERIAL PRIMARY KEY,

    -- Partner Identity
    contact_id INTEGER REFERENCES contacts(contact_id) ON DELETE SET NULL,  -- Link to their contact record
    partner_code VARCHAR(50) UNIQUE NOT NULL,  -- Unique referral code (e.g., "EDMUND2024")
    partner_type VARCHAR(50) DEFAULT 'member',  -- 'member', 'affiliate', 'strategic_partner', 'influencer'

    -- Partner Info
    company_name VARCHAR(255),  -- If business partner
    website VARCHAR(500),

    -- Status
    status VARCHAR(50) DEFAULT 'active',  -- 'active', 'inactive', 'suspended'
    tier VARCHAR(50) DEFAULT 'standard',  -- 'standard', 'silver', 'gold', 'platinum'

    -- Commission Structure
    commission_rate DECIMAL(5,2) DEFAULT 10.00,  -- Percentage (10.00 = 10%)
    recurring_commission BOOLEAN DEFAULT false,  -- Earn on recurring revenue?
    recurring_months INTEGER,  -- How many months of recurring commissions (NULL = lifetime)

    -- Performance
    total_referrals INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,  -- How many became paying customers
    total_revenue_generated DECIMAL(12,2) DEFAULT 0.00,
    total_commissions_earned DECIMAL(12,2) DEFAULT 0.00,
    total_commissions_paid DECIMAL(12,2) DEFAULT 0.00,

    -- Payment Info
    payment_method VARCHAR(50),  -- 'paypal', 'stripe', 'bank_transfer', 'check', 'credit_to_account'
    payment_email VARCHAR(255),
    payment_details JSONB,  -- Flexible storage for payment info

    -- Settings
    auto_approve_payouts BOOLEAN DEFAULT false,
    minimum_payout DECIMAL(10,2) DEFAULT 50.00,  -- Minimum before payout

    -- Marketing Assets
    custom_landing_page VARCHAR(500),  -- Custom referral landing page URL
    promo_materials JSONB,  -- Links to banners, email templates, etc.

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_referral_at TIMESTAMP,

    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended')),
    CONSTRAINT valid_partner_type CHECK (partner_type IN ('member', 'affiliate', 'strategic_partner', 'influencer'))
);

CREATE INDEX idx_partners_code ON partners(partner_code);
CREATE INDEX idx_partners_contact ON partners(contact_id);
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_type ON partners(partner_type);
```

### **referrals** table:
```sql
CREATE TABLE referrals (
    referral_id SERIAL PRIMARY KEY,

    -- Referral Source
    partner_id INTEGER NOT NULL REFERENCES partners(partner_id) ON DELETE CASCADE,
    referral_code_used VARCHAR(50),  -- Code that was used

    -- Referred Contact
    referred_contact_id INTEGER NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,

    -- Tracking
    referral_source VARCHAR(100),  -- 'link_click', 'form_submission', 'manual_entry', 'import'
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    landing_page VARCHAR(500),

    -- Status
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'qualified', 'converted', 'rejected'

    -- Conversion Tracking
    converted_at TIMESTAMP,  -- When they became a paying customer
    first_purchase_opportunity_id INTEGER REFERENCES opportunities(opportunity_id),
    first_purchase_value DECIMAL(12,2),

    -- Commission
    commission_earned DECIMAL(12,2) DEFAULT 0.00,
    commission_paid BOOLEAN DEFAULT false,
    commission_paid_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_status CHECK (status IN ('pending', 'qualified', 'converted', 'rejected'))
);

CREATE INDEX idx_referrals_partner ON referrals(partner_id);
CREATE INDEX idx_referrals_contact ON referrals(referred_contact_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_converted ON referrals(converted_at);
```

### **partner_commissions** table:
```sql
CREATE TABLE partner_commissions (
    commission_id SERIAL PRIMARY KEY,

    -- Partner
    partner_id INTEGER NOT NULL REFERENCES partners(partner_id) ON DELETE CASCADE,
    referral_id INTEGER REFERENCES referrals(referral_id) ON DELETE SET NULL,

    -- Source Transaction
    opportunity_id INTEGER REFERENCES opportunities(opportunity_id) ON DELETE SET NULL,
    subscription_id INTEGER REFERENCES subscriptions(subscription_id) ON DELETE SET NULL,

    -- Commission Details
    commission_type VARCHAR(50) NOT NULL,  -- 'one_time', 'recurring_monthly', 'recurring_annual'
    transaction_value DECIMAL(12,2) NOT NULL,  -- Original sale amount
    commission_rate DECIMAL(5,2) NOT NULL,  -- Rate applied
    commission_amount DECIMAL(12,2) NOT NULL,  -- Amount earned

    -- Status
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'approved', 'paid', 'rejected'

    -- Payment
    paid_at TIMESTAMP,
    payout_id INTEGER REFERENCES partner_payouts(payout_id),

    -- Period (for recurring commissions)
    period_start DATE,
    period_end DATE,

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
    CONSTRAINT valid_commission_type CHECK (commission_type IN ('one_time', 'recurring_monthly', 'recurring_annual'))
);

CREATE INDEX idx_partner_commissions_partner ON partner_commissions(partner_id);
CREATE INDEX idx_partner_commissions_referral ON partner_commissions(referral_id);
CREATE INDEX idx_partner_commissions_status ON partner_commissions(status);
CREATE INDEX idx_partner_commissions_payout ON partner_commissions(payout_id);
```

### **partner_payouts** table:
```sql
CREATE TABLE partner_payouts (
    payout_id SERIAL PRIMARY KEY,

    -- Partner
    partner_id INTEGER NOT NULL REFERENCES partners(partner_id) ON DELETE CASCADE,

    -- Payout Details
    payout_amount DECIMAL(12,2) NOT NULL,
    commission_count INTEGER,  -- How many commissions in this payout

    -- Payment
    payment_method VARCHAR(50),  -- 'paypal', 'stripe', 'bank_transfer', 'check', 'credit_to_account'
    payment_email VARCHAR(255),
    transaction_id VARCHAR(255),  -- PayPal/Stripe transaction ID

    -- Status
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed'

    -- Dates
    payout_date DATE,
    period_start DATE,  -- Commissions from this date...
    period_end DATE,    -- ...to this date

    -- Notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX idx_partner_payouts_partner ON partner_payouts(partner_id);
CREATE INDEX idx_partner_payouts_status ON partner_payouts(status);
CREATE INDEX idx_partner_payouts_date ON partner_payouts(payout_date);
```

### **Updated contacts** table (add referral tracking):
```sql
ALTER TABLE contacts ADD COLUMN referred_by_partner_id INTEGER REFERENCES partners(partner_id) ON DELETE SET NULL;
ALTER TABLE contacts ADD COLUMN referral_code_used VARCHAR(50);
ALTER TABLE contacts ADD COLUMN referral_source VARCHAR(255);  -- UTM tracking

CREATE INDEX idx_contacts_referred_by ON contacts(referred_by_partner_id);
```

### **Updated opportunities** table (link to referral):
```sql
ALTER TABLE opportunities ADD COLUMN referral_id INTEGER REFERENCES referrals(referral_id) ON DELETE SET NULL;

CREATE INDEX idx_opportunities_referral ON opportunities(referral_id);
```

---

## Partner Tiers & Commission Rates

### Standard Tier (Default):
- **Commission Rate:** 10% on first purchase
- **Recurring:** First 3 months only
- **Minimum Payout:** $50
- **Requirements:** Any active member

### Silver Tier:
- **Commission Rate:** 15% on first purchase
- **Recurring:** First 6 months
- **Minimum Payout:** $50
- **Requirements:** 10+ conversions OR $5,000+ generated

### Gold Tier:
- **Commission Rate:** 20% on first purchase
- **Recurring:** First 12 months
- **Minimum Payout:** $25
- **Requirements:** 25+ conversions OR $15,000+ generated

### Platinum Tier:
- **Commission Rate:** 25% on first purchase
- **Recurring:** Lifetime recurring commissions
- **Minimum Payout:** $0 (immediate payout)
- **Requirements:** 50+ conversions OR $50,000+ generated
- **Bonuses:** Custom landing page, dedicated support

---

## Commission Calculation Examples

### Example 1: Single Listing Page ($249)
```
Partner Code: EDMUND2024
Customer: Steve Beach purchases listing page ($249)
Commission Rate: 10% (Standard tier)
Commission Earned: $24.90 (one-time)
```

### Example 2: REIGNmaker Membership ($70/month)
```
Partner Code: MARIA2024
Customer: John Doe subscribes to REIGNmaker ($70/month)
Commission Rate: 15% (Silver tier)
Recurring: 6 months

Month 1: $10.50
Month 2: $10.50
Month 3: $10.50
Month 4: $10.50
Month 5: $10.50
Month 6: $10.50
Total Earned: $63.00 (over 6 months)
```

### Example 3: 1-on-1 Coaching ($900/month)
```
Partner Code: PLATINUM_PARTNER
Customer: Sarah Johnson subscribes to coaching ($900/month)
Commission Rate: 25% (Platinum tier)
Recurring: Lifetime

Month 1: $225
Month 2: $225
Month 3: $225
... (continues as long as customer remains subscribed)
```

---

## Automatic Commission Tracking

### When a Sale is Made:
```javascript
async function trackReferralCommission(opportunity, contact) {
  // Check if contact was referred
  if (!contact.referred_by_partner_id) return;

  const partner = await getPartner(contact.referred_by_partner_id);
  const referral = await getReferral(contact.contact_id, partner.partner_id);

  // Calculate commission
  const commissionAmount = opportunity.value * (partner.commission_rate / 100);

  // Create commission record
  await createCommission({
    partner_id: partner.partner_id,
    referral_id: referral.referral_id,
    opportunity_id: opportunity.opportunity_id,
    commission_type: opportunity.is_recurring ? 'recurring_monthly' : 'one_time',
    transaction_value: opportunity.value,
    commission_rate: partner.commission_rate,
    commission_amount: commissionAmount,
    status: 'pending'  // Requires approval
  });

  // Update referral status
  if (referral.status === 'pending') {
    await updateReferral(referral.referral_id, {
      status: 'converted',
      converted_at: new Date(),
      first_purchase_opportunity_id: opportunity.opportunity_id,
      first_purchase_value: opportunity.value,
      commission_earned: commissionAmount
    });
  }

  // Update partner stats
  await updatePartnerStats(partner.partner_id, {
    total_conversions: partner.total_conversions + 1,
    total_revenue_generated: partner.total_revenue_generated + opportunity.value,
    total_commissions_earned: partner.total_commissions_earned + commissionAmount,
    last_referral_at: new Date()
  });
}
```

### Recurring Commission Tracking:
```javascript
async function processRecurringCommissions() {
  // Run monthly: find all active subscriptions with referrals
  const subscriptionsWithReferrals = await db.query(`
    SELECT s.*, c.referred_by_partner_id, p.partner_id, p.commission_rate, p.recurring_months
    FROM subscriptions s
    JOIN contacts c ON c.contact_id = s.contact_id
    JOIN partners p ON p.partner_id = c.referred_by_partner_id
    WHERE s.status = 'active'
      AND c.referred_by_partner_id IS NOT NULL
      AND p.recurring_commission = true
  `);

  for (const sub of subscriptionsWithReferrals) {
    // Check if within commission period
    const monthsSinceStart = monthsDiff(sub.start_date, new Date());

    if (sub.recurring_months && monthsSinceStart > sub.recurring_months) {
      continue;  // Commission period expired
    }

    // Create monthly commission
    const commissionAmount = sub.price_monthly * (sub.commission_rate / 100);

    await createCommission({
      partner_id: sub.partner_id,
      subscription_id: sub.subscription_id,
      commission_type: 'recurring_monthly',
      transaction_value: sub.price_monthly,
      commission_rate: sub.commission_rate,
      commission_amount: commissionAmount,
      status: 'approved',  // Auto-approve recurring
      period_start: startOfMonth(new Date()),
      period_end: endOfMonth(new Date())
    });
  }
}
```

---

## Partner Dashboard Views

### Partner Performance Dashboard:
```
┌─────────────────────────────────────────────────────────────┐
│ Partner: Edmund Bogen (#EDMUND2024)          Tier: Platinum │
├─────────────────────────────────────────────────────────────┤
│ 📊 Performance Overview                                      │
│ • Total Referrals: 47                                       │
│ • Conversions: 32 (68% conversion rate)                     │
│ • Revenue Generated: $87,450                                │
│ • Commissions Earned: $21,862.50                            │
│ • Commissions Paid: $19,200.00                              │
│ • Balance Due: $2,662.50                                    │
├─────────────────────────────────────────────────────────────┤
│ 💰 This Month (April 2026)                                  │
│ • New Referrals: 5                                          │
│ • New Conversions: 3                                        │
│ • Revenue Generated: $4,200                                 │
│ • Commissions Earned: $1,050                                │
│ • Recurring Commissions: $425/month                         │
├─────────────────────────────────────────────────────────────┤
│ 🎯 Next Payout                                              │
│ • Pending Commissions: $2,662.50                            │
│ • Payout Date: May 1, 2026                                  │
│ • Payment Method: PayPal (edmund@reignation.com)            │
├─────────────────────────────────────────────────────────────┤
│ 📈 Top Referred Products                                    │
│ 1. REIGNmaker Membership - 18 conversions ($1,260 comm)    │
│ 2. 1-on-1 Coaching - 8 conversions ($7,200 comm)           │
│ 3. Listing Pages - 6 conversions ($149.40 comm)            │
└─────────────────────────────────────────────────────────────┘
```

### Referrals List:
```
┌─────────────────────────────────────────────────────────────┐
│ Recent Referrals for Edmund Bogen                           │
├──────────────┬──────────────┬─────────────┬────────────────┤
│ Contact      │ Date         │ Status      │ Commission     │
├──────────────┼──────────────┼─────────────┼────────────────┤
│ Steve Beach  │ Apr 12, 2026 │ Converted   │ $24.90 (paid)  │
│ Maria Garcia │ Apr 10, 2026 │ Qualified   │ $0.00          │
│ John Smith   │ Apr 8, 2026  │ Converted   │ $225/month     │
│ Sarah Lee    │ Apr 5, 2026  │ Pending     │ $0.00          │
│ Mike Johnson │ Apr 3, 2026  │ Converted   │ $10.50/month   │
└──────────────┴──────────────┴─────────────┴────────────────┘
```

---

## API Endpoints

### Partner Management:
```javascript
POST /api/crm/partners
{
  contact_id: 123,
  partner_code: "EDMUND2024",
  partner_type: "member",
  commission_rate: 10.00,
  recurring_commission: true,
  recurring_months: 3,
  payment_method: "paypal",
  payment_email: "edmund@reignation.com"
}

GET /api/crm/partners
  ?status=active
  &tier=platinum

GET /api/crm/partners/:id/dashboard
  // Get partner performance stats

PATCH /api/crm/partners/:id/tier
  // Upgrade partner tier

GET /api/crm/partners/:id/referrals
  // Get all referrals for a partner
```

### Referral Tracking:
```javascript
POST /api/crm/referrals/track
{
  partner_code: "EDMUND2024",
  email: "newcustomer@example.com",
  utm_source: "partner_link",
  utm_campaign: "spring_2026"
}

GET /api/crm/referrals/:id
  // Get referral details

PATCH /api/crm/referrals/:id/convert
  // Mark referral as converted
```

### Commission Management:
```javascript
GET /api/crm/commissions
  ?partner_id=123
  &status=pending

POST /api/crm/commissions/:id/approve
  // Approve commission

POST /api/crm/payouts
{
  partner_id: 123,
  commission_ids: [1, 2, 3, 4],
  payment_method: "paypal"
}

GET /api/crm/payouts/:id
  // Get payout details
```

---

## Partner Onboarding Flow

### 1. Member Applies to Become Partner:
```javascript
POST /api/crm/partners/apply
{
  contact_id: 123,
  desired_code: "EDMUND2024",  // Optional, auto-generated if not provided
  partner_type: "member",
  notes: "I want to refer other real estate agents"
}

// System creates partner record with status: 'pending'
```

### 2. Admin Approves Partner:
```javascript
PATCH /api/crm/partners/:id/approve
{
  tier: "standard",
  commission_rate: 10.00
}

// Sends email to partner with:
// - Unique referral link
// - Partner code
// - Commission structure
// - Marketing materials
```

### 3. Partner Receives Welcome Email:
```
Subject: Welcome to the Edmund's Mastermind Partner Program!

Hi Edmund,

Congratulations! Your partner application has been approved.

Your Partner Details:
• Partner Code: EDMUND2024
• Commission Rate: 10% on first purchase + 3 months recurring
• Minimum Payout: $50

Your Referral Link:
https://reignation.com?ref=EDMUND2024

Marketing Materials:
• Email templates
• Social media graphics
• Banner ads

Start referring today and earn commissions!
```

---

## Marketing Materials for Partners

### Pre-Built Email Templates:
```html
<!-- Template 1: Membership Invitation -->
Subject: Join Edmund's Mastermind - Transform Your Real Estate Business

Hey [First Name],

I wanted to personally invite you to Edmund's Mastermind...

[Join Now - https://reignation.com?ref=EDMUND2024]

<!-- Template 2: Free Resource Offer -->
Subject: Free ChatGPT Prompts for Real Estate Agents

<!-- Template 3: Coaching Offer -->
Subject: 1-on-1 Coaching with Edmund Bogen
```

### Social Media Templates:
```
Instagram Post:
"Just joined @edmundbogen's Mastermind and my business has 2x'd in 3 months!
If you're serious about real estate, check it out:
[link in bio - reignation.com?ref=EDMUND2024]"

LinkedIn Post:
"Highly recommend Edmund Bogen's coaching program for any real estate
professional looking to scale with AI automation..."
```

### Banner Ads (Sizes):
- 728x90 (Leaderboard)
- 300x250 (Medium Rectangle)
- 160x600 (Wide Skyscraper)

---

## Automatic Tier Upgrades

### Upgrade Logic:
```javascript
async function checkPartnerTierUpgrade(partnerId) {
  const partner = await getPartner(partnerId);
  const stats = await getPartnerStats(partnerId);

  let newTier = partner.tier;

  // Platinum Tier
  if (stats.total_conversions >= 50 || stats.total_revenue_generated >= 50000) {
    newTier = 'platinum';
  }
  // Gold Tier
  else if (stats.total_conversions >= 25 || stats.total_revenue_generated >= 15000) {
    newTier = 'gold';
  }
  // Silver Tier
  else if (stats.total_conversions >= 10 || stats.total_revenue_generated >= 5000) {
    newTier = 'silver';
  }

  if (newTier !== partner.tier) {
    await upgradePartnerTier(partnerId, newTier);
    await sendTierUpgradeEmail(partner, newTier);
  }
}
```

---

## Benefits of Partner Program

✅ **Organic Growth** - Members bring in new members (viral loop)

✅ **Lower CAC** - Customer Acquisition Cost is just commission (vs. ads)

✅ **High-Quality Leads** - Referred customers have higher conversion rates

✅ **Community Building** - Partners become brand advocates

✅ **Passive Income for Members** - Extra incentive to promote

✅ **Scalable** - Program grows automatically with member base

✅ **Lifetime Value** - Recurring commissions keep partners engaged

---

## Anti-Fraud Measures

### Prevent Self-Referrals:
```javascript
// Block partners from referring themselves or family members
async function validateReferral(partnerId, contactEmail) {
  const partner = await getPartner(partnerId);
  const partnerContact = await getContact(partner.contact_id);

  // Check email similarity
  if (contactEmail === partnerContact.email) {
    return { valid: false, reason: 'Cannot refer yourself' };
  }

  // Check same domain (for businesses)
  const contactDomain = contactEmail.split('@')[1];
  const partnerDomain = partnerContact.email.split('@')[1];

  if (contactDomain === partnerDomain) {
    return { valid: false, reason: 'Cannot refer from same company domain' };
  }

  return { valid: true };
}
```

### Cookie Duration:
- Referral cookies last 90 days
- Last click attribution (last partner who referred gets credit)

### Minimum Activity:
- Referred contact must stay subscribed for 30+ days before commission is paid
- If customer refunds/cancels within 30 days, commission is reversed

---

## Migration & Setup

### Initial Seed Data:
```sql
-- Create partner records for existing members who want to refer
INSERT INTO partners (contact_id, partner_code, partner_type, tier, commission_rate, recurring_commission, recurring_months)
SELECT
  c.contact_id,
  UPPER(LEFT(c.first_name, 1) || c.last_name || EXTRACT(YEAR FROM CURRENT_DATE)),  -- Auto-generate code
  'member',
  'standard',
  10.00,
  true,
  3
FROM contacts c
WHERE c.lifecycle_stage = 'customer'
  AND c.email IS NOT NULL;
```
