const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

// Use DATABASE_URL for production, otherwise use local config
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : require('./server/config/database').pool
);

async function addAdmin() {
  try {
    const email = 'eytan@benzeno.com';
    const password = 'Iamtotallygay1';
    const name = 'Eytan Benzeno';

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if admin already exists
    const existing = await pool.query(
      'SELECT admin_id FROM admin_users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      console.log('❌ Admin user already exists with this email');
      await pool.end();
      return;
    }

    // Insert new admin
    const result = await pool.query(
      `INSERT INTO admin_users (email, password_hash, name, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       RETURNING admin_id, email, name`,
      [email, passwordHash, name]
    );

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('   Email:', result.rows[0].email);
    console.log('   Name:', result.rows[0].name);
    console.log('   Admin ID:', result.rows[0].admin_id);
    console.log('');
    console.log('Eytan can now login at: https://bogen.ai/admin');

    await pool.end();
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addAdmin();
