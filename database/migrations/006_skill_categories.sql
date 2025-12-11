-- Migration: Add comprehensive skill categories with parent/child hierarchy
-- Run this after 005_skills_marketplace.sql

-- Drop the old category check constraint if it exists
ALTER TABLE skills DROP CONSTRAINT IF EXISTS skills_category_check;

-- Create categories table for better organization
CREATE TABLE IF NOT EXISTS skill_categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    parent_slug VARCHAR(100) REFERENCES skill_categories(slug) ON DELETE SET NULL,
    description TEXT,
    icon VARCHAR(10),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_skill_categories_parent ON skill_categories(parent_slug);
CREATE INDEX IF NOT EXISTS idx_skill_categories_active ON skill_categories(is_active);

-- Insert Parent Categories (top-level)
INSERT INTO skill_categories (slug, name, parent_slug, description, icon, display_order) VALUES
-- Parent Categories
('business-professional', 'Business & Professional', NULL, 'Skills for business operations and professional services', '💼', 1),
('marketing-sales', 'Marketing & Sales', NULL, 'Skills for marketing, advertising, and sales', '📈', 2),
('technology', 'Technology', NULL, 'Skills for software, IT, and technical work', '💻', 3),
('creative', 'Creative', NULL, 'Skills for design, writing, and creative work', '🎨', 4),
('operations-admin', 'Operations & Admin', NULL, 'Skills for operations and administration', '⚙️', 5),
('personal-lifestyle', 'Personal & Lifestyle', NULL, 'Skills for personal productivity and lifestyle', '🌟', 6),
('education-training', 'Education & Training', NULL, 'Skills for teaching, training, and research', '📚', 7),
('industry-specific', 'Industry-Specific', NULL, 'Specialized skills for specific industries', '🏢', 8)
ON CONFLICT (slug) DO NOTHING;

-- Business & Professional subcategories
INSERT INTO skill_categories (slug, name, parent_slug, description, icon, display_order) VALUES
('real-estate', 'Real Estate', 'business-professional', 'Property listings, CMAs, lead processing, client management', '🏠', 1),
('accounting-finance', 'Accounting & Finance', 'business-professional', 'Bookkeeping, financial analysis, invoicing, tax prep', '💰', 2),
('legal', 'Legal', 'business-professional', 'Contract review, legal research, document drafting', '⚖️', 3),
('consulting', 'Consulting', 'business-professional', 'Business analysis, strategy, client deliverables', '📊', 4),
('human-resources', 'Human Resources', 'business-professional', 'Recruiting, onboarding, policy writing, performance reviews', '👥', 5),
('insurance', 'Insurance', 'business-professional', 'Policy analysis, claims processing, client communications', '🛡️', 6),
('banking', 'Banking & Lending', 'business-professional', 'Loan processing, underwriting support, compliance', '🏦', 7)
ON CONFLICT (slug) DO NOTHING;

-- Marketing & Sales subcategories
INSERT INTO skill_categories (slug, name, parent_slug, description, icon, display_order) VALUES
('marketing', 'Marketing', 'marketing-sales', 'Campaign planning, brand strategy, market research', '📢', 1),
('sales', 'Sales', 'marketing-sales', 'Lead qualification, proposals, objection handling, CRM', '🤝', 2),
('social-media', 'Social Media', 'marketing-sales', 'Content creation, scheduling, engagement, analytics', '📱', 3),
('advertising', 'Advertising', 'marketing-sales', 'Ad copy, campaign management, A/B testing', '📺', 4),
('email-marketing', 'Email Marketing', 'marketing-sales', 'Sequences, newsletters, automation, deliverability', '📧', 5),
('seo-content', 'SEO & Content', 'marketing-sales', 'Keyword research, blog writing, optimization', '🔍', 6),
('public-relations', 'Public Relations', 'marketing-sales', 'Press releases, media outreach, crisis management', '📰', 7)
ON CONFLICT (slug) DO NOTHING;

-- Technology subcategories
INSERT INTO skill_categories (slug, name, parent_slug, description, icon, display_order) VALUES
('development', 'Development', 'technology', 'Code writing, debugging, documentation, architecture', '👨‍💻', 1),
('web-development', 'Web Development', 'technology', 'Frontend, backend, full-stack, APIs', '🌐', 2),
('mobile-development', 'Mobile Development', 'technology', 'iOS, Android, React Native, Flutter', '📲', 3),
('data-analytics', 'Data & Analytics', 'technology', 'SQL, data visualization, reporting, insights', '📊', 4),
('ai-automation', 'AI & Automation', 'technology', 'Prompt engineering, workflow automation, integrations', '🤖', 5),
('cybersecurity', 'Cybersecurity', 'technology', 'Security audits, compliance, incident response', '🔒', 6),
('it-support', 'IT & Support', 'technology', 'Troubleshooting, documentation, user guides', '🖥️', 7),
('devops', 'DevOps & Cloud', 'technology', 'Deployment, CI/CD, infrastructure, monitoring', '☁️', 8)
ON CONFLICT (slug) DO NOTHING;

-- Creative subcategories
INSERT INTO skill_categories (slug, name, parent_slug, description, icon, display_order) VALUES
('writing-content', 'Writing & Content', 'creative', 'Copywriting, blogging, storytelling, editing', '✍️', 1),
('design', 'Design', 'creative', 'Graphics, UI/UX, branding, presentations', '🎨', 2),
('video-production', 'Video & Audio', 'creative', 'Scripts, editing guides, podcast outlines', '🎬', 3),
('photography', 'Photography', 'creative', 'Shot lists, editing workflows, client delivery', '📷', 4),
('music-audio', 'Music & Audio', 'creative', 'Composition, sound design, audio engineering', '🎵', 5)
ON CONFLICT (slug) DO NOTHING;

-- Operations & Admin subcategories
INSERT INTO skill_categories (slug, name, parent_slug, description, icon, display_order) VALUES
('operations', 'Operations', 'operations-admin', 'Process optimization, SOPs, workflow design', '⚙️', 1),
('project-management', 'Project Management', 'operations-admin', 'Planning, tracking, reporting, team coordination', '📋', 2),
('customer-service', 'Customer Service', 'operations-admin', 'Support responses, escalation, satisfaction', '💬', 3),
('administrative', 'Administrative', 'operations-admin', 'Scheduling, correspondence, documentation', '📁', 4),
('supply-chain', 'Supply Chain', 'operations-admin', 'Inventory, logistics, vendor management', '🚚', 5),
('quality-assurance', 'Quality Assurance', 'operations-admin', 'Testing, audits, compliance checks', '✅', 6)
ON CONFLICT (slug) DO NOTHING;

-- Personal & Lifestyle subcategories
INSERT INTO skill_categories (slug, name, parent_slug, description, icon, display_order) VALUES
('travel', 'Travel', 'personal-lifestyle', 'Trip planning, itineraries, travel hacks', '✈️', 1),
('health-wellness', 'Health & Wellness', 'personal-lifestyle', 'Fitness plans, nutrition, mental health', '🏃', 2),
('personal-finance', 'Personal Finance', 'personal-lifestyle', 'Budgeting, investing, debt management', '💵', 3),
('productivity', 'Productivity', 'personal-lifestyle', 'Time management, habits, organization', '⏰', 4),
('relationships', 'Relationships', 'personal-lifestyle', 'Communication, networking, social skills', '❤️', 5),
('career', 'Career Development', 'personal-lifestyle', 'Resumes, interviews, job search, networking', '🎯', 6)
ON CONFLICT (slug) DO NOTHING;

-- Education & Training subcategories
INSERT INTO skill_categories (slug, name, parent_slug, description, icon, display_order) VALUES
('education', 'Education', 'education-training', 'Curriculum design, lesson plans, assessments', '🎓', 1),
('training', 'Training & Coaching', 'education-training', 'Workshop design, coaching frameworks, facilitation', '🏆', 2),
('e-learning', 'E-Learning', 'education-training', 'Course creation, LMS content, video scripts', '💻', 3),
('research', 'Research', 'education-training', 'Literature review, methodology, analysis', '🔬', 4),
('tutoring', 'Tutoring', 'education-training', 'Subject-specific help, study guides, test prep', '📖', 5)
ON CONFLICT (slug) DO NOTHING;

-- Industry-Specific subcategories
INSERT INTO skill_categories (slug, name, parent_slug, description, icon, display_order) VALUES
('healthcare', 'Healthcare', 'industry-specific', 'Patient communication, documentation, compliance', '🏥', 1),
('hospitality', 'Hospitality', 'industry-specific', 'Guest services, reservations, event planning', '🏨', 2),
('retail', 'Retail', 'industry-specific', 'Product descriptions, inventory, customer experience', '🛍️', 3),
('restaurants', 'Restaurants & Food', 'industry-specific', 'Menu writing, operations, customer service', '🍽️', 4),
('manufacturing', 'Manufacturing', 'industry-specific', 'Production planning, quality control, documentation', '🏭', 5),
('non-profit', 'Non-Profit', 'industry-specific', 'Grant writing, donor communication, volunteer coordination', '🤲', 6),
('construction', 'Construction', 'industry-specific', 'Estimates, project docs, safety, client communication', '🏗️', 7),
('automotive', 'Automotive', 'industry-specific', 'Service writing, inventory, customer follow-up', '🚗', 8),
('agriculture', 'Agriculture', 'industry-specific', 'Farm planning, crop management, market analysis', '🌾', 9)
ON CONFLICT (slug) DO NOTHING;

-- Update skills table to reference new categories
ALTER TABLE skills ADD COLUMN IF NOT EXISTS category_slug VARCHAR(100);

-- Create index for category lookups
CREATE INDEX IF NOT EXISTS idx_skills_category_slug ON skills(category_slug);

-- Migrate existing skills to new category structure
UPDATE skills SET category_slug = category WHERE category_slug IS NULL;
