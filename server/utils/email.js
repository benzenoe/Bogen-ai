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
    return { success: false, error: error.message };
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
    to: process.env.ADMIN_EMAIL || 'info@bogen.ai',
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
    to: process.env.ADMIN_EMAIL || 'info@bogen.ai',
    subject,
    html,
    text: `New partner application from ${partner.name} (${partner.email})`
  });
}

module.exports = {
  sendEmail,
  sendPartnerApprovalEmail,
  sendClientInquiryNotification,
  sendPartnerApplicationNotification
};
