const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { sendClientInquiryNotification } = require('../utils/email');

const router = express.Router();

/**
 * POST /api/clients/inquiry
 * Submit client inquiry form
 */
router.post(
  '/inquiry',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').optional().trim(),
    body('company').optional().trim(),
    body('industry').optional().trim(),
    body('services_interested').optional().isArray(),
    body('monthly_budget').optional().trim(),
    body('business_description').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        email,
        phone,
        company,
        industry,
        services_interested,
        monthly_budget,
        business_description
      } = req.body;

      // Check for referral code in cookie
      console.log('=== REFERRAL DEBUG START ===');
      console.log('All cookies:', req.cookies);
      console.log('Signed cookies:', req.signedCookies);
      const referralCode = req.cookies.bogen_ref || req.signedCookies.bogen_ref;
      console.log('Referral code from cookie:', referralCode);
      console.log('=== REFERRAL DEBUG END ===');
      let referredByPartnerId = null;
      let referralSource = 'direct';

      if (referralCode) {
        const partner = await pool.query(
          'SELECT partner_id FROM partners WHERE unique_referral_code = $1 AND status = $2',
          [referralCode, 'active']
        );

        if (partner.rows.length > 0) {
          referredByPartnerId = partner.rows[0].partner_id;
          referralSource = `partner_${referralCode}`;
        }
      }

      // Insert client
      const clientResult = await pool.query(
        `INSERT INTO clients (name, email, phone, company, industry, services_interested, monthly_budget, business_description, referred_by_partner_id, referral_source, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'lead')
         RETURNING client_id, name, email, created_at`,
        [name, email, phone, company, industry, services_interested, monthly_budget, business_description, referredByPartnerId, referralSource]
      );

      const client = clientResult.rows[0];

      // If referred by partner, create referral record
      if (referredByPartnerId) {
        const partnerData = await pool.query(
          'SELECT commission_rate FROM partners WHERE partner_id = $1',
          [referredByPartnerId]
        );

        await pool.query(
          `INSERT INTO referrals (partner_id, client_id, client_name, client_email, client_company, partner_commission_rate, status, referral_source)
           VALUES ($1, $2, $3, $4, $5, $6, 'lead', $7)`,
          [referredByPartnerId, client.client_id, name, email, company, partnerData.rows[0].commission_rate, referralSource]
        );
      }

      // Send notification to admin
      await sendClientInquiryNotification({
        name,
        email,
        phone,
        company,
        industry,
        services_interested,
        monthly_budget,
        business_description,
        referred_by_partner_id: referredByPartnerId
      });

      res.status(201).json({
        message: 'Thank you! We\'ll send a custom proposal within 24 hours.',
        client_id: client.client_id
      });
    } catch (error) {
      console.error('Client inquiry error:', error);
      res.status(500).json({ error: 'Failed to submit inquiry' });
    }
  }
);

/**
 * POST /api/clients/partner-application
 * Submit partner application (alternative to auth/partner/register)
 */
router.post(
  '/partner-application',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').optional().trim(),
    body('linkedin_url').optional().trim(),
    body('industries').optional().isArray(),
    body('how_they_know_businesses').trim().notEmpty().withMessage('Please describe how you know business owners')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // This is a simplified version that doesn't create a login
      // Admin will manually approve and create credentials
      // Or redirect to full registration

      res.json({
        message: 'Thank you for your interest! Please complete the full partner registration to create your account.',
        redirect: '/partner-program'
      });
    } catch (error) {
      console.error('Partner application error:', error);
      res.status(500).json({ error: 'Failed to submit application' });
    }
  }
);

module.exports = router;
