const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Inquiry = require('../models/Inquiry');
const authMiddleware = require('../middleware/auth');
const { sendAcceptanceEmail, sendDiscussionEmail, sendRejectionEmail } = require('../utils/emailService');

// Helper to validate ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// @route   POST api/inquiries
// @desc    Submit a new inquiry (Public)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;
    
    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!email) return res.status(400).json({ message: 'Email is required' });
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });
    if (!service) return res.status(400).json({ message: 'Service selection is required' });

    const newInqry = new Inquiry({ name, email, phone, service, message });
    await newInqry.save();
    res.status(201).json({ message: 'Inquiry submitted successfully' });
  } catch (err) {
    console.error('Error submitting inquiry:', err);
    res.status(500).json({ message: 'Server error during submission' });
  }
});

// @route   GET api/inquiries
// @desc    Get all inquiries (sorted newest first)
// @access  Private (Admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    console.error('Error fetching inquiries:', err);
    res.status(500).json({ message: 'Server error while fetching' });
  }
});

// @route   PATCH api/inquiries/:id/status
// @desc    Update inquiry status
// @access  Private (Admin only)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Inquiry ID format' });
    }

    const { status } = req.body;
    const allowed = ['pending', 'in_discussion', 'accepted', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

    // --- Automated Notifications Moved to Frontend (WhatsApp) ---
    // Email notifications have been disabled per user request to simplify workflow.

    res.json({ message: `Status updated to ${status}`, inquiry });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ message: 'Server error while updating status' });
  }
});

// Legacy support for PUT status
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const mappedStatus = status === 'contacted' ? 'accepted' : status === 'finalized' ? 'accepted' : status;
    
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status: mappedStatus, updatedAt: new Date() },
      { new: true }
    );
    res.json({ message: 'Status updated', inquiry });
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

// @route   PUT api/inquiries/:id/notes
// @desc    Save admin notes for an inquiry
// @access  Private (Admin only)
router.put('/:id/notes', authMiddleware, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Inquiry ID format' });
    }

    const { adminNotes } = req.body;
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { adminNotes, updatedAt: new Date() },
      { new: true }
    );
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    res.json({ message: 'Notes saved', inquiry });
  } catch (err) {
    console.error('Error saving notes:', err);
    res.status(500).json({ message: 'Server error while saving notes' });
  }
});

// @route   PUT api/inquiries/:id/accept
// @desc    Accept inquiry (Legacy endpoint)
// @access  Private (Admin only)
router.put('/:id/accept', authMiddleware, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Inquiry ID format' });
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status: 'accepted', updatedAt: new Date() },
      { new: true }
    );

    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

    res.json({ message: 'Inquiry accepted', inquiry });
  } catch (err) {
    console.error('Critical Error in /accept route:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
