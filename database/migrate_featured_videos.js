const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrateFeaturedVideos() {
  const client = await pool.connect();

  try {
    console.log('🔄 Running migration to add featured_videos table...');

    // Read and execute migration file
    const migrationPath = path.join(__dirname, 'add_featured_videos.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    await client.query(migration);

    console.log('✅ featured_videos table created successfully!');
    console.log('📊 You can now add videos through the admin dashboard');

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  migrateFeaturedVideos()
    .then(() => {
      console.log('\n✅ Migration complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateFeaturedVideos };
