# Bogen.ai Content Management System - Setup Guide

## What is This?

You now have a **Content Management System (CMS)** that allows you to edit website content without touching code or using Claude Code!

### What You Can Edit:

✅ **Mastermind Events**
- Event title, subtitle, date, and time
- Zoom links and meeting details
- Event description
- Key points and benefits
- Display options (show day only, time range, etc.)

✅ **Homepage Content**
- Hero tagline
- Video + Mastermind boxes text
- YouTube video URL

## Setup Instructions

### Step 1: Run Database Migration

You need to create the database tables first. Run this command:

```bash
cd /Users/edmundbogen/bogen-ai
psql -U your_db_user -d bogenai -f database/migrations/001_create_cms_tables.sql
```

Replace `your_db_user` with your actual PostgreSQL username (usually from your `.env` file).

**Alternative:** If you have your database credentials in `.env`, you can use:

```bash
psql $DATABASE_URL -f database/migrations/001_create_cms_tables.sql
```

### Step 2: Start Your Server

```bash
npm run dev
```

or

```bash
npm start
```

### Step 3: Access the CMS

1. Open your browser and go to: **http://localhost:3000/admin-content**

2. You'll see two tabs:
   - **Mastermind Event** - Edit event details
   - **Homepage Content** - Edit homepage text

3. Make your changes and click "Save Changes"

4. Your changes are **immediately live** on the website!

## How to Use the CMS

### Editing Mastermind Events

1. Go to http://localhost:3000/admin-content
2. Click the "Mastermind Event" tab (it's already selected by default)
3. Fill in the form:
   - **Event Title**: e.g., "EXPANSION: LICENSE TO MULTIPLY MARKETS"
   - **Event Date**: Pick the date from the calendar
   - **Start Time**: e.g., 09:00
   - **Display Options**:
     - Check "Show day only" to display "Wednesday" instead of "Wednesday, November 12, 2025"
     - Check "Show time range" to display "9:00-10:00 AM" instead of just "9:00 AM"
   - **Zoom Link**, **Meeting ID**, **Passcode**: Enter meeting details
   - **Description**: Main event description
   - **Key Points**: Use the "+ Add Key Point" button to add items
   - **Benefits**: Use the "+ Add Benefit" button to add items

4. Click "Save Changes"
5. Done! Check your website to see the updates

### Editing Homepage Content

1. Go to http://localhost:3000/admin-content
2. Click the "Homepage Content" tab
3. Edit any of these fields:
   - **Main Tagline**: The hero section text
   - **Left Box - Line 1**: First line of the left box (e.g., "You need AI.")
   - **Left Box - Line 2**: Second line (e.g., "You need Edmund Bogen")
   - **Right Box - Line 1**: First line of the right box (e.g., "Next Mastermind: Wednesday")
   - **Right Box - Line 2**: Second line (e.g., "9:00 AM Eastern Time")
   - **YouTube Video Embed URL**: The video URL

4. Click "Save Homepage Changes"
5. Done! Refresh your homepage to see the changes

## What Changed Behind the Scenes

### Database
- Created 2 new tables: `mastermind_events` and `content_sections`
- Your current mastermind event from `config/mastermind-event.json` is imported automatically

### API
- Added `/api/cms/*` endpoints for content management
- Updated `/api/mastermind/event-config` to pull from database instead of JSON file

### Frontend
- Created `/admin-content` page with forms to edit content
- Existing website continues to work exactly the same (pulls from database now)

## Troubleshooting

### "Database error" when saving
- Make sure you ran the migration SQL file (Step 1 above)
- Check that your PostgreSQL database is running
- Verify your `.env` file has correct database credentials

### "Event not found" error
- The database might be empty. Run the migration again to seed initial data
- Or create a new event from scratch using the form

### Changes don't appear on website
- Hard refresh your browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Check that "Publish event" is checked in the form
- Make sure your server is running

## Security Note

The CMS uses your existing admin authentication system (`authenticateAdmin` middleware). Only logged-in admins can access `/admin-content` and the CMS API endpoints.

## Next Steps

You can now update your website content anytime without:
- Opening Claude Code
- Editing HTML files
- Running git commands
- Deploying code

Just log in to `/admin-content`, make your changes, and click Save!

---

**Questions?** Ask Eytan or check the database logs for any errors.
