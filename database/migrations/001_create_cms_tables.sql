-- ============================================
-- CMS Database Tables Migration
-- Created: 2025-11-12
-- Purpose: Content Management System tables
-- ============================================

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- Table: mastermind_events
-- Purpose: Store mastermind session details
-- ============================================
CREATE TABLE IF NOT EXISTS mastermind_events (
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mastermind_events_date ON mastermind_events(event_date DESC);
CREATE INDEX idx_mastermind_events_published ON mastermind_events(is_published, is_featured);

CREATE TRIGGER update_mastermind_events_updated_at BEFORE UPDATE
ON mastermind_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Table: content_sections
-- Purpose: Store editable page content
-- ============================================
CREATE TABLE IF NOT EXISTS content_sections (
  section_id SERIAL PRIMARY KEY,
  page VARCHAR(100) NOT NULL,
  section_key VARCHAR(100) NOT NULL,
  section_type VARCHAR(50) NOT NULL,
  content TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page, section_key)
);

CREATE INDEX idx_content_sections_page ON content_sections(page);
CREATE INDEX idx_content_sections_active ON content_sections(is_active);

CREATE TRIGGER update_content_sections_updated_at BEFORE UPDATE
ON content_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Seed Initial Data from existing config
-- ============================================
INSERT INTO mastermind_events (
  event_title,
  event_subtitle,
  event_date,
  event_time_start,
  event_time_end,
  event_timezone,
  show_full_date,
  show_day_only,
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
  false,
  true,
  false,
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
  true,
  true
) ON CONFLICT DO NOTHING;

-- Seed homepage content sections
INSERT INTO content_sections (page, section_key, section_type, content, display_order) VALUES
('homepage', 'hero_tagline', 'text', 'Your AI Front Office. Always On. Always Professional.', 1),
('homepage', 'left_box_line1', 'text', 'You need AI.', 2),
('homepage', 'left_box_line2', 'text', 'You need Edmund Bogen', 3),
('homepage', 'right_box_line1', 'text', 'Next Mastermind: Wednesday', 4),
('homepage', 'right_box_line2', 'text', '9:00 AM Eastern Time', 5),
('homepage', 'video_url', 'text', 'https://www.youtube.com/embed/vqPPkELwcpI', 6)
ON CONFLICT (page, section_key) DO NOTHING;

COMMENT ON TABLE mastermind_events IS 'Stores mastermind session details editable via CMS';
COMMENT ON TABLE content_sections IS 'Stores editable content sections for various pages';
