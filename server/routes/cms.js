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

// ============================================
// BLOG ENDPOINTS
// ============================================

/**
 * GET /api/cms/blog/posts
 * Get all blog posts (admin view)
 */
router.get('/blog/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status; // filter by status

    let query = `
      SELECT p.*, COALESCE(json_agg(
        json_build_object('id', c.category_id, 'name', c.name, 'slug', c.slug)
      ) FILTER (WHERE c.category_id IS NOT NULL), '[]') as categories
      FROM blog_posts p
      LEFT JOIN blog_post_categories pc ON p.post_id = pc.post_id
      LEFT JOIN blog_categories c ON pc.category_id = c.category_id
    `;

    const params = [];
    if (status) {
      query += ' WHERE p.status = $1';
      params.push(status);
    }

    query += ' GROUP BY p.post_id ORDER BY p.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM blog_posts' + (status ? ' WHERE status = $1' : ''), status ? [status] : []);

    res.json({
      posts: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    });
  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({ error: 'Failed to load blog posts' });
  }
});

/**
 * GET /api/cms/blog/posts/:id
 * Get single blog post
 */
router.get('/blog/posts/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, COALESCE(json_agg(
        json_build_object('id', c.category_id, 'name', c.name, 'slug', c.slug)
      ) FILTER (WHERE c.category_id IS NOT NULL), '[]') as categories
      FROM blog_posts p
      LEFT JOIN blog_post_categories pc ON p.post_id = pc.post_id
      LEFT JOIN blog_categories c ON pc.category_id = c.category_id
      WHERE p.post_id = $1
      GROUP BY p.post_id
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post: result.rows[0] });
  } catch (error) {
    console.error('Get blog post error:', error);
    res.status(500).json({ error: 'Failed to load blog post' });
  }
});

/**
 * POST /api/cms/blog/posts
 * Create new blog post
 */
router.post('/blog/posts', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('slug').trim().notEmpty().withMessage('Slug is required'),
  body('content').trim().notEmpty().withMessage('Content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title, slug, excerpt, content, featured_image_url, author_name,
      meta_description, meta_keywords, status, is_featured, categories
    } = req.body;

    const published_at = status === 'published' ? new Date() : null;

    const result = await pool.query(`
      INSERT INTO blog_posts (
        title, slug, excerpt, content, featured_image_url, author_name,
        meta_description, meta_keywords, status, is_featured, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING post_id
    `, [
      title, slug, excerpt, content, featured_image_url, author_name || 'Edmund Bogen',
      meta_description, meta_keywords, status || 'draft', is_featured === true, published_at
    ]);

    const post_id = result.rows[0].post_id;

    // Add categories if provided
    if (categories && Array.isArray(categories) && categories.length > 0) {
      for (const category_id of categories) {
        await pool.query(
          'INSERT INTO blog_post_categories (post_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [post_id, category_id]
        );
      }
    }

    res.json({ post_id, message: 'Blog post created successfully' });
  } catch (error) {
    console.error('Create blog post error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

/**
 * PUT /api/cms/blog/posts/:id
 * Update blog post
 */
router.put('/blog/posts/:id', async (req, res) => {
  try {
    const {
      title, slug, excerpt, content, featured_image_url, author_name,
      meta_description, meta_keywords, status, is_featured, categories
    } = req.body;

    // If changing to published and no published_at, set it now
    let published_at_update = '';
    if (status === 'published') {
      published_at_update = ', published_at = COALESCE(published_at, CURRENT_TIMESTAMP)';
    }

    const result = await pool.query(`
      UPDATE blog_posts SET
        title = COALESCE($1, title),
        slug = COALESCE($2, slug),
        excerpt = $3,
        content = COALESCE($4, content),
        featured_image_url = $5,
        author_name = COALESCE($6, author_name),
        meta_description = $7,
        meta_keywords = $8,
        status = COALESCE($9, status),
        is_featured = COALESCE($10, is_featured),
        updated_at = CURRENT_TIMESTAMP
        ${published_at_update}
      WHERE post_id = $11
      RETURNING post_id
    `, [
      title, slug, excerpt, content, featured_image_url, author_name,
      meta_description, meta_keywords, status, is_featured,
      req.params.id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Update categories if provided
    if (categories && Array.isArray(categories)) {
      await pool.query('DELETE FROM blog_post_categories WHERE post_id = $1', [req.params.id]);
      for (const category_id of categories) {
        await pool.query(
          'INSERT INTO blog_post_categories (post_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [req.params.id, category_id]
        );
      }
    }

    res.json({ message: 'Blog post updated successfully' });
  } catch (error) {
    console.error('Update blog post error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Slug already exists' });
    }
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

/**
 * DELETE /api/cms/blog/posts/:id
 * Delete blog post
 */
router.delete('/blog/posts/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM blog_posts WHERE post_id = $1 RETURNING post_id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

/**
 * GET /api/cms/blog/categories
 * Get all blog categories
 */
router.get('/blog/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM blog_categories ORDER BY display_order, name');
    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

module.exports = router;
