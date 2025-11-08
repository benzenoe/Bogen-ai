# Bogen.ai - AI Automation Platform with Partner Program

A full-stack web application offering 50+ AI automation services with integrated partner/affiliate program, referral tracking, and commission management.

## Architecture

**Frontend:**
- HTML5, CSS3 (luxury brand aesthetic)
- Vanilla JavaScript
- Responsive design (mobile-first)

**Backend:**
- Node.js with Express
- PostgreSQL database
- JWT authentication
- RESTful API architecture

**Integrations:**
- Xero API for commission payments
- Email notifications (Nodemailer)
- UTM referral tracking

## Project Structure

```
bogen-ai/
├── server.js                 # Main Express server
├── package.json              # Dependencies
├── .env.example              # Environment variables template
├── database/
│   ├── schema.sql           # PostgreSQL database schema
│   └── init.js              # Database initialization script
├── server/
│   ├── config/
│   │   └── database.js      # PostgreSQL connection pool
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js          # Authentication endpoints
│   │   ├── partners.js      # Partner portal endpoints
│   │   ├── clients.js       # Client inquiry endpoints
│   │   ├── admin.js         # Admin dashboard endpoints
│   │   └── xero.js          # Xero integration endpoints
│   └── utils/
│       ├── email.js         # Email notification functions
│       └── referralCode.js  # Unique code generation
├── views/
│   ├── index.html           # Homepage
│   ├── about-edmund.html    # About Edmund page
│   ├── contact.html         # Contact/proposal forms
│   └── [other pages]        # Additional pages (to be created)
└── public/
    ├── css/
    │   └── global.css       # Brand styling
    └── js/
        └── common.js        # Frontend utilities
```

## Quick Start

### 1. Install Dependencies

```bash
cd bogen-ai
npm install
```

### 2. Set Up PostgreSQL Database

Create a PostgreSQL database:

```bash
createdb bogenai
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bogenai
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password

# JWT Secret (generate a random string)
JWT_SECRET=your_secure_random_string_here

# Email (configure your SMTP server)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=info@bogen.ai

# Xero (optional - for commission payments)
XERO_CLIENT_ID=your_xero_client_id
XERO_CLIENT_SECRET=your_xero_client_secret

# Admin
ADMIN_EMAIL=admin@bogen.ai
ADMIN_PASSWORD=change_this_secure_password

# Base URL
BASE_URL=http://localhost:3000
```

### 4. Initialize Database

Run the database initialization script to create all tables:

```bash
npm run init-db
```

This creates:
- `partners` - Partner accounts and referral codes
- `clients` - Client inquiries and leads
- `referrals` - Partner-client relationships
- `commission_payments` - Monthly commission tracking
- `admin_users` - Admin authentication

### 5. Start the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will run at: **http://localhost:3000**

## Features Implemented

### ✅ Core Website
- [x] Homepage with hero, services grid, partner CTA
- [x] About Edmund page (biography and philosophy)
- [x] Contact page with dual forms (client inquiry + partner application)
- [x] Luxury brand styling (Navy #1B365D + Gold #D4AF37)
- [x] Fully responsive mobile design
- [x] Smooth animations and transitions

### ✅ Backend Infrastructure
- [x] PostgreSQL database with complete schema
- [x] JWT authentication for partners and admin
- [x] RESTful API endpoints
- [x] Email notification system
- [x] Unique referral code generation
- [x] UTM tracking with 90-day cookie attribution
- [x] Xero API integration (foundation)

### ✅ Partner System
- [x] Partner registration with approval workflow
- [x] Unique referral code generation (8-character alphanumeric)
- [x] Referral tracking via URL parameters (?ref=CODE)
- [x] 90-day cookie attribution window
- [x] Commission calculation (configurable %, default 20%)
- [x] Partner authentication and dashboard API

### 🚧 To Be Completed
- [ ] About Eytan page
- [ ] 5 Service category pages with 50 services
- [ ] Partner program marketing page
- [ ] Partner portal dashboard (frontend)
- [ ] Admin dashboard (frontend)
- [ ] Privacy Policy & Terms of Service pages

## API Endpoints

### Authentication
- `POST /api/auth/partner/register` - Register new partner (pending approval)
- `POST /api/auth/partner/login` - Partner login
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/logout` - Logout (clear cookies)

### Client Inquiries
- `POST /api/clients/inquiry` - Submit client inquiry form

### Partner Dashboard (requires authentication)
- `GET /api/partners/dashboard` - Get partner metrics
- `GET /api/partners/referrals` - Get all referrals
- `GET /api/partners/commissions` - Get commission payment history
- `GET /api/partners/referral-link` - Get unique referral link

### Admin (requires admin authentication)
- `GET /api/admin/dashboard` - Admin overview stats
- `GET /api/admin/partners` - List all partners
- `POST /api/admin/partners/:id/approve` - Approve pending partner
- `POST /api/admin/partners/:id/suspend` - Suspend partner
- `GET /api/admin/clients` - List all client inquiries
- `GET /api/admin/referrals` - List all referrals
- `POST /api/admin/referrals` - Create/update referral (activate client)

### Xero Integration (admin only)
- `GET /api/xero/connect` - Connect to Xero
- `POST /api/xero/generate-commission-payments` - Generate monthly commission invoices

## Database Schema

### Partners Table
Stores partner accounts, referral codes, and lifetime earnings.

```sql
partner_id, name, email, password_hash, unique_referral_code,
status (pending/active/suspended), commission_rate, total_lifetime_earnings
```

### Clients Table
Stores all client inquiries from the website.

```sql
client_id, name, email, company, industry, services_interested,
monthly_budget, referred_by_partner_id, referral_source
```

### Referrals Table
Links partners to clients with commission tracking.

```sql
referral_id, partner_id, client_id, monthly_recurring_revenue,
partner_commission_rate, partner_monthly_commission (calculated),
status (lead/proposal_sent/active/churned)
```

### Commission Payments Table
Tracks monthly commission payments to partners.

```sql
payment_id, partner_id, payment_period (YYYY-MM),
total_commission_amount, payment_date, xero_invoice_id, status
```

## Partner Program Workflow

1. **Partner Application**
   - Partner fills out form at `/contact` (Partner tab)
   - Creates account with email/password
   - Status: `pending`
   - Admin receives email notification

2. **Admin Approval**
   - Admin reviews application in admin dashboard
   - Approves or denies
   - On approval: partner status → `active`
   - Partner receives welcome email with unique referral code

3. **Referral Tracking**
   - Partner shares link: `https://bogen.ai/?ref=ABCD1234`
   - Visitor clicks link → cookie set for 90 days
   - If visitor submits inquiry within 90 days → partner gets credit

4. **Client Conversion**
   - Admin converts lead to active client
   - Sets monthly recurring revenue
   - Referral status → `active`
   - Commission auto-calculated (20% default)

5. **Monthly Commissions**
   - Admin runs commission generation for the month
   - Creates `commission_payments` records
   - Optionally creates Xero invoices
   - Partner sees payment in dashboard

## Email Notifications

The system sends automatic emails for:

- **Partner approval** - Welcome email with login credentials and referral link
- **Client inquiry** - Notification to admin with client details
- **Partner application** - Notification to admin for review

Configure SMTP settings in `.env` to enable emails.

## Xero Integration

The Xero integration allows automated commission invoice creation.

**Setup:**
1. Create a Xero app at https://developer.xero.com/
2. Get Client ID and Client Secret
3. Add to `.env`
4. Admin connects via `/api/xero/connect`
5. Generate monthly invoices via `/api/xero/generate-commission-payments`

## Security Features

- JWT-based authentication with httpOnly cookies
- Password hashing with bcrypt (10 rounds)
- SQL injection protection (parameterized queries)
- XSS protection (input validation)
- CORS configuration
- Environment variable protection

## Customization

### Brand Colors
Edit `/public/css/global.css`:

```css
:root {
  --navy: #1B365D;
  --gold: #D4AF37;
  --white: #FFFFFF;
  --soft-gray: #F8F9FA;
}
```

### Commission Rates
Default is 20%, but can be customized per partner in the database:

```sql
UPDATE partners SET commission_rate = 25.00 WHERE partner_id = 1;
```

### Add Services
Edit service category pages in `/views/services/` to add your 50 services from the architecture document.

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Generate secure `JWT_SECRET` (use `openssl rand -base64 32`)
- [ ] Use production PostgreSQL database
- [ ] Enable SSL certificate
- [ ] Set up CDN for images
- [ ] Configure production email service (SendGrid, AWS SES, etc.)
- [ ] Set up Xero production app
- [ ] Change default admin password
- [ ] Add real photos for Edmund and Eytan
- [ ] Complete remaining pages

### Hosting Options

- **Vercel/Netlify** (frontend) + **Heroku/Railway** (backend + database)
- **AWS EC2** + **RDS PostgreSQL**
- **DigitalOcean Droplet** + **Managed PostgreSQL**

## Support

For questions or issues:
- Email: info@bogen.ai
- Review `/database/schema.sql` for database structure
- Check `/server/routes/` for API endpoint details

## License

Proprietary - © 2025 Bogen.ai. All rights reserved.
