const express = require('express');
const router = express.Router();
const Achievement = require('../models/Achievement');
const authMiddleware = require('../middleware/auth');

// GET /api/achievements  — public
router.get('/', async (req, res) => {
  try {
    const items = await Achievement.find().sort({ order: 1, createdAt: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/achievements  — admin only
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { label, value, suffix, icon, order } = req.body;
    if (!label || value === undefined) return res.status(400).json({ message: 'label and value are required' });
    const item = new Achievement({ label, value: Number(value), suffix: suffix || '+', icon: icon || 'trophy', order: order || 0 });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/achievements/:id  — admin only
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { label, value, suffix, icon, order } = req.body;
    const item = await Achievement.findByIdAndUpdate(
      req.params.id,
      { label, value: Number(value), suffix, icon, order },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Achievement not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/achievements/:id  — admin only
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await Achievement.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Achievement not found' });
    res.json({ message: 'Achievement deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
