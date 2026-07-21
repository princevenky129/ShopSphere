const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // built into Node — no npm install needed
const sendEmail = require('../utils/sendEmail'); // same helper used for order confirmations

// Helper function: creates a JWT token containing the user's ID
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },           // data stored inside the token
    process.env.JWT_SECRET,    // secret key used to sign it (from .env)
    { expiresIn: '30d' }       // token is valid for 30 days
  );
};

// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request a password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // IMPORTANT: we always send back the same generic success message,
    // whether or not a user with this email actually exists. If we said
    // "no account found" here, a stranger could use this endpoint to
    // check which emails are registered on your site — that's a real
    // privacy leak in production apps, so we avoid it even here.
    const genericResponse = {
      message: 'If an account with that email exists, a reset link has been sent.',
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Step 1: generate a random raw token (this is what goes in the email link)
    const rawToken = crypto.randomBytes(20).toString('hex');

    // Step 2: hash it before saving to the database (see note above on why
    // we use crypto's deterministic hashing here instead of bcrypt)
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Step 3: save the HASHED token + an expiry time (15 minutes from now)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 min in milliseconds

    // We're only updating these two fields, not the password, so the
    // pre('save') hook's password-hashing check (isModified('password'))
    // correctly skips re-hashing the password here.
    await user.save();

    // Step 4: build the link the user will click, and email it to them.
    // FRONTEND_URL should point at your Vite dev server — falls back to
    // the default localhost:5173 if you haven't set it in .env yet.
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;

    const emailHtml = `
      <h2>Password Reset Request</h2>
      <p>Hi ${user.name},</p>
      <p>You requested a password reset. Click the link below to set a new password. This link expires in 15 minutes.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `;

    await sendEmail({
      to: user.email,
      subject: 'ShopSphere Password Reset',
      html: emailHtml,
    });

    res.status(200).json(genericResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password using the token from the emailed link
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params; // the raw token, from the URL
    const { password } = req.body; // the new password the user typed

    // Hash the incoming raw token the SAME way we hashed it before saving,
    // so we can look it up directly (deterministic hashing — see note above)
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find a user whose resetPasswordToken matches AND whose expiry is
    // still in the future ($gt = "greater than" the current time).
    // .select('+resetPasswordToken +resetPasswordExpire') is required
    // because we set select: false on these fields in the model — they're
    // hidden by default, so we have to explicitly ask for them here.
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }

    // Set the new password. Because we assign to user.password and then
    // call .save(), the pre('save') hook detects isModified('password')
    // and automatically hashes it with bcrypt — same as normal signup.
    user.password = password;

    // Clear the reset token fields so this link can't be used again
    // (single-use, as promised in the security notes)
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword };