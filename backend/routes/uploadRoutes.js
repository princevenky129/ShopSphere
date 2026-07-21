const express = require('express');
const router = express.Router();
const { uploadImage } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// upload.single('image') runs FIRST — it intercepts the incoming file,
// sends it to Cloudinary, and attaches the result to req.file.
// THEN uploadImage runs and just reads that result and responds.
router.post('/', protect, upload.single('image'), uploadImage);

module.exports = router;