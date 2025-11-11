const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

/**
 * GET /api/mastermind/event-config
 * Get current mastermind event configuration
 */
router.get('/event-config', (req, res) => {
  try {
    const configPath = path.join(__dirname, '../../config/mastermind-event.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    res.json(config);
  } catch (error) {
    console.error('Error reading mastermind config:', error);
    res.status(500).json({ error: 'Failed to load event configuration' });
  }
});

module.exports = router;
