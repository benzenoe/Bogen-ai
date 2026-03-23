# bogen.ai/book — Companion Page Status

**Last updated:** March 23, 2026
**Route:** `/book` in server.js (line ~180)
**View file:** `views/book.html`
**Cover image:** `public/images/book-cover.png`

---

## What's Built (Phase 1 -- Live)

### Hero Section
- Book cover image (ChatGPT-generated, "AI is already deciding who wins." tagline)
- Title: "Prompt to Close"
- Subtitle + description
- Two CTAs: "Download the Prompt Library" (scrolls to resources) + "Browse AI Tools" (scrolls to directory)
- "Last updated: March 2026" badge

### AI Tool Directory
- Three tiers: Starting Stack ($40/mo), Recommended Additions ($53-93/mo), Specialized Tools
- Tools: ChatGPT Plus, Claude Pro, Canva Pro, Perplexity Pro, Genspark, Google AI Studio, HeyGen, Wispr Flow, Constant Contact
- Each card has: name, price, description, chapter references, "Edmund's Pick" badges where applicable
- Prices verified March 2026

### Video Walkthroughs
- 5 video cards with "Coming Soon" placeholders
- Videos planned: Claude Skills Setup (Ch 5), LLM Stacking (Ch 6), Risk Radar Contract Review (Ch 11), Content Daisy Chain (Ch 4), Virtual Staging (Ch 13)
- Each placeholder has a `data-video-id=""` attribute -- when YouTube IDs are added, they auto-embed via JavaScript at bottom of page

### Downloadable Resources (Email-Gated)
- Complete Prompt Library PDF (all chapters)
- 90-Day Implementation Tracker (Ch 16)
- Risk Radar Setup Guide (Ch 11)
- Content Daisy Chain Template (Ch 4)
- LLM Stacking Cheat Sheet (Ch 6)
- "First 7 Days" Quick Start Card (Ch 16)
- Personal AI ROI Calculator (Ch 3, 16)

### Downloadable Resources (Free)
- AI Tool Directory (scrolls to #tools section)

### Email Capture Modal
- Triggers on click of any email-gated resource card
- Captures: first name, email, resource ID
- Shows resource-specific title and description in the modal
- SUCCESS state shows confirmation + link to tool directory
- **NOT YET WIRED TO CONSTANT CONTACT** -- currently logs to console only
- TODO comment in the `handleEmailSubmit()` function marks where API integration goes

### Social Proof / Results Section
- Stats ticker: 200+ agents, 15 states, 85-90% contract review time saved, 56.5% email open rates
- 4 testimonial cards with real metrics from the book (anonymized as "Mastermind Member")

### Mastermind CTA Section
- Features grid (weekly sessions, private prompt library, direct access, community)
- $250/month pricing display
- "Book readers: ask about our introductory rate" note
- Two CTAs: Join the Mastermind + Book a Free Strategy Call

### Contact Section
- AI Receptionist: (424) 587-0840
- Email: info@bogen.ai

### Sticky CTA Bar
- Fixed to bottom of screen, appears after scrolling past 600px
- Text: "Join 200+ agents in Edmund's Mastermind -- go beyond the book"
- Button links to /edmunds-mastermind

### Navigation
- "Book" nav link is ONLY on the /book page itself (nav-link active state)
- Intentionally NOT added to other pages yet -- will add when book launches publicly
- Decision: don't clutter the existing nav (already 9+ items). Options discussed:
  1. Replace "Video" with "Book"
  2. Nest under Mastermind dropdown
  3. Keep it off nav entirely (current approach -- QR codes and direct URL handle discovery)

### Footer
- Includes Book-specific column with links to #tools, #videos, #resources, #results
- Location updated to Boca Raton, FL

---

## What's NOT Built Yet

### Email Capture API
- Modal works but `handleEmailSubmit()` only logs to console
- Need to connect to Constant Contact API
- Should trigger automated welcome sequence (3-5 emails per brainstorm)

### Downloadable PDFs
None of these exist yet -- they need to be created:
- Complete Prompt Library PDF
- 90-Day Implementation Tracker (printable + Google Sheet)
- Risk Radar Setup Guide (screenshots)
- Content Daisy Chain Template (worksheet)
- LLM Stacking Cheat Sheet (one-page flowchart)
- "First 7 Days" Quick Start Card
- AI ROI Calculator (Google Sheet)

### Video Content
- 0 of 5 launch videos recorded
- YouTube IDs go into `data-video-id` attributes on `.video-placeholder` elements
- JavaScript at bottom of page auto-replaces placeholders with YouTube embeds

### QR Code Chapter Landing Pages
- Brainstorm calls for `/book/ch1` through `/book/ch16` (plus intro and appendices)
- Each chapter gets a specific "digital gift" download
- Full chapter-by-chapter plan in: `ai-playbook-real-estate/projects/companion-page-brainstorm.md` (Section 7)
- Not started

### SEO
- Schema markup is in place (Book schema + FAQ schema with 3 questions)
- Open Graph meta tags present
- Video transcripts / sub-pages for each video (planned, not built)
- Blog cross-linking from bogen.ai (not started)

### Monthly Update Feed
- Planned: tool directory updates, prompt of the month, member win, AI news summary
- Not built -- could be a simple blog-style feed section added later

---

## Technical Notes

### Page Architecture
- Single HTML file: `views/book.html`
- Page-specific CSS is inline in `<style>` tag (no separate CSS file)
- Uses global.css from `/css/global.css` for base styles (navy/cyan palette, nav, footer, buttons, cards, forms)
- JavaScript is inline at bottom of `<script>` tag
- No external JS dependencies

### How to Add YouTube Videos
In `views/book.html`, find the `.video-placeholder` elements. Replace the empty `data-video-id=""` with the YouTube video ID:
```html
<div class="video-placeholder" data-video-id="dQw4w9WgXcQ">
```
The JS at the bottom auto-converts these to privacy-enhanced YouTube embeds.

### How to Connect Email Capture
In the `handleEmailSubmit()` function (~line 1300), replace the console.log with a fetch to your Constant Contact API endpoint. The function already captures `name`, `email`, and `resource` (the resource ID string).

### Cover Image
- File: `public/images/book-cover.png`
- Source: ChatGPT image generation, March 20, 2026
- Original on Desktop: `ChatGPT Image Mar 20, 2026, 10_34_01 PM.png`
- Shows Edmund with "PROMPT TO CLOSE" title, "AI IS ALREADY DECIDING WHO WINS." tagline
- KDP note: cover tagline may be close to top trim -- check proof copy

### Related Files
- **Brainstorm:** `ai-playbook-real-estate/projects/companion-page-brainstorm.md` (full plan, all phases)
- **Cover prompt:** `ai-playbook-real-estate/projects/book-cover-image-prompt.md` (v2, masculine version)
- **Book memory:** `~/.claude/projects/-Users-edmundbogen/memory/project_book_winging_it.md`
- **KDP status:** `~/.claude/projects/-Users-edmundbogen/memory/project_book_kdp_published.md`

---

## Launch Checklist (When Book Goes Live)

- [ ] Confirm book is live on Amazon, grab link
- [ ] Add Amazon purchase link/button to hero section
- [ ] Wire email capture to Constant Contact
- [ ] Create at least the Prompt Library PDF (highest-value lead magnet)
- [ ] Add "Book" to nav on other pages (or add homepage banner)
- [ ] Update "Last updated" badge
- [ ] Order author copies
- [ ] Start review campaign with Mastermind members
- [ ] Share bogen.ai/book link in Mastermind sessions
