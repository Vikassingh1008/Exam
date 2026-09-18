const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  selectedOptionId: { type: mongoose.Schema.Types.ObjectId }, // Can be null if unanswered
  status: { type: String, enum: ['answered', 'not_visited', 'not_answered', 'marked_for_review', 'answered_marked_for_review'], default: 'not_visited' },
  timeSpent: { type: Number, default: 0 } // seconds spent on this question
});

const testAttemptSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  startTime: { type: Date, required: true, default: Date.now },
  endTime: { type: Date },
  status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' },
  answers: [answerSchema],
  score: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  incorrectCount: { type: Number, default: 0 },
  unansweredCount: { type: Number, default: 0 },
  timeTaken: { type: Number, default: 0 } // in seconds
}, { timestamps: true });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
