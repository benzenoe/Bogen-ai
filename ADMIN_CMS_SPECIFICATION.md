# Bogen.ai Content Management System (CMS) Specification

**Document Version:** 1.0
**Date:** November 12, 2025
**Prepared For:** Eytan Benzeno (Technical Implementation)
**Requested By:** Edmund Bogen

---

## Executive Summary

Edmund requires a user-friendly admin interface to update website content without accessing code or Claude Code. This specification outlines the extension of the existing admin dashboard (`/admin`) to include comprehensive content management capabilities.

### Key Objective
Enable Edmund to independently manage:
- Mastermind event details (date, time, description, links)
- Homepage content (hero text, feature boxes, CTAs)
- Service descriptions and pricing
- Team bios and photos
- Testimonials and social proof
- Video library entries

---

## Current System Analysis

### Existing Infrastructure
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Authentication:** JWT + bcryptjs (already implemented)
- **Admin Dashboard:** `/admin` with partner/client management
- **Config Storage:** `/config/mastermind-event.json` (file-based)

### Existing Routes (To Extend)
```javascript
/api/admin/*              // Already has authenticateAdmin middleware
/api/mastermind/event-config  // Reads from JSON file
```

### Existing Admin Functionality
✅ Partner approval/management
✅ Client tracking
✅ Referral management
⚠️ **Missing:** Content management for website pages

---

## Feature Requirements

### Phase 1: Mastermind Event Management (High Priority)
**Current State:** Content stored in `config/mastermind-event.json`
**New State:** Move to PostgreSQL + admin UI for editing

#### Editable Fields:
- Event title (e.g., "EXPANSION: LICENSE TO MULTIPLY MARKETS")
- Event subtitle (e.g., "The Geographic Domination Session")
- Event date (date picker)
- Event time (time picker with timezone)
- Event day of week display (e.g., "Wednesday")
- Display format options:
  - Show full date vs. day only
  - Show time range vs. start time only
- Zoom link
- Meeting ID & passcode
- Workbook/document links
- Event description (rich text editor)
- Key points (list editor - add/remove/reorder)
- Benefits (list editor)
- Featured image upload

#### UI Components Needed:
- Date/time picker
- Rich text editor (TinyMCE or Quill.js)
- List editor with drag-to-reorder
- Image uploader with preview
- "Publish Changes" button with confirmation
- Preview mode showing how it looks on homepage

---

### Phase 2: Homepage Content Management

#### Section: Hero Text
**Location:** `views/index.html` - `.masthead-tagline`

Editable fields:
- Main tagline (currently: "Your AI Front Office. Always On. Always Professional.")
- Subheadline (if applicable)

#### Section: Video + Event Boxes
**Location:** `views/index.html` - Edmund's Mastermind Video Section

Editable fields:
- Left box heading (currently: "You need AI. You need Edmund Bogen")
- Right box heading (currently: "Next Mastermind: Wednesday")
- Right box time (currently: "9:00 AM Eastern Time")
- YouTube video embed URL
- Mastermind expansion image upload
- Box styling options (colors, font sizes)

#### Section: About Edmund
**Location:** `views/index.html` - Introduction Section

Editable fields:
- Main heading
- Paragraph 1 (bio intro)
- Paragraph 2 (achievements)
- Quote/testimonial
- Photo upload
- CTA button text & link

#### Section: About Eytan
Editable fields:
- Same structure as Edmund section

#### Section: Service Categories
**Location:** `views/index.html` - Services Overview Grid

Editable for each of 5 categories:
- Icon/emoji
- Category title
- Service count
- Description
- CTA button text
- Link URL

---

### Phase 3: Service Pages Management

Each service category page (`/services/*`) needs:
- Page title
- Hero description
- Service list (each service has):
  - Name
  - Description
  - Pricing (optional)
  - Features list
  - "Learn More" content (expandable)
- Order/priority for display

---

### Phase 4: Testimonials & Social Proof

**Location:** Multiple pages

Manage testimonials with:
- Client quote (text)
- Client name
- Client company/title
- Star rating (1-5)
- Display status (active/inactive)
- Featured flag (show on homepage)
- Order priority

---

### Phase 5: Video Library Management

**Current Route:** `/api/videos/*` (already exists)
**Enhancement Needed:** Admin UI for CRUD operations

Editable fields per video:
- Title
- Description
- YouTube URL
- Thumbnail (auto-extract or upload)
- Category/tags
- Featured flag
- Publish date
- Display order

---

## Technical Architecture

### Database Schema Extensions

#### Table: `content_sections`
Stores general page content that can be edited.

```sql
CREATE TABLE content_sections (
  section_id SERIAL PRIMARY KEY,
  page VARCHAR(100) NOT NULL,           -- 'homepage', 'about', 'services', etc.
  section_key VARCHAR(100) NOT NULL,    -- 'hero_tagline', 'edmund_bio', etc.
  section_type VARCHAR(50) NOT NULL,    -- 'text', 'rich_text', 'image', 'list', 'json'
  content TEXT,                         -- Actual content (JSON for complex types)
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  updated_by INTEGER REFERENCES partners(partner_id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page, section_key)
);

CREATE INDEX idx_content_sections_page ON content_sections(page);
```

#### Table: `mastermind_events`
Move from JSON file to database for better management.

```sql
CREATE TABLE mastermind_events (
  event_id SERIAL PRIMARY KEY,
  event_title VARCHAR(255) NOT NULL,
  event_subtitle VARCHAR(255),
  event_date DATE NOT NULL,
  event_time_start TIME NOT NULL,
  event_time_end TIME,
  event_timezone VARCHAR(50) DEFAULT 'America/New_York',

  -- Display options
  show_full_date BOOLEAN DEFAULT true,
  show_day_only BOOLEAN DEFAULT false,
  show_time_range BOOLEAN DEFAULT true,

  -- Meeting details
  zoom_link TEXT,
  meeting_id VARCHAR(50),
  passcode VARCHAR(50),
  workbook_link TEXT,

  -- Content
  description TEXT,
  key_points JSONB,                     -- Array of strings
  benefits JSONB,                       -- Array of strings
  featured_image_url TEXT,

  -- Status
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,    -- Show on homepage
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES partners(partner_id)
);

CREATE INDEX idx_mastermind_events_date ON mastermind_events(event_date DESC);
```

#### Table: `testimonials`
```sql
CREATE TABLE testimonials (
  testimonial_id SERIAL PRIMARY KEY,
  client_name VARCHAR(255) NOT NULL,
  client_company VARCHAR(255),
  client_title VARCHAR(255),
  quote TEXT NOT NULL,
  star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,    -- Show on homepage
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table: `service_categories`
```sql
CREATE TABLE service_categories (
  category_id SERIAL PRIMARY KEY,
  category_name VARCHAR(255) NOT NULL,
  icon_emoji VARCHAR(50),
  service_count INTEGER DEFAULT 0,
  description TEXT,
  cta_text VARCHAR(100),
  cta_link VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table: `services`
```sql
CREATE TABLE services (
  service_id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES service_categories(category_id),
  service_name VARCHAR(255) NOT NULL,
  description TEXT,
  features JSONB,                       -- Array of feature strings
  pricing_info TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Endpoints

### Mastermind Event Management

```javascript
// Get current/upcoming event
GET /api/admin/mastermind/current
Response: { event: { ...eventData } }

// Get all events (with pagination)
GET /api/admin/mastermind/events?page=1&limit=10
Response: { events: [...], total: 50, page: 1 }

// Get single event
GET /api/admin/mastermind/events/:id
Response: { event: { ...eventData } }

// Create new event
POST /api/admin/mastermind/events
Body: { event_title, event_date, event_time_start, ... }
Response: { event_id: 123, message: "Event created" }

// Update event
PUT /api/admin/mastermind/events/:id
Body: { event_title, description, ... }
Response: { message: "Event updated" }

// Delete event
DELETE /api/admin/mastermind/events/:id
Response: { message: "Event deleted" }

// Publish/unpublish event
POST /api/admin/mastermind/events/:id/publish
Body: { is_published: true }
Response: { message: "Event published" }
```

### Content Section Management

```javascript
// Get content for a page
GET /api/admin/content?page=homepage
Response: { sections: [ { section_key, content, ... } ] }

// Update content section
PUT /api/admin/content/:section_id
Body: { content: "New content here" }
Response: { message: "Content updated" }

// Bulk update (for multiple sections at once)
PUT /api/admin/content/bulk
Body: { updates: [ { section_key, content }, ... ] }
Response: { updated: 5, message: "Content updated" }
```

### Testimonial Management

```javascript
// Get all testimonials
GET /api/admin/testimonials
Response: { testimonials: [...] }

// Create testimonial
POST /api/admin/testimonials
Body: { client_name, quote, star_rating, ... }
Response: { testimonial_id: 123 }

// Update testimonial
PUT /api/admin/testimonials/:id
Body: { quote, star_rating, ... }
Response: { message: "Testimonial updated" }

// Delete testimonial
DELETE /api/admin/testimonials/:id
Response: { message: "Testimonial deleted" }

// Reorder testimonials
PUT /api/admin/testimonials/reorder
Body: { order: [3, 1, 5, 2, 4] }  // Array of testimonial IDs in new order
Response: { message: "Order updated" }
```

### Service Management

```javascript
// Get all service categories
GET /api/admin/services/categories
Response: { categories: [...] }

// Update service category
PUT /api/admin/services/categories/:id
Body: { category_name, description, ... }
Response: { message: "Category updated" }

// Get services in category
GET /api/admin/services/categories/:id/services
Response: { services: [...] }

// Update service
PUT /api/admin/services/:id
Body: { service_name, description, features, ... }
Response: { message: "Service updated" }
```

---

## Frontend UI Components

### Admin Dashboard Enhancements

**New Tab Structure:**
```
📊 Dashboard   |   👥 Partners   |   🤝 Clients   |   🎯 Referrals   |   ✏️ Content   |   📹 Videos
```

### Content Management Tab Layout

```
┌─────────────────────────────────────────────────────┐
│  Content Management                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Quick Actions:                                     │
│  [Edit Homepage]  [Edit Mastermind]  [Edit About]  │
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │  Active Mastermind Event                   │   │
│  │  ────────────────────────────────────────  │   │
│  │  📅 EXPANSION: LICENSE TO MULTIPLY MARKETS │   │
│  │  🗓️  Wednesday, November 12, 2025          │   │
│  │  🕐 9:00-10:00 AM Eastern                  │   │
│  │                                            │   │
│  │  [Edit Event]  [View on Site]             │   │
│  └────────────────────────────────────────────┘   │
│                                                     │
│  Recent Content Updates:                            │
│  • Homepage hero updated 2 days ago                 │
│  • New testimonial added 5 days ago                 │
│  • Service pricing updated 1 week ago               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Mastermind Event Editor

```
┌─────────────────────────────────────────────────────┐
│  Edit Mastermind Event                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Event Title *                                      │
│  [EXPANSION: LICENSE TO MULTIPLY MARKETS        ]  │
│                                                     │
│  Event Subtitle                                     │
│  [The Geographic Domination Session             ]  │
│                                                     │
│  Event Date *           Event Time *                │
│  [📅 Nov 12, 2025]      [🕐 9:00 AM] - [10:00 AM] │
│  Timezone: [America/New_York ▼]                    │
│                                                     │
│  Display Options:                                   │
│  ☑ Show full date on homepage                      │
│  ☐ Show day only (e.g., "Wednesday")               │
│  ☑ Show time range                                 │
│  ☐ Show start time only                            │
│                                                     │
│  Meeting Links                                      │
│  Zoom Link:  [https://us02web.zoom.us/...      ]  │
│  Meeting ID: [839 2479 6230                    ]  │
│  Passcode:   [251112                           ]  │
│  Workbook:   [https://acrobat.adobe.com/...   ]  │
│                                                     │
│  Event Description *                                │
│  ┌─────────────────────────────────────────────┐  │
│  │ [Rich text editor with formatting tools]    │  │
│  │                                             │  │
│  │ While you're referring out clients'...     │  │
│  │                                             │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  Key Points (3 Models)                              │
│  1. [The Full License Model - Complete...      ] ❌│
│  2. [The Strategic Partnership Model...        ] ❌│
│  3. [The Premium Referral Network Model...     ] ❌│
│  [+ Add Key Point]                                 │
│                                                     │
│  Benefits (What You'll Get)                         │
│  1. [Real member case studies from...          ] ❌│
│  2. [Live AI system builds for...              ] ❌│
│  ... (6 items)                                      │
│  [+ Add Benefit]                                   │
│                                                     │
│  Featured Image                                     │
│  [📸 Upload Image]  Current: mastermind-expansion.png│
│  ┌──────────┐                                      │
│  │   📷     │  Preview                             │
│  │  Image   │                                      │
│  └──────────┘                                      │
│                                                     │
│  ────────────────────────────────────────────────  │
│                                                     │
│  [Cancel]  [Save Draft]  [Preview]  [Publish ✓]   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Homepage Content Editor

```
┌─────────────────────────────────────────────────────┐
│  Edit Homepage Content                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Section: Hero Masthead                             │
│  ─────────────────────────────                     │
│  Main Tagline                                       │
│  [Your AI Front Office. Always On...            ]  │
│                                                     │
│  Section: Video + Mastermind Boxes                  │
│  ─────────────────────────────────                 │
│  Left Box Heading                                   │
│  [You need AI.                                  ]  │
│  [You need Edmund Bogen                         ]  │
│                                                     │
│  Right Box Heading                                  │
│  [Next Mastermind: Wednesday                    ]  │
│  [9:00 AM Eastern Time                          ]  │
│                                                     │
│  Font Size: [1.75rem ▼]                            │
│                                                     │
│  YouTube Video URL                                  │
│  [https://www.youtube.com/embed/vqPPkELwcpI    ]  │
│                                                     │
│  ────────────────────────────────────────────────  │
│                                                     │
│  Section: About Edmund                              │
│  ─────────────────────────                         │
│  (Rich text editor with current bio content)        │
│                                                     │
│  Photo                                              │
│  [📸 Upload]  Current: edmund-bogen.png            │
│                                                     │
│  ────────────────────────────────────────────────  │
│                                                     │
│  [Cancel]  [Preview Changes]  [Publish Updates]    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Phases & Timeline

### Phase 1: Database & API Foundation (Week 1)
**Tasks:**
- Create database schema (mastermind_events, content_sections, testimonials tables)
- Run migration scripts
- Build API endpoints for mastermind event CRUD
- Build API endpoints for content sections
- Test API endpoints with Postman/curl

**Deliverables:**
- Migration SQL files
- API route handlers in `/server/routes/`
- API documentation

---

### Phase 2: Mastermind Event Editor (Week 2)
**Tasks:**
- Migrate existing `mastermind-event.json` to database
- Build admin UI for event editing
- Integrate date/time pickers
- Add rich text editor (TinyMCE or Quill)
- Build list editor component (key points, benefits)
- Implement image upload functionality
- Update frontend to fetch from database instead of JSON

**Deliverables:**
- Updated admin dashboard with "Mastermind" tab
- Fully functional event editor
- Homepage dynamically pulls from database

---

### Phase 3: Homepage Content Management (Week 3)
**Tasks:**
- Seed database with current homepage content
- Build content editor UI for homepage sections
- Implement save/preview/publish workflow
- Add validation and error handling
- Test content updates reflect on homepage

**Deliverables:**
- Homepage content editor
- Preview mode
- All homepage sections editable via admin

---

### Phase 4: Service & Testimonial Management (Week 4)
**Tasks:**
- Create service and testimonial management UIs
- Build drag-and-drop reordering
- Implement testimonial CRUD operations
- Add service category/service CRUD
- Test complete workflow

**Deliverables:**
- Testimonial manager
- Service category/service editor
- Reordering functionality

---

### Phase 5: Video Library Enhancement (Week 5)
**Tasks:**
- Enhance existing video management
- Add admin UI for video CRUD
- Implement YouTube thumbnail extraction
- Add category/tagging system

**Deliverables:**
- Complete video library management

---

### Phase 6: Polish & Training (Week 6)
**Tasks:**
- UI/UX refinement
- Add loading states and error messages
- Create user documentation for Edmund
- Record video walkthrough of admin features
- Final testing and bug fixes

**Deliverables:**
- Polished admin interface
- User documentation
- Training video for Edmund

---

## Technical Considerations

### Security
- ✅ Use existing `authenticateAdmin` middleware for all new routes
- ✅ Validate and sanitize all user inputs (use express-validator)
- ✅ Implement CSRF protection for admin forms
- ✅ Log all content changes with user ID and timestamp
- ✅ Sanitize HTML input from rich text editors (prevent XSS)

### Performance
- Cache frequently accessed content (homepage hero, current mastermind event)
- Use database indexes on commonly queried fields
- Implement lazy loading for large lists (pagination)
- Optimize image uploads (resize/compress on server)

### Data Migration
- Create migration script to move `mastermind-event.json` to database
- Seed script for initial content_sections from current HTML
- Backup strategy before major updates

### File Uploads
- Store images in `/public/uploads/` directory
- Generate unique filenames (use nanoid or UUID)
- Validate file types (only allow images)
- Set max file size limit (e.g., 5MB)
- Optional: Integrate with S3 or Cloudflare for CDN

### Rich Text Editor
**Recommended:** Quill.js (lightweight, easy to integrate)
- Allow basic formatting: bold, italic, lists, links
- Sanitize output to prevent XSS
- Store as HTML in database

**Alternative:** TinyMCE (more features, larger bundle)

---

## Frontend Technology Stack

### Existing (Keep)
- Vanilla JavaScript (no framework overhead)
- Fetch API for HTTP requests
- CSS with existing `global.css`

### New Additions
- **Quill.js** - Rich text editor
- **Flatpickr** - Date/time picker
- **Sortable.js** - Drag-and-drop reordering (optional, can be vanilla JS)

---

## Admin User Experience Flow

### Scenario: Updating Next Mastermind Event

1. Edmund logs into `/admin` (already authenticated)
2. Clicks "Content" tab in navigation
3. Sees current mastermind event card with "Edit Event" button
4. Clicks "Edit Event"
5. Form pre-populated with current event details
6. Edmund updates:
   - Date to December 10, 2025
   - Title to "AI MASTERY: Advanced Prompt Engineering"
   - Description text
   - Zoom link
7. Clicks "Preview" to see how it looks
8. Satisfied, clicks "Publish"
9. Confirmation message: "Event updated and published successfully"
10. Homepage immediately reflects new content

**Time to update:** ~2-3 minutes (vs. 15+ minutes with code editing)

---

## Migration Strategy

### Step 1: Database Schema
```sql
-- Run in PostgreSQL
\i database/migrations/001_create_content_tables.sql
\i database/migrations/002_create_mastermind_events.sql
\i database/migrations/003_create_testimonials.sql
\i database/migrations/004_create_services.sql
```

### Step 2: Seed Initial Data
```sql
-- Migrate mastermind-event.json to database
\i database/seeds/001_seed_mastermind_events.sql

-- Seed current homepage content
\i database/seeds/002_seed_homepage_content.sql
```

### Step 3: Update Frontend Routes
```javascript
// OLD (file-based)
GET /api/mastermind/event-config
→ reads config/mastermind-event.json

// NEW (database)
GET /api/mastermind/event-config
→ queries mastermind_events table WHERE is_published = true
```

### Step 4: Deploy Changes
- Test locally
- Deploy database migrations to production
- Deploy updated API routes
- Deploy updated admin UI
- Update frontend to use new API endpoints

---

## Success Metrics

After implementation, Edmund should be able to:

✅ Update mastermind event details in < 3 minutes
✅ Change homepage text without touching code
✅ Add/edit testimonials independently
✅ Update service descriptions and pricing
✅ Upload new team photos
✅ Reorder content sections
✅ Preview changes before publishing
✅ See update history/audit log

**ROI:**
- Save ~2-3 hours/week on content updates
- Reduce dependency on developer for copy changes
- Faster iteration on marketing messaging
- Lower risk of breaking site with code edits

---

## Open Questions for Eytan

1. **Image Storage:** Keep local (`/public/uploads/`) or integrate cloud storage (S3/Cloudflare)?
2. **Rich Text Editor:** Preference for Quill.js vs. TinyMCE?
3. **Content Versioning:** Should we track change history (v1, v2, v3) for rollback capability?
4. **Multi-admin:** Will other team members need admin access? (affects permissions/roles)
5. **Preview Mode:** Static preview in admin UI vs. actual staging environment?
6. **Caching Strategy:** Redis for content caching, or database query caching sufficient?

---

## Next Steps

1. **Review Meeting:** Eytan + Edmund discuss this spec, clarify requirements
2. **Timeline Approval:** Confirm 6-week timeline or adjust scope
3. **Design Mockups:** Create high-fidelity UI mockups for admin screens (optional)
4. **Kickoff:** Begin Phase 1 implementation

---

## Appendix A: Database Migration Scripts

### Migration: Create Content Tables

**File:** `database/migrations/001_create_content_tables.sql`

```sql
-- Content Sections Table
CREATE TABLE content_sections (
  section_id SERIAL PRIMARY KEY,
  page VARCHAR(100) NOT NULL,
  section_key VARCHAR(100) NOT NULL,
  section_type VARCHAR(50) NOT NULL,
  content TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  updated_by INTEGER REFERENCES partners(partner_id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page, section_key)
);

CREATE INDEX idx_content_sections_page ON content_sections(page);
CREATE INDEX idx_content_sections_active ON content_sections(is_active);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_sections_updated_at BEFORE UPDATE
ON content_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE content_sections IS 'Stores editable content sections for various pages';
COMMENT ON COLUMN content_sections.section_type IS 'Types: text, rich_text, image, list, json';
```

### Migration: Create Mastermind Events Table

**File:** `database/migrations/002_create_mastermind_events.sql`

```sql
CREATE TABLE mastermind_events (
  event_id SERIAL PRIMARY KEY,
  event_title VARCHAR(255) NOT NULL,
  event_subtitle VARCHAR(255),
  event_date DATE NOT NULL,
  event_time_start TIME NOT NULL,
  event_time_end TIME,
  event_timezone VARCHAR(50) DEFAULT 'America/New_York',

  -- Display options
  show_full_date BOOLEAN DEFAULT true,
  show_day_only BOOLEAN DEFAULT false,
  show_time_range BOOLEAN DEFAULT true,

  -- Meeting details
  zoom_link TEXT,
  meeting_id VARCHAR(50),
  passcode VARCHAR(50),
  workbook_link TEXT,

  -- Content
  description TEXT,
  key_points JSONB,
  benefits JSONB,
  featured_image_url TEXT,

  -- Status
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES partners(partner_id)
);

CREATE INDEX idx_mastermind_events_date ON mastermind_events(event_date DESC);
CREATE INDEX idx_mastermind_events_published ON mastermind_events(is_published, is_featured);

CREATE TRIGGER update_mastermind_events_updated_at BEFORE UPDATE
ON mastermind_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE mastermind_events IS 'Stores mastermind session details';
COMMENT ON COLUMN mastermind_events.key_points IS 'JSON array of key learning points';
COMMENT ON COLUMN mastermind_events.benefits IS 'JSON array of attendee benefits';
```

---

## Appendix B: Seed Data Script

**File:** `database/seeds/001_seed_mastermind_events.sql`

```sql
-- Insert current mastermind event from JSON config
INSERT INTO mastermind_events (
  event_title,
  event_subtitle,
  event_date,
  event_time_start,
  event_time_end,
  event_timezone,
  show_full_date,
  show_time_range,
  zoom_link,
  meeting_id,
  passcode,
  workbook_link,
  description,
  key_points,
  benefits,
  featured_image_url,
  is_published,
  is_featured
) VALUES (
  'EXPANSION: LICENSE TO MULTIPLY MARKETS',
  'The Geographic Domination Session',
  '2025-11-12',
  '09:00:00',
  '10:00:00',
  'America/New_York',
  false,  -- show_day_only instead of full date
  true,
  'https://us02web.zoom.us/j/83924796230?pwd=5QfNlq7KIcxGOuXBtoaN1sWVWd8jnj.1',
  '839 2479 6230',
  '251112',
  'https://acrobat.adobe.com/id/urn:aaid:sc:us:6d9e36ea-0112-42f3-ac13-6957b050cfed',
  'While you''re referring out clients'' relocations for 25% fees, watching your best buyers move to Arizona and hire someone else, the top 1% of agents are collecting 100% commissions in MULTIPLE states.',
  '[
    "The Full License Model - Complete control = maximum profit. Get licensed, control everything, capture 100% commissions.",
    "The Strategic Partnership Model - Leverage without licensing. Partner with a top agent in your target market, co-brand relocation services, split commissions 50/50.",
    "The Premium Referral Network Model - Curated relationships = passive income. Negotiate 30-35% referral fees (vs. standard 25%), maintain white-glove client experience."
  ]'::jsonb,
  '[
    "Real member case studies from agents who''ve already done this (NY→FL, RI→FL, SC→NC)",
    "Live AI system builds for market research, licensing timelines, and dual-territory marketing",
    "AI decision framework to analyze YOUR situation and recommend your optimal path",
    "Partnership agreement templates and 50-state licensing comparison",
    "90-day implementation roadmap with week-by-week action steps",
    "50+ copy-paste AI prompts for market analysis, exam prep, and partnership outreach"
  ]'::jsonb,
  '/images/mastermind-expansion.png',
  true,  -- Published
  true   -- Featured on homepage
);
```

---

## Document End

**Prepared By:** Claude Code (AI Assistant for Edmund Bogen)
**For Technical Review By:** Eytan Benzeno
**Implementation Start Date:** TBD
**Questions/Feedback:** Contact Edmund or reply to this specification document

---
