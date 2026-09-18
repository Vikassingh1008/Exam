const express = require('express');
const Test = require('../models/Test');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filter = { status: 'published' };
    if (req.query.examId) filter.examId = req.query.examId;
    const tests = await Test.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, tests });
  } catch (error) { res.status(500).json({ success: false, message: 'Server Error' }); }
});

router.get('/admin', adminMiddleware, async (req, res) => {
  try {
    const tests = await Test.find().sort({ createdAt: -1 });
    res.json({ success: true, tests });
  } catch (error) { res.status(500).json({ success: false, message: 'Server Error' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, status: 'published' });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    
    const Section = require('../models/Section');
    const Question = require('../models/Question');
    
    const sections = await Section.find({ testId: test._id }).sort('displayOrder');
    const sectionsWithQuestions = [];
    
    let calcTotalMarks = 0;
    let calcTotalQuestions = 0;

    for (const section of sections) {
      const questions = await Question.find({ sectionId: section._id }).sort('displayOrder');
      sectionsWithQuestions.push({
        ...section.toObject(),
        questions: questions
      });
      calcTotalQuestions += questions.length;
      calcTotalMarks += questions.reduce((sum, q) => sum + q.marks, 0);
    }
    
    res.json({ 
      success: true, 
      test: {
        ...test.toObject(),
        sections: sectionsWithQuestions,
        calculatedTotalMarks: calcTotalMarks,
        calculatedTotalQuestions: calcTotalQuestions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', adminMiddleware, async (req, res) => {
  try { const test = await Test.create(req.body); res.status(201).json({ success: true, test }); }
  catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

router.put('/:id', adminMiddleware, async (req, res) => {
  try { const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!test) return res.status(404).json({ success: false, message: 'Test paper not found' }); res.json({ success: true, test }); }
  catch (error) { res.status(400).json({ success: false, message: error.message }); }
});

router.delete('/:id', adminMiddleware, async (req, res) => {
  try { const test = await Test.findByIdAndDelete(req.params.id); if (!test) return res.status(404).json({ success: false, message: 'Test paper not found' }); res.json({ success: true }); }
  catch (error) { res.status(500).json({ success: false, message: 'Server Error' }); }
});

// Get Test Paper with all Sections and Questions
router.get('/admin/:id', adminMiddleware, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    
    // Instead of populating from test.sections directly if they don't have questions array embedded,
    // we can manually fetch sections and questions, but since sections are ref'd:
    const Section = require('../models/Section');
    const Question = require('../models/Question');
    
    const sections = await Section.find({ testId: test._id }).sort('displayOrder');
    const sectionsWithQuestions = [];
    
    let calcTotalMarks = 0;
    let calcTotalQuestions = 0;

    for (const section of sections) {
      const questions = await Question.find({ sectionId: section._id }).sort('displayOrder');
      sectionsWithQuestions.push({
        ...section.toObject(),
        questions: questions
      });
      calcTotalQuestions += questions.length;
      calcTotalMarks += questions.reduce((sum, q) => sum + q.marks, 0);
    }
    
    res.json({ 
      success: true, 
      test: {
        ...test.toObject(),
        sections: sectionsWithQuestions,
        calculatedTotalMarks: calcTotalMarks,
        calculatedTotalQuestions: calcTotalQuestions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Publish Test
router.post('/:id/publish', adminMiddleware, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    
    const Section = require('../models/Section');
    const Question = require('../models/Question');
    
    const sections = await Section.find({ testId: test._id });
    if (sections.length === 0) {
      return res.status(400).json({ success: false, message: 'Test must have at least one section' });
    }
    
    let totalQ = 0;
    for (const section of sections) {
      const questions = await Question.find({ sectionId: section._id });
      if (questions.length === 0) {
        return res.status(400).json({ success: false, message: `Section "${section.name}" must have at least one question` });
      }
      totalQ += questions.length;
    }
    
    test.status = 'published';
    test.totalMarks = req.body.totalMarks || test.totalMarks; // allow auto-calculated to be passed
    await test.save();
    
    res.json({ success: true, test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
