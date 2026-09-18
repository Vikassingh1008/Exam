const express = require('express');
const Question = require('../models/Question');
const Test = require('../models/Test');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// @route   GET /api/questions
// @desc    Get all questions (optionally filter by examId)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.examId) filter.examId = req.query.examId;
    if (req.query.testId) filter.testId = req.query.testId;
    if (req.query.sectionId) filter.sectionId = req.query.sectionId;
    
    // Never send answer keys to a student before they submit a test.
    const questions = await Question.find(filter).select('-options.isCorrect').populate('examId', 'name').populate('sectionId', 'name');
    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET /api/questions/admin
// @desc    Get questions with correct-answer keys for the admin editor only
router.get('/admin', adminMiddleware, async (req, res) => {
  try {
    const questions = await Question.find({}).populate('examId', 'name').populate('testId', 'name').populate('sectionId', 'name');
    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET /api/questions/:id
// @desc    Get a single question
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   PUT /api/questions/reorder
// @desc    Reorder multiple questions (Admin only)
router.put('/reorder', adminMiddleware, async (req, res) => {
  try {
    const { questionIds } = req.body; // array of question IDs in the new order
    if (!questionIds || !Array.isArray(questionIds)) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }
    
    for (let i = 0; i < questionIds.length; i++) {
      await Question.findByIdAndUpdate(questionIds[i], { displayOrder: i });
    }
    
    res.json({ success: true, message: 'Questions reordered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST /api/questions
// @desc    Create a new question
router.post('/', adminMiddleware, async (req, res) => {
  try {
    if (req.body.questionType === 'Single MCQ') {
      if (!req.body.options || req.body.options.length < 2) {
        return res.status(400).json({ success: false, message: 'MCQ must have at least 2 options.' });
      }
      if (req.body.options.filter(option => option.isCorrect).length !== 1) {
        return res.status(400).json({ success: false, message: 'Select exactly one correct option for a Single MCQ.' });
      }
    }
    
    // Determine the next displayOrder
    const latestQuestion = await Question.findOne({ sectionId: req.body.sectionId }).sort('-displayOrder');
    req.body.displayOrder = latestQuestion ? latestQuestion.displayOrder + 1 : 0;

    const question = new Question(req.body);
    await question.save();
    await Test.findByIdAndUpdate(question.testId, { $addToSet: { questions: question._id } });
    res.status(201).json({ success: true, question });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// @route   PUT /api/questions/:id
// @desc    Update a question
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    if (req.body.questionType === 'Single MCQ') {
      if (!req.body.options || req.body.options.length < 2) {
        return res.status(400).json({ success: false, message: 'MCQ must have at least 2 options.' });
      }
      if (req.body.options.filter(option => option.isCorrect).length !== 1) {
        return res.status(400).json({ success: false, message: 'Select exactly one correct option for a Single MCQ.' });
      }
    }
    const previousQuestion = await Question.findById(req.params.id);
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    if (String(previousQuestion.testId) !== String(question.testId)) {
      await Test.findByIdAndUpdate(previousQuestion.testId, { $pull: { questions: question._id } });
      await Test.findByIdAndUpdate(question.testId, { $addToSet: { questions: question._id } });
    }
    res.json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   DELETE /api/questions/:id
// @desc    Delete a question
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    await Test.findByIdAndUpdate(question.testId, { $pull: { questions: question._id } });
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
