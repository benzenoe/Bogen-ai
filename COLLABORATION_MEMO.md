# Collaboration Memo: bogen.ai Access & Setup

**Date:** December 26, 2025
**From:** Edmund Bogen
**To:** Eytan Benzeno
**Subject:** Full Access Setup for bogen.ai Website Management

---

## Overview

This memo outlines all the tools, accounts, and steps required for Eytan to have full access to develop, manage, and deploy the bogen.ai website. Both parties should retain this document for reference.

---

## Required Accounts & Services

| Service | Purpose | Account Needed |
|---------|---------|----------------|
| GitHub | Code repository & version control | GitHub account |
| Vercel | Website hosting & deployment | Vercel account |
| Neon | PostgreSQL database | Neon account (or shared access) |
| Anthropic | AI chatbot functionality | Anthropic API account |
| Claude Code | AI-assisted development | Anthropic account |

---

## Step-by-Step Access Setup

### 1. GitHub Repository Access

**Repository:** `github.com/edmundbogen/bogen-ai`

**Edmund's Action:**
1. Go to https://github.com/edmundbogen/bogen-ai
2. Click **Settings** (top navigation)
3. Click **Collaborators** (left sidebar under "Access")
4. Click **Add people**
5. Enter Eytan's GitHub username or email
6. Select role: **Admin** (full access)
7. Click **Add [username] to this repository**

**Eytan's Action:**
1. Check email for GitHub invitation
2. Click **Accept invitation**
3. Clone the repository:
   ```bash
   git clone https://github.com/edmundbogen/bogen-ai.git
   cd bogen-ai
   ```

---

### 2. Vercel Deployment Access

**Project:** bogen-ai (hosted at bogen.ai)

**Edmund's Action:**
1. Go to https://vercel.com/dashboard
2. Click on your avatar (top right) → **Create Team** (if not already in a team)
3. Name the team (e.g., "Bogen AI Team")
4. Go to **Team Settings** → **Members**
5. Click **Invite Member**
6. Enter Eytan's email
7. Select role: **Owner** or **Member** (Owner for full access)
8. Transfer the bogen-ai project to the team if needed

**Eytan's Action:**
1. Create Vercel account at https://vercel.com (if needed)
2. Check email for team invitation
3. Accept invitation
4. Access project at Vercel dashboard

---

### 3. Neon Database Access

**Database Host:** `ep-wispy-feather-a4zusv7l-pooler.us-east-1.aws.neon.tech`

**Edmund's Action:**
1. Go to https://console.neon.tech
2. Select the bogen-ai project
3. Click **Settings** → **Sharing**
4. Click **Add collaborator**
5. Enter Eytan's email
6. Select permission level: **Admin** (full access)

**Eytan's Action:**
1. Create Neon account at https://neon.tech (if needed)
2. Check email for collaboration invitation
3. Accept invitation
4. Access database from Neon console

---

### 4. Environment Variables

The `.env` file contains sensitive credentials needed to run the site locally.

**Edmund's Action:**
Share the following environment variables securely (via Signal, iMessage, or password manager - NOT email):

```
PORT=3000
NODE_ENV=development
DATABASE_URL=[full connection string]
DB_HOST=[database host]
DB_PORT=5432
DB_NAME=[database name]
DB_USER=[database user]
DB_PASSWORD=[database password]
JWT_SECRET=[secret key]
EMAIL_HOST=[email server]
EMAIL_PORT=587
EMAIL_USER=[email account]
EMAIL_PASSWORD=[email password]
EMAIL_FROM=info@bogen.ai
BASE_URL=https://bogen.ai
COOKIE_SECRET=[cookie secret]
MIGRATION_SECRET=[migration secret]
ANTHROPIC_API_KEY=[API key - or Eytan uses his own]
```

**Eytan's Action:**
1. Create a file named `.env` in the project root
2. Paste the environment variables Edmund shared
3. Never commit this file to GitHub (it's already in .gitignore)

---

### 5. Anthropic API Access (for AI Chatbot)

**Option A: Share Edmund's API Key**
- Include `ANTHROPIC_API_KEY` in the .env file shared above

**Option B: Eytan Uses His Own Key (Recommended)**
1. Go to https://console.anthropic.com
2. Create account or sign in
3. Go to **API Keys** → **Create Key**
4. Copy the key and add to your local `.env` file

---

### 6. Claude Code Setup

Each person uses their own Claude Code installation.

**Eytan's Action:**
1. Install Claude Code: https://claude.ai/code
2. Authenticate with your Anthropic account
3. Navigate to the cloned repository
4. Run Claude Code from the project directory

---

## Local Development Setup

Once Eytan has all access, run these commands to start developing:

```bash
# Navigate to project
cd bogen-ai

# Install dependencies
npm install

# Start development server
npm run dev

# Site will be available at http://localhost:3000
```

---

## Deployment Workflow

### Making Changes
1. Make code changes locally
2. Test at `http://localhost:3000`
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```
4. Vercel automatically deploys when code is pushed to `main` branch

### Manual Deployment (if needed)
```bash
vercel --prod
```

---

## Key Project Files

| File/Folder | Purpose |
|-------------|---------|
| `server.js` | Main application server |
| `views/` | EJS templates (HTML pages) |
| `public/` | Static assets (CSS, JS, images) |
| `database/` | Database schemas and initialization |
| `config/` | Configuration files |
| `.env` | Environment variables (not in repo) |

---

## Communication & Workflow

**Recommended Practices:**
- Create feature branches for major changes: `git checkout -b feature/new-feature`
- Use pull requests for code review when needed
- Communicate before making major structural changes
- Keep `.env` file secure and never share via email

---

## Access Checklist

**Edmund - Complete these steps:**
- [ ] Add Eytan to GitHub repository (Admin role)
- [ ] Create Vercel team and invite Eytan
- [ ] Add Eytan to Neon database project
- [ ] Share .env file securely

**Eytan - Complete these steps:**
- [ ] Accept GitHub repository invitation
- [ ] Accept Vercel team invitation
- [ ] Accept Neon database invitation
- [ ] Create local .env file with shared credentials
- [ ] Clone repository and run `npm install`
- [ ] Test local development with `npm run dev`
- [ ] Set up Claude Code for AI-assisted development

---

## Support Contacts

- **GitHub Issues:** github.com/edmundbogen/bogen-ai/issues
- **Vercel Support:** vercel.com/support
- **Neon Support:** neon.tech/docs

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| Dec 26, 2025 | Edmund Bogen | Initial memo created |

---

*This document should be updated as access requirements change.*
