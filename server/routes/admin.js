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

/**
 * GET /api/admin/mastermind/registrations
 * Get all mastermind registrations with optional filtering
 */
router.get('/mastermind/registrations', async (req, res) => {
  try {
    const { event_date, status } = req.query;

    let query = `
      SELECT
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
    `;

    const conditions = [];
    const params = [];
    let paramCount = 0;

    if (event_date) {
      paramCount++;
      conditions.push(`event_date = $${paramCount}`);
      params.push(event_date);
    }

    if (status) {
      paramCount++;
      conditions.push(`registration_status = $${paramCount}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      registrations: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Get mastermind registrations error:', error);
    res.status(500).json({ error: 'Failed to load registrations' });
  }
});

/**
 * GET /api/admin/mastermind/stats
 * Get registration statistics grouped by event
 */
router.get('/mastermind/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        event_date,
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN registration_status = 'registered' THEN 1 END) as registered,
        COUNT(CASE WHEN registration_status = 'attended' THEN 1 END) as attended,
        COUNT(CASE WHEN registration_status = 'no_show' THEN 1 END) as no_show,
        COUNT(CASE WHEN registration_status = 'cancelled' THEN 1 END) as cancelled
      FROM mastermind_registrations
      GROUP BY event_date
      ORDER BY event_date DESC
    `);

    res.json({ stats: result.rows });
  } catch (error) {
    console.error('Get mastermind stats error:', error);
    res.status(500).json({ error: 'Failed to load statistics' });
  }
});

/**
 * PUT /api/admin/mastermind/registrations/:id
 * Update registration status (mark attendance, etc.)
 */
router.put('/mastermind/registrations/:id', async (req, res) => {
  try {
    const registrationId = req.params.id;
    const { registration_status } = req.body;

    if (!['registered', 'attended', 'no_show', 'cancelled'].includes(registration_status)) {
      return res.status(400).json({ error: 'Invalid registration status' });
    }

    const result = await pool.query(
      `UPDATE mastermind_registrations
       SET registration_status = $1
       WHERE registration_id = $2
       RETURNING registration_id, first_name, last_name, registration_status`,
      [registration_status, registrationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    res.json({
      message: 'Registration updated successfully',
      registration: result.rows[0]
    });
  } catch (error) {
    console.error('Update registration error:', error);
    res.status(500).json({ error: 'Failed to update registration' });
  }
});

/**
 * GET /api/admin/mastermind/event-config
 * Get current event configuration
 */
router.get('/mastermind/event-config', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(__dirname, '../../config/mastermind-event.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    res.json(config);
  } catch (error) {
    console.error('Get event config error:', error);
    res.status(500).json({ error: 'Failed to load event configuration' });
  }
});

/**
 * PUT /api/admin/mastermind/event-config
 * Update event configuration
 */
router.put('/mastermind/event-config', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(__dirname, '../../config/mastermind-event.json');

    // Validate required fields
    const requiredFields = [
      'eventTitle', 'eventSubtitle', 'eventDate', 'eventDateDisplay',
      'eventTime', 'eventTimeStart', 'eventTimeZone', 'zoomLink',
      'meetingId', 'passcode'
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Write the new config
    fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2), 'utf8');

    res.json({
      message: 'Event configuration updated successfully',
      config: req.body
    });
  } catch (error) {
    console.error('Update event config error:', error);
    res.status(500).json({ error: 'Failed to update event configuration' });
  }
});

// ============================================
// CLIENT PORTAL MANAGEMENT ROUTES
// ============================================

/**
 * GET /api/admin/portal/dashboard
 * Get client portal admin dashboard stats
 */
router.get('/portal/dashboard', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM portal_clients WHERE status = 'active') as active_clients,
        (SELECT COUNT(*) FROM transactions WHERE status NOT IN ('completed', 'cancelled')) as active_transactions,
        (SELECT COUNT(*) FROM client_messages WHERE sender_type = 'client' AND is_read = FALSE) as unread_messages,
        (SELECT COUNT(*) FROM client_appointments WHERE scheduled_at > NOW() AND status = 'scheduled') as upcoming_appointments
    `);

    const recentActivity = await pool.query(`
      SELECT 'message' as type, cm.created_at, pc.first_name || ' ' || pc.last_name as client_name, cm.subject as detail
      FROM client_messages cm
      JOIN portal_clients pc ON cm.portal_client_id = pc.portal_client_id
      WHERE cm.sender_type = 'client'
      ORDER BY cm.created_at DESC
      LIMIT 5
    `);

    res.json({
      stats: stats.rows[0],
      recentActivity: recentActivity.rows
    });
  } catch (error) {
    console.error('Portal dashboard error:', error);
    res.status(500).json({ error: 'Failed to load portal dashboard' });
  }
});

/**
 * GET /api/admin/portal/clients
 * Get all portal clients
 */
router.get('/portal/clients', async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT pc.portal_client_id, pc.email, pc.first_name, pc.last_name, pc.phone,
             pc.company, pc.status, pc.email_verified, pc.last_login, pc.created_at,
             COUNT(DISTINCT t.transaction_id) as transaction_count,
             COUNT(DISTINCT CASE WHEN cm.is_read = FALSE AND cm.sender_type = 'client' THEN cm.message_id END) as unread_messages
      FROM portal_clients pc
      LEFT JOIN transactions t ON pc.portal_client_id = t.portal_client_id
      LEFT JOIN client_messages cm ON pc.portal_client_id = cm.portal_client_id
    `;

    const params = [];
    if (status) {
      query += ' WHERE pc.status = $1';
      params.push(status);
    }

    query += ' GROUP BY pc.portal_client_id ORDER BY pc.created_at DESC';

    const result = await pool.query(query, params);

    res.json({ clients: result.rows });
  } catch (error) {
    console.error('Get portal clients error:', error);
    res.status(500).json({ error: 'Failed to load portal clients' });
  }
});

/**
 * POST /api/admin/portal/clients
 * Create a new portal client account
 */
router.post('/portal/clients', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, company } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }

    // Check if email exists
    const existing = await pool.query('SELECT portal_client_id FROM portal_clients WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO portal_clients (email, password_hash, first_name, last_name, phone, company, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING portal_client_id, email, first_name, last_name, phone, company, status, created_at`,
      [email.toLowerCase(), password_hash, first_name, last_name, phone || null, company || null]
    );

    res.json({
      message: 'Client account created successfully',
      client: result.rows[0]
    });
  } catch (error) {
    console.error('Create portal client error:', error);
    res.status(500).json({ error: 'Failed to create client account' });
  }
});

/**
 * GET /api/admin/portal/clients/:id
 * Get single portal client details
 */
router.get('/portal/clients/:id', async (req, res) => {
  try {
    const clientId = req.params.id;

    const client = await pool.query(
      `SELECT portal_client_id, email, first_name, last_name, phone, company, status,
              email_verified, last_login, created_at
       FROM portal_clients WHERE portal_client_id = $1`,
      [clientId]
    );

    if (client.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const transactions = await pool.query(
      `SELECT transaction_id, title, property_address, status, created_at
       FROM transactions WHERE portal_client_id = $1 ORDER BY created_at DESC`,
      [clientId]
    );

    res.json({
      client: client.rows[0],
      transactions: transactions.rows
    });
  } catch (error) {
    console.error('Get portal client error:', error);
    res.status(500).json({ error: 'Failed to load client details' });
  }
});

/**
 * PUT /api/admin/portal/clients/:id
 * Update portal client
 */
router.put('/portal/clients/:id', async (req, res) => {
  try {
    const clientId = req.params.id;
    const { first_name, last_name, phone, company, status } = req.body;

    const result = await pool.query(
      `UPDATE portal_clients
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           company = COALESCE($4, company),
           status = COALESCE($5, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE portal_client_id = $6
       RETURNING portal_client_id, email, first_name, last_name, phone, company, status`,
      [first_name, last_name, phone, company, status, clientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({
      message: 'Client updated successfully',
      client: result.rows[0]
    });
  } catch (error) {
    console.error('Update portal client error:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

/**
 * POST /api/admin/portal/clients/:id/reset-password
 * Reset client password (admin sets new password)
 */
router.post('/portal/clients/:id/reset-password', async (req, res) => {
  try {
    const clientId = req.params.id;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const password_hash = await bcrypt.hash(new_password, 10);

    await pool.query(
      'UPDATE portal_clients SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE portal_client_id = $2',
      [password_hash, clientId]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ============================================
// TRANSACTIONS MANAGEMENT
// ============================================

/**
 * GET /api/admin/portal/transactions
 * Get all transactions
 */
router.get('/portal/transactions', async (req, res) => {
  try {
    const { status, client_id } = req.query;

    let query = `
      SELECT t.transaction_id, t.title, t.description, t.service_type, t.property_address,
             t.property_value, t.status, t.assigned_to, t.start_date, t.estimated_completion,
             t.created_at, pc.first_name || ' ' || pc.last_name as client_name, pc.email as client_email,
             (SELECT COUNT(*) FROM transaction_timeline WHERE transaction_id = t.transaction_id) as total_steps,
             (SELECT COUNT(*) FROM transaction_timeline WHERE transaction_id = t.transaction_id AND status = 'completed') as completed_steps
      FROM transactions t
      JOIN portal_clients pc ON t.portal_client_id = pc.portal_client_id
    `;

    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`t.status = $${params.length}`);
    }

    if (client_id) {
      params.push(client_id);
      conditions.push(`t.portal_client_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);

    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to load transactions' });
  }
});

/**
 * POST /api/admin/portal/transactions
 * Create a new transaction for a client
 */
router.post('/portal/transactions', async (req, res) => {
  try {
    const {
      portal_client_id, title, description, service_type, property_address,
      property_value, assigned_to, start_date, estimated_completion, timeline_template
    } = req.body;

    if (!portal_client_id || !title) {
      return res.status(400).json({ error: 'Client and title are required' });
    }

    // Create the transaction
    const result = await pool.query(
      `INSERT INTO transactions (portal_client_id, title, description, service_type, property_address,
                                  property_value, assigned_to, start_date, estimated_completion, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'initiated')
       RETURNING transaction_id`,
      [portal_client_id, title, description || null, service_type || null, property_address || null,
       property_value || null, assigned_to || null, start_date || null, estimated_completion || null]
    );

    const transactionId = result.rows[0].transaction_id;

    // Add default timeline steps based on service type
    const timelineSteps = getDefaultTimeline(service_type || timeline_template);

    for (let i = 0; i < timelineSteps.length; i++) {
      await pool.query(
        `INSERT INTO transaction_timeline (transaction_id, step_name, step_description, step_order, status)
         VALUES ($1, $2, $3, $4, 'pending')`,
        [transactionId, timelineSteps[i].name, timelineSteps[i].description, i + 1]
      );
    }

    res.json({
      message: 'Transaction created successfully',
      transaction_id: transactionId,
      timeline_steps: timelineSteps.length
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Helper function for default timelines
function getDefaultTimeline(type) {
  const timelines = {
    'buyer': [
      { name: 'Initial Consultation', description: 'Discuss needs, preferences, and budget' },
      { name: 'Pre-Approval', description: 'Secure mortgage pre-approval letter' },
      { name: 'Property Search', description: 'Review listings and schedule showings' },
      { name: 'Property Tours', description: 'Visit selected properties' },
      { name: 'Offer Submitted', description: 'Submit purchase offer' },
      { name: 'Offer Accepted', description: 'Negotiate and finalize terms' },
      { name: 'Under Contract', description: 'Execute purchase agreement' },
      { name: 'Home Inspection', description: 'Complete property inspection' },
      { name: 'Appraisal', description: 'Lender appraisal completed' },
      { name: 'Loan Processing', description: 'Final mortgage underwriting' },
      { name: 'Clear to Close', description: 'All conditions satisfied' },
      { name: 'Final Walkthrough', description: 'Verify property condition' },
      { name: 'Closing', description: 'Sign documents and receive keys' }
    ],
    'seller': [
      { name: 'Initial Consultation', description: 'Discuss goals, timeline, and pricing strategy' },
      { name: 'Listing Agreement', description: 'Sign exclusive listing contract' },
      { name: 'Home Preparation', description: 'Staging, repairs, and photography' },
      { name: 'Listed on MLS', description: 'Property active on market' },
      { name: 'Showings Begin', description: 'Scheduled property tours' },
      { name: 'Offer Received', description: 'Review and negotiate offers' },
      { name: 'Offer Accepted', description: 'Terms agreed upon' },
      { name: 'Under Contract', description: 'Purchase agreement executed' },
      { name: 'Buyer Inspection', description: 'Inspection completed' },
      { name: 'Appraisal', description: 'Property appraised for buyer\'s lender' },
      { name: 'Buyer Clear to Close', description: 'Buyer\'s financing confirmed' },
      { name: 'Closing', description: 'Sign documents and transfer ownership' }
    ],
    'general': [
      { name: 'Initiated', description: 'Transaction started' },
      { name: 'In Progress', description: 'Work underway' },
      { name: 'Review', description: 'Final review' },
      { name: 'Completed', description: 'Transaction complete' }
    ]
  };

  return timelines[type] || timelines['general'];
}

/**
 * GET /api/admin/portal/transactions/:id
 * Get single transaction with full timeline
 */
router.get('/portal/transactions/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;

    const transaction = await pool.query(
      `SELECT t.*, pc.first_name || ' ' || pc.last_name as client_name, pc.email as client_email, pc.phone as client_phone
       FROM transactions t
       JOIN portal_clients pc ON t.portal_client_id = pc.portal_client_id
       WHERE t.transaction_id = $1`,
      [transactionId]
    );

    if (transaction.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const timeline = await pool.query(
      `SELECT * FROM transaction_timeline WHERE transaction_id = $1 ORDER BY step_order`,
      [transactionId]
    );

    const documents = await pool.query(
      `SELECT * FROM client_documents WHERE transaction_id = $1 ORDER BY created_at DESC`,
      [transactionId]
    );

    res.json({
      transaction: transaction.rows[0],
      timeline: timeline.rows,
      documents: documents.rows
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to load transaction' });
  }
});

/**
 * PUT /api/admin/portal/transactions/:id
 * Update transaction details
 */
router.put('/portal/transactions/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const { title, description, service_type, property_address, property_value,
            status, assigned_to, estimated_completion, notes } = req.body;

    const result = await pool.query(
      `UPDATE transactions
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           service_type = COALESCE($3, service_type),
           property_address = COALESCE($4, property_address),
           property_value = COALESCE($5, property_value),
           status = COALESCE($6, status),
           assigned_to = COALESCE($7, assigned_to),
           estimated_completion = COALESCE($8, estimated_completion),
           notes = COALESCE($9, notes),
           actual_completion = CASE WHEN $6 = 'completed' THEN CURRENT_DATE ELSE actual_completion END,
           updated_at = CURRENT_TIMESTAMP
       WHERE transaction_id = $10
       RETURNING *`,
      [title, description, service_type, property_address, property_value,
       status, assigned_to, estimated_completion, notes, transactionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      message: 'Transaction updated successfully',
      transaction: result.rows[0]
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// ============================================
// TIMELINE MANAGEMENT
// ============================================

/**
 * POST /api/admin/portal/transactions/:id/timeline
 * Add a timeline step to a transaction
 */
router.post('/portal/transactions/:id/timeline', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const { step_name, step_description, step_order } = req.body;

    if (!step_name) {
      return res.status(400).json({ error: 'Step name is required' });
    }

    // Get current max order if not specified
    let order = step_order;
    if (!order) {
      const maxOrder = await pool.query(
        'SELECT COALESCE(MAX(step_order), 0) + 1 as next_order FROM transaction_timeline WHERE transaction_id = $1',
        [transactionId]
      );
      order = maxOrder.rows[0].next_order;
    }

    const result = await pool.query(
      `INSERT INTO transaction_timeline (transaction_id, step_name, step_description, step_order, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [transactionId, step_name, step_description || null, order]
    );

    res.json({
      message: 'Timeline step added',
      step: result.rows[0]
    });
  } catch (error) {
    console.error('Add timeline step error:', error);
    res.status(500).json({ error: 'Failed to add timeline step' });
  }
});

/**
 * PUT /api/admin/portal/timeline/:id
 * Update a timeline step
 */
router.put('/portal/timeline/:id', async (req, res) => {
  try {
    const timelineId = req.params.id;
    const { step_name, step_description, status, notes, completed_by } = req.body;

    const result = await pool.query(
      `UPDATE transaction_timeline
       SET step_name = COALESCE($1, step_name),
           step_description = COALESCE($2, step_description),
           status = COALESCE($3, status),
           notes = COALESCE($4, notes),
           completed_by = COALESCE($5, completed_by),
           completed_at = CASE WHEN $3 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
           updated_at = CURRENT_TIMESTAMP
       WHERE timeline_id = $6
       RETURNING *`,
      [step_name, step_description, status, notes, completed_by, timelineId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Timeline step not found' });
    }

    res.json({
      message: 'Timeline step updated',
      step: result.rows[0]
    });
  } catch (error) {
    console.error('Update timeline step error:', error);
    res.status(500).json({ error: 'Failed to update timeline step' });
  }
});

/**
 * DELETE /api/admin/portal/timeline/:id
 * Delete a timeline step
 */
router.delete('/portal/timeline/:id', async (req, res) => {
  try {
    const timelineId = req.params.id;

    await pool.query('DELETE FROM transaction_timeline WHERE timeline_id = $1', [timelineId]);

    res.json({ message: 'Timeline step deleted' });
  } catch (error) {
    console.error('Delete timeline step error:', error);
    res.status(500).json({ error: 'Failed to delete timeline step' });
  }
});

// ============================================
// RESOURCES MANAGEMENT
// ============================================

/**
 * GET /api/admin/portal/resources
 * Get all resources
 */
router.get('/portal/resources', async (req, res) => {
  try {
    const { category } = req.query;

    let query = 'SELECT * FROM client_resources';
    const params = [];

    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }

    query += ' ORDER BY category, sort_order, created_at DESC';

    const result = await pool.query(query, params);

    res.json({ resources: result.rows });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ error: 'Failed to load resources' });
  }
});

/**
 * POST /api/admin/portal/resources
 * Create a new resource
 */
router.post('/portal/resources', async (req, res) => {
  try {
    const { title, description, category, file_url, external_link, thumbnail_url, is_public, sort_order } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required' });
    }

    const result = await pool.query(
      `INSERT INTO client_resources (title, description, category, file_url, external_link, thumbnail_url, is_public, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, description || null, category, file_url || null, external_link || null,
       thumbnail_url || null, is_public !== false, sort_order || 0]
    );

    res.json({
      message: 'Resource created successfully',
      resource: result.rows[0]
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

/**
 * PUT /api/admin/portal/resources/:id
 * Update a resource
 */
router.put('/portal/resources/:id', async (req, res) => {
  try {
    const resourceId = req.params.id;
    const { title, description, category, file_url, external_link, thumbnail_url, is_public, sort_order } = req.body;

    const result = await pool.query(
      `UPDATE client_resources
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           file_url = COALESCE($4, file_url),
           external_link = COALESCE($5, external_link),
           thumbnail_url = COALESCE($6, thumbnail_url),
           is_public = COALESCE($7, is_public),
           sort_order = COALESCE($8, sort_order),
           updated_at = CURRENT_TIMESTAMP
       WHERE resource_id = $9
       RETURNING *`,
      [title, description, category, file_url, external_link, thumbnail_url, is_public, sort_order, resourceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json({
      message: 'Resource updated successfully',
      resource: result.rows[0]
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ error: 'Failed to update resource' });
  }
});

/**
 * DELETE /api/admin/portal/resources/:id
 * Delete a resource
 */
router.delete('/portal/resources/:id', async (req, res) => {
  try {
    const resourceId = req.params.id;

    await pool.query('DELETE FROM client_resources WHERE resource_id = $1', [resourceId]);

    res.json({ message: 'Resource deleted' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

// ============================================
// MESSAGES MANAGEMENT
// ============================================

/**
 * GET /api/admin/portal/messages
 * Get all client messages
 */
router.get('/portal/messages', async (req, res) => {
  try {
    const { unread_only, client_id } = req.query;

    let query = `
      SELECT cm.*, pc.first_name || ' ' || pc.last_name as client_name, pc.email as client_email,
             t.title as transaction_title
      FROM client_messages cm
      JOIN portal_clients pc ON cm.portal_client_id = pc.portal_client_id
      LEFT JOIN transactions t ON cm.transaction_id = t.transaction_id
    `;

    const conditions = [];
    const params = [];

    if (unread_only === 'true') {
      conditions.push("cm.sender_type = 'client' AND cm.is_read = FALSE");
    }

    if (client_id) {
      params.push(client_id);
      conditions.push(`cm.portal_client_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY cm.created_at DESC';

    const result = await pool.query(query, params);

    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

/**
 * POST /api/admin/portal/messages/:client_id
 * Send a message to a client
 */
router.post('/portal/messages/:client_id', async (req, res) => {
  try {
    const clientId = req.params.client_id;
    const { subject, message, transaction_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await pool.query(
      `INSERT INTO client_messages (portal_client_id, transaction_id, sender_type, sender_name, subject, message)
       VALUES ($1, $2, 'admin', 'The Edmund Bogen Team', $3, $4)
       RETURNING *`,
      [clientId, transaction_id || null, subject || null, message]
    );

    res.json({
      message: 'Message sent successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * PUT /api/admin/portal/messages/:id/read
 * Mark a message as read
 */
router.put('/portal/messages/:id/read', async (req, res) => {
  try {
    const messageId = req.params.id;

    await pool.query(
      'UPDATE client_messages SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE message_id = $1',
      [messageId]
    );

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// ============================================
// APPOINTMENTS MANAGEMENT
// ============================================

/**
 * GET /api/admin/portal/appointments
 * Get all appointments
 */
router.get('/portal/appointments', async (req, res) => {
  try {
    const { upcoming_only } = req.query;

    let query = `
      SELECT ca.*, pc.first_name || ' ' || pc.last_name as client_name, pc.email as client_email,
             t.title as transaction_title
      FROM client_appointments ca
      JOIN portal_clients pc ON ca.portal_client_id = pc.portal_client_id
      LEFT JOIN transactions t ON ca.transaction_id = t.transaction_id
    `;

    if (upcoming_only === 'true') {
      query += " WHERE ca.scheduled_at > NOW() AND ca.status NOT IN ('cancelled', 'completed')";
    }

    query += ' ORDER BY ca.scheduled_at ASC';

    const result = await pool.query(query);

    res.json({ appointments: result.rows });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Failed to load appointments' });
  }
});

/**
 * POST /api/admin/portal/appointments
 * Create an appointment for a client
 */
router.post('/portal/appointments', async (req, res) => {
  try {
    const { portal_client_id, transaction_id, title, description, appointment_type,
            scheduled_at, duration_minutes, location, meeting_link } = req.body;

    if (!portal_client_id || !title || !scheduled_at) {
      return res.status(400).json({ error: 'Client, title, and scheduled time are required' });
    }

    const result = await pool.query(
      `INSERT INTO client_appointments (portal_client_id, transaction_id, title, description, appointment_type,
                                        scheduled_at, duration_minutes, location, meeting_link)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [portal_client_id, transaction_id || null, title, description || null, appointment_type || null,
       scheduled_at, duration_minutes || 30, location || null, meeting_link || null]
    );

    res.json({
      message: 'Appointment created successfully',
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

/**
 * PUT /api/admin/portal/appointments/:id
 * Update an appointment
 */
router.put('/portal/appointments/:id', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { title, description, scheduled_at, duration_minutes, location, meeting_link, status, notes } = req.body;

    const result = await pool.query(
      `UPDATE client_appointments
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           scheduled_at = COALESCE($3, scheduled_at),
           duration_minutes = COALESCE($4, duration_minutes),
           location = COALESCE($5, location),
           meeting_link = COALESCE($6, meeting_link),
           status = COALESCE($7, status),
           notes = COALESCE($8, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE appointment_id = $9
       RETURNING *`,
      [title, description, scheduled_at, duration_minutes, location, meeting_link, status, notes, appointmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({
      message: 'Appointment updated successfully',
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

module.exports = router;
