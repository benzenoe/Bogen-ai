const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./server/routes/auth');
const partnerRoutes = require('./server/routes/partners');
const clientRoutes = require('./server/routes/clients');
const adminRoutes = require('./server/routes/admin');
const xeroRoutes = require('./server/routes/xero');
const videoRoutes = require('./server/routes/videos');
const mastermindRoutes = require('./server/routes/mastermind');
const mastermindConfigRoutes = require('./server/routes/mastermind-config');
const claudeCodeMastermindRoutes = require('./server/routes/claude-code-mastermind');
const cmsRoutes = require('./server/routes/cms');
const blogRoutes = require('./server/routes/blog');
const migrateRoutes = require('./server/routes/migrate');
const setupAdminRoutes = require('./server/routes/setup-admin');
const chatRoutes = require('./server/routes/chat');
const skillsRoutes = require('./server/routes/skills');
const clientAuthRoutes = require('./server/routes/client-auth');
const clientPortalRoutes = require('./server/routes/client-portal');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Referral tracking middleware (MUST be before routes)
app.use((req, res, next) => {
  if (req.query.ref) {
    // Set cookie for referral tracking (90-day attribution)
    res.cookie('bogen_ref', req.query.ref, {
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      httpOnly: false, // Allow client-side reading for debugging
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' // Allow cookie to work across page navigation
    });
    console.log('Referral cookie set:', req.query.ref);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/xero', xeroRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/mastermind', mastermindRoutes);
app.use('/api/mastermind', mastermindConfigRoutes);
app.use('/api/claude-code-mastermind', claudeCodeMastermindRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api/setup-admin', setupAdminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/auth', clientAuthRoutes);
app.use('/api/client-portal', clientPortalRoutes);

// Book companion email capture
const { pool: dbPool } = require('./server/config/database');
app.post('/api/book/capture-email', async (req, res) => {
  try {
    const { name, email, resource, utm_source, utm_medium } = req.body;
    if (!name || !email || !resource) {
      return res.status(400).json({ error: 'Name, email, and resource are required' });
    }
    await dbPool.query(
      'INSERT INTO book_leads (name, email, resource, utm_source, utm_medium) VALUES ($1, $2, $3, $4, $5)',
      [name, email, resource, utm_source || 'direct', utm_medium || 'book-companion']
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Book email capture error:', error);
    res.status(500).json({ error: 'Failed to save' });
  }
});

// Speaker inquiry capture
app.post('/api/book/speaker-inquiry', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, message } = req.body;
    if (!first_name || !last_name || !email || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    await dbPool.query(
      'INSERT INTO speaker_inquiries (first_name, last_name, email, phone, message) VALUES ($1, $2, $3, $4, $5)',
      [first_name, last_name, email, phone, message || '']
    );

    // Send email notification to Edmund
    const { sendEmail } = require('./server/utils/email');
    sendEmail({
      to: 'edmund@bogenhomes.com',
      subject: `New Inquiry: ${first_name} ${last_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #1B365D;">New Inquiry Received</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${first_name} ${last_name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${email}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${phone}</td></tr>
            <tr><td style="padding: 8px; vertical-align: top;"><strong>Message:</strong></td><td style="padding: 8px;">${message || 'N/A'}</td></tr>
          </table>
          <p style="margin-top: 20px;"><a href="https://www.bogen.ai/admin-dashboard" style="display: inline-block; background: #1B365D; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;">View in Dashboard</a></p>
        </div>
      `,
      text: `New inquiry from ${first_name} ${last_name} (${email}, ${phone}). Message: ${message || 'N/A'}`
    }).catch(err => console.error('Email notification error:', err));

    res.json({ success: true });
  } catch (error) {
    console.error('Speaker inquiry error:', error);
    res.status(500).json({ error: 'Failed to save' });
  }
});

// Service inquiry capture
app.post('/api/services/inquiry', async (req, res) => {
  try {
    const { industry, challenge, team_size, name, email, phone, company, business_description } = req.body;
    if (!industry || !challenge || !team_size || !name || !email || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    await dbPool.query(
      'INSERT INTO service_inquiries (industry, challenge, team_size, name, email, phone, company, business_description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [industry, challenge, team_size, name, email, phone, company || '', business_description || '']
    );

    // Send email notification to Edmund
    const { sendEmail } = require('./server/utils/email');
    sendEmail({
      to: 'edmund@bogenhomes.com',
      subject: `New Service Inquiry: ${name} (${industry})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #1B365D;">New Service Inquiry</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${email}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${phone}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Company:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${company || 'N/A'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Industry:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${industry}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Challenge:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${challenge}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Team Size:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${team_size}</td></tr>
            <tr><td style="padding: 8px; vertical-align: top;"><strong>Description:</strong></td><td style="padding: 8px;">${business_description || 'N/A'}</td></tr>
          </table>
          <p style="margin-top: 20px;"><a href="https://www.bogen.ai/admin-dashboard" style="display: inline-block; background: #1B365D; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;">View in Dashboard</a></p>
        </div>
      `,
      text: `New service inquiry from ${name} (${email}). Industry: ${industry}, Challenge: ${challenge}`
    }).catch(err => console.error('Email notification error:', err));

    res.json({ success: true });
  } catch (error) {
    console.error('Service inquiry error:', error);
    res.status(500).json({ error: 'Failed to save' });
  }
});

// Page view tracking
app.post('/api/track/pageview', async (req, res) => {
  try {
    const { page, referrer, utm_source, utm_medium } = req.body;
    if (!page) return res.status(400).json({ error: 'Page is required' });
    const userAgent = (req.headers['user-agent'] || '').substring(0, 500);
    await dbPool.query(
      'INSERT INTO page_views (page, referrer, utm_source, utm_medium, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [page, referrer || '', utm_source || '', utm_medium || '', userAgent]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Site analytics API (admin only)
const { authenticateAdmin } = require('./server/middleware/auth');
app.get('/api/admin/analytics', authenticateAdmin, async (req, res) => {
  try {
    // Page views today
    const todayViews = await dbPool.query(
      "SELECT COUNT(*) as count FROM page_views WHERE created_at >= CURRENT_DATE"
    );

    // Page views last 7 days
    const weekViews = await dbPool.query(
      "SELECT COUNT(*) as count FROM page_views WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'"
    );

    // Page views last 30 days
    const monthViews = await dbPool.query(
      "SELECT COUNT(*) as count FROM page_views WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'"
    );

    // Top pages last 7 days
    const topPages = await dbPool.query(
      "SELECT page, COUNT(*) as views FROM page_views WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' GROUP BY page ORDER BY views DESC LIMIT 15"
    );

    // Daily views last 14 days
    const dailyViews = await dbPool.query(
      "SELECT DATE(created_at) as date, COUNT(*) as views FROM page_views WHERE created_at >= CURRENT_DATE - INTERVAL '14 days' GROUP BY DATE(created_at) ORDER BY date"
    );

    // Book leads
    const bookLeads = await dbPool.query(
      "SELECT * FROM book_leads ORDER BY created_at DESC LIMIT 20"
    );

    // Speaker inquiries
    const speakerInquiries = await dbPool.query(
      "SELECT * FROM speaker_inquiries ORDER BY created_at DESC LIMIT 20"
    );

    // Book leads count
    const bookLeadsTotal = await dbPool.query("SELECT COUNT(*) as count FROM book_leads");

    // Speaker inquiries count
    const speakerTotal = await dbPool.query("SELECT COUNT(*) as count FROM speaker_inquiries");

    res.json({
      pageViews: {
        today: parseInt(todayViews.rows[0].count),
        week: parseInt(weekViews.rows[0].count),
        month: parseInt(monthViews.rows[0].count)
      },
      topPages: topPages.rows,
      dailyViews: dailyViews.rows,
      bookLeads: { total: parseInt(bookLeadsTotal.rows[0].count), recent: bookLeads.rows },
      speakerInquiries: { total: parseInt(speakerTotal.rows[0].count), recent: speakerInquiries.rows }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// Weekly inquiry digest — called by Vercel cron every Friday at 9am ET
app.get('/api/cron/inquiry-digest', async (req, res) => {
  // Verify cron secret to prevent unauthorized triggers
  const cronSecret = req.headers['authorization'];
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { sendEmail } = require('./server/utils/email');

    // Get all unresponded speaker inquiries (status = 'new')
    const speakerResult = await dbPool.query(
      "SELECT first_name, last_name, email, phone, message, created_at FROM speaker_inquiries WHERE status = 'new' ORDER BY created_at DESC"
    );

    // Get all unresponded service inquiries (status = 'pending')
    const serviceResult = await dbPool.query(
      "SELECT name, email, phone, company, industry, challenge, created_at FROM service_inquiries WHERE status = 'pending' ORDER BY created_at DESC"
    );

    const speakerCount = speakerResult.rows.length;
    const serviceCount = serviceResult.rows.length;
    const totalCount = speakerCount + serviceCount;

    if (totalCount === 0) {
      return res.json({ success: true, message: 'No pending inquiries — no email sent' });
    }

    // Build speaker inquiry rows
    let speakerRows = '';
    speakerResult.rows.forEach(r => {
      const date = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      speakerRows += `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${r.first_name} ${r.last_name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${r.email}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${r.phone}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${date}</td>
      </tr>`;
    });

    // Build service inquiry rows
    let serviceRows = '';
    serviceResult.rows.forEach(r => {
      const date = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      serviceRows += `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${r.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${r.email}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${r.industry}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${date}</td>
      </tr>`;
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 700px;">
        <h2 style="color: #1B365D;">Weekly Inquiry Digest — ${totalCount} Unanswered</h2>
        <p>You have <strong>${totalCount}</strong> inquiries waiting for a response.</p>

        ${speakerCount > 0 ? `
        <h3 style="color: #D4AF37; margin-top: 24px;">Speaker/Contact Inquiries (${speakerCount})</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="background: #f4f4f4;">
            <th style="padding: 8px; text-align: left;">Name</th>
            <th style="padding: 8px; text-align: left;">Email</th>
            <th style="padding: 8px; text-align: left;">Phone</th>
            <th style="padding: 8px; text-align: left;">Date</th>
          </tr>
          ${speakerRows}
        </table>` : ''}

        ${serviceCount > 0 ? `
        <h3 style="color: #D4AF37; margin-top: 24px;">Service Inquiries (${serviceCount})</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="background: #f4f4f4;">
            <th style="padding: 8px; text-align: left;">Name</th>
            <th style="padding: 8px; text-align: left;">Email</th>
            <th style="padding: 8px; text-align: left;">Industry</th>
            <th style="padding: 8px; text-align: left;">Date</th>
          </tr>
          ${serviceRows}
        </table>` : ''}

        <p style="margin-top: 24px;"><a href="https://www.bogen.ai/admin-dashboard" style="display: inline-block; background: #1B365D; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;">Open Dashboard</a></p>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">This is an automated weekly digest from bogen.ai. Mark inquiries as responded in the dashboard to remove them from future digests.</p>
      </div>
    `;

    await sendEmail({
      to: 'edmund@bogenhomes.com',
      subject: `Bogen.ai: ${totalCount} Unanswered Inquiries`,
      html,
      text: `You have ${totalCount} unanswered inquiries (${speakerCount} speaker, ${serviceCount} service). View at https://www.bogen.ai/admin-dashboard`
    });

    res.json({ success: true, sent: totalCount });
  } catch (error) {
    console.error('Inquiry digest error:', error);
    res.status(500).json({ error: 'Failed to send digest' });
  }
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/about-us', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'about-us.html'));
});

// Redirect old URLs to new combined page
app.get('/about-edmund', (req, res) => {
  res.redirect(301, '/about-us');
});

app.get('/about-eytan', (req, res) => {
  res.redirect(301, '/about-us');
});

app.get('/partner-program', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'partner-program.html'));
});

app.get('/partner-portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'partner-portal.html'));
});

// Client Portal pages
app.get('/client-portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'client-portal.html'));
});

app.get('/client-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'client-dashboard.html'));
});

app.get('/client-transactions', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'client-dashboard.html')); // Uses dashboard with transactions filter
});

app.get('/client-transaction/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'client-transaction.html'));
});

app.get('/client-resources', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'client-resources.html'));
});

app.get('/client-messages', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'client-messages.html'));
});

app.get('/client-documents', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'client-documents.html'));
});

app.get('/client-appointments', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'client-appointments.html'));
});

app.get('/client-reports', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'client-reports.html'));
});

app.get('/client-report/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'client-report-viewer.html'));
});

app.get('/client-profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'client-profile.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});

app.get('/tools-weve-built', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'tools-weve-built.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'privacy.html'));
});

app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'terms.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin-dashboard.html'));
});

app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin-dashboard.html'));
});

app.get('/admin-content', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin-content.html'));
});

app.get('/admin-blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin-blog.html'));
});

app.get('/admin-portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin-portal.html'));
});

app.get('/book', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'book.html'));
});

app.get('/prompt-library', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'prompt-library.html'));
});

app.get('/implementation-tracker', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'implementation-tracker.html'));
});

app.get('/risk-radar-guide', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'risk-radar-guide.html'));
});

app.get('/daisy-chain-template', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'daisy-chain-template.html'));
});

app.get('/stacking-cheatsheet', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'stacking-cheatsheet.html'));
});

app.get('/quickstart-card', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'quickstart-card.html'));
});

app.get('/roi-calculator', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'roi-calculator.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'services.html'));
});

app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'blog.html'));
});

app.get('/blog/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'blog-post.html'));
});

app.get('/video-archive', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'video-archive.html'));
});

app.get('/edmunds-mastermind', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'edmunds-mastermind.html'));
});

app.get('/mastermind-registered', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'mastermind-registered.html'));
});

app.get('/claude-code-mastermind', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'claude-code-mastermind.html'));
});

app.get('/claude-code-mastermind-registered', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'claude-code-mastermind-registered.html'));
});

// Skills marketplace pages
app.get('/skills', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'skills', 'index.html'));
});

app.get('/skills/submit', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'skills', 'submit.html'));
});

app.get('/skills/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'skills', 'admin.html'));
});

// Skills category pages - dynamic routing for all categories
// Parent categories
const parentCategories = [
  'business-professional', 'marketing-sales', 'technology', 'creative',
  'operations-admin', 'personal-lifestyle', 'education-training', 'industry-specific'
];

// All subcategories
const skillCategories = [
  // Business & Professional
  'real-estate', 'accounting-finance', 'legal', 'consulting', 'human-resources', 'insurance', 'banking',
  // Marketing & Sales
  'marketing', 'sales', 'social-media', 'advertising', 'email-marketing', 'seo-content', 'public-relations',
  // Technology
  'development', 'web-development', 'mobile-development', 'data-analytics', 'ai-automation',
  'cybersecurity', 'it-support', 'devops',
  // Creative
  'writing-content', 'design', 'video-production', 'photography', 'music-audio',
  // Operations & Admin
  'operations', 'project-management', 'customer-service', 'administrative', 'supply-chain', 'quality-assurance',
  // Personal & Lifestyle
  'travel', 'health-wellness', 'personal-finance', 'productivity', 'relationships', 'career',
  // Education & Training
  'education', 'training', 'e-learning', 'research', 'tutoring',
  // Industry-Specific
  'healthcare', 'hospitality', 'retail', 'restaurants', 'manufacturing', 'non-profit',
  'construction', 'automotive', 'agriculture'
];

// Route for parent categories (shows subcategories)
parentCategories.forEach(category => {
  app.get(`/skills/${category}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'skills', 'parent-category.html'));
  });
});

// Route for subcategories (shows skills list)
skillCategories.forEach(category => {
  app.get(`/skills/${category}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'skills', 'category.html'));
  });
});

// Individual skill pages
app.get('/skills/:category/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'skills', 'skill.html'));
});

// Service category pages
const serviceCategories = [
  'communication-customer-interaction',
  'sales-revenue-generation',
  'operations-workflow',
  'marketing-content',
  'industry-specific-premium'
];

serviceCategories.forEach(category => {
  app.get(`/services/${category}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'services', `${category}.html`));
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║         BOGEN.AI SERVER RUNNING          ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
  console.log(`🌐 Server:        http://localhost:${PORT}`);
  console.log(`📊 Environment:   ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database:      ${process.env.DB_NAME || 'bogenai'}`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

module.exports = app;
