const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Checks if the request has a valid JWT token
const protect = async (req, res, next) => {
  let token;

  // Tokens are sent in the header like: "Authorization: Bearer eyJhbGc..."
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract just the token part (removes the word "Bearer ")
      token = req.headers.authorization.split(' ')[1];

      // Verify the token is valid and not expired/tampered with
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by the ID stored inside the token, exclude password field
      req.user = await User.findById(decoded.id).select('-password');

      next(); // token is valid — let the request continue to the actual route
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Checks if the logged-in user is an admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // user is an admin — continue
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

module.exports = { protect, admin };