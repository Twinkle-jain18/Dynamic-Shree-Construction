const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const authMiddleware = require('../middleware/auth');
const ServiceContent = require('../models/ServiceContent');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage (Memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// @route   POST api/upload
// @desc    Upload media or save external link
// @access  Private (Admin only)
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { service, description, title, type, link } = req.body;

    // Handle external links (e.g. YouTube)
    if (link) {
      const newContent = new ServiceContent({
        service,
        type: type || (link.includes('youtube') || link.includes('vimeo') ? 'video' : 'image'),
        fileUrl: link,
        cloudinaryId: 'external',
        description: description || '',
        title: title || ''
      });
      const savedContent = await newContent.save();
      return res.json(savedContent);
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file or link provided' });
    }

    // Determine resource type based on mime type
    let resource_type = 'image';
    if (req.file.mimetype.startsWith('video/')) {
      resource_type = 'video';
    }

    cloudinary.uploader.upload_stream(
      { 
        folder: 'shree_constructions',
        resource_type: resource_type 
      },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ message: "Cloudinary upload failed", error });
        }

        try {
          const newContent = new ServiceContent({
            service,
            type: type || resource_type,
            fileUrl: result.secure_url,
            cloudinaryId: result.public_id,
            description: description || '',
            title: title || ''
          });

          const savedContent = await newContent.save();
          res.json(savedContent);
        } catch (dbErr) {
          console.error("Database error:", dbErr);
          res.status(500).json({ message: 'Database saving failed' });
        }
      }
    ).end(req.file.buffer);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE api/upload/:id
// @desc    Delete media
// @access  Private (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const content = await ServiceContent.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Delete from cloudinary (only if not an external link)
    if (content.cloudinaryId !== 'external') {
      if (content.type === 'video') {
         await cloudinary.uploader.destroy(content.cloudinaryId, { resource_type: 'video' });
      } else {
         await cloudinary.uploader.destroy(content.cloudinaryId);
      }
    }

    // Delete from DB
    await ServiceContent.findByIdAndDelete(req.params.id);

    res.json({ message: 'Content removed' });
  } catch (err) {
    console.error(err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Content not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
