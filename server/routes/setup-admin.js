const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const router = express.Router();

/**
 * POST /api/setup-admin/add
 * One-time endpoint to add admin users (secured with secret)
 */
router.post('/add', async (req, res) => {
  try {
    // Security check
    const secret = req.body.secret;
    if (secret !== process.env.MIGRATION_SECRET) {
      return res.status(403).json({ error: 'Unauthorized - Invalid secret key' });
    }

    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if admin already exists
    const existing = await pool.query(
      'SELECT admin_id FROM admin_users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.json({
        success: false,
        message: 'Admin user already exists with this email'
      });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert new admin
    const result = await pool.query(
      `INSERT INTO admin_users (email, password_hash, name, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING admin_id, email, name`,
      [email, passwordHash, name]
    );

    res.json({
      success: true,
      message: 'Admin user created successfully!',
      admin: {
        id: result.rows[0].admin_id,
        email: result.rows[0].email,
        name: result.rows[0].name
      }
    });

  } catch (error) {
    console.error('Add admin error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
