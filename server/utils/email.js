const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send a 6-digit verification code to the user's email.
 * @param {string} email - Recipient email address
 * @param {string} code - 6-digit verification code
 */
async function sendVerificationEmail(email, code) {
  const mailOptions = {
    from: 'no-reply@example.com', // Change to your verified sender email
    to: email,                   // Send to the user's email, NOT hardcoded
    subject: 'Your Email Verification Code',
    html: `
      <p>Thank you for registering.</p>
      <p>Your verification code is:</p>
      <h2>${code}</h2>
      <p>This code will expire in 10 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail };
