-- Skills Marketplace Schema
-- Migration: 005_skills_marketplace.sql
-- Created: December 10, 2025

-- Skills table - stores all published and pending skills
CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    skill_content TEXT NOT NULL,
    author_name VARCHAR(100),
    author_website VARCHAR(255),
    author_email VARCHAR(255),
    is_free BOOLEAN DEFAULT true,
    price_cents INTEGER,
    gumroad_url VARCHAR(255),
    install_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Skill submissions table - stores pending submissions for review
CREATE TABLE IF NOT EXISTS skill_submissions (
    id SERIAL PRIMARY KEY,
    skill_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    admin_notes TEXT,
    submitted_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES admin_users(admin_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_is_published ON skills(is_published);
CREATE INDEX IF NOT EXISTS idx_skills_is_featured ON skills(is_featured);
CREATE INDEX IF NOT EXISTS idx_skills_slug ON skills(slug);
CREATE INDEX IF NOT EXISTS idx_skill_submissions_status ON skill_submissions(status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_skills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS skills_updated_at ON skills;
CREATE TRIGGER skills_updated_at
    BEFORE UPDATE ON skills
    FOR EACH ROW
    EXECUTE FUNCTION update_skills_updated_at();

-- Valid categories constraint
ALTER TABLE skills DROP CONSTRAINT IF EXISTS skills_category_check;
ALTER TABLE skills ADD CONSTRAINT skills_category_check
    CHECK (category IN ('real-estate', 'marketing', 'sales', 'operations', 'development'));

ALTER TABLE skill_submissions DROP CONSTRAINT IF EXISTS skill_submissions_status_check;
ALTER TABLE skill_submissions ADD CONSTRAINT skill_submissions_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'));
