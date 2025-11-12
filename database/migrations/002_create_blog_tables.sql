-- ============================================
-- Blog System Database Tables Migration
-- Created: 2025-11-12
-- Purpose: Blog content management
-- ============================================

-- ============================================
-- Table: blog_posts
-- Purpose: Store blog posts
-- ============================================
CREATE TABLE IF NOT EXISTS blog_posts (
  post_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  author_name VARCHAR(100),

  -- SEO
  meta_description VARCHAR(160),
  meta_keywords TEXT,

  -- Status and visibility
  status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
  is_featured BOOLEAN DEFAULT false,

  -- Timestamps
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_featured ON blog_posts(is_featured, status);

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE
ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Table: blog_categories
-- Purpose: Organize blog posts by category
-- ============================================
CREATE TABLE IF NOT EXISTS blog_categories (
  category_id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: blog_post_categories
-- Purpose: Many-to-many relationship between posts and categories
-- ============================================
CREATE TABLE IF NOT EXISTS blog_post_categories (
  post_id INTEGER REFERENCES blog_posts(post_id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES blog_categories(category_id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

-- ============================================
-- Seed initial blog categories
-- ============================================
INSERT INTO blog_categories (name, slug, description, display_order) VALUES
('AI & Technology', 'ai-technology', 'Latest trends in AI and business automation', 1),
('Real Estate', 'real-estate', 'Tips and insights for real estate professionals', 2),
('Business Strategy', 'business-strategy', 'Growth strategies and business development', 3),
('Masterminds & Coaching', 'masterminds-coaching', 'Insights from Edmund''s Mastermind sessions', 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- Sample blog post for testing
-- ============================================
INSERT INTO blog_posts (
  title, slug, excerpt, content, author_name, status, published_at, is_featured
) VALUES (
  'Welcome to the Bogen.ai Blog',
  'welcome-to-bogen-ai-blog',
  'Discover how AI is transforming business operations and why now is the time to embrace automation.',
  '<h2>The AI Revolution is Here</h2>
  <p>Artificial Intelligence is no longer a futuristic concept—it''s here, and it''s transforming how businesses operate. At Bogen.ai, we''re at the forefront of this revolution, helping businesses implement AI solutions that deliver real results.</p>

  <h3>Why AI Matters Now</h3>
  <p>In today''s competitive landscape, businesses that adopt AI early gain significant advantages:</p>
  <ul>
    <li>24/7 customer service without hiring additional staff</li>
    <li>Automated workflows that save hours daily</li>
    <li>Data-driven insights that improve decision-making</li>
    <li>Scalable solutions that grow with your business</li>
  </ul>

  <h3>Our Approach</h3>
  <p>At Bogen.ai, we don''t believe in one-size-fits-all solutions. Every business is unique, and your AI implementation should be too. We work closely with you to understand your specific challenges and build custom solutions that address your needs.</p>

  <p>Stay tuned for more insights on AI, business automation, and strategies for growth. Subscribe to our newsletter to never miss an update.</p>',
  'Edmund Bogen',
  'published',
  CURRENT_TIMESTAMP,
  true
) ON CONFLICT (slug) DO NOTHING;

-- Link sample post to AI & Technology category
INSERT INTO blog_post_categories (post_id, category_id)
SELECT
  (SELECT post_id FROM blog_posts WHERE slug = 'welcome-to-bogen-ai-blog'),
  (SELECT category_id FROM blog_categories WHERE slug = 'ai-technology')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE blog_posts IS 'Stores blog post content managed via CMS';
COMMENT ON TABLE blog_categories IS 'Organizes blog posts into categories';
COMMENT ON TABLE blog_post_categories IS 'Many-to-many relationship for posts and categories';
