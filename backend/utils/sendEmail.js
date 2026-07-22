const nodemailer = require('nodemailer');

// A "transporter" is nodemailer's term for the connection to the email
// server that will actually send the message — in our case, Gmail's servers.
//
// We use explicit host/port instead of the "service: gmail" shortcut, and
// add "family: 4" to force Node to connect over IPv4 only. This fixes a
// common issue on cloud hosts like Render, which don't support outbound
// IPv6 — without this, Node sometimes picks Gmail's IPv6 address first
// and the connection fails with ENETUNREACH.
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for port 465, false for port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  family: 4, // force IPv4 — fixes ENETUNREACH on hosts like Render
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