const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 Running expanded categories migration...\n');

    // Run the categories migration
    const migrationPath = path.join(__dirname, 'migrations/006_skill_categories.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    await client.query(migrationSql);
    console.log('✅ Categories table created with 50+ categories!');

    // Run the expanded seed data
    console.log('\n🌱 Seeding expanded skills...');
    const seedPath = path.join(__dirname, 'seeds/skills_seed_expanded.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await client.query(seedSql);
    console.log('✅ Expanded seed data inserted!');

    // Verify counts
    const catResult = await client.query('SELECT COUNT(*) FROM skill_categories');
    const skillResult = await client.query('SELECT COUNT(*) FROM skills');
    console.log(`\n📊 Categories in database: ${catResult.rows[0].count}`);
    console.log(`📊 Total skills in database: ${skillResult.rows[0].count}`);

    // Show breakdown by parent category
    console.log('\n📁 Categories breakdown:');
    const breakdown = await client.query(`
      SELECT parent_slug, COUNT(*) as subcategories
      FROM skill_categories
      WHERE parent_slug IS NOT NULL
      GROUP BY parent_slug
      ORDER BY parent_slug
    `);
    breakdown.rows.forEach(row => {
      console.log(`   ${row.parent_slug}: ${row.subcategories} subcategories`);
    });

    console.log('\n✅ Expanded Skills Marketplace ready!');

  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
      console.log('⚠️  Some items already exist - continuing...');

      // Still verify counts
      const skillResult = await client.query('SELECT COUNT(*) FROM skills');
      console.log(`📊 Total skills in database: ${skillResult.rows[0].count}`);
    } else {
      console.error('❌ Migration error:', error.message);
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
