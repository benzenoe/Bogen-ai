-- Expanded seed data for skills marketplace
-- Run this after 006_skill_categories.sql migration

-- =====================
-- ACCOUNTING & FINANCE
-- =====================
INSERT INTO skills (slug, name, category, description, skill_content, author_name, is_free, is_published, is_featured, install_count)
VALUES
('invoice-generator', 'Invoice Generator', 'accounting-finance', 'Creates professional invoices with line items, tax calculations, and payment terms. Supports multiple currencies and invoice formats.', '# Invoice Generator\n\nGenerate professional invoices instantly with proper formatting, calculations, and branding.\n\n## Features\n- Automatic tax calculations\n- Multiple currency support\n- Payment terms and conditions\n- Professional formatting\n\n## Usage\nProvide: Client name, items/services, rates, tax rate, due date', 'Bogen.ai', true, true, false, 34),

('expense-categorizer', 'Expense Categorizer', 'accounting-finance', 'Automatically categorizes business expenses for bookkeeping and tax preparation. Maps to standard chart of accounts.', '# Expense Categorizer\n\nAutomatically categorize expenses for accurate bookkeeping.\n\n## Categories\n- Office supplies\n- Travel & meals\n- Professional services\n- Software & subscriptions\n- Marketing & advertising\n\n## Input\nPaste expense list or bank statement data', 'Bogen.ai', true, true, false, 28),

('financial-report-writer', 'Financial Report Writer', 'accounting-finance', 'Generates executive summaries and financial analysis reports from raw financial data. Includes trend analysis and KPI tracking.', '# Financial Report Writer\n\nTransform financial data into executive-ready reports.\n\n## Report Sections\n1. Executive Summary\n2. Revenue Analysis\n3. Expense Breakdown\n4. Cash Flow Status\n5. Key Metrics & KPIs\n6. Recommendations\n\n## Input Required\n- Revenue figures\n- Expense data\n- Comparison period', 'Bogen.ai', true, true, false, 19);

-- =====================
-- LEGAL
-- =====================
INSERT INTO skills (slug, name, category, description, skill_content, author_name, is_free, is_published, is_featured, install_count)
VALUES
('contract-reviewer', 'Contract Reviewer', 'legal', 'Reviews contracts and agreements, highlighting key terms, potential issues, and missing clauses. Provides plain-language summaries.', '# Contract Reviewer\n\nAnalyze contracts quickly and identify important terms.\n\n## Analysis Includes\n- Key terms extraction\n- Risk identification\n- Missing clause detection\n- Plain-language summary\n- Recommended changes\n\n## Disclaimer\nFor informational purposes only. Consult a licensed attorney for legal advice.', 'Bogen.ai', true, true, true, 67),

('legal-letter-drafter', 'Legal Letter Drafter', 'legal', 'Drafts professional legal correspondence including demand letters, cease and desist, and formal notices.', '# Legal Letter Drafter\n\nCreate professional legal correspondence.\n\n## Letter Types\n- Demand letters\n- Cease and desist\n- Formal notices\n- Settlement proposals\n- Response letters\n\n## Input Needed\n- Letter type\n- Parties involved\n- Key facts\n- Desired outcome', 'Bogen.ai', true, true, false, 41),

('nda-generator', 'NDA Generator', 'legal', 'Generates customizable Non-Disclosure Agreements for various business situations. Includes mutual and one-way options.', '# NDA Generator\n\nCreate professional NDAs quickly.\n\n## Options\n- Mutual NDA\n- One-way NDA\n- Employee NDA\n- Contractor NDA\n\n## Customizations\n- Duration\n- Scope of information\n- Exclusions\n- Jurisdiction', 'Bogen.ai', true, true, false, 53);

-- =====================
-- TRAVEL
-- =====================
INSERT INTO skills (slug, name, category, description, skill_content, author_name, is_free, is_published, is_featured, install_count)
VALUES
('trip-planner', 'Trip Planner', 'travel', 'Creates detailed travel itineraries with day-by-day schedules, booking recommendations, and local tips.', '# Trip Planner\n\nPlan your perfect trip with detailed itineraries.\n\n## Includes\n- Day-by-day schedule\n- Hotel recommendations\n- Restaurant suggestions\n- Activity planning\n- Transportation logistics\n- Local tips & customs\n\n## Input\n- Destination\n- Travel dates\n- Budget\n- Interests\n- Travel style', 'Bogen.ai', true, true, true, 89),

('packing-list-generator', 'Packing List Generator', 'travel', 'Generates customized packing lists based on destination, weather, activities, and trip duration.', '# Packing List Generator\n\nNever forget essentials again.\n\n## Customized For\n- Weather conditions\n- Trip activities\n- Duration\n- Destination type\n- Business vs leisure\n\n## Categories\n- Clothing\n- Toiletries\n- Electronics\n- Documents\n- Medications', 'Bogen.ai', true, true, false, 62),

('travel-budget-calculator', 'Travel Budget Calculator', 'travel', 'Estimates travel costs and creates detailed budgets for trips including flights, hotels, food, and activities.', '# Travel Budget Calculator\n\nPlan your travel budget accurately.\n\n## Cost Categories\n- Transportation\n- Accommodation\n- Food & dining\n- Activities & tours\n- Shopping\n- Emergency fund\n\n## Output\n- Daily budget\n- Total estimate\n- Money-saving tips', 'Bogen.ai', true, true, false, 45);

-- =====================
-- EDUCATION
-- =====================
INSERT INTO skills (slug, name, category, description, skill_content, author_name, is_free, is_published, is_featured, install_count)
VALUES
('lesson-plan-creator', 'Lesson Plan Creator', 'education', 'Creates structured lesson plans with objectives, activities, assessments, and materials lists for any subject.', '# Lesson Plan Creator\n\nDesign effective lesson plans quickly.\n\n## Lesson Components\n1. Learning objectives\n2. Materials needed\n3. Introduction/hook\n4. Main activities\n5. Assessment methods\n6. Differentiation strategies\n7. Closure/reflection\n\n## Input\n- Subject/topic\n- Grade level\n- Duration\n- Learning standards', 'Bogen.ai', true, true, true, 78),

('quiz-generator', 'Quiz & Test Generator', 'education', 'Generates quizzes and tests with multiple question types, answer keys, and grading rubrics.', '# Quiz Generator\n\nCreate assessments efficiently.\n\n## Question Types\n- Multiple choice\n- True/false\n- Short answer\n- Essay prompts\n- Matching\n- Fill in the blank\n\n## Includes\n- Answer key\n- Grading rubric\n- Difficulty levels', 'Bogen.ai', true, true, false, 56),

('study-guide-maker', 'Study Guide Maker', 'education', 'Creates comprehensive study guides from textbook chapters, lecture notes, or course materials.', '# Study Guide Maker\n\nTransform content into effective study materials.\n\n## Guide Includes\n- Key concepts summary\n- Important vocabulary\n- Practice questions\n- Mnemonics & memory aids\n- Review checklist\n\n## Input\n- Source material\n- Exam format\n- Key topics', 'Bogen.ai', true, true, false, 43);

-- =====================
-- HEALTHCARE
-- =====================
INSERT INTO skills (slug, name, category, description, skill_content, author_name, is_free, is_published, is_featured, install_count)
VALUES
('patient-communication', 'Patient Communication Writer', 'healthcare', 'Creates clear, empathetic patient communications including appointment reminders, follow-up instructions, and health education materials.', '# Patient Communication Writer\n\nCreate clear healthcare communications.\n\n## Communication Types\n- Appointment reminders\n- Pre-visit instructions\n- Post-visit summaries\n- Treatment explanations\n- Health education materials\n\n## Tone\n- Empathetic\n- Clear (low health literacy friendly)\n- Professional\n- HIPAA-aware', 'Bogen.ai', true, true, false, 38),

('medical-note-formatter', 'Medical Note Formatter', 'healthcare', 'Formats clinical notes into standard SOAP format with proper medical terminology and structure.', '# Medical Note Formatter\n\nStructure clinical documentation properly.\n\n## SOAP Format\n- Subjective\n- Objective\n- Assessment\n- Plan\n\n## Features\n- Medical terminology\n- ICD-10 suggestions\n- Proper formatting\n\n## Disclaimer\nFor documentation assistance only. Clinical judgment required.', 'Bogen.ai', true, true, false, 29);

-- =====================
-- HOSPITALITY
-- =====================
INSERT INTO skills (slug, name, category, description, skill_content, author_name, is_free, is_published, is_featured, install_count)
VALUES
('hotel-response-writer', 'Hotel Guest Response Writer', 'hospitality', 'Crafts professional responses to guest reviews, inquiries, and complaints across all platforms.', '# Hotel Guest Response Writer\n\nProfessional hospitality communications.\n\n## Response Types\n- Positive review thanks\n- Negative review recovery\n- Booking inquiries\n- Special requests\n- Complaint resolution\n\n## Platforms\n- TripAdvisor\n- Google Reviews\n- Booking.com\n- Direct email', 'Bogen.ai', true, true, false, 31),

('event-planner-assistant', 'Event Planning Assistant', 'hospitality', 'Helps plan events with timelines, vendor checklists, guest management, and day-of schedules.', '# Event Planning Assistant\n\nPlan flawless events.\n\n## Planning Tools\n- Timeline creation\n- Vendor checklist\n- Budget tracker\n- Guest list management\n- Day-of schedule\n- Contingency planning\n\n## Event Types\n- Corporate events\n- Weddings\n- Conferences\n- Social gatherings', 'Bogen.ai', true, true, false, 44);

-- =====================
-- WEB DEVELOPMENT
-- =====================
INSERT INTO skills (slug, name, category, description, skill_content, author_name, is_free, is_published, is_featured, install_count)
VALUES
('react-component-builder', 'React Component Builder', 'web-development', 'Generates React components with TypeScript, proper props typing, hooks, and best practices.', '# React Component Builder\n\nCreate React components following best practices.\n\n## Features\n- TypeScript support\n- Proper prop types\n- Hooks implementation\n- Accessibility (a11y)\n- Responsive design\n- Unit test stubs\n\n## Input\n- Component purpose\n- Required props\n- State needs\n- Styling preference', 'Bogen.ai', true, true, true, 112),

('css-helper', 'CSS Layout Helper', 'web-development', 'Generates CSS for common layouts including flexbox, grid, and responsive designs with browser compatibility.', '# CSS Layout Helper\n\nSolve CSS layout challenges quickly.\n\n## Layout Types\n- Flexbox layouts\n- CSS Grid systems\n- Responsive breakpoints\n- Centering techniques\n- Sticky headers/footers\n\n## Output\n- Clean CSS\n- Browser prefixes\n- Mobile-first approach', 'Bogen.ai', true, true, false, 87);

-- =====================
-- DATA & ANALYTICS
-- =====================
INSERT INTO skills (slug, name, category, description, skill_content, author_name, is_free, is_published, is_featured, install_count)
VALUES
('sql-query-builder', 'SQL Query Builder', 'data-analytics', 'Generates SQL queries for common data analysis tasks with optimization suggestions.', '# SQL Query Builder\n\nWrite efficient SQL queries.\n\n## Query Types\n- SELECT with JOINs\n- Aggregations\n- Window functions\n- Subqueries\n- CTEs\n\n## Databases\n- PostgreSQL\n- MySQL\n- SQL Server\n- SQLite\n\n## Input\n- What you want to find\n- Tables available\n- Filters needed', 'Bogen.ai', true, true, true, 94),

('data-insight-generator', 'Data Insight Generator', 'data-analytics', 'Analyzes data patterns and generates business insights with visualization recommendations.', '# Data Insight Generator\n\nTurn data into actionable insights.\n\n## Analysis Types\n- Trend analysis\n- Anomaly detection\n- Cohort analysis\n- Correlation finding\n- Forecasting\n\n## Output\n- Key findings\n- Visualization suggestions\n- Action recommendations', 'Bogen.ai', true, true, false, 56);

-- =====================
-- PRODUCTIVITY
-- =====================
INSERT INTO skills (slug, name, category, description, skill_content, author_name, is_free, is_published, is_featured, install_count)
VALUES
('meeting-summarizer', 'Meeting Summarizer', 'productivity', 'Creates structured meeting summaries with action items, decisions, and follow-ups from notes or transcripts.', '# Meeting Summarizer\n\nNever lose meeting details again.\n\n## Summary Includes\n- Key discussion points\n- Decisions made\n- Action items (with owners)\n- Follow-up dates\n- Parking lot items\n\n## Input\n- Meeting notes or transcript\n- Attendees\n- Meeting purpose', 'Bogen.ai', true, true, true, 156),

('email-template-creator', 'Email Template Creator', 'productivity', 'Creates reusable email templates for common business communications with personalization tokens.', '# Email Template Creator\n\nBuild professional email templates.\n\n## Template Types\n- Client outreach\n- Follow-ups\n- Announcements\n- Thank you notes\n- Meeting requests\n\n## Features\n- Personalization tokens\n- Multiple variants\n- Subject lines\n- Call-to-action', 'Bogen.ai', true, true, false, 89),

('weekly-planner', 'Weekly Planner', 'productivity', 'Creates structured weekly plans with time blocking, priorities, and goal tracking.', '# Weekly Planner\n\nPlan your week for maximum productivity.\n\n## Includes\n- Priority setting\n- Time blocking\n- Goal alignment\n- Buffer time\n- Review prompts\n\n## Input\n- Goals for the week\n- Fixed commitments\n- Priority tasks\n- Available hours', 'Bogen.ai', true, true, false, 67);

-- =====================
-- CUSTOMER SERVICE
-- =====================
INSERT INTO skills (slug, name, category, description, skill_content, author_name, is_free, is_published, is_featured, install_count)
VALUES
('support-response-writer', 'Support Response Writer', 'customer-service', 'Crafts professional, empathetic customer support responses for common issues and escalations.', '# Support Response Writer\n\nDeliver excellent customer service.\n\n## Response Types\n- Issue acknowledgment\n- Problem resolution\n- Escalation handling\n- Refund processing\n- Feature requests\n\n## Tone\n- Empathetic\n- Professional\n- Solution-focused\n- Brand-aligned', 'Bogen.ai', true, true, true, 73),

('faq-generator', 'FAQ Generator', 'customer-service', 'Creates comprehensive FAQ documents from support tickets, product info, and common questions.', '# FAQ Generator\n\nBuild helpful FAQ resources.\n\n## Sections\n- Getting started\n- Common issues\n- Billing questions\n- Feature explanations\n- Troubleshooting\n\n## Output\n- Q&A format\n- Category organization\n- Search-friendly', 'Bogen.ai', true, true, false, 48);

-- =====================
-- DESIGN
-- =====================
INSERT INTO skills (slug, name, category, description, skill_content, author_name, is_free, is_published, is_featured, install_count)
VALUES
('brand-style-guide', 'Brand Style Guide Creator', 'design', 'Creates comprehensive brand style guides with color palettes, typography, and usage guidelines.', '# Brand Style Guide Creator\n\nDocument your brand identity.\n\n## Guide Sections\n- Logo usage rules\n- Color palette (hex, RGB)\n- Typography system\n- Imagery style\n- Voice & tone\n- Do''s and don''ts\n\n## Input\n- Brand values\n- Target audience\n- Existing assets\n- Industry context', 'Bogen.ai', true, true, false, 42),

('ui-copy-writer', 'UI Copy Writer', 'design', 'Writes clear, concise UI copy for buttons, labels, error messages, and onboarding flows.', '# UI Copy Writer\n\nCreate user-friendly interface text.\n\n## Copy Types\n- Button labels\n- Form fields\n- Error messages\n- Success messages\n- Onboarding text\n- Empty states\n- Tooltips\n\n## Principles\n- Clarity first\n- Action-oriented\n- Consistent voice', 'Bogen.ai', true, true, false, 38);

-- =====================
-- SOCIAL MEDIA (expanded)
-- =====================
INSERT INTO skills (slug, name, category, description, skill_content, author_name, is_free, is_published, is_featured, install_count)
VALUES
('linkedin-post-writer', 'LinkedIn Post Writer', 'social-media', 'Creates engaging LinkedIn posts optimized for the algorithm with hooks, formatting, and CTAs.', '# LinkedIn Post Writer\n\nWrite posts that get engagement.\n\n## Post Types\n- Thought leadership\n- Personal stories\n- Industry insights\n- Carousel content\n- Polls\n\n## Optimization\n- Hook in first line\n- Proper formatting\n- Hashtag strategy\n- CTA placement\n- Best posting times', 'Bogen.ai', true, true, true, 134),

('instagram-caption-writer', 'Instagram Caption Writer', 'social-media', 'Creates scroll-stopping Instagram captions with emojis, hashtags, and engagement hooks.', '# Instagram Caption Writer\n\nCaptions that stop the scroll.\n\n## Elements\n- Attention-grabbing hook\n- Story or value\n- Call to action\n- Hashtag strategy\n- Emoji placement\n\n## Content Types\n- Feed posts\n- Reels\n- Stories\n- Carousel', 'Bogen.ai', true, true, false, 98),

('tiktok-script-writer', 'TikTok Script Writer', 'tiktok-scripts', 'Creates viral-style TikTok scripts with hooks, transitions, and trending audio suggestions.', '# TikTok Script Writer\n\nCreate content that goes viral.\n\n## Script Elements\n- 3-second hook\n- Pattern interrupts\n- Story arc\n- CTA\n- Trending audio suggestions\n\n## Content Styles\n- Educational\n- Entertainment\n- Behind-the-scenes\n- Trends/challenges', 'Bogen.ai', true, true, false, 76);

-- =====================
-- CAREER
-- =====================
INSERT INTO skills (slug, name, category, description, skill_content, author_name, is_free, is_published, is_featured, install_count)
VALUES
('resume-optimizer', 'Resume Optimizer', 'career', 'Optimizes resumes for ATS systems and specific job descriptions with keyword matching and formatting.', '# Resume Optimizer\n\nGet past ATS and impress recruiters.\n\n## Optimization\n- Keyword matching\n- ATS formatting\n- Achievement quantification\n- Action verb enhancement\n- Section ordering\n\n## Input\n- Current resume\n- Target job description\n- Industry', 'Bogen.ai', true, true, true, 187),

('cover-letter-writer', 'Cover Letter Writer', 'career', 'Writes personalized cover letters that highlight relevant experience and enthusiasm for specific roles.', '# Cover Letter Writer\n\nStand out from other applicants.\n\n## Structure\n- Compelling opening\n- Relevant experience match\n- Company research integration\n- Enthusiasm demonstration\n- Strong close\n\n## Input\n- Job posting\n- Your background\n- Company info', 'Bogen.ai', true, true, false, 143),

('interview-prep-coach', 'Interview Prep Coach', 'career', 'Prepares you for interviews with common questions, STAR-format answers, and company research guides.', '# Interview Prep Coach\n\nAce your next interview.\n\n## Preparation\n- Common questions\n- STAR format answers\n- Company research\n- Questions to ask\n- Salary negotiation tips\n\n## Question Types\n- Behavioral\n- Technical\n- Situational\n- Culture fit', 'Bogen.ai', true, true, false, 112);
