const nodemailer = require('nodemailer');

// A "transporter" is nodemailer's term for the connection to the email
// server that will actually send the message — in our case, Gmail's servers.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Reusable function: pass in who to send to, subject line, and HTML content.
// Anything in the app that needs to send an email can just call this.
const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"ShopSphere" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    // We log the error but don't throw it further up.
    // Reason: if email sending fails, we don't want that to crash
    // or block the order itself — the order should still succeed
    // even if the confirmation email has a hiccup.
    console.error('Email sending failed:', error.message);
  }
};

module.exports = sendEmail;