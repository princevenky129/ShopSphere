const express = require('express');
const router = express.Router();
const { registerUser, loginUser, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);

// NEW: request a password reset email — public, no login required
// (makes sense: if you're locked out, you can't be logged in to ask for help)
router.post('/forgot-password', forgotPassword);

// NEW: actually reset the password using the token from the emailed link
// Also public — the token itself IS the proof of identity here, not a JWT.
// :token is a route parameter — Express reads whatever's in that part of
// the URL and makes it available as req.params.token in the controller.
router.put('/reset-password/:token', resetPassword);

// New: a protected test route
router.get('/profile', protect, (req, res) => {
  res.json(req.user);
});

module.exports = router;