const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { generateToken, authenticateClient } = require('../middleware/auth');
const { sendClientWelcomeEmail, sendClientPasswordResetEmail } = require('../utils/email');

const router = express.Router();

/**
 * POST /api/auth/client/register
 * Register new client portal account
 */
router.post(
  '/client/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('phone').optional().trim(),
    body('company').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, email, password, phone, company } = req.body;

      // Check if email already exists
      const existingUser = await pool.query(
        'SELECT email FROM portal_clients WHERE email = $1',
        [email]
      );
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Generate email verification token
      const verification_token = crypto.randomBytes(32).toString('hex');

      // Check if there's an existing client record to link to
      const existingClient = await pool.query(
        'SELECT client_id FROM clients WHERE email = $1 LIMIT 1',
        [email]
      );
      const client_id = existingClient.rows.length > 0 ? existingClient.rows[0].client_id : null;

      // Insert new portal client
      const result = await pool.query(
        `INSERT INTO portal_clients
         (client_id, email, password_hash, first_name, last_name, phone, company, verification_token, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
         RETURNING portal_client_id, first_name, last_name, email, status, created_at`,
        [client_id, email, password_hash, firstName, lastName, phone, company, verification_token]
      );

      const newClient = result.rows[0];

      // Send welcome email (with optional verification link)
      try {
        await sendClientWelcomeEmail({
          email,
          firstName,
          lastName,
          verificationToken: verification_token
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }

      // Generate JWT token for immediate login
      const token = generateToken({
        id: newClient.portal_client_id,
        email: newClient.email,
        firstName: newClient.first_name,
        lastName: newClient.last_name,
        type: 'client'
      });

      // Set cookie
      res.cookie('client_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(201).json({
        message: 'Account created successfully',
        token,
        client: {
          id: newClient.portal_client_id,
          firstName: newClient.first_name,
          lastName: newClient.last_name,
          email: newClient.email
        }
      });
    } catch (error) {
      console.error('Client registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

/**
 * POST /api/auth/client/login
 * Client portal login
 */
router.post(
  '/client/login',
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

      // Get client from database
      const result = await pool.query(
        `SELECT portal_client_id, first_name, last_name, email, password_hash, status
         FROM portal_clients WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const client = result.rows[0];

      // Check if client is active
      if (client.status === 'suspended') {
        return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
      }

      if (client.status === 'inactive') {
        return res.status(403).json({ error: 'Your account is inactive. Please contact support.' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, client.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Update last login
      await pool.query(
        'UPDATE portal_clients SET last_login = CURRENT_TIMESTAMP WHERE portal_client_id = $1',
        [client.portal_client_id]
      );

      // Generate JWT token
      const token = generateToken({
        id: client.portal_client_id,
        email: client.email,
        firstName: client.first_name,
        lastName: client.last_name,
        type: 'client'
      });

      // Set cookie
      res.cookie('client_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        message: 'Login successful',
        token,
        client: {
          id: client.portal_client_id,
          firstName: client.first_name,
          lastName: client.last_name,
          email: client.email
        }
      });
    } catch (error) {
      console.error('Client login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

/**
 * POST /api/auth/client/logout
 * Client logout (clear cookies)
 */
router.post('/client/logout', (req, res) => {
  res.clearCookie('client_token');
  res.json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/client/me
 * Get current logged-in client info
 */
router.get('/client/me', authenticateClient, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT portal_client_id, first_name, last_name, email, phone, company,
              email_verified, status, last_login, created_at
       FROM portal_clients WHERE portal_client_id = $1`,
      [req.client.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = result.rows[0];
    res.json({
      client: {
        id: client.portal_client_id,
        firstName: client.first_name,
        lastName: client.last_name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        emailVerified: client.email_verified,
        status: client.status,
        lastLogin: client.last_login,
        createdAt: client.created_at
      }
    });
  } catch (error) {
    console.error('Get client info error:', error);
    res.status(500).json({ error: 'Failed to get client info' });
  }
});

/**
 * POST /api/auth/client/forgot-password
 * Request password reset
 */
router.post(
  '/client/forgot-password',
  [
    body('email').isEmail().normalizeEmail()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // Find client by email
      const result = await pool.query(
        'SELECT portal_client_id, first_name, email FROM portal_clients WHERE email = $1',
        [email]
      );

      // Always return success to prevent email enumeration
      if (result.rows.length === 0) {
        return res.json({ message: 'If an account exists with this email, you will receive a password reset link.' });
      }

      const client = result.rows[0];

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await pool.query(
        `UPDATE portal_clients
         SET password_reset_token = $1, password_reset_expires = $2
         WHERE portal_client_id = $3`,
        [resetToken, resetExpires, client.portal_client_id]
      );

      // Send reset email
      try {
        await sendClientPasswordResetEmail({
          email: client.email,
          firstName: client.first_name,
          resetToken
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }

      res.json({ message: 'If an account exists with this email, you will receive a password reset link.' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process request' });
    }
  }
);

/**
 * POST /api/auth/client/reset-password
 * Complete password reset
 */
router.post(
  '/client/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password } = req.body;

      // Find client by reset token
      const result = await pool.query(
        `SELECT portal_client_id, email, password_reset_expires
         FROM portal_clients
         WHERE password_reset_token = $1`,
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      const client = result.rows[0];

      // Check if token is expired
      if (new Date() > new Date(client.password_reset_expires)) {
        return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
      }

      // Hash new password
      const password_hash = await bcrypt.hash(password, 10);

      // Update password and clear reset token
      await pool.query(
        `UPDATE portal_clients
         SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL
         WHERE portal_client_id = $2`,
        [password_hash, client.portal_client_id]
      );

      res.json({ message: 'Password reset successful. You can now log in with your new password.' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

/**
 * GET /api/auth/client/verify-email/:token
 * Verify email address
 */
router.get('/client/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find client by verification token
    const result = await pool.query(
      `SELECT portal_client_id FROM portal_clients WHERE verification_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    // Mark email as verified
    await pool.query(
      `UPDATE portal_clients
       SET email_verified = TRUE, verification_token = NULL
       WHERE portal_client_id = $1`,
      [result.rows[0].portal_client_id]
    );

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

/**
 * PUT /api/auth/client/change-password
 * Change password (while logged in)
 */
router.put(
  '/client/change-password',
  authenticateClient,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;

      // Get current password hash
      const result = await pool.query(
        'SELECT password_hash FROM portal_clients WHERE portal_client_id = $1',
        [req.client.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const password_hash = await bcrypt.hash(newPassword, 10);

      // Update password
      await pool.query(
        'UPDATE portal_clients SET password_hash = $1 WHERE portal_client_id = $2',
        [password_hash, req.client.id]
      );

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

module.exports = router;
