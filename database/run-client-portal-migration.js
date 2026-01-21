/**
 * Run Client Portal Migration
 */

const { Pool } = require('pg');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connecting to database...\n');

  try {
    // Create tables one by one
    console.log('Creating portal_clients table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS portal_clients (
        portal_client_id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(client_id) ON DELETE SET NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        company VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        email_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ portal_clients');

    console.log('Creating transactions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        transaction_id SERIAL PRIMARY KEY,
        portal_client_id INTEGER NOT NULL REFERENCES portal_clients(portal_client_id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        service_type VARCHAR(100),
        property_address VARCHAR(500),
        property_value DECIMAL(12,2),
        status VARCHAR(50) DEFAULT 'initiated' CHECK (status IN (
          'initiated', 'proposal_sent', 'contract_signed', 'in_progress',
          'under_review', 'pending_closing', 'completed', 'on_hold', 'cancelled'
        )),
        assigned_to VARCHAR(100),
        start_date DATE,
        estimated_completion DATE,
        actual_completion DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ transactions');

    console.log('Creating transaction_timeline table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transaction_timeline (
        timeline_id SERIAL PRIMARY KEY,
        transaction_id INTEGER NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
        step_name VARCHAR(100) NOT NULL,
        step_description TEXT,
        step_order INTEGER NOT NULL,
        status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
        completed_at TIMESTAMP,
        completed_by VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ transaction_timeline');

    console.log('Creating client_resources table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_resources (
        resource_id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL CHECK (category IN (
          'market_report', 'buying_guide', 'selling_guide',
          'neighborhood_info', 'template', 'video', 'general'
        )),
        file_url VARCHAR(500),
        external_link VARCHAR(500),
        thumbnail_url VARCHAR(500),
        is_public BOOLEAN DEFAULT FALSE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ client_resources');

    console.log('Creating client_messages table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_messages (
        message_id SERIAL PRIMARY KEY,
        portal_client_id INTEGER NOT NULL REFERENCES portal_clients(portal_client_id) ON DELETE CASCADE,
        transaction_id INTEGER REFERENCES transactions(transaction_id) ON DELETE SET NULL,
        sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('client', 'admin')),
        sender_id INTEGER,
        sender_name VARCHAR(255),
        subject VARCHAR(255),
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ client_messages');

    console.log('Creating client_documents table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_documents (
        document_id SERIAL PRIMARY KEY,
        portal_client_id INTEGER NOT NULL REFERENCES portal_clients(portal_client_id) ON DELETE CASCADE,
        transaction_id INTEGER REFERENCES transactions(transaction_id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_url VARCHAR(500) NOT NULL,
        file_type VARCHAR(50),
        file_size INTEGER,
        uploaded_by VARCHAR(20) CHECK (uploaded_by IN ('client', 'admin')),
        uploader_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ client_documents');

    console.log('Creating client_appointments table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_appointments (
        appointment_id SERIAL PRIMARY KEY,
        portal_client_id INTEGER NOT NULL REFERENCES portal_clients(portal_client_id) ON DELETE CASCADE,
        transaction_id INTEGER REFERENCES transactions(transaction_id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        appointment_type VARCHAR(50),
        scheduled_at TIMESTAMP NOT NULL,
        duration_minutes INTEGER DEFAULT 30,
        location VARCHAR(500),
        meeting_link VARCHAR(500),
        status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no_show')),
        reminder_sent BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ client_appointments');

    // Create indexes
    console.log('\nCreating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_portal_clients_email ON portal_clients(email)',
      'CREATE INDEX IF NOT EXISTS idx_portal_clients_status ON portal_clients(status)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_portal_client ON transactions(portal_client_id)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)',
      'CREATE INDEX IF NOT EXISTS idx_timeline_transaction ON transaction_timeline(transaction_id)',
      'CREATE INDEX IF NOT EXISTS idx_resources_category ON client_resources(category)',
      'CREATE INDEX IF NOT EXISTS idx_messages_portal_client ON client_messages(portal_client_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_is_read ON client_messages(is_read)',
      'CREATE INDEX IF NOT EXISTS idx_documents_portal_client ON client_documents(portal_client_id)',
      'CREATE INDEX IF NOT EXISTS idx_appointments_portal_client ON client_appointments(portal_client_id)',
      'CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON client_appointments(scheduled_at)'
    ];

    for (const idx of indexes) {
      await pool.query(idx);
    }
    console.log('  ✓ All indexes created');

    // Seed default resources
    console.log('\nSeeding default resources...');
    await pool.query(`
      INSERT INTO client_resources (title, description, category, is_public, sort_order) VALUES
      ('First-Time Buyer Guide', 'Everything you need to know about buying your first home in South Florida', 'buying_guide', TRUE, 1),
      ('Selling Your Home Checklist', 'Step-by-step checklist to prepare your home for a successful sale', 'selling_guide', TRUE, 2),
      ('South Florida Market Report', 'Current market trends, pricing data, and insights for luxury real estate', 'market_report', TRUE, 3),
      ('Boca Raton Neighborhood Guide', 'Explore the premier communities and neighborhoods in Boca Raton', 'neighborhood_info', TRUE, 4),
      ('Closing Cost Breakdown', 'Understanding the fees and costs involved in real estate transactions', 'general', TRUE, 5)
      ON CONFLICT DO NOTHING
    `);
    console.log('  ✓ Default resources added');

    // Verify tables
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND (table_name LIKE '%client%' OR table_name LIKE 'portal%' OR table_name = 'transactions' OR table_name LIKE 'transaction%')
      ORDER BY table_name
    `);

    console.log('\n' + '='.repeat(50));
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📋 Client Portal tables created:');
    result.rows.forEach(row => console.log(`   ✓ ${row.table_name}`));
    console.log('');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
