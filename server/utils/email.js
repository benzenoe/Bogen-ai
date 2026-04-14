const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send email notification
 */
async function sendEmail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'info@bogen.ai',
      to,
      subject,
      text,
      html
    });

    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email error:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send partner application approval email
 */
async function sendPartnerApprovalEmail(partner) {
  const subject = 'Welcome to the Bogen.ai Partner Program!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1B365D;">Welcome, ${partner.name}!</h1>
      <p>Your application to the Bogen.ai Partner Program has been approved.</p>

      <div style="background: #f4f4f4; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="color: #1B365D; margin-top: 0;">Your Partner Details</h3>
        <p><strong>Referral Code:</strong> ${partner.unique_referral_code}</p>
        <p><strong>Commission Rate:</strong> ${partner.commission_rate}%</p>
        <p><strong>Your Tracking Link:</strong><br>
        <a href="${process.env.BASE_URL}/?ref=${partner.unique_referral_code}" style="color: #D4AF37;">
          ${process.env.BASE_URL}/?ref=${partner.unique_referral_code}
        </a></p>
      </div>

      <p>You can now log in to your partner portal:</p>
      <p><a href="${process.env.BASE_URL}/partner-portal" style="display: inline-block; background: #D4AF37; color: #1B365D; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Access Partner Portal</a></p>

      <p>Start sharing your unique link with businesses that could benefit from AI automation!</p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      <p style="color: #666; font-size: 14px;">Questions? Reply to this email or contact us at info@bogen.ai</p>
    </div>
  `;

  return sendEmail({
    to: partner.email,
    subject,
    html,
    text: `Welcome to Bogen.ai Partner Program! Your referral code: ${partner.unique_referral_code}`
  });
}

/**
 * Send client inquiry notification to admin
 */
async function sendClientInquiryNotification(client) {
  const subject = `New Client Inquiry: ${client.name}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2 style="color: #1B365D;">New Client Inquiry Received</h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Name:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${client.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Email:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${client.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Phone:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${client.phone || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Company:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${client.company || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Industry:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${client.industry || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Budget:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${client.monthly_budget || 'Not specified'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Services:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${client.services_interested ? client.services_interested.join(', ') : 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; vertical-align: top;"><strong>Description:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${client.business_description || 'N/A'}</td>
        </tr>
        ${client.referred_by_partner_id ? `
        <tr>
          <td style="padding: 8px; background: #fffacd;"><strong>Referred By:</strong></td>
          <td style="padding: 8px; background: #fffacd;">Partner ID: ${client.referred_by_partner_id}</td>
        </tr>
        ` : ''}
      </table>

      <p style="margin-top: 20px;"><a href="${process.env.BASE_URL}/admin" style="display: inline-block; background: #1B365D; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;">View in Admin Dashboard</a></p>
    </div>
  `;

  return sendEmail({
    to: process.env.ADMIN_EMAIL || 'sales@reignation.com',
    subject,
    html,
    text: `New client inquiry from ${client.name} (${client.email})`
  });
}

/**
 * Send partner application notification to admin
 */
async function sendPartnerApplicationNotification(partner) {
  const subject = `New Partner Application: ${partner.name}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2 style="color: #1B365D;">New Partner Application</h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Name:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${partner.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Email:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${partner.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Phone:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${partner.phone || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>LinkedIn:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${partner.linkedin_url || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Industries:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${partner.industries ? partner.industries.join(', ') : 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; vertical-align: top;"><strong>Experience:</strong></td>
          <td style="padding: 8px;">${partner.how_they_know_businesses || 'N/A'}</td>
        </tr>
      </table>

      <p style="margin-top: 20px;"><a href="${process.env.BASE_URL}/admin" style="display: inline-block; background: #1B365D; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;">Review & Approve</a></p>
    </div>
  `;

  return sendEmail({
    to: process.env.ADMIN_EMAIL || 'sales@reignation.com',
    subject,
    html,
    text: `New partner application from ${partner.name} (${partner.email})`
  });
}

/**
 * Send welcome email to new client portal user
 */
async function sendClientWelcomeEmail(client) {
  const subject = 'Welcome to Your Client Portal - Bogen.ai';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a3a52;">Welcome, ${client.firstName}!</h1>
      <p>Your client portal account has been created. You can now track your transactions, access resources, and communicate with our team all in one place.</p>

      <div style="background: #f4f8fb; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #64b5f6;">
        <h3 style="color: #1a3a52; margin-top: 0;">What you can do in your portal:</h3>
        <ul style="color: #444; line-height: 1.8;">
          <li>Track your transaction progress in real-time</li>
          <li>Access market reports and helpful guides</li>
          <li>Send messages directly to your team</li>
          <li>View and share documents securely</li>
          <li>Schedule appointments</li>
        </ul>
      </div>

      <p><a href="${process.env.BASE_URL}/client-portal" style="display: inline-block; background: #64b5f6; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">Access Your Portal</a></p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      <p style="color: #666; font-size: 14px;">Questions? Reply to this email or contact us at info@bogen.ai</p>
      <p style="color: #888; font-size: 12px;">Edmund Bogen Team | South Florida Luxury Real Estate</p>
    </div>
  `;

  return sendEmail({
    to: client.email,
    subject,
    html,
    text: `Welcome to your Bogen.ai Client Portal! Access your portal at ${process.env.BASE_URL}/client-portal`
  });
}

/**
 * Send password reset email to client
 */
async function sendClientPasswordResetEmail(client) {
  const resetUrl = `${process.env.BASE_URL}/client-portal?reset=${client.resetToken}`;
  const subject = 'Reset Your Password - Bogen.ai Client Portal';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a3a52;">Password Reset Request</h1>
      <p>Hi ${client.firstName},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>

      <p style="margin: 30px 0;"><a href="${resetUrl}" style="display: inline-block; background: #64b5f6; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a></p>

      <p style="color: #666;">This link will expire in 1 hour for security reasons.</p>
      <p style="color: #666;">If you didn't request this password reset, you can safely ignore this email.</p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      <p style="color: #888; font-size: 12px;">Edmund Bogen Team | Bogen.ai</p>
    </div>
  `;

  return sendEmail({
    to: client.email,
    subject,
    html,
    text: `Reset your password at: ${resetUrl}`
  });
}

/**
 * Send notification when client transaction is updated
 */
async function sendClientTransactionUpdateEmail(client, transaction, update) {
  const subject = `Update on Your Transaction - ${transaction.title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a3a52;">Transaction Update</h1>
      <p>Hi ${client.firstName},</p>
      <p>There's been an update on your transaction:</p>

      <div style="background: #f4f8fb; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #64b5f6;">
        <h3 style="color: #1a3a52; margin-top: 0;">${transaction.title}</h3>
        <p style="margin-bottom: 0;"><strong>Update:</strong> ${update}</p>
      </div>

      <p><a href="${process.env.BASE_URL}/client-transaction/${transaction.transaction_id}" style="display: inline-block; background: #64b5f6; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Transaction</a></p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      <p style="color: #888; font-size: 12px;">Edmund Bogen Team | Bogen.ai</p>
    </div>
  `;

  return sendEmail({
    to: client.email,
    subject,
    html,
    text: `Update on ${transaction.title}: ${update}`
  });
}

/**
 * Send notification when admin sends a message to client
 */
async function sendClientNewMessageEmail(client, message) {
  const subject = message.subject ? `New Message: ${message.subject}` : 'New Message from Edmund Bogen Team';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a3a52;">You Have a New Message</h1>
      <p>Hi ${client.firstName},</p>
      <p>You've received a new message from the Edmund Bogen Team:</p>

      <div style="background: #f4f8fb; padding: 20px; margin: 20px 0; border-radius: 8px;">
        ${message.subject ? `<p style="margin-top: 0;"><strong>Subject:</strong> ${message.subject}</p>` : ''}
        <p style="white-space: pre-line;">${message.message.substring(0, 500)}${message.message.length > 500 ? '...' : ''}</p>
      </div>

      <p><a href="${process.env.BASE_URL}/client-messages" style="display: inline-block; background: #64b5f6; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Full Message</a></p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      <p style="color: #888; font-size: 12px;">Edmund Bogen Team | Bogen.ai</p>
    </div>
  `;

  return sendEmail({
    to: client.email,
    subject,
    html,
    text: `New message: ${message.message.substring(0, 200)}`
  });
}

/**
 * Send password reset email to admin
 */
async function sendAdminPasswordResetEmail(admin) {
  const resetUrl = `${process.env.BASE_URL}/admin?reset=${admin.resetToken}`;
  const subject = 'Reset Your Admin Password - Bogen.ai';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a3a52;">Admin Password Reset</h1>
      <p>Hi ${admin.name},</p>
      <p>We received a request to reset your admin password. Click the button below to create a new password:</p>

      <p style="margin: 30px 0;"><a href="${resetUrl}" style="display: inline-block; background: #D4AF37; color: #1B365D; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a></p>

      <p style="color: #666;">This link will expire in 1 hour for security reasons.</p>
      <p style="color: #666;">If you didn't request this password reset, you can safely ignore this email.</p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      <p style="color: #888; font-size: 12px;">Bogen.ai Admin System</p>
    </div>
  `;

  return sendEmail({
    to: admin.email,
    subject,
    html,
    text: `Reset your admin password at: ${resetUrl}`
  });
}

/**
 * Send listing page order notification to admin
 */
async function sendListingPageOrderNotification(order) {
  const subject = `New Listing Page Order: ${order.name}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2 style="color: #1B365D;">New Listing Page Order</h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Name:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${order.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Email:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${order.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Phone:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${order.phone || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Package:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${order.package}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Brokerage:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${order.brokerage || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>Website:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${order.website || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; vertical-align: top;"><strong>Details:</strong></td>
          <td style="padding: 8px;">${order.details || 'N/A'}</td>
        </tr>
      </table>

      <p style="margin-top: 20px;"><a href="${process.env.BASE_URL}/admin" style="display: inline-block; background: #1B365D; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;">View in Admin</a></p>
    </div>
  `;

  return sendEmail({
    to: process.env.ADMIN_EMAIL || 'sales@reignation.com',
    subject,
    html,
    text: `New listing page order from ${order.name} (${order.email}). Package: ${order.package}. Details: ${order.details || 'N/A'}`
  });
}

module.exports = {
  sendEmail,
  sendPartnerApprovalEmail,
  sendClientInquiryNotification,
  sendPartnerApplicationNotification,
  sendClientWelcomeEmail,
  sendClientPasswordResetEmail,
  sendClientTransactionUpdateEmail,
  sendClientNewMessageEmail,
  sendAdminPasswordResetEmail,
  sendListingPageOrderNotification
};
