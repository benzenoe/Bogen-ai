const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/videos
 * Get all featured videos (public)
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM featured_videos ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

/**
 * POST /api/videos
 * Add a new featured video (admin only)
 */
router.post(
  '/',
  authenticateAdmin,
  [
    body('youtube_url').trim().notEmpty().withMessage('YouTube URL is required'),
    body('title').optional().trim(),
    body('description').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { youtube_url, title, description } = req.body;

      // Extract YouTube video ID from URL
      const videoId = extractYoutubeId(youtube_url);
      if (!videoId) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
      }

      // Get the current max display_order
      const maxOrderResult = await pool.query(
        'SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM featured_videos'
      );
      const nextOrder = maxOrderResult.rows[0].next_order;

      // Insert video
      const result = await pool.query(
        `INSERT INTO featured_videos (youtube_video_id, title, description, thumbnail_url, display_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          videoId,
          title || null,
          description || null,
          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          nextOrder
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error adding video:', error);
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'This video is already in the archive' });
      }
      res.status(500).json({ error: 'Failed to add video' });
    }
  }
);

/**
 * PUT /api/videos/:video_id
 * Update a featured video (admin only)
 */
router.put(
  '/:video_id',
  authenticateAdmin,
  [
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('display_order').optional().isInt()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { video_id } = req.params;
      const { title, description, display_order } = req.body;

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramCount++}`);
        values.push(title);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(description);
      }
      if (display_order !== undefined) {
        updates.push(`display_order = $${paramCount++}`);
        values.push(display_order);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(video_id);

      const result = await pool.query(
        `UPDATE featured_videos SET ${updates.join(', ')} WHERE video_id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Video not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating video:', error);
      res.status(500).json({ error: 'Failed to update video' });
    }
  }
);

/**
 * DELETE /api/videos/:video_id
 * Delete a featured video (admin only)
 */
router.delete('/:video_id', authenticateAdmin, async (req, res) => {
  try {
    const { video_id } = req.params;

    const result = await pool.query(
      'DELETE FROM featured_videos WHERE video_id = $1 RETURNING *',
      [video_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ message: 'Video removed successfully', video: result.rows[0] });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

/**
 * Helper function to extract YouTube video ID from URL
 */
function extractYoutubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

module.exports = router;
