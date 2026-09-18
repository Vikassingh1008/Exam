const express = require('express');
const Section = require('../models/Section');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// @route   GET /api/sections
// @desc    Get all sections, optionally filter by testId
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.testId) filter.testId = req.query.testId;
    
    const sections = await Section.find(filter).populate('testId', 'name').sort({ displayOrder: 1 });
    res.json({ success: true, sections });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   PUT /api/sections/reorder
// @desc    Reorder multiple sections (Admin only)
router.put('/reorder', adminMiddleware, async (req, res) => {
  try {
    const { sectionIds } = req.body; // array of section IDs in the new order
    if (!sectionIds || !Array.isArray(sectionIds)) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }
    
    for (let i = 0; i < sectionIds.length; i++) {
      await Section.findByIdAndUpdate(sectionIds[i], { displayOrder: i });
    }
    
    res.json({ success: true, message: 'Sections reordered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST /api/sections
// @desc    Create a section (Admin only)
router.post('/', adminMiddleware, async (req, res) => {
  try {
    // Determine the next displayOrder
    const latestSection = await Section.findOne({ testId: req.body.testId }).sort('-displayOrder');
    req.body.displayOrder = latestSection ? latestSection.displayOrder + 1 : 0;

    const section = new Section(req.body);
    await section.save();
    res.status(201).json({ success: true, section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/sections/:id
// @desc    Update a section (Admin only)
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const section = await Section.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    res.json({ success: true, section });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   DELETE /api/sections/:id
// @desc    Delete a section (Admin only)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const section = await Section.findByIdAndDelete(req.params.id);
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    // Note: should ideally delete all questions inside this section as well.
    const Question = require('../models/Question');
    await Question.deleteMany({ sectionId: req.params.id });
    
    res.json({ success: true, message: 'Section deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
