const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');
const { sendPartnerApprovalEmail } = require('../utils/email');

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

/**
 * GET /api/admin/dashboard
 * Get admin dashboard overview
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Get counts
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM partners WHERE status = 'pending') as pending_partners,
        (SELECT COUNT(*) FROM partners WHERE status = 'active') as active_partners,
        (SELECT COUNT(*) FROM clients WHERE status = 'lead') as new_leads,
        (SELECT COUNT(*) FROM referrals WHERE status = 'active') as active_referrals,
        (SELECT COALESCE(SUM(monthly_recurring_revenue), 0) FROM referrals WHERE status = 'active') as total_mrr
    `);

    res.json({ stats: stats.rows[0] });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

/**
 * GET /api/admin/partners
 * Get all partners
 */
router.get('/partners', async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT p.partner_id, p.name, p.email, p.phone, p.linkedin_url,
             p.unique_referral_code, p.status, p.commission_rate,
             p.total_lifetime_earnings, p.date_joined,
             COUNT(r.referral_id) as referral_count,
             COALESCE(SUM(CASE WHEN r.status = 'active' THEN r.partner_monthly_commission ELSE 0 END), 0) as monthly_commission
      FROM partners p
      LEFT JOIN referrals r ON p.partner_id = r.partner_id
    `;

    const params = [];
    if (status) {
      query += ' WHERE p.status = $1';
      params.push(status);
    }

    query += ' GROUP BY p.partner_id ORDER BY p.date_joined DESC';

    const result = await pool.query(query, params);

    const partners = result.rows.map(p => ({
      id: p.partner_id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      linkedin_url: p.linkedin_url,
      referral_code: p.unique_referral_code,
      status: p.status,
      commission_rate: parseFloat(p.commission_rate),
      total_earnings: parseFloat(p.total_lifetime_earnings),
      monthly_commission: parseFloat(p.monthly_commission),
      referral_count: parseInt(p.referral_count),
      date_joined: p.date_joined
    }));

    res.json({ partners });
  } catch (error) {
    console.error('Get partners error:', error);
    res.status(500).json({ error: 'Failed to load partners' });
  }
});

/**
 * POST /api/admin/partners/:id/approve
 * Approve pending partner
 */
router.post('/partners/:id/approve', async (req, res) => {
  try {
    const partnerId = req.params.id;

    // Update partner status
    const result = await pool.query(
      `UPDATE partners
       SET status = 'active'
       WHERE partner_id = $1 AND status = 'pending'
       RETURNING partner_id, name, email, unique_referral_code, commission_rate`,
      [partnerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found or already processed' });
    }

    const partner = result.rows[0];

    // Send approval email
    await sendPartnerApprovalEmail({
      name: partner.name,
      email: partner.email,
      unique_referral_code: partner.unique_referral_code,
      commission_rate: partner.commission_rate
    });

    res.json({
      message: 'Partner approved successfully',
      partner: {
        id: partner.partner_id,
        name: partner.name,
        email: partner.email
      }
    });
  } catch (error) {
    console.error('Approve partner error:', error);
    res.status(500).json({ error: 'Failed to approve partner' });
  }
});

/**
 * POST /api/admin/partners/:id/suspend
 * Suspend partner
 */
router.post('/partners/:id/suspend', async (req, res) => {
  try {
    const partnerId = req.params.id;

    await pool.query(
      'UPDATE partners SET status = $1 WHERE partner_id = $2',
      ['suspended', partnerId]
    );

    res.json({ message: 'Partner suspended' });
  } catch (error) {
    console.error('Suspend partner error:', error);
    res.status(500).json({ error: 'Failed to suspend partner' });
  }
});

/**
 * GET /api/admin/clients
 * Get all clients
 */
router.get('/clients', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.client_id, c.name, c.email, c.phone, c.company, c.industry,
             c.services_interested, c.monthly_budget, c.status,
             c.referred_by_partner_id, c.referral_source, c.created_at,
             p.name as partner_name
      FROM clients c
      LEFT JOIN partners p ON c.referred_by_partner_id = p.partner_id
      ORDER BY c.created_at DESC
    `);

    const clients = result.rows.map(c => ({
      id: c.client_id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      industry: c.industry,
      services: c.services_interested,
      budget: c.monthly_budget,
      status: c.status,
      partner_id: c.referred_by_partner_id,
      partner_name: c.partner_name,
      referral_source: c.referral_source,
      created_at: c.created_at
    }));

    res.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to load clients' });
  }
});

/**
 * POST /api/admin/referrals
 * Create or update referral (when client becomes active)
 */
router.post(
  '/referrals',
  [
    body('client_id').isInt(),
    body('monthly_revenue').isFloat({ min: 0 }),
    body('services').isArray(),
    body('status').isIn(['lead', 'proposal_sent', 'active', 'churned'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { client_id, monthly_revenue, services, status } = req.body;

      // Get client and check if referred
      const client = await pool.query(
        'SELECT referred_by_partner_id, name, email, company FROM clients WHERE client_id = $1',
        [client_id]
      );

      if (client.rows.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }

      const clientData = client.rows[0];

      if (!clientData.referred_by_partner_id) {
        return res.status(400).json({ error: 'Client was not referred by a partner' });
      }

      // Get partner commission rate
      const partner = await pool.query(
        'SELECT commission_rate FROM partners WHERE partner_id = $1',
        [clientData.referred_by_partner_id]
      );

      // Update or create referral
      const referralResult = await pool.query(
        `INSERT INTO referrals (partner_id, client_id, client_name, client_email, client_company,
                                services_subscribed, monthly_recurring_revenue, partner_commission_rate,
                                status, start_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE)
         ON CONFLICT (partner_id, client_id)
         DO UPDATE SET
           monthly_recurring_revenue = $7,
           services_subscribed = $6,
           status = $9,
           start_date = CASE WHEN referrals.status != 'active' AND $9 = 'active' THEN CURRENT_DATE ELSE referrals.start_date END
         RETURNING referral_id`,
        [
          clientData.referred_by_partner_id,
          client_id,
          clientData.name,
          clientData.email,
          clientData.company,
          JSON.stringify(services),
          monthly_revenue,
          partner.rows[0].commission_rate,
          status
        ]
      );

      // Update client status
      await pool.query('UPDATE clients SET status = $1 WHERE client_id = $2', [status, client_id]);

      res.json({
        message: 'Referral updated successfully',
        referral_id: referralResult.rows[0].referral_id
      });
    } catch (error) {
      console.error('Update referral error:', error);
      res.status(500).json({ error: 'Failed to update referral' });
    }
  }
);

/**
 * GET /api/admin/referrals
 * Get all referrals
 */
router.get('/referrals', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.referral_id, r.client_name, r.client_email, r.client_company,
             r.services_subscribed, r.monthly_recurring_revenue,
             r.partner_monthly_commission, r.status, r.start_date, r.created_at,
             p.name as partner_name, p.email as partner_email
      FROM referrals r
      JOIN partners p ON r.partner_id = p.partner_id
      ORDER BY r.created_at DESC
    `);

    const referrals = result.rows.map(r => ({
      id: r.referral_id,
      client_name: r.client_name,
      client_email: r.client_email,
      client_company: r.client_company,
      services: r.services_subscribed,
      monthly_revenue: parseFloat(r.monthly_recurring_revenue),
      partner_commission: parseFloat(r.partner_monthly_commission),
      status: r.status,
      start_date: r.start_date,
      partner_name: r.partner_name,
      partner_email: r.partner_email,
      created_at: r.created_at
    }));

    res.json({ referrals });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ error: 'Failed to load referrals' });
  }
});

module.exports = router;
