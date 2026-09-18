const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// Admin Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let admin = await Admin.findOne({ email });
    if (admin) return res.status(400).json({ success: false, message: 'Admin already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    admin = new Admin({ name, email, password: hashedPassword });
    await admin.save();

    const payload = { admin: { id: admin.id }, role: 'admin' };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
      if (err) throw err;
      res.status(201).json({ success: true, token, admin: { id: admin.id, name: admin.name, email: admin.email } });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const payload = { admin: { id: admin.id }, role: 'admin' };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
      if (err) throw err;
      res.json({ success: true, token, admin: { id: admin.id, name: admin.name, email: admin.email } });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin Profile
router.get('/me', adminMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    res.json({ success: true, admin });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
