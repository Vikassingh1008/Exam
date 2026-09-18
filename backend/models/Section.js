const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  description: { type: String },
  displayOrder: { type: Number, default: 0 },
  sectionMarks: { type: Number, default: 0 },
  sectionDuration: { type: Number },
  negativeMarking: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Section', sectionSchema);
