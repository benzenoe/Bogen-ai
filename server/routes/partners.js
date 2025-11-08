const express = require('express');
const { pool } = require('../config/database');
const { authenticatePartner } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticatePartner);

/**
 * GET /api/partners/dashboard
 * Get partner dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const partnerId = req.partner.id;

    // Get partner overview
    const partnerData = await pool.query(
      `SELECT partner_id, name, email, unique_referral_code, commission_rate,
              total_lifetime_earnings, date_joined, status
       FROM partners WHERE partner_id = $1`,
      [partnerId]
    );

    const partner = partnerData.rows[0];

    // Get active referrals count
    const activeReferrals = await pool.query(
      'SELECT COUNT(*) FROM referrals WHERE partner_id = $1 AND status = $2',
      [partnerId, 'active']
    );

    // Get this month's commission
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const thisMonthCommission = await pool.query(
      'SELECT COALESCE(SUM(partner_monthly_commission), 0) as total FROM referrals WHERE partner_id = $1 AND status = $2',
      [partnerId, 'active']
    );

    // Get pending proposals
    const pendingProposals = await pool.query(
      'SELECT COUNT(*) FROM referrals WHERE partner_id = $1 AND status = $2',
      [partnerId, 'proposal_sent']
    );

    res.json({
      partner: {
        id: partner.partner_id,
        name: partner.name,
        email: partner.email,
        referral_code: partner.unique_referral_code,
        commission_rate: parseFloat(partner.commission_rate),
        date_joined: partner.date_joined
      },
      metrics: {
        active_referrals: parseInt(activeReferrals.rows[0].count),
        this_month_commission: parseFloat(thisMonthCommission.rows[0].total),
        lifetime_earnings: parseFloat(partner.total_lifetime_earnings),
        pending_proposals: parseInt(pendingProposals.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

/**
 * GET /api/partners/referrals
 * Get all referrals for partner
 */
router.get('/referrals', async (req, res) => {
  try {
    const partnerId = req.partner.id;

    const result = await pool.query(
      `SELECT referral_id, client_name, client_email, client_company,
              services_subscribed, monthly_recurring_revenue,
              partner_monthly_commission, status, start_date, created_at
       FROM referrals
       WHERE partner_id = $1
       ORDER BY created_at DESC`,
      [partnerId]
    );

    const referrals = result.rows.map(r => ({
      id: r.referral_id,
      client_name: r.client_name,
      client_email: r.client_email,
      client_company: r.client_company,
      services: r.services_subscribed,
      monthly_value: parseFloat(r.monthly_recurring_revenue),
      commission: parseFloat(r.partner_monthly_commission),
      status: r.status,
      start_date: r.start_date,
      created_at: r.created_at
    }));

    res.json({ referrals });
  } catch (error) {
    console.error('Referrals error:', error);
    res.status(500).json({ error: 'Failed to load referrals' });
  }
});

/**
 * GET /api/partners/commissions
 * Get commission payment history
 */
router.get('/commissions', async (req, res) => {
  try {
    const partnerId = req.partner.id;

    const result = await pool.query(
      `SELECT payment_id, payment_period, total_commission_amount,
              payment_date, payment_method, status, xero_invoice_id, created_at
       FROM commission_payments
       WHERE partner_id = $1
       ORDER BY payment_period DESC`,
      [partnerId]
    );

    const payments = result.rows.map(p => ({
      id: p.payment_id,
      period: p.payment_period,
      amount: parseFloat(p.total_commission_amount),
      payment_date: p.payment_date,
      method: p.payment_method,
      status: p.status,
      invoice_id: p.xero_invoice_id,
      created_at: p.created_at
    }));

    res.json({ payments });
  } catch (error) {
    console.error('Commissions error:', error);
    res.status(500).json({ error: 'Failed to load commission history' });
  }
});

/**
 * GET /api/partners/referral-link
 * Get partner's unique referral link
 */
router.get('/referral-link', async (req, res) => {
  try {
    const partnerId = req.partner.id;

    const result = await pool.query(
      'SELECT unique_referral_code FROM partners WHERE partner_id = $1',
      [partnerId]
    );

    const referralCode = result.rows[0].unique_referral_code;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    res.json({
      referral_code: referralCode,
      referral_link: `${baseUrl}/?ref=${referralCode}`,
      share_links: {
        email: `mailto:?subject=Check out Bogen.ai&body=I wanted to share this AI automation service with you: ${baseUrl}/?ref=${referralCode}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(baseUrl + '/?ref=' + referralCode)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(baseUrl + '/?ref=' + referralCode)}&text=Check%20out%20Bogen.ai%20for%20AI%20automation%20services`
      }
    });
  } catch (error) {
    console.error('Referral link error:', error);
    res.status(500).json({ error: 'Failed to generate referral link' });
  }
});

module.exports = router;
