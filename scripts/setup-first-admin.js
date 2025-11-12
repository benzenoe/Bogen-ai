/**
 * Setup First Admin User Script
 *
 * This script sets up the initial admin user for Edmund Bogen
 * with the credentials specified in the documentation
 *
 * Usage: node scripts/setup-first-admin.js
 */

const bcrypt = require('bcryptjs');
const { pool } = require('../server/config/database');

async function setupFirstAdmin() {
  try {
    console.log('\n=================================');
    console.log('   SETUP FIRST ADMIN USER');
    console.log('=================================\n');

    // Check if any admin users exist
    const existingAdmins = await pool.query('SELECT COUNT(*) FROM admin_users');
    const adminCount = parseInt(existingAdmins.rows[0].count);

    if (adminCount > 0) {
      console.log(`ℹ️  Admin users already exist (${adminCount} total)`);
      console.log('\nIf you need to create additional admins, use:');
      console.log('  node scripts/create-admin-user.js\n');
      process.exit(0);
    }

    console.log('⏳ No admin users found. Creating first admin...\n');

    // Edmund's credentials from documentation
    const name = 'Edmund Bogen';
    const email = 'edmund@bogenhomes.com';
    const password = 'Joyousgarde1';

    // Hash password
    console.log('⏳ Hashing password...');
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

    console.log('\n✅ First admin user created successfully!\n');
    console.log('=================================');
    console.log('Admin ID:', newAdmin.admin_id);
    console.log('Name:', newAdmin.name);
    console.log('Email:', newAdmin.email);
    console.log('Role:', newAdmin.role);
    console.log('Created:', newAdmin.created_at);
    console.log('=================================\n');

    console.log('🔐 Login Credentials:');
    console.log('   URL: https://www.bogen.ai/admin');
    console.log('   Email: edmund@bogenhomes.com');
    console.log('   Password: Joyousgarde1\n');

    console.log('⚠️  IMPORTANT: Change this password after first login!\n');

  } catch (error) {
    console.error('\n❌ Error setting up admin user:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
setupFirstAdmin();
