/**
 * Run Client Reports Migration
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
    console.log('Creating client_reports table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_reports (
        report_id SERIAL PRIMARY KEY,
        portal_client_id INTEGER NOT NULL REFERENCES portal_clients(portal_client_id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        report_html TEXT NOT NULL,
        report_type VARCHAR(50) DEFAULT 'general' CHECK (report_type IN (
          'market_analysis', 'property_report', 'investment_summary',
          'neighborhood_report', 'comparative_market_analysis', 'annual_review', 'general'
        )),
        is_published BOOLEAN DEFAULT FALSE,
        created_by VARCHAR(100) DEFAULT 'Edmund Bogen',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ client_reports');

    // Create indexes
    console.log('\nCreating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_client_reports_portal_client ON client_reports(portal_client_id)',
      'CREATE INDEX IF NOT EXISTS idx_client_reports_type ON client_reports(report_type)',
      'CREATE INDEX IF NOT EXISTS idx_client_reports_published ON client_reports(is_published)',
      'CREATE INDEX IF NOT EXISTS idx_client_reports_created_at ON client_reports(created_at DESC)'
    ];

    for (const idx of indexes) {
      await pool.query(idx);
    }
    console.log('  ✓ All indexes created');

    // Create update trigger
    console.log('\nCreating update trigger...');
    await pool.query(`
      DO $$ BEGIN
        CREATE TRIGGER update_client_reports_updated_at
          BEFORE UPDATE ON client_reports
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    console.log('  ✓ Trigger created');

    // Verify
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'client_reports'
      ORDER BY ordinal_position
    `);

    console.log('\n' + '='.repeat(50));
    console.log('MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\nClient Reports table columns:');
    result.rows.forEach(row => console.log(`   ${row.column_name} (${row.data_type})`));
    console.log('');

  } catch (error) {
    console.error('\nMigration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
