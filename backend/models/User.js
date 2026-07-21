const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// NEW: This is a "sub-schema" — a mini-schema for a single address.
// It's not its own separate collection in MongoDB; instead, an array
// of these will live directly INSIDE each user document.
const addressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required for this address'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required for this address'],
  },
  addressLine1: {
    type: String,
    required: [true, 'Address line 1 is required'],
  },
  addressLine2: {
    type: String, // optional — apartment, landmark, etc.
  },
  city: {
    type: String,
    required: [true, 'City is required'],
  },
  state: {
    type: String,
    required: [true, 'State is required'],
  },
  postalCode: {
    type: String,
    required: [true, 'Postal code is required'],
  },
  country: {
    type: String,
    default: 'India',
  },
  // Only one address per user should ever be true at a time.
  // We'll enforce that rule in the CONTROLLER (next step), not here —
  // Mongoose schemas describe "shape," not "business rules between documents."
  isDefault: {
    type: Boolean,
    default: false,
  },
});

// Define the "shape" of a User document
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,       // no two users can share an email
      lowercase: true,     // stores "John@x.com" as "john@x.com"
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],  // only these two values allowed
      default: 'customer',
    },
    // NEW: Cloudinary URL for the user's profile picture.
    // Reuses the exact same upload pipeline built in Week 9 for products —
    // POST /api/upload already returns a Cloudinary URL we can store here.
    profilePicture: {
      type: String,
      default: '', // empty string until the user uploads one
    },
    // NEW: array of addresses, using the addressSchema defined above.
    // Example: user.addresses = [ {fullName: "Venky", city: "Bengaluru", isDefault: true}, ... ]
    addresses: [addressSchema],
    // These two fields power the "Forgot Password" flow.
    // resetPasswordToken stores a HASHED version of the reset token we
    // email to the user — never the raw token, same principle as never
    // storing plain-text passwords. select: false means this field is
    // hidden by default on normal queries (like the password field
    // pattern you'd see in many MERN apps), so it doesn't accidentally
    // leak out in API responses.
    resetPasswordToken: {
      type: String,
      select: false,
    },
    // When the reset token expires. After this time, the token
    // is no longer valid even if someone has it.
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt fields
  }
);

// This runs automatically BEFORE a user document is saved to the database
userSchema.pre('save', async function () {
  // Only hash the password if it's new or being changed
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Custom method to check login password against the hashed one
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Turn the schema into an actual usable Model
const User = mongoose.model('User', userSchema);

module.exports = User;