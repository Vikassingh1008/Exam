const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  targetExam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
