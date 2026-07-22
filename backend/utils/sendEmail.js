// We switched from Nodemailer (SMTP) to Brevo's HTTP API because
// Render blocks outbound SMTP traffic on its servers — this affects
// ALL SMTP providers (Gmail, Outlook, etc.), not just Gmail specifically.
// HTTP-based email APIs use standard HTTPS (port 443), which isn't
// blocked, so this works reliably both locally and on Render.
//
// We use Node's built-in "fetch" (available in Node 18+) to call
// Brevo's API directly — no extra npm package needed.

const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'ShopSphere', email: process.env.EMAIL_USER },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      // Brevo returns error details in the response body — log them
      // so we can see exactly what went wrong, same as before.
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    console.log(`Email sent to ${to}`);
  } catch (error) {
    // Same as before: log the error, but don't throw it further up,
    // so a failed email never blocks or crashes the order itself.
    console.error('Email sending failed:', error.message);
  }
};

module.exports = sendEmail;