# Bogen.ai Chatbot - Implementation Guide

## Overview

The Bogen.ai chatbot is a fully integrated AI assistant powered by Claude (Anthropic) that provides 24/7 customer support, lead qualification, and seamless scheduling integration with your Calendly.

## Features

✅ **24/7 AI Assistant** - Answers questions about services, pricing, and capabilities
✅ **Lead Qualification** - Intelligently qualifies prospects based on revenue, bottlenecks, and fit
✅ **Smart Escalation** - Automatically offers strategy calls for qualified leads
✅ **Calendly Integration** - Direct scheduling link to Edmund's calendar
✅ **Conversation History** - Persistent chat sessions across visits
✅ **Mobile Responsive** - Works perfectly on all devices
✅ **Lead Capture** - Stores qualified leads in database for follow-up
✅ **Admin Dashboard Ready** - Conversations and leads available via API

## Architecture

### Frontend
- **Chat Widget**: `/public/js/chatbot.js` - Handles UI and user interactions
- **Styles**: `/public/css/chatbot.css` - Modern, branded chat interface
- **Integration**: Added to `index.html` (and can be added to all pages)

### Backend
- **API Routes**: `/server/routes/chat.js` - Handles message processing
- **Endpoints**:
  - `POST /api/chat/message` - Send message, get AI response
  - `POST /api/chat/lead` - Capture qualified lead
  - `GET /api/chat/conversations` - View all conversations (admin)
  - `GET /api/chat/conversation/:sessionId` - Get specific conversation

### Database
- **chat_conversations** - Stores chat sessions
- **chat_messages** - Stores individual messages
- **chat_leads** - Stores qualified leads with scoring

### AI Knowledge Base
- **System Prompt**: `/config/chatbot-system-prompt.txt`
- **Knowledge Base**: `/config/chatbot-knowledge-base.json`
- **FAQ Database**: `/config/chatbot-faq.json`

## Setup Instructions

### 1. Anthropic API Key (REQUIRED)

You **MUST** add your Anthropic API key to the `.env` file:

```bash
# Open .env and update this line:
ANTHROPIC_API_KEY=your_actual_anthropic_api_key_here
```

**How to get an API key:**
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key
5. Copy it to your `.env` file

**Pricing:** Claude API is very affordable:
- ~$3 per 1 million input tokens
- ~$15 per 1 million output tokens
- Typical chat conversation: $0.01-$0.05
- 1000 conversations/month: ~$20-$50

### 2. Database Migration (COMPLETED ✅)

The chatbot tables have been created:
- ✅ chat_conversations
- ✅ chat_messages
- ✅ chat_leads

If you need to run it again: `node scripts/run-chatbot-migration.js`

### 3. Install Dependencies (COMPLETED ✅)

The Anthropic SDK has been installed:
```bash
npm install @anthropic-ai/sdk
```

### 4. Add Chatbot to Other Pages (OPTIONAL)

The chatbot is currently active on:
- ✅ Homepage (`/views/index.html`)

To add to other pages, add these two lines:

**In the `<head>` section, after `global.css`:**
```html
<link rel="stylesheet" href="/css/chatbot.css">
```

**At the end of `<body>`, after `common.js`:**
```html
<script src="/js/chatbot.js"></script>
```

**Pages to consider adding chatbot to:**
- `/views/about-us.html`
- `/views/edmunds-mastermind.html`
- `/views/partner-program.html`
- `/views/contact.html`
- All service pages in `/views/services/`

You can use this script to add to all pages:
```bash
# Coming soon: automated script to add chatbot to all pages
```

## Testing the Chatbot

### Local Testing

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Add your API key to .env** (if not done already)

3. **Open your browser:**
   ```
   http://localhost:3000
   ```

4. **Look for the chat icon** in the bottom-right corner

5. **Click to open and test:**
   - Ask "How much does it cost?"
   - Ask "How does this work?"
   - Ask "Schedule a call"
   - Ask "Tell me about the Mastermind"

### What to Test

✅ **Welcome message appears** when first opening chat
✅ **Quick action buttons** are clickable
✅ **Messages send and receive** properly
✅ **Typing indicator** appears while waiting
✅ **Conversation persists** when closing/reopening
✅ **Calendly button appears** when asking to schedule
✅ **Mobile responsive** - test on phone/tablet
✅ **Session persistence** - refresh page, chat history remains

### Expected Behavior

The chatbot is designed to:
1. **Educate** prospects about Bogen.ai services
2. **Qualify** leads by asking about revenue, bottlenecks, and needs
3. **Escalate** qualified prospects to Edmund's Calendly
4. **Capture** contact information and store in database
5. **Maintain** consistent, professional tone matching Edmund's voice

## Chatbot Personality

The chatbot is trained to be:
- **Consultative** and calm, not salesy
- **Direct** and clear, no jargon
- **ROI-focused** - talks about value, not just features
- **Qualifying** - asks smart questions to understand fit
- **Helpful** but efficient - doesn't waste time on unqualified leads

## Deployment to Production

### 1. Add API Key to Vercel Environment Variables

In your Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add: `ANTHROPIC_API_KEY` = `your_key_here`
3. Apply to: Production, Preview, Development

### 2. Run Migration on Production Database

Option A - Use the migrate API endpoint:
```bash
curl -X POST https://bogen.ai/api/migrate/chatbot \
  -H "Content-Type: application/json" \
  -H "x-migration-secret: YOUR_MIGRATION_SECRET"
```

Option B - Run directly on Neon console:
1. Log into https://console.neon.tech/
2. Navigate to your database
3. Run SQL from `/migrations/003_create_chatbot_tables.sql`

### 3. Deploy

**Automatic deployment:**
```bash
git add .
git commit -m "Add AI chatbot powered by Claude"
git push origin main
```

Vercel will automatically deploy within 1-2 minutes.

### 4. Verify Production

1. Visit https://bogen.ai
2. Look for chat icon in bottom-right
3. Test a conversation
4. Verify it works on mobile
5. Check that leads are captured in database

## Monitoring & Maintenance

### View Conversations & Leads

**API Endpoints (for admin dashboard):**

```javascript
// Get all conversations
GET /api/chat/conversations?limit=50&active_only=true

// Get specific conversation
GET /api/chat/conversation/:sessionId

// Response includes:
// - Conversation metadata
// - All messages
// - Captured lead info (if any)
```

### Add to Admin Dashboard (Future Enhancement)

You can add a "Chatbot Leads" tab to `/views/admin-dashboard.html`:

```javascript
fetch('/api/chat/conversations')
  .then(res => res.json())
  .then(data => {
    // Display conversations and leads
    // Show qualification scores
    // Mark as contacted/converted
  });
```

## Knowledge Base Updates

To update chatbot knowledge:

1. **Edit FAQ:**
   `/config/chatbot-faq.json` - Add/modify Q&A pairs

2. **Edit Knowledge Base:**
   `/config/chatbot-knowledge-base.json` - Update services, pricing, etc.

3. **Edit System Prompt:**
   `/config/chatbot-system-prompt.txt` - Adjust personality, rules, talking points

4. **Redeploy:**
   Changes take effect immediately on next deployment (no migration needed)

## Troubleshooting

### Chatbot doesn't appear
- ✅ Check `/css/chatbot.css` and `/js/chatbot.js` are linked in HTML
- ✅ Check browser console for JavaScript errors
- ✅ Verify files exist in `/public/css/` and `/public/js/`

### Chatbot appears but doesn't respond
- ✅ Check `ANTHROPIC_API_KEY` is set in `.env`
- ✅ Check server console for API errors
- ✅ Verify database tables exist (run migration)
- ✅ Check browser network tab for failed API calls

### Messages send but get generic error
- ✅ API key is invalid or missing
- ✅ Database connection issue
- ✅ Check server logs: `npm run dev`

### Session doesn't persist
- ✅ Check browser localStorage is enabled
- ✅ Verify `/api/chat/conversation/:sessionId` returns data
- ✅ Check session ID is being saved to localStorage

### Calendly link doesn't appear
- ✅ Verify Calendly link in `/config/chatbot-knowledge-base.json`
- ✅ Check that escalation logic is triggering
- ✅ Test with phrases like "schedule a call" or "talk to Edmund"

## Cost Estimates

### Anthropic API Costs (Claude)

**Typical Usage:**
- 100 conversations/month: $10-$25
- 500 conversations/month: $40-$100
- 1,000 conversations/month: $80-$200

**Why it's worth it:**
- If chatbot qualifies just 1 extra lead/month → ROI is 10-50x
- 24/7 availability vs. missing inquiries
- Consistent qualification and messaging
- Scales without adding headcount

**Cost per conversation:**
- Simple inquiry (3-5 messages): $0.01-$0.02
- Full qualification (10-15 messages): $0.03-$0.06
- Complex conversation (20+ messages): $0.08-$0.15

## Next Steps

### Immediate (Required)
1. ✅ Add `ANTHROPIC_API_KEY` to `.env` file
2. ✅ Test chatbot locally: `npm run dev`
3. ✅ Verify conversation flow works
4. ✅ Add API key to Vercel environment variables
5. ✅ Deploy to production
6. ✅ Run production database migration

### Short-term (Recommended)
1. Add chatbot to other key pages (About, Mastermind, Services)
2. Set up email notifications for new leads
3. Add chatbot conversations to admin dashboard
4. Monitor first 50 conversations and refine knowledge base
5. A/B test different welcome messages

### Long-term (Optional)
1. Add lead scoring automation
2. Integrate with CRM (if you have one)
3. Add proactive chat triggers (e.g., after 30 seconds on pricing page)
4. Build analytics dashboard for chatbot performance
5. Add conversation summaries and sentiment analysis
6. Create automated follow-up sequences for qualified leads

## Support & Questions

**Issues or questions about the chatbot?**
- Check this README first
- Review code comments in `/server/routes/chat.js`
- Test API endpoints directly with Postman/curl
- Check Claude API docs: https://docs.anthropic.com/

**Want to customize?**
- Personality: Edit `/config/chatbot-system-prompt.txt`
- Knowledge: Edit `/config/chatbot-knowledge-base.json`
- Styling: Edit `/public/css/chatbot.css`
- Behavior: Edit `/public/js/chatbot.js`

---

**Built with:**
- Claude 3.5 Sonnet (Anthropic)
- Node.js + Express
- PostgreSQL (Neon)
- Vanilla JavaScript
- Modern CSS

**Version:** 1.0.0
**Last Updated:** November 2025
**Status:** ✅ Ready for Production (pending API key)
