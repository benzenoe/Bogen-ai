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
    console.log('🔄 Running Skills Marketplace migration...\n');

    // Run the migration
    const migrationPath = path.join(__dirname, 'migrations/005_skills_marketplace.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    await client.query(migrationSql);
    console.log('✅ Migration completed - tables created!');

    // Run the seed data
    console.log('\n🌱 Seeding initial skills...');
    const seedPath = path.join(__dirname, 'seeds/skills_seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await client.query(seedSql);
    console.log('✅ Seed data inserted!');

    // Verify
    const result = await client.query('SELECT COUNT(*) FROM skills');
    console.log(`\n📊 Total skills in database: ${result.rows[0].count}`);

    console.log('\n✅ Skills Marketplace ready!');

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Tables already exist - skipping migration');

      // Still try to run seed if tables exist
      try {
        const seedPath = path.join(__dirname, 'seeds/skills_seed.sql');
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        await client.query(seedSql);
        console.log('✅ Seed data inserted!');
      } catch (seedError) {
        if (seedError.message.includes('duplicate key')) {
          console.log('⚠️  Seed data already exists - skipping');
        } else {
          throw seedError;
        }
      }
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
