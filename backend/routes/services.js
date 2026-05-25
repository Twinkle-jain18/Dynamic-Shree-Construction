const express = require('express');
const router = express.Router();
const ServiceContent = require('../models/ServiceContent');

// @route   GET api/services/:serviceName
// @desc    Get all content for a specific service
// @access  Public
router.get('/:serviceName', async (req, res) => {
  try {
    const content = await ServiceContent.find({ service: req.params.serviceName }).sort({ createdAt: -1 });
    res.json(content);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/services/
// @desc    Get all content
// @access  Public
router.get('/', async (req, res) => {
    try {
        const content = await ServiceContent.find().sort({ createdAt: -1 });
        res.json(content);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

module.exports = router;
