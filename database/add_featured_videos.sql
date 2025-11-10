-- Migration: Add featured_videos table
-- Run this on an existing database to add the featured_videos table

-- Create Featured Videos Table if it doesn't exist
CREATE TABLE IF NOT EXISTS featured_videos (
    video_id SERIAL PRIMARY KEY,
    youtube_video_id VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255),
    description TEXT,
    thumbnail_url VARCHAR(500),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_featured_videos_display_order ON featured_videos(display_order);
CREATE INDEX IF NOT EXISTS idx_featured_videos_youtube_id ON featured_videos(youtube_video_id);

-- Add update trigger for updated_at column
CREATE TRIGGER update_featured_videos_updated_at
BEFORE UPDATE ON featured_videos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
