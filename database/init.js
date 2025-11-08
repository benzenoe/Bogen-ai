const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bogenai',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    console.log('🔄 Initializing Bogen.ai database...');

    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await client.query(schema);

    console.log('✅ Database schema created successfully!');
    console.log('📊 Tables created:');
    console.log('   - partners');
    console.log('   - clients');
    console.log('   - referrals');
    console.log('   - commission_payments');
    console.log('   - admin_users');
    console.log('');
    console.log('⚠️  IMPORTANT: Update admin password in production!');
    console.log('   Default admin credentials:');
    console.log('   Email: admin@bogen.ai');
    console.log('   Password: admin123 (CHANGE THIS!)');

  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('\n✅ Database initialization complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
