const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

/**
 * POST /api/mastermind/register
 * Register for mastermind event
 */
router.post(
  '/register',
  [
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').optional().trim(),
    body('company').optional().trim(),
    body('how_heard').optional().trim()
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
        how_heard
      } = req.body;

      // Event date for this specific session
      const eventDate = '2025-11-13';

      // Check if already registered
      const existingRegistration = await pool.query(
        'SELECT registration_id FROM mastermind_registrations WHERE email = $1 AND event_date = $2',
        [email, eventDate]
      );

      if (existingRegistration.rows.length > 0) {
        return res.status(200).json({
          message: 'You are already registered for this event!',
          already_registered: true,
          zoom_link: 'https://us02web.zoom.us/j/83924796230?pwd=5QfNlq7KIcxGOuXBtoaN1sWVWd8jnj.1',
          meeting_id: '839 2479 6230',
          passcode: '251112',
          event_date: 'Wednesday, November 13, 2025',
          event_time: '9:00-10:00 AM Eastern Time'
        });
      }

      // Insert registration
      const result = await pool.query(
        `INSERT INTO mastermind_registrations
         (first_name, last_name, email, phone, company, how_heard, event_date, registration_status, email_sent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'registered', false)
         RETURNING registration_id, created_at`,
        [first_name, last_name, email, phone, company, how_heard, eventDate]
      );

      const registration = result.rows[0];

      // TODO: Send confirmation email (to be implemented in future session)
      // await sendMastermindConfirmationEmail({
      //   first_name,
      //   last_name,
      //   email,
      //   zoom_link: 'https://us02web.zoom.us/j/83924796230?pwd=5QfNlq7KIcxGOuXBtoaN1sWVWd8jnj.1',
      //   meeting_id: '839 2479 6230',
      //   passcode: '251112'
      // });

      res.status(201).json({
        message: 'Registration successful! See your Zoom details below.',
        registration_id: registration.registration_id,
        zoom_link: 'https://us02web.zoom.us/j/83924796230?pwd=5QfNlq7KIcxGOuXBtoaN1sWVWd8jnj.1',
        meeting_id: '839 2479 6230',
        passcode: '251112',
        event_date: 'Wednesday, November 13, 2025',
        event_time: '9:00-10:00 AM Eastern Time',
        workbook_link: 'https://acrobat.adobe.com/id/urn:aaid:sc:us:6d9e36ea-0112-42f3-ac13-6957b050cfed'
      });
    } catch (error) {
      console.error('Mastermind registration error:', error);
      res.status(500).json({ error: 'Failed to register for event. Please try again.' });
    }
  }
);

/**
 * GET /api/mastermind/registrations
 * Get all registrations (admin only - add auth middleware later)
 */
router.get('/registrations', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        registration_id,
        first_name,
        last_name,
        email,
        phone,
        company,
        how_heard,
        event_date,
        registration_status,
        email_sent,
        created_at
       FROM mastermind_registrations
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

module.exports = router;
