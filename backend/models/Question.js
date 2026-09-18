const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  optionLabel: { type: String, required: true }, // e.g., 'A', 'B', 'C', 'D'
  optionText: { type: String, required: true },
  optionTextHi: { type: String }, // Hindi translation
  image: { type: String },
  isCorrect: { type: Boolean, required: true, default: false },
  displayOrder: { type: Number, default: 0 }
});

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  questionTextHi: { type: String }, // Hindi translation
  questionType: { type: String, enum: ['Single MCQ', 'Multiple MCQ', 'True/False', 'Image Based'], required: true, default: 'Single MCQ' },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  topic: { type: String },
  subTopic: { type: String },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  options: [optionSchema],
  explanation: { type: String },
  explanationHi: { type: String }, // Hindi translation
  questionImage: { type: String },
  marks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0 }, // usually positive number deducted, e.g. 0.25
  displayOrder: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
