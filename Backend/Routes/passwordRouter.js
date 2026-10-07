// Routes/passwordRouter.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const UserModel = require('../Models/Users');
const { generateResetToken, sendResetPasswordEmail } = require('../utils/emailUtils');

const RESET_SECRET = process.env.JWT_SECRET;

// POST /forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await UserModel.findOne({ email });
    if (!user) {
      // Do not reveal whether email exists — respond with success to avoid enumeration
      return res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
    }

    const token = generateResetToken(user._id);
    await sendResetPasswordEmail(email, token);

    return res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /reset-password?token=...  (optional check endpoint)
router.get('/reset-password', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).json({ success: false, message: 'Token missing' });

  try {
    const decoded = jwt.verify(token, RESET_SECRET);
    // token valid
    res.json({ success: true, userId: decoded.userId });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
});

// POST /reset-password  -> set new password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, message: 'Token and newPassword are required' });

    let decoded;
    try {
      decoded = jwt.verify(token, RESET_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await UserModel.findByIdAndUpdate(decoded.userId, { password: hashed });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
