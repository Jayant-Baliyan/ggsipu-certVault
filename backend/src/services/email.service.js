const nodemailer = require('nodemailer');
const path = require('path');

require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Creates and returns a Nodemailer transporter using Gmail service.
 * Reads credentials strictly from process.env.
 */
function getEmailTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn('[EMAIL SERVICE] Missing GMAIL_USER or GMAIL_APP_PASSWORD in environment variables. Emails cannot be sent.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass.trim(),
    },
  });
}

/**
 * Sleep helper to introduce a delay (in ms) between operations.
 *
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends a certificate notification email to a student.
 *
 * @param {Object} params
 * @param {string} params.name - Recipient student name
 * @param {string} params.email - Recipient email address
 * @param {string} params.cert_id - Unique Certificate ID
 * @param {string} params.pdf_url - Direct Google Drive or viewable PDF URL
 * @returns {Promise<Object>} Send info
 */
async function sendCertificateEmail({ name, email, cert_id, pdf_url }) {
  const transporter = getEmailTransporter();

  if (!transporter) {
    throw new Error('Email service is not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in environment variables.');
  }

  if (!email) {
    throw new Error(`Recipient email address is missing for certificate ${cert_id || 'unknown'}`);
  }

  const senderUser = process.env.GMAIL_USER;
  const certificateLink = pdf_url || '#';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header { background: #1e3a8a; padding: 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0 0; font-size: 13px; color: #dbeafe; }
        .content { padding: 28px 24px; line-height: 1.6; }
        .cert-card { background: #f8fafc; border-left: 4px solid #d97706; padding: 14px 18px; margin: 20px 0; border-radius: 4px; }
        .cert-id { font-family: monospace; font-size: 15px; font-weight: bold; color: #1e3a8a; }
        .btn-container { text-align: center; margin: 30px 0 20px 0; }
        .btn { background-color: #1e3a8a; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 2px 4px rgba(30,58,138,0.3); }
        .footer { padding: 18px 24px; background: #f1f5f9; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Guru Gobind Singh Indraprastha University</h1>
          <p>Directorate of Students' Welfare (DSW) &bull; CertVault</p>
        </div>
        <div class="content">
          <p>Dear <strong>${name || 'Student'}</strong>,</p>
          <p>We are pleased to inform you that your official certificate has been issued and verified on the GGSIPU CertVault blockchain ledger.</p>
          
          <div class="cert-card">
            <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">CERTIFICATE IDENTIFIER</div>
            <div class="cert-id">${cert_id || 'N/A'}</div>
          </div>

          <p>You can view, verify, and download your digital certificate directly via the link below:</p>

          <div class="btn-container">
            <a href="${certificateLink}" class="btn" target="_blank" rel="noopener noreferrer">View Certificate</a>
          </div>

          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
            If the button above does not work, copy and paste this link into your browser:<br>
            <a href="${certificateLink}" style="color: #1e3a8a; word-break: break-all;">${certificateLink}</a>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated notification from GGSIPU CertVault. Please do not reply directly to this email.</p>
          <p>&copy; ${new Date().getFullYear()} GGSIPU. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"GGSIPU CertVault" <${senderUser}>`,
    to: email,
    subject: 'Your Certificate – GGSIPU',
    html: htmlContent,
  };

  console.log(`[EMAIL SERVICE] Sending certificate email for ${cert_id} to ${email}...`);
  const info = await transporter.sendMail(mailOptions);
  console.log(`[EMAIL SERVICE] Certificate email sent successfully to ${email} (Message ID: ${info.messageId})`);
  return info;
}

module.exports = {
  sendCertificateEmail,
  getEmailTransporter,
  delay,
};
