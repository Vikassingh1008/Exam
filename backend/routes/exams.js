const express = require('express');
const Exam = require('../models/Exam');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// @route   GET /api/exams
// @desc    Get all exams (Public, so students can see them too)
router.get('/', async (req, res) => {
  try {
    const exams = await Exam.find().sort({ order: 1 });
    res.json({ success: true, exams });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET /api/exams/:id
// @desc    Get a single exam
router.get('/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST /api/exams
// @desc    Create a new exam (Admin only)
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { name, slug, description, thumbnail, category, status, order } = req.body;
    let exam = await Exam.findOne({ slug });
    if (exam) return res.status(400).json({ success: false, message: 'Exam slug must be unique' });

    exam = new Exam({ name, slug, description, thumbnail, category, status, order });
    await exam.save();
    res.status(201).json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   PUT /api/exams/:id
// @desc    Update an exam (Admin only)
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   DELETE /api/exams/:id
// @desc    Delete an exam (Admin only)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
