# Bogen.ai Setup Guide

This guide will help you set up the PostgreSQL database and deploy the application.

## Prerequisites

- PostgreSQL database (we'll set this up)
- Vercel account (already done ✓)
- Node.js installed locally

## Step 1: Set Up PostgreSQL Database

You have several options for hosting PostgreSQL:

### Option A: Vercel Postgres (Recommended - Easiest)

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Click on your `bogen-ai` project
3. Go to the "Storage" tab
4. Click "Create Database"
5. Select "Postgres"
6. Follow the prompts to create the database
7. Vercel will automatically add the `DATABASE_URL` environment variable

### Option B: Neon (Free PostgreSQL)

1. Go to https://neon.tech
2. Sign up for a free account
3. Create a new project
4. Copy the connection string (looks like: `postgresql://user:pass@host/database`)
5. Add this to Vercel environment variables (see Step 2)

### Option C: Supabase (Free PostgreSQL)

1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → Database → Connection String
4. Copy the connection string
5. Add this to Vercel environment variables (see Step 2)

## Step 2: Add Environment Variables to Vercel

1. Go to your Vercel project: https://vercel.com/edmundbogen/bogen-ai
2. Click "Settings" tab
3. Click "Environment Variables"
4. Add these variables:

```
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-random-secret-key-min-32-characters
COOKIE_SECRET=another-random-secret-key
NODE_ENV=production
EMAIL_USER=your-email@gmail.com (optional for now)
EMAIL_PASS=your-app-password (optional for now)
```

**Important:** Click "Redeploy" after adding environment variables

## Step 3: Initialize Database Schema

Once you have a PostgreSQL database, you need to create the tables.

### Option 1: Using a Database Client (Easiest)

1. Download a PostgreSQL client like:
   - **pgAdmin** (https://www.pgadmin.org/)
   - **TablePlus** (https://tableplus.com/)
   - **DBeaver** (https://dbeaver.io/)

2. Connect to your database using the connection string
3. Open `database/schema.sql` from this project
4. Run the entire SQL script

### Option 2: Using Command Line

If you have `psql` installed:

```bash
psql "your-database-connection-string" < database/schema.sql
```

## Step 4: Create Your Admin Account

After the database is set up, create your admin login:

```bash
# Set your database URL
export DATABASE_URL="your-database-connection-string"

# Run the admin creation script
node scripts/create-admin.js
```

Follow the prompts to enter:
- Your name (e.g., "Edmund Bogen")
- Your email (e.g., "edmund@bogen.ai")
- Your password (minimum 8 characters)

## Step 5: Test the Application

1. **Partner Portal:** https://bogen-ai.vercel.app/partner-portal
2. **Admin Dashboard:** https://bogen-ai.vercel.app/admin-dashboard

Try logging in with the admin credentials you just created!

## Step 6: Workflow

### When Someone Applies to Be a Partner:

1. They fill out the form at `/contact` (Partner tab)
2. It creates a record in the database with `status: 'pending'`
3. You log into `/admin-dashboard`
4. Go to the "Partners" tab
5. Click "Approve" on their application
6. They receive an email and can now log into `/partner-portal`

### When a Partner Refers a Client:

1. Partner shares their unique referral link (e.g., `bogen.ai/?ref=ABC123`)
2. Client fills out the contact form
3. The referral is tracked in the database
4. You log into `/admin-dashboard`
5. Go to the "Clients" tab
6. Click "Activate" on the client
7. Enter their monthly revenue (e.g., $1000)
8. System automatically calculates 20% commission ($200/month)
9. Partner can see this in their dashboard

## Troubleshooting

### "Page Not Found" Error

This usually means the database isn't connected. Check:
- Environment variable `DATABASE_URL` is set in Vercel
- Database tables are created (run schema.sql)
- Redeploy your Vercel app after adding environment variables

### "Internal Server Error"

Check Vercel logs:
1. Go to your Vercel project
2. Click "Deployments" tab
3. Click on the latest deployment
4. Click "View Function Logs"

### Database Connection Issues

- Make sure the DATABASE_URL includes the full connection string
- For SSL connections (production), the format is:
  `postgresql://user:pass@host:port/db?sslmode=require`

## Quick Start (Recommended Order)

1. ✅ GitHub repo created
2. ✅ Vercel deployed
3. ⬜ Set up PostgreSQL database (Vercel Postgres recommended)
4. ⬜ Add DATABASE_URL to Vercel environment variables
5. ⬜ Run `database/schema.sql` to create tables
6. ⬜ Run `node scripts/create-admin.js` to create your admin account
7. ⬜ Redeploy Vercel app
8. ⬜ Test login at `/admin-dashboard`

## Need Help?

If you run into issues, check:
- Vercel deployment logs
- Database connection string format
- Environment variables are saved and redeployed
