const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Running chatbot database migration...');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/003_create_chatbot_tables.sql'),
      'utf8'
    );

    await pool.query(migrationSQL);

    console.log('✅ Chatbot tables created successfully!');
    console.log('');
    console.log('Created tables:');
    console.log('  - chat_conversations');
    console.log('  - chat_messages');
    console.log('  - chat_leads');
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
