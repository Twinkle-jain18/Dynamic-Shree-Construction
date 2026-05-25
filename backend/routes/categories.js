const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const authMiddleware = require('../middleware/auth');

// GET /api/categories  — public
router.get('/', async (req, res) => {
  try {
    const cats = await Category.find().sort({ createdAt: 1 });
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/categories  — admin only
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Category name is required' });
    const existing = await Category.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: 'Category already exists' });
    const cat = new Category({ name: name.trim() });
    await cat.save();
    res.status(201).json(cat);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/categories/:id  — admin only
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
