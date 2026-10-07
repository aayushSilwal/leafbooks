const jwt = require('jsonwebtoken');
const transporter = require('../mailer');

const FRONTEND_URL = process.env.FRONTEND_URL;
const RESET_SECRET = process.env.JWT_SECRET;
const RESET_EXPIRY = process.env.RESET_TOKEN_EXPIRY || '15m';

function generateVerificationToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
}

async function sendVerificationEmail(userEmail, token) {
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
  const termsUrl = `${FRONTEND_URL}/terms`;
  const privacyUrl = `${FRONTEND_URL}/privacy`;
  const year = new Date().getFullYear();

  await transporter.sendMail({
    from: `"LeafBooks" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    replyTo: process.env.EMAIL_USER,
    subject: "Verify your LeafBooks email address",

    // Anti-spam: plain text version must match HTML content
    text: `Welcome to LeafBooks!

Hi there,

Thanks for signing up. Please verify your email address by visiting the link below:

${verificationUrl}

This link expires in 24 hours.

By using LeafBooks, you agree to our Terms of Service (${termsUrl}) and Privacy Policy (${privacyUrl}).

If you did not create a LeafBooks account, you can safely ignore this email — no action is needed.

— The LeafBooks Team

© ${year} LeafBooks. All rights reserved.
You are receiving this email because you registered at LeafBooks.`,

    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your LeafBooks email</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f9; font-family:'Segoe UI', Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a3a5c, #2563a8); padding: 36px 40px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:700; letter-spacing:-0.5px;">📖 LeafBooks</h1>
              <p style="margin:8px 0 0; color:rgba(255,255,255,0.75); font-size:14px;">Your digital reading companion</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 40px 28px;">
              <h2 style="margin:0 0 12px; color:#1a3a5c; font-size:22px; font-weight:600;">Verify your email address</h2>
              <p style="margin:0 0 20px; color:#4a5568; font-size:15px; line-height:1.7;">
                Thanks for signing up! Click the button below to verify your email and activate your LeafBooks account.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                <tr>
                  <td style="border-radius:8px; background: linear-gradient(135deg, #1a3a5c, #2563a8);">
                    <a href="${verificationUrl}"
                      style="display:inline-block; padding:14px 36px; color:#ffffff; text-decoration:none;
                             font-size:16px; font-weight:600; border-radius:8px; letter-spacing:0.2px;">
                      Verify My Email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px; color:#718096; font-size:13px;">Button not working? Copy and paste this link into your browser:</p>
              <p style="margin:0 0 28px; word-break:break-all;">
                <a href="${verificationUrl}" style="color:#2563a8; font-size:13px;">${verificationUrl}</a>
              </p>

              <!-- Expiry notice -->
              <table cellpadding="0" cellspacing="0" width="100%" style="background:#fffbeb; border:1px solid #fde68a; border-radius:8px; margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 18px; color:#92400e; font-size:13px; line-height:1.6;">
                    ⏰ <strong>This link expires in 24 hours.</strong> If it expires, you can request a new verification email from the login page.
                  </td>
                </tr>
              </table>

              <!-- Terms & Conditions -->
              <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:24px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 8px; color:#1a3a5c; font-size:13px; font-weight:600;">Terms & Privacy</p>
                    <p style="margin:0; color:#718096; font-size:12px; line-height:1.7;">
                      By verifying your account, you agree to our
                      <a href="${termsUrl}" style="color:#2563a8; text-decoration:underline;">Terms of Service</a>
                      and
                      <a href="${privacyUrl}" style="color:#2563a8; text-decoration:underline;">Privacy Policy</a>.
                      We will never sell your personal data. Your email is used solely for account management and important platform notifications.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0; color:#a0aec0; font-size:12px; line-height:1.6;">
                If you did not create a LeafBooks account, no action is needed — you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc; border-top:1px solid #e2e8f0; padding:24px 40px; text-align:center;">
              <p style="margin:0 0 6px; color:#a0aec0; font-size:12px;">
                © ${year} LeafBooks. All rights reserved.
              </p>
              <p style="margin:0; color:#a0aec0; font-size:12px;">
                You're receiving this because you registered at LeafBooks.
                This is an automated message — please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`,

    // Anti-spam headers
    headers: {
      'X-Mailer': 'LeafBooks Mailer',
      'X-Priority': '3',
      'Precedence': 'bulk',
      'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
    }
  });
}

//below this line is for resseting password
function generateResetToken(userId) {
  return jwt.sign({ userId }, RESET_SECRET, { expiresIn: RESET_EXPIRY });
}

async function sendResetPasswordEmail(userEmail, token) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"LeafBooks Support" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'LeafBooks — Reset your password',
    text: `Hello,

We received a request to reset your LeafBooks password. To reset your password, open the link below:

${resetUrl}

This link is valid for ${RESET_EXPIRY}. If you did not request a password reset, you can ignore this email.

LeafBooks Team`,
    html: `
      <div style="font-family: Arial, sans-serif; color:#333; line-height:1.5;">
        <h3>Reset your LeafBooks password</h3>
        <p>We received a request to reset your password. Click the button below to continue:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#4CAF50;color:#fff;text-decoration:none;border-radius:6px;">Reset password</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p style="color:#777;font-size:12px;">This link will expire in ${RESET_EXPIRY}.</p>
      </div>
    `
  });
}



module.exports = { 
  generateVerificationToken, 
  sendVerificationEmail,
  generateResetToken,
  sendResetPasswordEmail,
};
