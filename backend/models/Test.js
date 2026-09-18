const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  name: { type: String, required: true },
  examName: { type: String, required: true },
  testType: { type: String, enum: ['Full Mock Test', 'Section Test', 'Practice Test', 'Previous Year Paper'], default: 'Full Mock Test' },
  description: { type: String },
  duration: { type: Number, required: true, default: 60 }, // in minutes
  totalMarks: { type: Number, required: true, default: 100 },
  passingMarks: { type: Number, default: 33 },
  negativeMarking: { type: Boolean, default: false },
  language: { type: String, default: 'English' },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }], // Used for flat structure if needed, else calculate from sections
  isRandomized: { type: Boolean, default: false },
  allowedAttempts: { type: Number, default: -1 }, // -1 for unlimited
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);
