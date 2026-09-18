const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String },
  thumbnail: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  isSectionWise: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'draft' },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
