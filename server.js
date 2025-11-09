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

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
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

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'contact.html'));
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

app.get('/video-archive', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'video-archive.html'));
});

app.get('/edmunds-mastermind', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'edmunds-mastermind.html'));
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
