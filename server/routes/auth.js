const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { generateReferralCode } = require('../utils/referralCode');
const { sendPartnerApprovalEmail, sendPartnerApplicationNotification } = require('../utils/email');

const router = express.Router();

/**
 * POST /api/auth/partner/register
 * Register new partner (application)
 */
router.post(
  '/partner/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('phone').optional().trim(),
    body('linkedin_url').optional().trim(),
    body('industries').optional().isArray(),
    body('how_they_know_businesses').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, phone, linkedin_url, industries, how_they_know_businesses } = req.body;

      // Check if email already exists
      const existingUser = await pool.query('SELECT email FROM partners WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Generate unique referral code
      let referral_code = generateReferralCode();
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        const existing = await pool.query('SELECT unique_referral_code FROM partners WHERE unique_referral_code = $1', [referral_code]);
        if (existing.rows.length === 0) {
          isUnique = true;
        } else {
          referral_code = generateReferralCode();
          attempts++;
        }
      }

      // Insert new partner (status: pending)
      const result = await pool.query(
        `INSERT INTO partners (name, email, password_hash, phone, linkedin_url, unique_referral_code, industries, how_they_know_businesses, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
         RETURNING partner_id, name, email, unique_referral_code, status, date_joined`,
        [name, email, password_hash, phone, linkedin_url, referral_code, industries, how_they_know_businesses]
      );

      const newPartner = result.rows[0];

      // Send notification to admin
      await sendPartnerApplicationNotification({
        name,
        email,
        phone,
        linkedin_url,
        industries,
        how_they_know_businesses
      });

      res.status(201).json({
        message: 'Partner application submitted successfully. We will review and contact you within 24 hours.',
        partner: {
          id: newPartner.partner_id,
          name: newPartner.name,
          email: newPartner.email,
          status: newPartner.status
        }
      });
    } catch (error) {
      console.error('Partner registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

/**
 * POST /api/auth/partner/login
 * Partner login
 */
router.post(
  '/partner/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Get partner from database
      const result = await pool.query(
        'SELECT partner_id, name, email, password_hash, status, unique_referral_code FROM partners WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const partner = result.rows[0];

      // Check if partner is active
      if (partner.status === 'suspended') {
        return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
      }

      if (partner.status === 'pending') {
        return res.status(403).json({ error: 'Your application is still pending review. We will contact you within 24 hours.' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, partner.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Update last login
      await pool.query('UPDATE partners SET last_login = CURRENT_TIMESTAMP WHERE partner_id = $1', [partner.partner_id]);

      // Generate JWT token
      const token = generateToken({
        id: partner.partner_id,
        email: partner.email,
        name: partner.name,
        type: 'partner'
      });

      // Set cookie
      res.cookie('partner_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        message: 'Login successful',
        token,
        partner: {
          id: partner.partner_id,
          name: partner.name,
          email: partner.email,
          referral_code: partner.unique_referral_code
        }
      });
    } catch (error) {
      console.error('Partner login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

/**
 * POST /api/auth/admin/login
 * Admin login
 */
router.post(
  '/admin/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Get admin from database
      const result = await pool.query(
        'SELECT admin_id, name, email, password_hash FROM admin_users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const admin = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, admin.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Update last login
      await pool.query('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE admin_id = $1', [admin.admin_id]);

      // Generate JWT token
      const token = generateToken({
        id: admin.admin_id,
        email: admin.email,
        name: admin.name,
        type: 'admin'
      });

      // Set cookie
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        message: 'Admin login successful',
        token,
        admin: {
          id: admin.admin_id,
          name: admin.name,
          email: admin.email
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

/**
 * GET /api/auth/admin/me
 * Get current admin user info
 */
router.get('/admin/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.admin_token;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { verifyToken } = require('../middleware/auth');
    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== 'admin') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({
      admin: {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email
      }
    });
  } catch (error) {
    console.error('Admin me error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (clear cookies)
 */
router.post('/logout', (req, res) => {
  res.clearCookie('partner_token');
  res.clearCookie('admin_token');
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
