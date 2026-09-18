const express = require('express');
const TestAttempt = require('../models/TestAttempt');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/attempts
// @desc    Create a new test attempt (submit test)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { testId, answers, score, correctCount, incorrectCount, unansweredCount, timeTaken } = req.body;
    
    // Calculate percentage and accuracy
    const attempted = correctCount + incorrectCount;
    const accuracy = attempted > 0 ? (correctCount / attempted) * 100 : 0;
    
    // Total marks based on Test
    const Test = require('../models/Test');
    const test = await Test.findById(testId);
    let percentage = 0;
    if (test && test.totalMarks > 0) {
      percentage = (score / test.totalMarks) * 100;
    }

    const attempt = new TestAttempt({
      studentId: req.user.id,
      testId,
      status: 'completed',
      endTime: new Date(),
      answers,
      score,
      percentage,
      accuracy,
      correctCount,
      incorrectCount,
      unansweredCount,
      timeTaken
    });

    await attempt.save();

    // Calculate Rank
    const totalStudents = await TestAttempt.countDocuments({ testId });
    const rank = await TestAttempt.countDocuments({ testId, score: { $gt: score } }) + 1;

    res.status(201).json({ success: true, attempt, rank, totalStudents });
  } catch (error) {
    console.error('Error creating attempt:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET /api/attempts/my-history
// @desc    Get all completed attempts for logged in student
router.get('/my-history', authMiddleware, async (req, res) => {
  try {
    const attempts = await TestAttempt.find({ studentId: req.user.id })
      .populate('testId', 'name totalMarks calculatedTotalQuestions duration')
      .sort({ createdAt: -1 });
    res.json({ success: true, attempts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET /api/attempts/:id
// @desc    Get specific attempt details for analysis
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const attempt = await TestAttempt.findOne({ _id: req.params.id, studentId: req.user.id })
      .populate('testId', 'name examName duration totalMarks')
      .populate({
        path: 'answers.questionId',
        model: 'Question'
      });
      
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
    
    // Calculate Rank
    const totalStudents = await TestAttempt.countDocuments({ testId: attempt.testId._id });
    const rank = await TestAttempt.countDocuments({ testId: attempt.testId._id, score: { $gt: attempt.score } }) + 1;

    res.json({ success: true, attempt, rank, totalStudents });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
