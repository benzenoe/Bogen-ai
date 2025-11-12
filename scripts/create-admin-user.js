/**
 * Create Admin User Script
 *
 * This script creates a new admin user in the database
 * Usage: node scripts/create-admin-user.js
 */

const bcrypt = require('bcryptjs');
const { pool } = require('../server/config/database');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdminUser() {
  try {
    console.log('\n=================================');
    console.log('   CREATE NEW ADMIN USER');
    console.log('=================================\n');

    // Get user input
    const name = await question('Enter admin name: ');
    const email = await question('Enter admin email: ');
    const password = await question('Enter password (min 8 characters): ');
    const confirmPassword = await question('Confirm password: ');

    // Validation
    if (!name || !email || !password) {
      console.error('\n❌ Error: All fields are required');
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('\n❌ Error: Password must be at least 8 characters');
      process.exit(1);
    }

    if (password !== confirmPassword) {
      console.error('\n❌ Error: Passwords do not match');
      process.exit(1);
    }

    // Check if email already exists
    const existingAdmin = await pool.query(
      'SELECT email FROM admin_users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingAdmin.rows.length > 0) {
      console.error('\n❌ Error: An admin with this email already exists');
      process.exit(1);
    }

    // Hash password
    console.log('\n⏳ Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert admin user
    console.log('⏳ Creating admin user...');
    const result = await pool.query(
      `INSERT INTO admin_users (name, email, password_hash, role, created_at)
       VALUES ($1, $2, $3, 'admin', CURRENT_TIMESTAMP)
       RETURNING admin_id, name, email, role, created_at`,
      [name, email.toLowerCase(), passwordHash]
    );

    const newAdmin = result.rows[0];

    console.log('\n✅ Admin user created successfully!\n');
    console.log('=================================');
    console.log('Admin ID:', newAdmin.admin_id);
    console.log('Name:', newAdmin.name);
    console.log('Email:', newAdmin.email);
    console.log('Role:', newAdmin.role);
    console.log('Created:', newAdmin.created_at);
    console.log('=================================\n');

    console.log('You can now log in at: https://www.bogen.ai/admin');
    console.log(`Email: ${newAdmin.email}`);
    console.log('Password: [the password you just entered]\n');

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

// Run the script
createAdminUser();
