const User = require('../models/User');

// @desc    Get logged-in user's own profile
// @route   GET /api/users/profile
// @access  Private (any logged-in user — customer or admin)
const getProfile = async (req, res) => {
  // req.user was already attached by the "protect" middleware,
  // and already excludes the password. We can just send it back.
  res.json(req.user);
};

// @desc    Update logged-in user's name/email/profile picture
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  const { name, email, profilePicture, currentPassword } = req.body;

  // We fetch a FRESH copy of the user here (not req.user) because if the
  // email is changing, we need to verify the password — and req.user has
  // no password field on it (remember: protect middleware excludes it).
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // If the request wants to change the email, require the current password
  // as confirmation — this matches the requirement: "since email is often
  // tied to login." We do NOT need this same check when changing just the name.
  if (email && email.toLowerCase() !== user.email) {
    if (!currentPassword) {
      return res.status(400).json({
        message: 'Current password is required to change your email',
      });
    }

    // Here we CAN use user.matchPassword because "user" was fetched fresh
    // above with User.findById() and DOES include the password field
    // (only req.user, from the middleware, excludes it — this fresh copy doesn't).
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.email = email.toLowerCase();
  }

  // Name and profile picture can be updated freely, no password needed
  if (name) {
    user.name = name;
  }
  if (profilePicture !== undefined) {
    // profilePicture will be a Cloudinary URL string, already uploaded
    // via the existing POST /api/upload endpoint from Week 9
    user.profilePicture = profilePicture;
  }

  const updatedUser = await user.save();

  // Send back the updated user, but strip the password before responding
  // (toObject converts the Mongoose document into a plain JS object so we
  // can safely delete a field from it)
  const userResponse = updatedUser.toObject();
  delete userResponse.password;

  res.json(userResponse);
};

// @desc    Change logged-in user's password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: 'Both current password and new password are required',
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      message: 'New password must be at least 6 characters',
    });
  }

  // Again: fetch fresh from the DB (not req.user) because we need the
  // actual password hash to compare against, which req.user doesn't have.
  const user = await User.findById(req.user._id);

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  // Just assign the new plain-text password — we do NOT hash it manually here.
  // Your User model's pre('save') hook automatically hashes it because
  // user.isModified('password') will be true. This is the same hook that
  // already handles hashing on signup.
  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password updated successfully' });
};

// @desc    Add a new address
// @route   POST /api/users/addresses
// @access  Private
const addAddress = async (req, res) => {
  const user = await User.findById(req.user._id);

  const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

  if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
    return res.status(400).json({ message: 'Please fill in all required address fields' });
  }

  // If this new address is being set as default, first un-set default
  // on every existing address — only ONE address should ever be default.
  if (isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  // If this is the user's very FIRST address, make it default automatically
  // (there's no reason to ever have zero default addresses if at least one exists)
  const shouldBeDefault = isDefault || user.addresses.length === 0;

  user.addresses.push({
    fullName,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    isDefault: shouldBeDefault,
  });

  await user.save();
  res.status(201).json(user.addresses);
};

// @desc    Update an existing address
// @route   PUT /api/users/addresses/:addressId
// @access  Private
const updateAddress = async (req, res) => {
  const user = await User.findById(req.user._id);

  // .id() is a special Mongoose helper for finding one item inside an
  // array of sub-documents by its auto-generated _id
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    return res.status(404).json({ message: 'Address not found' });
  }

  const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

  if (fullName) address.fullName = fullName;
  if (phone) address.phone = phone;
  if (addressLine1) address.addressLine1 = addressLine1;
  if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
  if (city) address.city = city;
  if (state) address.state = state;
  if (postalCode) address.postalCode = postalCode;
  if (country) address.country = country;

  if (isDefault) {
    // Unset default on every OTHER address first
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
    address.isDefault = true;
  }

  await user.save();
  res.json(user.addresses);
};

// @desc    Delete an address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
const deleteAddress = async (req, res) => {
  const user = await User.findById(req.user._id);

  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    return res.status(404).json({ message: 'Address not found' });
  }

  const wasDefault = address.isDefault;

  // .deleteOne() here removes just this one sub-document from the array
  address.deleteOne();

  // If we just deleted the default address and other addresses still exist,
  // automatically promote the first remaining one to default — so checkout
  // always has a default to prefill from, if any address exists at all.
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  res.json(user.addresses);
};

// @desc    Set a specific address as the default
// @route   PUT /api/users/addresses/:addressId/set-default
// @access  Private
const setDefaultAddress = async (req, res) => {
  const user = await User.findById(req.user._id);

  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    return res.status(404).json({ message: 'Address not found' });
  }

  user.addresses.forEach((addr) => {
    addr.isDefault = addr._id.toString() === req.params.addressId;
  });

  await user.save();
  res.json(user.addresses);
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};