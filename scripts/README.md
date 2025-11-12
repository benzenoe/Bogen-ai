# Admin Scripts

Utility scripts for managing the Bogen.ai platform.

## Create Admin User

Creates a new admin user in the database with a hashed password.

### Usage

```bash
node scripts/create-admin-user.js
```

### What It Does

1. Prompts you for admin user details:
   - Name
   - Email address
   - Password (minimum 8 characters)
   - Password confirmation

2. Validates the input:
   - Ensures all fields are filled
   - Checks password length
   - Verifies passwords match
   - Confirms email isn't already in use

3. Creates the admin user:
   - Hashes the password securely using bcrypt
   - Inserts the new admin into the database
   - Displays confirmation with user details

### Example

```bash
$ node scripts/create-admin-user.js

=================================
   CREATE NEW ADMIN USER
=================================

Enter admin name: John Smith
Enter admin email: john@bogen.ai
Enter password (min 8 characters): ********
Confirm password: ********

⏳ Hashing password...
⏳ Creating admin user...

✅ Admin user created successfully!

=================================
Admin ID: 2
Name: John Smith
Email: john@bogen.ai
Role: admin
Created: 2025-11-11T20:30:00.000Z
=================================

You can now log in at: https://www.bogen.ai/admin
Email: john@bogen.ai
Password: [the password you just entered]
```

### Security Notes

- Passwords are hashed using bcrypt with 10 salt rounds
- Email addresses are stored in lowercase
- Minimum password length is 8 characters
- Passwords are never logged or displayed after entry

### Troubleshooting

**"Database connection error"**
- Make sure your `.env` file has correct database credentials
- Verify you're connected to the internet
- Check that Neon database is running

**"An admin with this email already exists"**
- Use a different email address
- Or use the database to update the existing admin's password

**"All fields are required"**
- Make sure you enter all requested information
- Don't leave any fields blank

## Future Scripts

Additional utility scripts that could be added:

- `reset-admin-password.js` - Reset an admin user's password
- `list-admin-users.js` - View all admin users
- `delete-admin-user.js` - Remove an admin user
- `export-data.js` - Export database tables to CSV
- `sync-event-config.js` - Update mastermind event details

---

**Last Updated:** November 11, 2025
