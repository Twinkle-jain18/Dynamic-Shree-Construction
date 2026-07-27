const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      admin: {
        id: admin.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Verify token
router.get('/verify', require('../middleware/auth'), (req, res) => {
  res.json({ valid: true });
});

// Create new admin account (Protected)
router.post('/register', require('../middleware/auth'), async (req, res) => {
  const { username, password, email } = req.body;

  try {
    let existingUsername = await Admin.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'An admin with this username already exists' });
    }

    if (email && email.trim() !== '') {
      const trimmedEmail = email.trim().toLowerCase();
      let existingEmail = await Admin.findOne({ email: trimmedEmail });
      if (existingEmail) {
        return res.status(400).json({ message: 'An admin with this email address already exists' });
      }
    }

    const adminData = { username, password };
    if (email && email.trim() !== '') {
      adminData.email = email.trim().toLowerCase();
    }
    
    const newAdmin = new Admin(adminData);
    await newAdmin.save();

    res.json({ message: 'New admin account created successfully' });
  } catch (err) {
    if (err.code === 11000) {
      if (err.keyPattern && err.keyPattern.email) {
        return res.status(400).json({ message: 'An admin with this email address already exists' });
      }
      if (err.keyPattern && err.keyPattern.username) {
        return res.status(400).json({ message: 'An admin with this username already exists' });
      }
      return res.status(400).json({ message: 'An admin account with these credentials already exists' });
    }
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Change Password (Protected)
router.patch('/change-password', require('../middleware/auth'), async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Update Profile Email (Protected)
router.patch('/update-profile', require('../middleware/auth'), async (req, res) => {
  const { email } = req.body;

  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    if (email && email.trim() !== '') {
      const trimmedEmail = email.trim().toLowerCase();
      // Check if another admin account is using this email
      const existingEmail = await Admin.findOne({ email: trimmedEmail, _id: { $ne: admin._id } });
      if (existingEmail) {
        return res.status(400).json({ message: 'This email address is already registered to another admin account' });
      }
      admin.email = trimmedEmail;
    } else {
      admin.email = undefined;
    }
    
    await admin.save();
    res.json({ message: 'Admin profile updated successfully', email: admin.email });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'This email address is already registered to another admin account' });
    }
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Request Password Reset
router.post('/request-reset', async (req, res) => {
  const { username } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (!admin.email) {
      return res.status(400).json({ message: 'Admin email not configured. Please contact support.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.resetOtp = otp;
    admin.resetOtpExpires = Date.now() + 600000; // 10 minutes
    await admin.save();

    // Log the OTP to backend console for easy retrieval during local debugging/development
    console.log(`[SECURITY/DEBUG] Password reset requested for admin "${username}". Generated OTP: ${otp} (sent to ${admin.email})`);

    res.json({ 
      message: 'OTP generated successfully',
      email: admin.email,
      otp: otp // Returning OTP so frontend can send it via EmailJS as requested
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { username, otp, newPassword } = req.body;
  try {
    const admin = await Admin.findOne({ 
      username,
      resetOtp: otp,
      resetOtpExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    admin.password = newPassword;
    admin.resetOtp = undefined;
    admin.resetOtpExpires = undefined;
    await admin.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;
