const { v2: cloudinary } = require('cloudinary');

// This reads the 3 values you just added to .env and configures
// the Cloudinary SDK so it knows which account to upload to.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;