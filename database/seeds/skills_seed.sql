-- Seed data for skills marketplace
-- Run this after the migration to populate initial skills

-- Real Estate Skills
INSERT INTO skills (slug, name, category, description, skill_content, author_name, author_website, is_free, is_published, is_featured, install_count)
VALUES
(
  'fb-lead-processor',
  'Facebook Lead Processor',
  'real-estate',
  'Processes Facebook group member data to categorize leads, flag spam accounts, generate personalized email drip sequences, and create social engagement posts. Perfect for real estate agents managing Facebook community groups.',
  '# Facebook Lead Processor

## Purpose
Process Facebook group member request data to efficiently categorize and nurture leads from your real estate community groups.

## Capabilities
- Categorize leads by interest level and property type preferences
- Flag spam accounts and fake profiles automatically
- Generate personalized email drip sequences for new members
- Create welcome posts and engagement content
- Output CSV-ready data for CRM import

## Input Format
Paste raw Facebook member request data including:
- Name
- Profile link
- Answers to membership questions
- Email (if captured)

## Output
1. **Lead Categorization**: Hot/Warm/Cold with reasoning
2. **Spam Detection**: Flagged accounts with confidence score
3. **Email Sequence**: 5-email nurture sequence personalized to their interests
4. **Welcome Post**: Personalized community welcome message
5. **CSV Export**: Ready for import to your email platform

## Usage Example
```
Process the following new member requests:

[Paste member data here]
```

## Best Practices
- Process new members weekly for best engagement
- Customize email templates with your branding
- Follow up with hot leads within 24 hours',
  'Edmund Bogen',
  'https://bogen.ai',
  true,
  true,
  true,
  47
),
(
  'listing-description-writer',
  'Luxury Listing Description Writer',
  'real-estate',
  'Creates compelling, MLS-compliant property descriptions for luxury real estate listings. Optimized for South Florida markets but adaptable to any luxury market.',
  '# Luxury Listing Description Writer

## Purpose
Generate compelling, professional property descriptions that sell luxury homes while maintaining MLS compliance.

## Features
- MLS character limit compliance (varies by market)
- SEO-optimized for real estate searches
- Emotional storytelling that connects with buyers
- Highlight unique features and lifestyle benefits
- Multiple versions for different platforms (MLS, Zillow, social media)

## Input Requirements
Provide the following property details:
- Address and neighborhood
- Property specs (beds, baths, sqft, lot size)
- Key features and upgrades
- Unique selling points
- Target buyer profile
- Any required disclosures

## Output Formats
1. **MLS Description**: Compliant, keyword-rich
2. **Extended Description**: Full storytelling version
3. **Social Media Captions**: Platform-specific posts
4. **Email Teaser**: For coming soon announcements

## Style Guidelines
- Lead with the most compelling feature
- Use sensory language (sun-drenched, resort-style)
- Avoid banned words per MLS rules
- Include call-to-action

## Example Usage
```
Create descriptions for:
Address: 123 Royal Palm Way, Boca Raton, FL
Beds: 5 | Baths: 6.5 | SqFt: 7,500
Pool: Yes, infinity edge overlooking lake
Key Features: Smart home, wine cellar, chef kitchen
Target: Executive families relocating
```',
  'Edmund Bogen',
  'https://bogen.ai',
  true,
  true,
  true,
  156
),
(
  'cma-generator',
  'Comparative Market Analysis Generator',
  'real-estate',
  'Generates professional CMA reports with market analysis, pricing recommendations, and presentation-ready formatting for seller consultations.',
  '# CMA Report Generator

## Purpose
Create comprehensive Comparative Market Analysis reports that help sellers understand their home''s value and position you as the market expert.

## Report Sections
1. **Executive Summary**: Key findings and recommended list price
2. **Subject Property Analysis**: Features, condition, upgrades
3. **Comparable Sales**: 3-6 recent sales with adjustments
4. **Active Competition**: Current listings affecting pricing
5. **Market Trends**: Days on market, price trends, absorption rate
6. **Pricing Strategy**: Recommended price with rationale
7. **Marketing Plan Preview**: How you''ll sell their home

## Input Required
- Subject property address and details
- Recent comparable sales (from MLS export)
- Active listings in the area
- Any unique features or concerns
- Seller''s timeline and motivation

## Adjustments Calculated
- Square footage differences
- Lot size variations
- Pool/no pool
- Renovations and updates
- Location premiums
- Condition adjustments

## Output Format
- Professional PDF-ready layout
- Charts and graphs
- Photo placeholders
- Your branding integration

## Usage
```
Generate CMA for:
Subject: 456 Country Club Drive
Style: Single Family
SqFt: 4,200
Comparables: [paste MLS data]
```',
  'Edmund Bogen',
  'https://bogen.ai',
  true,
  true,
  true,
  89
);

-- Marketing Skills
INSERT INTO skills (slug, name, category, description, skill_content, author_name, author_website, is_free, is_published, is_featured, install_count)
VALUES
(
  'social-media-content-engine',
  'Social Media Content Engine',
  'marketing',
  'Generates daily social media content across all platforms with platform-specific formatting, hashtags, and engagement hooks. Includes content calendar planning.',
  '# Social Media Content Engine

## Purpose
Generate consistent, engaging social media content across all platforms while maintaining your brand voice and driving engagement.

## Supported Platforms
- Instagram (Posts, Reels scripts, Stories)
- Facebook (Posts, Group content)
- LinkedIn (Professional thought leadership)
- TikTok (Script + hook ideas)
- YouTube (Titles, descriptions, scripts)
- X/Twitter (Threads and single posts)

## Content Types
1. **Educational**: Tips, how-tos, market insights
2. **Engagement**: Questions, polls, discussions
3. **Promotional**: Listings, services, events
4. **Personal Brand**: Behind-the-scenes, stories
5. **Social Proof**: Testimonials, wins, milestones

## Weekly Content Calendar
- Monday: Motivation/Week preview
- Tuesday: Tips/Educational
- Wednesday: Behind-the-scenes
- Thursday: Engagement question
- Friday: Fun/Personal
- Saturday: Lifestyle content
- Sunday: Week recap/Planning

## Input Options
- Topic or theme
- Key message to convey
- Target audience
- Any timely hooks (holidays, events)
- Preferred content type

## Output Includes
- Platform-specific post copy
- Hashtag recommendations (by platform)
- Best posting times
- Engagement CTAs
- Image/video suggestions

## Example
```
Generate content about:
Topic: Spring real estate market
Audience: First-time homebuyers
Platforms: Instagram, LinkedIn
Tone: Encouraging but informative
```',
  'Bogen.ai',
  'https://bogen.ai',
  true,
  true,
  true,
  234
),
(
  'email-sequence-writer',
  'Email Sequence Writer',
  'marketing',
  'Creates high-converting email sequences for lead nurturing, client onboarding, and re-engagement campaigns. Includes subject lines, preview text, and A/B variants.',
  '# Email Sequence Writer

## Purpose
Create professional email sequences that nurture leads, onboard clients, and drive conversions with strategic copywriting.

## Sequence Types

### Lead Nurture (5-7 emails)
1. Welcome + value proposition
2. Problem awareness
3. Solution introduction
4. Social proof
5. Objection handling
6. Soft offer
7. Direct offer + urgency

### Client Onboarding (4 emails)
1. Welcome + next steps
2. What to expect
3. Value reinforcement
4. Feedback request

### Re-engagement (3 emails)
1. We miss you
2. What''s new
3. Special offer

### Event/Webinar (5 emails)
1. Invitation
2. Reminder (1 week)
3. Reminder (1 day)
4. Day-of
5. Follow-up/replay

## Elements Included
- Subject lines (3 variants each)
- Preview text
- Email body copy
- CTAs
- P.S. lines
- Optimal send timing

## Input Required
- Sequence type
- Target audience
- Key offer/goal
- Brand voice notes
- Any specific content requirements

## Output Format
Each email includes:
- **Subject Line Options**: A/B/C variants
- **Preview Text**: 40-90 characters
- **Body**: Formatted with personalization tokens
- **CTA**: Button text + link placeholder
- **Send Timing**: Day and time recommendation

## Example
```
Create a lead nurture sequence for:
Audience: Luxury home sellers
Goal: Book listing appointment
Voice: Professional yet warm
Timeline: 2 weeks
```',
  'Bogen.ai',
  'https://bogen.ai',
  true,
  true,
  false,
  178
);

-- Sales Skills
INSERT INTO skills (slug, name, category, description, skill_content, author_name, author_website, is_free, is_published, is_featured, install_count)
VALUES
(
  'objection-handler',
  'Sales Objection Handler',
  'sales',
  'Provides strategic responses to common sales objections with empathetic, value-focused rebuttals. Covers real estate, consulting, and B2B scenarios.',
  '# Sales Objection Handler

## Purpose
Turn objections into opportunities with strategic, empathetic responses that address concerns while advancing the conversation.

## Common Objection Categories

### Price Objections
- "It''s too expensive"
- "I can find cheaper"
- "I need to think about it"
- "I need to talk to my spouse"

### Timing Objections
- "Not the right time"
- "Maybe next year"
- "Market is too crazy"
- "Waiting for rates to drop"

### Trust Objections
- "I''m working with someone else"
- "I want to shop around"
- "How do I know you''re the right choice"

### Value Objections
- "What makes you different"
- "I can do this myself"
- "I don''t see the value"

## Response Framework (LAER)
1. **Listen**: Acknowledge the concern
2. **Acknowledge**: Show empathy
3. **Explore**: Ask clarifying questions
4. **Respond**: Address with value

## Input Format
Provide:
- The specific objection
- Context (industry, product/service)
- Relationship stage
- Any known concerns

## Output
- Empathetic acknowledgment
- Clarifying questions to ask
- Value-focused response
- Conversation continuation

## Example
```
Handle this objection:
Objection: "I need to think about it"
Context: Seller considering listing their home
Relationship: Second meeting
Known concerns: Worried about finding next home
```',
  'Bogen.ai',
  'https://bogen.ai',
  true,
  true,
  false,
  67
);

-- Operations Skills
INSERT INTO skills (slug, name, category, description, skill_content, author_name, author_website, is_free, is_published, is_featured, install_count)
VALUES
(
  'sop-creator',
  'Standard Operating Procedure Creator',
  'operations',
  'Creates detailed SOPs for business processes with step-by-step instructions, checklists, and training materials. Perfect for team onboarding and process documentation.',
  '# SOP Creator

## Purpose
Create comprehensive Standard Operating Procedures that ensure consistency, enable delegation, and facilitate training.

## SOP Structure

### Header Section
- Procedure name
- Version and date
- Owner/responsible party
- Revision history

### Overview
- Purpose statement
- Scope
- Prerequisites
- Required tools/access

### Step-by-Step Instructions
- Numbered steps with sub-steps
- Screenshots/visual placeholders
- Tips and warnings
- Common mistakes to avoid

### Quality Checklist
- Verification steps
- Quality standards
- Completion criteria

### Troubleshooting
- Common issues and solutions
- Escalation procedures
- Contact information

## Input Required
- Process name and description
- Current workflow (even rough notes)
- Key stakeholders
- Tools/systems used
- Common problems encountered

## Output Formats
1. **Full SOP Document**: Complete with all sections
2. **Quick Reference Card**: One-page summary
3. **Training Checklist**: For new team members
4. **Video Script**: For recording walkthrough

## Example
```
Create SOP for:
Process: New client onboarding
Steps: Contract signing through first meeting
Tools: DocuSign, CRM, Calendar
Timeline: 48 hours from contract
```',
  'Bogen.ai',
  'https://bogen.ai',
  true,
  true,
  false,
  45
);

-- Development Skills
INSERT INTO skills (slug, name, category, description, skill_content, author_name, author_website, is_free, is_published, is_featured, install_count)
VALUES
(
  'api-documentation-writer',
  'API Documentation Writer',
  'development',
  'Generates clear, developer-friendly API documentation with examples, error handling, and authentication guides. Supports REST and GraphQL APIs.',
  '# API Documentation Writer

## Purpose
Create comprehensive, developer-friendly API documentation that reduces support requests and accelerates integration.

## Documentation Sections

### Getting Started
- Authentication setup
- Base URL configuration
- Rate limits
- Environment setup

### Endpoint Reference
For each endpoint:
- HTTP method and path
- Description
- Request parameters
- Request body schema
- Response schema
- Example request/response
- Error codes

### Authentication
- Auth method explanation
- Token generation
- Token refresh
- Security best practices

### Error Handling
- Error code reference
- Common issues
- Debugging tips

### SDK Examples
- JavaScript/Node.js
- Python
- cURL
- Postman collection

## Input Required
- API endpoint details
- Request/response samples
- Auth method
- Error codes
- Any existing docs to improve

## Output Formats
- Markdown (for GitHub/docs sites)
- OpenAPI/Swagger spec
- Postman collection JSON

## Example
```
Document this endpoint:
Method: POST
Path: /api/v1/leads
Auth: Bearer token
Body: { name, email, source, notes }
Response: Lead object with ID
```',
  'Bogen.ai',
  'https://bogen.ai',
  true,
  true,
  false,
  32
);
