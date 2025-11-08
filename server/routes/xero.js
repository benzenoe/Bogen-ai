const express = require('express');
const { XeroClient } = require('xero-node');
const { pool } = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Initialize Xero client
const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: [process.env.XERO_REDIRECT_URI],
  scopes: 'openid profile email accounting.transactions offline_access'.split(' ')
});

/**
 * GET /api/xero/connect
 * Initiate Xero OAuth connection (admin only)
 */
router.get('/connect', authenticateAdmin, async (req, res) => {
  try {
    const consentUrl = await xero.buildConsentUrl();
    res.redirect(consentUrl);
  } catch (error) {
    console.error('Xero connect error:', error);
    res.status(500).json({ error: 'Failed to connect to Xero' });
  }
});

/**
 * GET /api/xero/callback
 * Xero OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    const tokenSet = await xero.apiCallback(req.url);
    await xero.updateTenants();

    // Store token securely (in production, encrypt and store in database)
    // For now, we'll just log success
    console.log('Xero connected successfully');

    res.redirect('/admin?xero=connected');
  } catch (error) {
    console.error('Xero callback error:', error);
    res.redirect('/admin?xero=error');
  }
});

/**
 * POST /api/xero/generate-commission-payments
 * Generate commission payments for a specific month (admin only)
 * This will create invoices in Xero for each partner
 */
router.post('/generate-commission-payments', authenticateAdmin, async (req, res) => {
  try {
    const { payment_period } = req.body; // Format: YYYY-MM

    if (!payment_period || !/^\d{4}-\d{2}$/.test(payment_period)) {
      return res.status(400).json({ error: 'Invalid payment period format. Use YYYY-MM' });
    }

    // Get all active partners with referrals
    const partnersResult = await pool.query(`
      SELECT p.partner_id, p.name, p.email,
             SUM(r.partner_monthly_commission) as total_commission
      FROM partners p
      JOIN referrals r ON p.partner_id = r.partner_id
      WHERE p.status = 'active'
        AND r.status = 'active'
      GROUP BY p.partner_id
      HAVING SUM(r.partner_monthly_commission) > 0
    `);

    const payments = [];

    for (const partner of partnersResult.rows) {
      const totalCommission = parseFloat(partner.total_commission);

      // Check if payment already exists for this period
      const existing = await pool.query(
        'SELECT payment_id FROM commission_payments WHERE partner_id = $1 AND payment_period = $2',
        [partner.partner_id, payment_period]
      );

      if (existing.rows.length > 0) {
        console.log(`Payment already exists for partner ${partner.partner_id} for ${payment_period}`);
        continue;
      }

      // Create commission payment record
      const paymentResult = await pool.query(
        `INSERT INTO commission_payments (partner_id, payment_period, total_commission_amount, status)
         VALUES ($1, $2, $3, 'pending')
         RETURNING payment_id`,
        [partner.partner_id, payment_period, totalCommission]
      );

      const paymentId = paymentResult.rows[0].payment_id;

      // TODO: Create invoice in Xero
      // This is a placeholder - implement Xero invoice creation
      /*
      try {
        const invoice = await xero.accountingApi.createInvoices(tenantId, {
          invoices: [{
            type: 'ACCPAY',
            contact: { name: partner.name },
            lineItems: [{
              description: `Partner Commission - ${payment_period}`,
              quantity: 1,
              unitAmount: totalCommission,
              accountCode: '200' // Your expense account code
            }],
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
            status: 'DRAFT'
          }]
        });

        // Update payment with Xero invoice ID
        await pool.query(
          'UPDATE commission_payments SET xero_invoice_id = $1 WHERE payment_id = $2',
          [invoice.body.invoices[0].invoiceID, paymentId]
        );
      } catch (xeroError) {
        console.error('Xero invoice creation failed:', xeroError);
      }
      */

      payments.push({
        partner_id: partner.partner_id,
        partner_name: partner.name,
        payment_id: paymentId,
        amount: totalCommission
      });
    }

    res.json({
      message: `Generated ${payments.length} commission payments for ${payment_period}`,
      payments
    });
  } catch (error) {
    console.error('Generate payments error:', error);
    res.status(500).json({ error: 'Failed to generate commission payments' });
  }
});

/**
 * GET /api/xero/status
 * Check Xero connection status (admin only)
 */
router.get('/status', authenticateAdmin, async (req, res) => {
  try {
    // Check if we have valid tokens
    // This is a simplified check - in production, verify token validity
    const connected = process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET;

    res.json({
      connected,
      message: connected ? 'Xero is configured' : 'Xero not configured. Set environment variables and connect.'
    });
  } catch (error) {
    console.error('Xero status error:', error);
    res.status(500).json({ error: 'Failed to check Xero status' });
  }
});

module.exports = router;
