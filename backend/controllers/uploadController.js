// @desc    Upload a single product image to Cloudinary
// @route   POST /api/upload
// @access  Private/Admin
const uploadImage = async (req, res) => {
  try {
    // If multer/Cloudinary successfully processed the file, req.file
    // will exist and contain details about the uploaded image —
    // including .path, which is actually the full Cloudinary URL
    // (a quirk of multer-storage-cloudinary: it reuses the "path" field
    // for the hosted URL instead of a local file path).
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({ url: req.file.path });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

module.exports = { uploadImage };