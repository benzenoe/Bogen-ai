const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// Valid discount codes
const DISCOUNT_CODES = {
  'MASTERMIND20': { percent: 20, description: 'Mastermind Member Discount' },
  'CLIENT15': { percent: 15, description: 'Existing Client Discount' },
  'PARTNER25': { percent: 25, description: 'Partner Discount' },
  'EARLYBIRD': { percent: 10, description: 'Early Bird Discount' }
};

const BASE_PRICE = 1100;

/**
 * POST /api/claude-code-mastermind/register
 * Register for Claude Code Mastermind program
 */
router.post(
  '/register',
  [
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('company').optional().trim(),
    body('experience').optional().trim(),
    body('discount_code').optional().trim(),
    body('final_price').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        first_name,
        last_name,
        email,
        phone,
        company,
        experience,
        discount_code,
        final_price
      } = req.body;

      // Validate discount code if provided
      let validatedPrice = BASE_PRICE;
      let appliedDiscount = null;

      if (discount_code) {
        const upperCode = discount_code.toUpperCase();
        if (DISCOUNT_CODES[upperCode]) {
          const discount = DISCOUNT_CODES[upperCode];
          validatedPrice = BASE_PRICE * (1 - discount.percent / 100);
          appliedDiscount = upperCode;
        }
      }

      // Check if already registered
      const existingRegistration = await pool.query(
        'SELECT id FROM claude_code_mastermind_registrations WHERE email = $1',
        [email]
      );

      if (existingRegistration.rows.length > 0) {
        return res.status(400).json({
          error: 'This email is already registered for the Claude Code Mastermind program.'
        });
      }

      // Insert registration
      const result = await pool.query(
        `INSERT INTO claude_code_mastermind_registrations
         (first_name, last_name, email, phone, company, experience_level, discount_code, final_price, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'registered')
         RETURNING id, created_at`,
        [first_name, last_name, email, phone, company, experience, appliedDiscount, validatedPrice]
      );

      const registration = result.rows[0];

      // TODO: Send confirmation email
      // TODO: Process payment via Stripe

      res.status(201).json({
        message: 'Registration successful!',
        registration_id: registration.id,
        final_price: validatedPrice,
        discount_applied: appliedDiscount
      });
    } catch (error) {
      console.error('Claude Code Mastermind registration error:', error);
      res.status(500).json({ error: 'Failed to register. Please try again.' });
    }
  }
);

/**
 * POST /api/claude-code-mastermind/validate-discount
 * Validate a discount code
 */
router.post('/validate-discount', (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ valid: false, error: 'No code provided' });
  }

  const upperCode = code.toUpperCase();
  if (DISCOUNT_CODES[upperCode]) {
    const discount = DISCOUNT_CODES[upperCode];
    const discountedPrice = BASE_PRICE * (1 - discount.percent / 100);
    return res.json({
      valid: true,
      discount_percent: discount.percent,
      description: discount.description,
      original_price: BASE_PRICE,
      discounted_price: discountedPrice,
      savings: BASE_PRICE - discountedPrice
    });
  }

  return res.json({ valid: false, error: 'Invalid discount code' });
});

/**
 * GET /api/claude-code-mastermind/registrations
 * Get all registrations (admin only)
 */
router.get('/registrations', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        first_name,
        last_name,
        email,
        phone,
        company,
        experience_level,
        discount_code,
        final_price,
        status,
        created_at
       FROM claude_code_mastermind_registrations
       ORDER BY created_at DESC`
    );

    res.json({
      registrations: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

/**
 * GET /api/claude-code-mastermind/stats
 * Get registration statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const totalResult = await pool.query(
      'SELECT COUNT(*) as total FROM claude_code_mastermind_registrations'
    );

    const revenueResult = await pool.query(
      'SELECT SUM(final_price) as revenue FROM claude_code_mastermind_registrations WHERE status = $1',
      ['registered']
    );

    const discountResult = await pool.query(
      `SELECT discount_code, COUNT(*) as count
       FROM claude_code_mastermind_registrations
       WHERE discount_code IS NOT NULL
       GROUP BY discount_code`
    );

    res.json({
      total_registrations: parseInt(totalResult.rows[0].total) || 0,
      total_revenue: parseFloat(revenueResult.rows[0].revenue) || 0,
      discounts_used: discountResult.rows
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
