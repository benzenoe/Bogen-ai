const express = require('express');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const router = express.Router();

/**
 * GET /api/migrate/run
 * One-time migration endpoint to create mastermind_registrations table
 * Secure with query parameter
 */
router.get('/run', async (req, res) => {
  try {
    // Simple security check - require secret key
    const secret = req.query.secret;
    if (secret !== process.env.MIGRATION_SECRET) {
      return res.status(403).json({ error: 'Unauthorized - Invalid secret key' });
    }

    console.log('Running mastermind registrations migration...');

    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, '../../database/add_mastermind_registrations.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);

    console.log('Migration completed successfully!');

    res.json({
      success: true,
      message: 'Mastermind registrations table created successfully!',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Migration error:', error);

    // If table already exists, that's okay
    if (error.message && error.message.includes('already exists')) {
      return res.json({
        success: true,
        message: 'Table already exists - migration not needed',
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
