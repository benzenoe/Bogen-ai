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
  res.sendFile(path.join(__dirname, 'views', 'client-messages.html')); // Reuses messages page for now
});

app.get('/client-appointments', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'client-dashboard.html')); // Uses dashboard with appointments
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
