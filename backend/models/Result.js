const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestAttempt', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  score: { type: Number, required: true },
  percentage: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  percentile: { type: Number },
  rank: { type: Number },
  correctCount: { type: Number, required: true },
  incorrectCount: { type: Number, required: true },
  unansweredCount: { type: Number, required: true },
  timeTaken: { type: Number, required: true }, // in seconds
  sectionPerformance: [{
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    correct: Number,
    incorrect: Number,
    accuracy: Number,
    score: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
