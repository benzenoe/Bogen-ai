const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateClient } = require('../middleware/auth');

const router = express.Router();

// All routes require client authentication
router.use(authenticateClient);

// ============================================
// DASHBOARD
// ============================================

/**
 * GET /api/client-portal/dashboard
 * Get client dashboard overview
 */
router.get('/dashboard', async (req, res) => {
  try {
    const clientId = req.client.id;

    // Get active transactions
    const transactionsResult = await pool.query(
      `SELECT transaction_id, title, service_type, status, property_address,
              start_date, estimated_completion, assigned_to
       FROM transactions
       WHERE portal_client_id = $1 AND status NOT IN ('completed', 'cancelled')
       ORDER BY created_at DESC
       LIMIT 5`,
      [clientId]
    );

    // Get unread messages count
    const messagesResult = await pool.query(
      `SELECT COUNT(*) as unread_count
       FROM client_messages
       WHERE portal_client_id = $1 AND sender_type = 'admin' AND is_read = FALSE`,
      [clientId]
    );

    // Get upcoming appointments
    const appointmentsResult = await pool.query(
      `SELECT appointment_id, title, scheduled_at, appointment_type, location, meeting_link, status
       FROM client_appointments
       WHERE portal_client_id = $1 AND scheduled_at > NOW() AND status IN ('scheduled', 'confirmed')
       ORDER BY scheduled_at ASC
       LIMIT 3`,
      [clientId]
    );

    // Get recent documents
    const documentsResult = await pool.query(
      `SELECT document_id, title, file_type, created_at
       FROM client_documents
       WHERE portal_client_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [clientId]
    );

    // Get published reports count
    const reportsResult = await pool.query(
      `SELECT COUNT(*) as report_count
       FROM client_reports
       WHERE portal_client_id = $1 AND is_published = TRUE`,
      [clientId]
    );

    res.json({
      activeTransactions: transactionsResult.rows,
      unreadMessages: parseInt(messagesResult.rows[0].unread_count),
      upcomingAppointments: appointmentsResult.rows,
      recentDocuments: documentsResult.rows,
      reportCount: parseInt(reportsResult.rows[0].report_count)
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// ============================================
// TRANSACTIONS
// ============================================

/**
 * GET /api/client-portal/transactions
 * Get all client transactions
 */
router.get('/transactions', async (req, res) => {
  try {
    const clientId = req.client.id;
    const { status } = req.query;

    let query = `
      SELECT t.transaction_id, t.title, t.description, t.service_type,
             t.property_address, t.property_value, t.status, t.assigned_to,
             t.start_date, t.estimated_completion, t.actual_completion,
             t.created_at, t.updated_at,
             (SELECT COUNT(*) FROM transaction_timeline WHERE transaction_id = t.transaction_id AND status = 'completed') as completed_steps,
             (SELECT COUNT(*) FROM transaction_timeline WHERE transaction_id = t.transaction_id) as total_steps
      FROM transactions t
      WHERE t.portal_client_id = $1
    `;
    const params = [clientId];

    if (status) {
      query += ` AND t.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY t.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

/**
 * GET /api/client-portal/transactions/:id
 * Get single transaction with timeline
 */
router.get('/transactions/:id', async (req, res) => {
  try {
    const clientId = req.client.id;
    const { id } = req.params;

    // Get transaction
    const transactionResult = await pool.query(
      `SELECT * FROM transactions
       WHERE transaction_id = $1 AND portal_client_id = $2`,
      [id, clientId]
    );

    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Get timeline steps
    const timelineResult = await pool.query(
      `SELECT * FROM transaction_timeline
       WHERE transaction_id = $1
       ORDER BY step_order ASC`,
      [id]
    );

    // Get related messages
    const messagesResult = await pool.query(
      `SELECT message_id, sender_type, sender_name, subject, message, is_read, created_at
       FROM client_messages
       WHERE transaction_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [id]
    );

    // Get related documents
    const documentsResult = await pool.query(
      `SELECT document_id, title, description, file_url, file_type, uploaded_by, uploader_name, created_at
       FROM client_documents
       WHERE transaction_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    res.json({
      transaction: transactionResult.rows[0],
      timeline: timelineResult.rows,
      messages: messagesResult.rows,
      documents: documentsResult.rows
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to get transaction' });
  }
});

// ============================================
// RESOURCES
// ============================================

/**
 * GET /api/client-portal/resources
 * Get available resources
 */
router.get('/resources', async (req, res) => {
  try {
    const { category } = req.query;

    let query = `
      SELECT resource_id, title, description, category, file_url, external_link,
             thumbnail_url, created_at
      FROM client_resources
      WHERE is_public = TRUE
    `;
    const params = [];

    if (category) {
      query += ` AND category = $1`;
      params.push(category);
    }

    query += ` ORDER BY sort_order ASC, created_at DESC`;

    const result = await pool.query(query, params);

    res.json({ resources: result.rows });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ error: 'Failed to get resources' });
  }
});

/**
 * GET /api/client-portal/resources/:id
 * Get single resource
 */
router.get('/resources/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM client_resources WHERE resource_id = $1 AND is_public = TRUE`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json({ resource: result.rows[0] });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({ error: 'Failed to get resource' });
  }
});

// ============================================
// MESSAGES
// ============================================

/**
 * GET /api/client-portal/messages
 * Get client messages
 */
router.get('/messages', async (req, res) => {
  try {
    const clientId = req.client.id;
    const { transactionId, unreadOnly } = req.query;

    let query = `
      SELECT m.message_id, m.transaction_id, m.sender_type, m.sender_name,
             m.subject, m.message, m.is_read, m.read_at, m.created_at,
             t.title as transaction_title
      FROM client_messages m
      LEFT JOIN transactions t ON m.transaction_id = t.transaction_id
      WHERE m.portal_client_id = $1
    `;
    const params = [clientId];

    if (transactionId) {
      params.push(transactionId);
      query += ` AND m.transaction_id = $${params.length}`;
    }

    if (unreadOnly === 'true') {
      query += ` AND m.is_read = FALSE`;
    }

    query += ` ORDER BY m.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

/**
 * POST /api/client-portal/messages
 * Send new message
 */
router.post(
  '/messages',
  [
    body('subject').optional().trim(),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('transactionId').optional().isInt()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const clientId = req.client.id;
      const { subject, message, transactionId } = req.body;
      const senderName = `${req.client.firstName} ${req.client.lastName}`;

      // Verify transaction belongs to client if specified
      if (transactionId) {
        const txResult = await pool.query(
          'SELECT transaction_id FROM transactions WHERE transaction_id = $1 AND portal_client_id = $2',
          [transactionId, clientId]
        );
        if (txResult.rows.length === 0) {
          return res.status(403).json({ error: 'Transaction not found' });
        }
      }

      const result = await pool.query(
        `INSERT INTO client_messages
         (portal_client_id, transaction_id, sender_type, sender_id, sender_name, subject, message)
         VALUES ($1, $2, 'client', $1, $3, $4, $5)
         RETURNING *`,
        [clientId, transactionId || null, senderName, subject, message]
      );

      res.status(201).json({
        message: 'Message sent successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
);

/**
 * PUT /api/client-portal/messages/:id/read
 * Mark message as read
 */
router.put('/messages/:id/read', async (req, res) => {
  try {
    const clientId = req.client.id;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE client_messages
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE message_id = $1 AND portal_client_id = $2
       RETURNING *`,
      [id, clientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: 'Message marked as read', data: result.rows[0] });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// ============================================
// DOCUMENTS
// ============================================

/**
 * GET /api/client-portal/documents
 * Get client documents
 */
router.get('/documents', async (req, res) => {
  try {
    const clientId = req.client.id;
    const { transactionId } = req.query;

    let query = `
      SELECT d.document_id, d.transaction_id, d.title, d.description,
             d.file_url, d.file_type, d.file_size, d.uploaded_by,
             d.uploader_name, d.created_at,
             t.title as transaction_title
      FROM client_documents d
      LEFT JOIN transactions t ON d.transaction_id = t.transaction_id
      WHERE d.portal_client_id = $1
    `;
    const params = [clientId];

    if (transactionId) {
      params.push(transactionId);
      query += ` AND d.transaction_id = $${params.length}`;
    }

    query += ` ORDER BY d.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({ documents: result.rows });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

/**
 * POST /api/client-portal/documents
 * Upload document (URL-based for now - actual file upload would need multer)
 */
router.post(
  '/documents',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('fileUrl').trim().notEmpty().withMessage('File URL is required'),
    body('description').optional().trim(),
    body('fileType').optional().trim(),
    body('transactionId').optional().isInt()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const clientId = req.client.id;
      const { title, description, fileUrl, fileType, transactionId } = req.body;
      const uploaderName = `${req.client.firstName} ${req.client.lastName}`;

      // Verify transaction belongs to client if specified
      if (transactionId) {
        const txResult = await pool.query(
          'SELECT transaction_id FROM transactions WHERE transaction_id = $1 AND portal_client_id = $2',
          [transactionId, clientId]
        );
        if (txResult.rows.length === 0) {
          return res.status(403).json({ error: 'Transaction not found' });
        }
      }

      const result = await pool.query(
        `INSERT INTO client_documents
         (portal_client_id, transaction_id, title, description, file_url, file_type, uploaded_by, uploader_name)
         VALUES ($1, $2, $3, $4, $5, $6, 'client', $7)
         RETURNING *`,
        [clientId, transactionId || null, title, description, fileUrl, fileType, uploaderName]
      );

      res.status(201).json({
        message: 'Document uploaded successfully',
        document: result.rows[0]
      });
    } catch (error) {
      console.error('Upload document error:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }
);

// ============================================
// APPOINTMENTS
// ============================================

/**
 * GET /api/client-portal/appointments
 * Get client appointments
 */
router.get('/appointments', async (req, res) => {
  try {
    const clientId = req.client.id;
    const { upcoming, transactionId } = req.query;

    let query = `
      SELECT a.appointment_id, a.transaction_id, a.title, a.description,
             a.appointment_type, a.scheduled_at, a.duration_minutes,
             a.location, a.meeting_link, a.status, a.notes, a.created_at,
             t.title as transaction_title
      FROM client_appointments a
      LEFT JOIN transactions t ON a.transaction_id = t.transaction_id
      WHERE a.portal_client_id = $1
    `;
    const params = [clientId];

    if (upcoming === 'true') {
      query += ` AND a.scheduled_at > NOW() AND a.status IN ('scheduled', 'confirmed')`;
    }

    if (transactionId) {
      params.push(transactionId);
      query += ` AND a.transaction_id = $${params.length}`;
    }

    query += ` ORDER BY a.scheduled_at ${upcoming === 'true' ? 'ASC' : 'DESC'}`;

    const result = await pool.query(query, params);

    res.json({ appointments: result.rows });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Failed to get appointments' });
  }
});

/**
 * POST /api/client-portal/appointments
 * Request new appointment
 */
router.post(
  '/appointments',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('appointmentType').trim().notEmpty().withMessage('Appointment type is required'),
    body('preferredDate').isISO8601().withMessage('Valid date is required'),
    body('description').optional().trim(),
    body('transactionId').optional().isInt()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const clientId = req.client.id;
      const { title, description, appointmentType, preferredDate, transactionId } = req.body;

      // Verify transaction belongs to client if specified
      if (transactionId) {
        const txResult = await pool.query(
          'SELECT transaction_id FROM transactions WHERE transaction_id = $1 AND portal_client_id = $2',
          [transactionId, clientId]
        );
        if (txResult.rows.length === 0) {
          return res.status(403).json({ error: 'Transaction not found' });
        }
      }

      const result = await pool.query(
        `INSERT INTO client_appointments
         (portal_client_id, transaction_id, title, description, appointment_type, scheduled_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
         RETURNING *`,
        [clientId, transactionId || null, title, description, appointmentType, preferredDate]
      );

      res.status(201).json({
        message: 'Appointment request submitted',
        appointment: result.rows[0]
      });
    } catch (error) {
      console.error('Create appointment error:', error);
      res.status(500).json({ error: 'Failed to create appointment' });
    }
  }
);

// ============================================
// REPORTS
// ============================================

/**
 * GET /api/client-portal/reports
 * Get client's published reports (metadata only, no HTML)
 */
router.get('/reports', async (req, res) => {
  try {
    const clientId = req.client.id;
    const { report_type } = req.query;

    let query = `
      SELECT report_id, title, description, report_type, created_by, created_at
      FROM client_reports
      WHERE portal_client_id = $1 AND is_published = TRUE
    `;
    const params = [clientId];

    if (report_type) {
      params.push(report_type);
      query += ` AND report_type = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);

    res.json({ reports: result.rows });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
});

/**
 * GET /api/client-portal/reports/:id
 * Get single report with full HTML (only if belongs to client and is published)
 */
router.get('/reports/:id', async (req, res) => {
  try {
    const clientId = req.client.id;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT report_id, title, description, report_html, report_type, created_by, created_at
       FROM client_reports
       WHERE report_id = $1 AND portal_client_id = $2 AND is_published = TRUE`,
      [id, clientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ report: result.rows[0] });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to get report' });
  }
});

// ============================================
// PROFILE
// ============================================

/**
 * PUT /api/client-portal/profile
 * Update client profile
 */
router.put(
  '/profile',
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('phone').optional().trim(),
    body('company').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const clientId = req.client.id;
      const { firstName, lastName, phone, company } = req.body;

      // Build dynamic update query
      const updates = [];
      const params = [];
      let paramCount = 1;

      if (firstName) {
        updates.push(`first_name = $${paramCount++}`);
        params.push(firstName);
      }
      if (lastName) {
        updates.push(`last_name = $${paramCount++}`);
        params.push(lastName);
      }
      if (phone !== undefined) {
        updates.push(`phone = $${paramCount++}`);
        params.push(phone);
      }
      if (company !== undefined) {
        updates.push(`company = $${paramCount++}`);
        params.push(company);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      params.push(clientId);
      const query = `
        UPDATE portal_clients
        SET ${updates.join(', ')}
        WHERE portal_client_id = $${paramCount}
        RETURNING portal_client_id, first_name, last_name, email, phone, company
      `;

      const result = await pool.query(query, params);

      res.json({
        message: 'Profile updated successfully',
        client: result.rows[0]
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

module.exports = router;
