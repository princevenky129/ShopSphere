const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// CloudinaryStorage tells multer: "don't save files to disk, send them
// straight to Cloudinary instead."
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'shopsphere-products', // organizes uploads into a folder in your Cloudinary account
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    // Cloudinary can auto-resize on upload so you don't store giant images
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
  },
});

// upload.single('image') means: expect ONE file, sent under the
// form field name "image". We'll use this field name on the frontend too.
const upload = multer({ storage });

module.exports = upload;