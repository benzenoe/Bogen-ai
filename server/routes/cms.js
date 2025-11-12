const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// ============================================
// MASTERMIND EVENT ENDPOINTS
// ============================================

/**
 * GET /api/cms/mastermind/current
 * Get current published mastermind event
 */
router.get('/mastermind/current', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM mastermind_events
      WHERE is_published = true AND is_featured = true
      ORDER BY event_date DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No published event found' });
    }

    res.json({ event: result.rows[0] });
  } catch (error) {
    console.error('Get current event error:', error);
    res.status(500).json({ error: 'Failed to load event' });
  }
});

/**
 * GET /api/cms/mastermind/events
 * Get all mastermind events (with pagination)
 */
router.get('/mastermind/events', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(`
      SELECT * FROM mastermind_events
      ORDER BY event_date DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await pool.query('SELECT COUNT(*) FROM mastermind_events');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      events: result.rows,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to load events' });
  }
});

/**
 * GET /api/cms/mastermind/events/:id
 * Get single mastermind event
 */
router.get('/mastermind/events/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM mastermind_events WHERE event_id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event: result.rows[0] });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to load event' });
  }
});

/**
 * POST /api/cms/mastermind/events
 * Create new mastermind event
 */
router.post('/mastermind/events', [
  body('event_title').trim().notEmpty().withMessage('Event title is required'),
  body('event_date').isDate().withMessage('Valid date is required'),
  body('event_time_start').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      event_title, event_subtitle, event_date, event_time_start, event_time_end,
      event_timezone, show_full_date, show_day_only, show_time_range,
      zoom_link, meeting_id, passcode, workbook_link,
      description, key_points, benefits, featured_image_url,
      is_published, is_featured
    } = req.body;

    const result = await pool.query(`
      INSERT INTO mastermind_events (
        event_title, event_subtitle, event_date, event_time_start, event_time_end,
        event_timezone, show_full_date, show_day_only, show_time_range,
        zoom_link, meeting_id, passcode, workbook_link,
        description, key_points, benefits, featured_image_url,
        is_published, is_featured
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING event_id
    `, [
      event_title, event_subtitle, event_date, event_time_start, event_time_end,
      event_timezone || 'America/New_York',
      show_full_date !== false, show_day_only === true, show_time_range !== false,
      zoom_link, meeting_id, passcode, workbook_link,
      description,
      JSON.stringify(key_points || []),
      JSON.stringify(benefits || []),
      featured_image_url,
      is_published === true, is_featured === true
    ]);

    res.json({
      event_id: result.rows[0].event_id,
      message: 'Event created successfully'
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

/**
 * PUT /api/cms/mastermind/events/:id
 * Update mastermind event
 */
router.put('/mastermind/events/:id', async (req, res) => {
  try {
    const {
      event_title, event_subtitle, event_date, event_time_start, event_time_end,
      event_timezone, show_full_date, show_day_only, show_time_range,
      zoom_link, meeting_id, passcode, workbook_link,
      description, key_points, benefits, featured_image_url,
      is_published, is_featured
    } = req.body;

    const result = await pool.query(`
      UPDATE mastermind_events SET
        event_title = COALESCE($1, event_title),
        event_subtitle = COALESCE($2, event_subtitle),
        event_date = COALESCE($3, event_date),
        event_time_start = COALESCE($4, event_time_start),
        event_time_end = $5,
        event_timezone = COALESCE($6, event_timezone),
        show_full_date = COALESCE($7, show_full_date),
        show_day_only = COALESCE($8, show_day_only),
        show_time_range = COALESCE($9, show_time_range),
        zoom_link = $10,
        meeting_id = $11,
        passcode = $12,
        workbook_link = $13,
        description = $14,
        key_points = COALESCE($15, key_points),
        benefits = COALESCE($16, benefits),
        featured_image_url = $17,
        is_published = COALESCE($18, is_published),
        is_featured = COALESCE($19, is_featured),
        updated_at = CURRENT_TIMESTAMP
      WHERE event_id = $20
      RETURNING event_id
    `, [
      event_title, event_subtitle, event_date, event_time_start, event_time_end,
      event_timezone, show_full_date, show_day_only, show_time_range,
      zoom_link, meeting_id, passcode, workbook_link,
      description,
      key_points ? JSON.stringify(key_points) : null,
      benefits ? JSON.stringify(benefits) : null,
      featured_image_url,
      is_published, is_featured,
      req.params.id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

/**
 * DELETE /api/cms/mastermind/events/:id
 * Delete mastermind event
 */
router.delete('/mastermind/events/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM mastermind_events WHERE event_id = $1 RETURNING event_id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// ============================================
// CONTENT SECTIONS ENDPOINTS
// ============================================

/**
 * GET /api/cms/content
 * Get content sections for a page
 */
router.get('/content', async (req, res) => {
  try {
    const { page } = req.query;

    let query = 'SELECT * FROM content_sections WHERE is_active = true';
    const params = [];

    if (page) {
      query += ' AND page = $1';
      params.push(page);
    }

    query += ' ORDER BY display_order, section_id';

    const result = await pool.query(query, params);

    res.json({ sections: result.rows });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Failed to load content' });
  }
});

/**
 * PUT /api/cms/content/:section_id
 * Update content section
 */
router.put('/content/:section_id', async (req, res) => {
  try {
    const { content } = req.body;

    const result = await pool.query(`
      UPDATE content_sections
      SET content = $1, updated_at = CURRENT_TIMESTAMP
      WHERE section_id = $2
      RETURNING section_id
    `, [content, req.params.section_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content section not found' });
    }

    res.json({ message: 'Content updated successfully' });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

/**
 * PUT /api/cms/content/bulk
 * Bulk update content sections
 */
router.put('/content/bulk', async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Updates array required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const update of updates) {
        await client.query(`
          UPDATE content_sections
          SET content = $1, updated_at = CURRENT_TIMESTAMP
          WHERE page = $2 AND section_key = $3
        `, [update.content, update.page, update.section_key]);
      }

      await client.query('COMMIT');
      res.json({ message: 'Content updated successfully', updated: updates.length });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

module.exports = router;
