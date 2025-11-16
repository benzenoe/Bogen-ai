const fs = require('fs');
const path = require('path');
const { pool } = require('./server/config/database');

async function runMigrations() {
  try {
    console.log('Running database migrations...\n');

    // Migration 1: CMS tables
    console.log('1. Creating CMS tables...');
    const cms_sql = fs.readFileSync(path.join(__dirname, 'database/migrations/001_create_cms_tables.sql'), 'utf8');
    await pool.query(cms_sql);
    console.log('   ✓ CMS tables created\n');

    // Migration 2: Blog tables
    console.log('2. Creating blog tables...');
    const blog_sql = fs.readFileSync(path.join(__dirname, 'database/migrations/002_create_blog_tables.sql'), 'utf8');
    await pool.query(blog_sql);
    console.log('   ✓ Blog tables created\n');

    // Migration 3: Mastermind registrations
    console.log('3. Creating mastermind registrations table...');
    const mastermind_sql = fs.readFileSync(path.join(__dirname, 'database/add_mastermind_registrations.sql'), 'utf8');
    await pool.query(mastermind_sql);
    console.log('   ✓ Mastermind registrations table created\n');

    console.log('✅ All migrations completed successfully!');
    console.log('\nYou can now access:');
    console.log('  • Admin Dashboard: http://localhost:3000/admin');
    console.log('  • Admin CMS: http://localhost:3000/admin-content');
    console.log('  • Admin Blog: http://localhost:3000/admin-blog');
    console.log('  • Public Blog: http://localhost:3000/blog');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);

    // Check if it's just "already exists" errors
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Tables already exist. This is fine!');
      console.log('\nYou can access:');
      console.log('  • Admin Dashboard: http://localhost:3000/admin');
      console.log('  • Admin CMS: http://localhost:3000/admin-content');
      console.log('  • Admin Blog: http://localhost:3000/admin-blog');
      console.log('  • Public Blog: http://localhost:3000/blog');
      process.exit(0);
    }

    process.exit(1);
  }
}

runMigrations();
