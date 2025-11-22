const Mailgun = require('mailgun.js');
const formData = require('form-data');

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,   // API key
});

/**
 * Send a 6-digit verification code to the user's email.
 * @param {string} email - Recipient email address
 * @param {string} code - 6-digit verification code
 */
async function sendVerificationEmail(email, code) {
  try {
    const messageData = {
      from: 'no-reply@yourdomain.com', // ДОЛЖЕН быть домен, подтвержденный Mailgun
      to: email,
      subject: 'Your Email Verification Code',
      html: `
        <p>Thank you for registering.</p>
        <p>Your verification code is:</p>
        <h2>${code}</h2>
        <p>This code will expire in 10 minutes.</p>
      `,
    };

    const response = await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData);

    console.log('Mailgun response:', response);
  } catch (error) {
    console.error('Mailgun error:', error);
    throw error;
  }
}

module.exports = { sendVerificationEmail };
