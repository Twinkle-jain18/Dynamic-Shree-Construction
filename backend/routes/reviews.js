const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const authMiddleware = require('../middleware/auth');

// @route   POST api/reviews
// @desc    Submit a new review (Public)
router.post('/', async (req, res) => {
  try {
    const { name, rating, comment, service } = req.body;
    if (!name || !rating || !comment || !service) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const newReview = new Review({ name, rating, comment, service, approved: false });
    await newReview.save();
    res.status(201).json({ message: 'Review submitted and pending approval' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET api/reviews
// @desc    Get all APPROVED reviews (Public)
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find({ approved: true }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET api/reviews/admin
// @desc    Get all reviews regardless of status (Admin only)
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT api/reviews/:id/approve
// @desc    Approve/toggle a review (Admin only)
router.put('/:id/approve', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    
    review.approved = !review.approved; // Toggle approval
    await review.save();
    res.json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE api/reviews/:id
// @desc    Delete a review (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
