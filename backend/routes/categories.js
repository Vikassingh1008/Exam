const express = require('express');
const Category = require('../models/Category');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST /api/categories
// @desc    Create a new category
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { name, slug, description, status } = req.body;
    let category = await Category.findOne({ slug });
    if (category) return res.status(400).json({ success: false, message: 'Category slug must be unique' });

    category = new Category({ name, slug, description, status });
    await category.save();
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
