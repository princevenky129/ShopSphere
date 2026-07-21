const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Every single route in this file requires the user to be logged in.
// Instead of writing "protect" on each line individually, router.use()
// applies it to EVERY route defined below this line, in this file.
router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

// Address routes
router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);
router.put('/addresses/:addressId/set-default', setDefaultAddress);

module.exports = router;