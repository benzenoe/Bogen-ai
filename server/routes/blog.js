const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

/**
 * GET /api/blog/posts
 * Get published blog posts (public view)
 */
router.get('/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const category = req.query.category; // filter by category slug

    let query = `
      SELECT p.post_id, p.title, p.slug, p.excerpt, p.featured_image_url,
             p.author_name, p.published_at, p.is_featured,
             COALESCE(json_agg(
               json_build_object('id', c.category_id, 'name', c.name, 'slug', c.slug)
             ) FILTER (WHERE c.category_id IS NOT NULL), '[]') as categories
      FROM blog_posts p
      LEFT JOIN blog_post_categories pc ON p.post_id = pc.post_id
      LEFT JOIN blog_categories c ON pc.category_id = c.category_id
      WHERE p.status = 'published'
    `;

    const params = [];
    if (category) {
      query += ' AND EXISTS (SELECT 1 FROM blog_post_categories bpc JOIN blog_categories bc ON bpc.category_id = bc.category_id WHERE bpc.post_id = p.post_id AND bc.slug = $1)';
      params.push(category);
    }

    query += ` GROUP BY p.post_id ORDER BY p.published_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM blog_posts WHERE status = \'published\'';
    let countParams = [];
    if (category) {
      countQuery += ' AND EXISTS (SELECT 1 FROM blog_post_categories bpc JOIN blog_categories bc ON bpc.category_id = bc.category_id WHERE bpc.post_id = blog_posts.post_id AND bc.slug = $1)';
      countParams.push(category);
    }
    const countResult = await pool.query(countQuery, countParams);

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
 * GET /api/blog/posts/:slug
 * Get single published blog post by slug (public view)
 */
router.get('/posts/:slug', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, COALESCE(json_agg(
        json_build_object('id', c.category_id, 'name', c.name, 'slug', c.slug)
      ) FILTER (WHERE c.category_id IS NOT NULL), '[]') as categories
      FROM blog_posts p
      LEFT JOIN blog_post_categories pc ON p.post_id = pc.post_id
      LEFT JOIN blog_categories c ON pc.category_id = c.category_id
      WHERE p.slug = $1 AND p.status = 'published'
      GROUP BY p.post_id
    `, [req.params.slug]);

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
 * GET /api/blog/categories
 * Get all blog categories (public view)
 */
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, COUNT(bpc.post_id) as post_count
      FROM blog_categories c
      LEFT JOIN blog_post_categories bpc ON c.category_id = bpc.category_id
      LEFT JOIN blog_posts p ON bpc.post_id = p.post_id AND p.status = 'published'
      GROUP BY c.category_id
      ORDER BY c.display_order, c.name
    `);

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

module.exports = router;
