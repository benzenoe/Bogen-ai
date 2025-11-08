#!/usr/bin/env node
/**
 * Create Admin User Script
 * Run with: node scripts/create-admin.js
 */

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║      CREATE ADMIN USER - BOGEN.AI        ║');
  console.log('╚══════════════════════════════════════════╝\n');

  try {
    // Get admin details
    const name = await question('Admin Name: ');
    const email = await question('Admin Email: ');
    const password = await question('Password (min 8 characters): ');

    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters');
      process.exit(1);
    }

    // Hash password
    console.log('\n⏳ Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    // Connect to database
    console.log('⏳ Connecting to database...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Insert admin user
    console.log('⏳ Creating admin user...');
    const result = await pool.query(
      `INSERT INTO admin_users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email)
       DO UPDATE SET password_hash = $2, name = $3
       RETURNING admin_id, email, name`,
      [email, passwordHash, name, 'admin']
    );

    await pool.end();

    console.log('\n✅ Admin user created successfully!');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID:    ${result.rows[0].admin_id}`);
    console.log(`Name:  ${result.rows[0].name}`);
    console.log(`Email: ${result.rows[0].email}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('You can now login at:');
    console.log('https://bogen-ai.vercel.app/admin-dashboard\n');

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure your DATABASE_URL environment variable is set');
      console.error('💡 Check that your PostgreSQL database is running');
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

createAdmin();
