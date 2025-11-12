# How Bogen.ai Website Works - Simple Explanation

**Date:** November 12, 2025
**For:** Edmund & Eytan
**Purpose:** Understanding how all the pieces fit together

---

## The Big Picture (Simple Version)

Think of your website like a restaurant:
- **GitHub** = The recipe book (where all your code/recipes are stored)
- **Vercel** = The restaurant kitchen (where the food is actually made and served)
- **Neon** = The walk-in refrigerator (where all your data is stored)
- **Your Computer** = The chef's office (where you test recipes before serving to customers)

---

## The 4 Main Components

### 1. GitHub (Code Storage)
**What it is:** A place to store and track changes to your code
**Website:** https://github.com/edmundbogen/bogen-ai

**What's stored there:**
- All your website HTML files (the pages people see)
- Server code (the backend that handles requests)
- Database migration files (instructions to set up your database)
- CSS styles (how your website looks)
- JavaScript (interactive features)

**Think of it as:**
- A Google Drive for code
- Every time you save changes, it keeps a history
- You can go back to any previous version if something breaks

**How it works:**
```
Your Computer → Git Commit → GitHub → Vercel (automatically deploys)
```

---

### 2. Vercel (Website Hosting)
**What it is:** The service that makes your website available on the internet
**Website:** https://vercel.com
**Your site:** https://bogen.ai

**What it does:**
1. Watches your GitHub repository for changes
2. When you push new code, it automatically:
   - Downloads the new code
   - Builds the website
   - Deploys it live (usually takes 30-60 seconds)
3. Serves your website to visitors 24/7

**Think of it as:**
- A web server that's always running
- Handles millions of visitors without you managing servers
- Automatically scales up if you get lots of traffic

**How visitors see your site:**
```
Someone types bogen.ai → Vercel receives request → Vercel sends back your website
```

---

### 3. Neon (Database Hosting)
**What it is:** A PostgreSQL database hosted in the cloud
**Website:** https://neon.tech
**Your database:** neondb

**What's stored there:**
- Partners and their referral information
- Clients and leads
- Mastermind event details
- Blog posts
- Homepage content sections
- User accounts (for admin access)

**Think of it as:**
- A super-organized filing cabinet
- Each piece of information has its own slot
- Lightning-fast to search and retrieve

**How it connects:**
```
Your Website (Vercel) ← Internet → Neon Database
                ↑
         (secure connection)
```

Your website code on Vercel connects to Neon using a special URL (stored in `.env` file):
```
DATABASE_URL=postgresql://username:password@server-address/neondb
```

---

### 4. Your Local Computer (Development)
**What it is:** Where you test changes before they go live

**What you do here:**
1. Write/edit code
2. Run the server locally: `npm run dev`
3. Test at http://localhost:3000
4. When it looks good, push to GitHub
5. GitHub automatically tells Vercel to update

**Think of it as:**
- Your test kitchen
- Make sure the recipe works before serving to customers

---

## How the Content Management System (CMS) Works

### Before CMS (The Old Way):
```
1. Edmund wants to update mastermind date
2. Opens HTML file in code editor
3. Finds the right line of code
4. Edits the text
5. Saves file
6. Uses Git to commit changes
7. Pushes to GitHub
8. Waits for Vercel to deploy
9. Checks if it looks right
Total time: 15+ minutes
```

### With CMS (The New Way):
```
1. Edmund goes to /admin-content
2. Changes date in the form
3. Clicks "Save Changes"
4. Database updates instantly
5. Website shows new date immediately
Total time: 2 minutes
```

### How CMS Works Behind the Scenes:

**Step 1: You Edit Content**
```
You → Admin Page (/admin-content) → Fill out form → Click Save
```

**Step 2: Data Saves to Database**
```
Browser → API Call → Server (Vercel) → Database (Neon)
                         ↓
                  Saves mastermind event
```

**Step 3: Website Shows Updated Content**
```
Visitor → Loads Homepage → Server fetches from Database → Shows new content
```

**Key Point:** The HTML files NO LONGER have hardcoded content. Instead, they have placeholders that get filled with data from the database.

---

## The Full Request Flow

### When someone visits bogen.ai:

**Step 1: Browser Request**
```
User types "bogen.ai" → DNS looks up IP address → Finds Vercel server
```

**Step 2: Vercel Receives Request**
```
Vercel: "They want the homepage. Let me run server.js"
```

**Step 3: Server Runs**
```javascript
// server.js on Vercel
app.get('/', (req, res) => {
  res.sendFile('index.html')  // Sends the HTML page
})
```

**Step 4: HTML Loads, JavaScript Runs**
```javascript
// JavaScript in the page
fetch('/api/mastermind/event-config')  // Gets current event from database
  .then(data => {
    // Updates the page with database content
    document.getElementById('event-title').textContent = data.eventTitle
  })
```

**Step 5: Database Query**
```
Server → Neon Database: "Give me the current mastermind event"
Neon → Server: "Here's the data: {title: 'EXPANSION', date: '2025-11-12', ...}"
Server → Browser: Sends JSON data
Browser: Updates the page with the data
```

**Step 6: User Sees Page**
```
Browser displays fully-rendered page with live database content
```

**Total time:** Usually under 200 milliseconds

---

## Different Environments

### 1. Local Development (Your Computer)
```
URL: http://localhost:3000
Purpose: Testing changes before they go live
Database: Connected to Neon (same database as production)
Server: Running on your computer (npm run dev)
```

### 2. Production (Live Website)
```
URL: https://bogen.ai
Purpose: What customers/visitors see
Database: Neon
Server: Running on Vercel
```

**Important:** They use the SAME database. So when you test locally and add a blog post, it will also appear on the live site if you publish it.

---

## How Changes Get Deployed

### Code Changes (HTML, CSS, JavaScript):
```
1. Edit files on your computer
2. git add .
3. git commit -m "description"
4. git push
5. GitHub receives the changes
6. Vercel detects the push
7. Vercel automatically:
   - Downloads new code
   - Runs build process
   - Deploys to bogen.ai
   - Takes about 30-60 seconds
8. Website is updated
```

### Content Changes (via CMS):
```
1. Go to /admin-content or /admin-blog
2. Edit the content
3. Click "Save"
4. JavaScript sends data to API
5. Server saves to Neon database
6. Website immediately shows new content
   (no deployment needed!)
```

---

## File Structure Explained

```
bogen-ai/
├── server.js                    # Main server file - routes traffic
├── package.json                 # List of dependencies (libraries)
├── .env                         # Secret keys & database URL (NOT in GitHub)
│
├── server/
│   ├── routes/
│   │   ├── auth.js             # Login/logout
│   │   ├── cms.js              # CMS API (mastermind, content, blog)
│   │   ├── blog.js             # Public blog API
│   │   ├── partners.js         # Partner program
│   │   └── ...                 # Other features
│   ├── config/
│   │   └── database.js         # Database connection setup
│   └── middleware/
│       └── auth.js             # Checks if user is logged in
│
├── views/                       # HTML pages
│   ├── index.html              # Homepage
│   ├── admin-content.html      # CMS interface
│   ├── admin-blog.html         # Blog management
│   ├── blog.html               # Public blog listing
│   └── blog-post.html          # Individual blog post
│
├── public/                      # Static files (CSS, images, JS)
│   ├── css/
│   │   └── global.css          # Website styles
│   ├── images/                 # Photos, logos, etc.
│   └── js/
│       └── common.js           # Shared JavaScript
│
└── database/
    └── migrations/              # Database setup scripts
        ├── 001_create_cms_tables.sql
        └── 002_create_blog_tables.sql
```

---

## Key Technologies

### Backend (Server):
- **Node.js** - JavaScript runtime (runs server code)
- **Express.js** - Web framework (handles routes and requests)
- **PostgreSQL** - Database system (stores data)

### Frontend (What users see):
- **HTML** - Structure of pages
- **CSS** - Styling and layout
- **Vanilla JavaScript** - Interactivity (no frameworks like React)

### Tools:
- **Git** - Version control (tracks changes)
- **npm** - Package manager (installs libraries)
- **nodemon** - Auto-restarts server when you make changes (development)

---

## Common Scenarios

### Scenario 1: "I want to update the mastermind date"

**Old way (before CMS):**
1. Open `views/index.html` in code editor
2. Find line 338: `Next Mastermind: Wednesday, Nov 12, 2025`
3. Change to new date
4. Save file
5. Git commit and push
6. Wait for Vercel to deploy

**New way (with CMS):**
1. Go to http://localhost:3000/admin-content or https://bogen.ai/admin-content
2. Update the date in the form
3. Click "Save Changes"
4. Done! (Updates immediately)

---

### Scenario 2: "I want to write a blog post"

**Steps:**
1. Go to /admin-blog
2. Click "+ New Blog Post"
3. Fill in:
   - Title (e.g., "5 Ways AI Transforms Real Estate")
   - Content (write in HTML or plain text)
   - Categories (select from checkboxes)
   - Status: change to "Published"
4. Click "Save Post"
5. Post appears on /blog instantly
6. Share the URL: https://bogen.ai/blog/5-ways-ai-transforms-real-estate

---

### Scenario 3: "The website is down or showing an error"

**Troubleshooting checklist:**

1. **Check Vercel:**
   - Go to https://vercel.com/dashboard
   - Look for red error indicators
   - Check deployment logs

2. **Check Neon:**
   - Go to https://neon.tech
   - Make sure database is active (not paused)
   - Neon auto-pauses if unused for 7 days (free tier)

3. **Check your code:**
   - Recent GitHub commit might have broken something
   - Look at Vercel deployment logs for errors
   - Roll back to previous working version if needed

4. **Common fixes:**
   - Restart Neon database if paused
   - Redeploy on Vercel (trigger new deployment)
   - Check environment variables in Vercel match your `.env` file

---

## Environment Variables (Secrets)

These are stored in `.env` file locally and in Vercel settings:

```bash
# Database connection
DATABASE_URL=postgresql://username:password@neon-server/neondb

# JWT secret (for login sessions)
JWT_SECRET=some-random-string

# Cookie secret
COOKIE_SECRET=another-random-string

# Environment
NODE_ENV=production  (on Vercel)
NODE_ENV=development (on your computer)
```

**Important:**
- `.env` file is NOT pushed to GitHub (security)
- You must manually add these to Vercel dashboard
- Vercel settings: Settings → Environment Variables

---

## Database Tables Structure

### CMS Tables:
```
mastermind_events
├── event_id (unique number)
├── event_title (text)
├── event_date (date)
├── event_time_start (time)
├── zoom_link (text)
├── description (long text)
├── key_points (JSON array)
├── benefits (JSON array)
└── is_published (true/false)

content_sections
├── section_id
├── page (e.g., "homepage")
├── section_key (e.g., "hero_tagline")
├── content (the actual text)
└── updated_at
```

### Blog Tables:
```
blog_posts
├── post_id
├── title
├── slug (URL-friendly, e.g., "my-blog-post")
├── content (HTML)
├── author_name
├── status (draft/published/archived)
├── published_at
└── is_featured

blog_categories
├── category_id
├── name (e.g., "AI & Technology")
└── slug (e.g., "ai-technology")

blog_post_categories (links posts to categories)
├── post_id
└── category_id
```

---

## API Endpoints (How the Frontend Talks to Backend)

### Public Endpoints (no login required):
```
GET /api/blog/posts              → Get list of published blog posts
GET /api/blog/posts/:slug        → Get single blog post
GET /api/mastermind/event-config → Get current mastermind event
```

### Admin Endpoints (login required):
```
# CMS
GET    /api/cms/mastermind/current       → Get current event
PUT    /api/cms/mastermind/events/:id    → Update event
GET    /api/cms/content                  → Get content sections
PUT    /api/cms/content/bulk             → Update multiple sections

# Blog Management
GET    /api/cms/blog/posts               → Get all posts (including drafts)
POST   /api/cms/blog/posts               → Create new post
PUT    /api/cms/blog/posts/:id           → Update post
DELETE /api/cms/blog/posts/:id           → Delete post
GET    /api/cms/blog/categories          → Get categories
```

---

## Security

### Authentication:
- Admin pages require login (JWT tokens)
- Tokens stored in cookies (httpOnly for security)
- Passwords hashed with bcrypt (can't be reversed)

### Database:
- Connection uses SSL (encrypted)
- Database credentials in environment variables (not in code)
- SQL injection protection (parameterized queries)

### HTTPS:
- All traffic encrypted via Vercel's SSL certificates
- Vercel automatically handles SSL/TLS

---

## Maintenance & Monitoring

### Daily:
- Nothing! Website runs on autopilot

### Weekly:
- Check Vercel dashboard for any errors
- Make sure Neon database is active (might auto-pause on free tier)

### Monthly:
- Review analytics (if you add them)
- Check for security updates in npm packages

### When Making Changes:
1. Test locally first (http://localhost:3000)
2. Push to GitHub
3. Monitor Vercel deployment (2-3 minutes)
4. Check live site to confirm changes

---

## Costs & Billing

### Current Setup:

**GitHub:**
- Free for public repositories
- Your repo is public: https://github.com/edmundbogen/bogen-ai

**Vercel:**
- Free tier: Unlimited bandwidth, 100 GB hours/month
- Your usage is well within free tier
- Cost if you exceed: $20/month for Pro plan

**Neon:**
- Free tier: 0.5 GB storage, 1 compute
- Database auto-pauses after 7 days of inactivity (free tier)
- Cost if you upgrade: $19/month for paid plan

**Current Total: $0/month** (all on free tiers)

---

## What Happens When...

### Someone visits bogen.ai:
```
1. DNS resolves to Vercel's servers
2. Vercel runs your server.js
3. Server sends index.html
4. Browser loads HTML, CSS, JavaScript
5. JavaScript fetches data from Neon database
6. Page displays with live content
7. Total time: ~200-500ms
```

### You update content via CMS:
```
1. You edit form at /admin-content
2. Click "Save Changes"
3. JavaScript sends POST request to /api/cms/...
4. Server validates you're logged in
5. Server saves to Neon database
6. Server responds "Success"
7. Your browser shows success message
8. Next visitor sees updated content
9. Total time: ~100ms
```

### You push code changes:
```
1. git push from your computer
2. GitHub receives the code
3. GitHub webhook notifies Vercel
4. Vercel starts build:
   - Clones your repository
   - Runs npm install (installs dependencies)
   - Prepares files for deployment
5. Vercel deploys to edge network
6. Live site updates
7. Total time: 30-90 seconds
```

---

## Troubleshooting Guide

### "Page not found" Error:
**Cause:** Server not running or route doesn't exist
**Fix:**
1. Check server is running: `npm run dev`
2. Restart server if needed
3. Check route exists in `server.js`

### "Database connection error":
**Cause:** Neon database paused or credentials wrong
**Fix:**
1. Log into https://neon.tech
2. Check if database is paused → Click "Resume"
3. Check `DATABASE_URL` in `.env` is correct

### "Admin page shows 'not authorized'":
**Cause:** Not logged in or session expired
**Fix:**
1. Go to /admin (login page)
2. Enter credentials
3. Token expires after 24 hours

### "Changes not appearing on live site":
**Cause:** Vercel deployment failed or cached
**Fix:**
1. Check Vercel dashboard for deployment status
2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. Clear browser cache
4. Check if you pushed to GitHub: `git status`

### "Server crashes when I start it":
**Cause:** Missing dependencies or syntax error
**Fix:**
1. Run `npm install` (reinstall dependencies)
2. Check terminal for error messages
3. Look for red error text pointing to specific file/line

---

## Quick Reference Commands

### Starting Server:
```bash
npm run dev              # Development mode (auto-restarts on changes)
npm start                # Production mode
```

### Git Commands:
```bash
git status               # See what changed
git add .                # Stage all changes
git commit -m "message"  # Save changes with description
git push                 # Upload to GitHub
git pull                 # Download latest from GitHub
```

### Database Commands:
```bash
node run-migrations.js   # Run database setup
```

### Checking Status:
```bash
ps aux | grep node       # See if server is running
lsof -i :3000            # See what's using port 3000
kill <process_id>        # Stop a process
```

---

## Summary - The Flow

```
┌─────────────┐
│   GitHub    │  ← You push code changes
│ (Code Repo) │
└──────┬──────┘
       │ (automatic webhook)
       ↓
┌─────────────┐
│   Vercel    │  ← Hosts your website (https://bogen.ai)
│  (Hosting)  │  ← Runs server.js and serves pages
└──────┬──────┘
       │ (database queries)
       ↓
┌─────────────┐
│    Neon     │  ← Stores all your data
│ (Database)  │  ← Partners, blog posts, events, content
└─────────────┘

                    ↑
                    │ (visitors access via browser)
                    │
              ┌───────────┐
              │  Visitor  │
              │ (Browser) │
              └───────────┘
```

---

## Next Steps for You

### For Edmund:
1. ✅ Use /admin-content to manage mastermind events
2. ✅ Use /admin-blog to create blog posts
3. ✅ No need to touch code anymore for content updates

### For Eytan:
1. Review this document
2. Set up Vercel deployment (if not already done)
3. Add environment variables to Vercel
4. Monitor for any errors in production
5. Optional: Set up error tracking (e.g., Sentry)

### Together:
1. Decide on content update workflow
2. Set up automated backups for Neon database (Neon has built-in backups)
3. Consider upgrading Neon if database pausing is annoying (free tier pauses after 7 days idle)

---

## Questions to Discuss

1. **Backups:** Should we set up automatic database backups? (Neon has point-in-time recovery)
2. **Monitoring:** Do we want error alerts? (e.g., email if site goes down)
3. **Analytics:** Should we add Google Analytics or similar?
4. **Upgrades:** Is the free tier sufficient or should we upgrade Neon to prevent auto-pause?
5. **Access:** Does Eytan need admin CMS access too? (can create separate login)

---

**Document Version:** 1.0
**Last Updated:** November 12, 2025
**Prepared by:** Claude Code
**Review with:** Eytan Benzeno
