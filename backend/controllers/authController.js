// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Helper function to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d' // Simple 30-day token
  });
};

// Helper function to set permissions based on role
const setPermissionsByRole = (role) => {
  const permissions = {
    employees: { view: false, create: false, update: false, delete: false },
    assets: { view: false, create: false, update: false, delete: false },
    expenses: { view: false, create: false, update: false, delete: false },
    income: { view: false, create: false, update: false, delete: false },
    analytics: { view: false },
    tasks: { view: false, create: false, update: false, delete: false, manage: false },
    files: { view: false, upload: false, download: false, delete: false },
    attendance: { view: false, create: false, update: false, delete: false, manage: false },
    leave: { view: false, create: false, update: false, delete: false, manage: false },
    performance: { view: false, create: false, update: false, delete: false },
    events: { view: false, create: false, update: false, delete: false, manage: false }
  };

  switch (role) {
    case 'admin':
      // Admin has all permissions
      permissions.employees = { view: true, create: true, update: true, delete: true };
      permissions.assets = { view: true, create: true, update: true, delete: true };
      permissions.expenses = { view: true, create: true, update: true, delete: true };
      permissions.income = { view: true, create: true, update: true, delete: true };
      permissions.analytics = { view: true };
      permissions.tasks = { view: true, create: true, update: true, delete: true, manage: true };
      permissions.files = { view: true, upload: true, download: true, delete: true };
      permissions.attendance = { view: true, create: true, update: true, delete: true, manage: true };
      permissions.leave = { view: true, create: true, update: true, delete: true, manage: true };
      permissions.performance = { view: true, create: true, update: true, delete: true };
      permissions.events = { view: true, create: true, update: true, delete: true, manage: true };
      break;
    case 'manager':
      // Manager has view and create permissions, manage leave/attendance
      permissions.employees = { view: true, create: true, update: true, delete: false };
      permissions.assets = { view: true, create: true, update: true, delete: false };
      permissions.expenses = { view: true, create: true, update: true, delete: false };
      permissions.income = { view: true, create: true, update: true, delete: false };
      permissions.analytics = { view: true };
      permissions.tasks = { view: true, create: true, update: true, delete: false, manage: true };
      permissions.files = { view: true, upload: true, download: true, delete: false };
      permissions.attendance = { view: true, create: true, update: true, delete: false, manage: true };
      permissions.leave = { view: true, create: true, update: true, delete: false, manage: true };
      permissions.performance = { view: true, create: true, update: true, delete: false };
      permissions.events = { view: true, create: true, update: true, delete: false, manage: true };
      break;
    case 'employee':
      // Employee has limited permissions
      permissions.employees = { view: true, create: false, update: false, delete: false };
      permissions.assets = { view: true, create: false, update: false, delete: false };
      permissions.expenses = { view: true, create: true, update: false, delete: false };
      permissions.income = { view: true, create: true, update: false, delete: false };
      permissions.analytics = { view: false };
      permissions.tasks = { view: true, create: false, update: true, delete: false, manage: false };
      permissions.files = { view: true, upload: true, download: true, delete: true };
      permissions.attendance = { view: true, create: true, update: false, delete: false, manage: false };
      permissions.leave = { view: true, create: true, update: false, delete: false, manage: false };
      permissions.performance = { view: true, create: false, update: false, delete: false };
      permissions.events = { view: true, create: false, update: false, delete: false, manage: false };
      break;
  }

  return permissions;
};

// Email transporter configuration
const createTransporter = async () => {
  const provider = (process.env.EMAIL_PROVIDER || '').toLowerCase();

  if (provider === 'mailtrap') {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
      port: Number(process.env.EMAIL_PORT || 587),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  if (provider === 'ethereal') {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  // Default to Gmail
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Helper to ensure permissions are complete per role defaults
const ensurePermissionsComplete = (current, role) => {
  const defaults = setPermissionsByRole(role);
  const merged = { ...defaults };
  if (current && typeof current === 'object') {
    for (const mod of Object.keys(defaults)) {
      merged[mod] = { ...defaults[mod], ...(current[mod] || {}) };
    }
  }
  return merged;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const userRole = role || 'employee';
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      permissions: setPermissionsByRole(userRole)
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, mfaToken } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).select('+password +mfaSecret');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is inactive. Please contact an administrator.' });
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      return res.status(423).json({ 
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.' 
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts += 1;
      await user.save();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Reset login attempts on successful password
    user.loginAttempts = 0;
    await user.save();

    // If MFA is enabled, require MFA token
    if (user.mfaEnabled) {
      if (!mfaToken) {
        return res.status(200).json({
          message: 'MFA token required',
          mfaRequired: true,
          userId: user._id
        });
      }

      // Verify MFA token
      const isValidToken = user.verifyMFAToken(mfaToken);
      const isValidBackupCode = user.verifyBackupCode(mfaToken);

      if (!isValidToken && !isValidBackupCode) {
        return res.status(401).json({ message: 'Invalid MFA token' });
      }
    }

    // Generate token
    const token = generateToken(user._id);
    // Update last login time and ensure permissions are set
    user.lastLogin = Date.now();
    // Normalize permissions to include any new modules/actions
    user.permissions = ensurePermissionsComplete(user.permissions, user.role);
    // Force Files upload permission for employees
    if (user.role === 'employee') {
      if (!user.permissions.files) user.permissions.files = {};
      user.permissions.files.view = true;
      user.permissions.files.upload = true;
      // Ensure Leave apply permissions for employees
      if (!user.permissions.leave) user.permissions.leave = {};
      user.permissions.leave.view = true;
      user.permissions.leave.create = true;
      // Ensure Attendance mark permissions for employees
      if (!user.permissions.attendance) user.permissions.attendance = {};
      user.permissions.attendance.view = true;
      user.permissions.attendance.create = true;
    }
    await user.save({ validateBeforeSave: false });
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      mfaEnabled: user.mfaEnabled || false,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.mfaEnabled === undefined) {
      user.mfaEnabled = false;
    }
    // Normalize permissions each time profile is fetched
    user.permissions = ensurePermissionsComplete(user.permissions, user.role);
    // Force Files upload permission for employees
    if (user.role === 'employee') {
      if (!user.permissions.files) user.permissions.files = {};
      user.permissions.files.view = true;
      user.permissions.files.upload = true;
      // Ensure Leave apply permissions for employees
      if (!user.permissions.leave) user.permissions.leave = {};
      user.permissions.leave.view = true;
      user.permissions.leave.create = true;
      // Ensure Attendance mark permissions for employees
      if (!user.permissions.attendance) user.permissions.attendance = {};
      user.permissions.attendance.view = true;
      user.permissions.attendance.create = true;
    }
    await user.save({ validateBeforeSave: false });
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      employee: user.employee,
      mfaEnabled: user.mfaEnabled
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;
    
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID (admin only)
// @route   GET /api/auth/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, permissions, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (permissions) user.permissions = permissions;
    if (isActive !== undefined) user.isActive = isActive;
    
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      permissions: updatedUser.permissions,
      isActive: updatedUser.isActive
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.remove();
    
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Setup MFA for user
// @route   POST /api/auth/mfa/setup
// @access  Private
exports.setupMFA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+mfaSecret');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.mfaEnabled) {
      return res.status(400).json({ message: 'MFA is already enabled for this user' });
    }

    // Generate MFA secret
    const secret = user.generateMFASecret();
    await user.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify MFA setup
// @route   POST /api/auth/mfa/verify
// @access  Private
exports.verifyMFASetup = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id).select('+mfaSecret');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.mfaSecret) {
      return res.status(400).json({ message: 'MFA secret not found. Please setup MFA first.' });
    }

    // Verify the token
    const isValid = user.verifyMFAToken(token);

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid MFA token' });
    }

    // Enable MFA and generate backup codes
    user.mfaEnabled = true;
    const backupCodes = user.generateBackupCodes();
    await user.save();

    res.json({
      message: 'MFA enabled successfully',
      backupCodes: backupCodes.map(code => code.code),
      mfaEnabled: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Disable MFA for user
// @route   POST /api/auth/mfa/disable
// @access  Private
exports.disableMFA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.mfaEnabled) {
      return res.status(400).json({ message: 'MFA is not enabled for this user' });
    }

    // Simplified disable for testing - in production, you'd want password + MFA verification
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    user.mfaBackupCodes = [];
    await user.save();

    res.json({ message: 'MFA disabled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate new backup codes
// @route   POST /api/auth/mfa/backup-codes
// @access  Private
exports.generateBackupCodes = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.mfaEnabled) {
      return res.status(400).json({ message: 'MFA is not enabled for this user' });
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate new backup codes
    const backupCodes = user.generateBackupCodes();
    await user.save();

    res.json({
      message: 'New backup codes generated',
      backupCodes: backupCodes.map(code => code.code)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    // Always respond success to prevent user enumeration
    if (!user) {
      return res.status(200).json({ message: 'If an account exists for this email, a password reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save token and expiry (1 hour)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // Build reset URL for frontend page
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    const transporter = await createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link below to set a new password.\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>You requested a password reset. Click the link below to set a new password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can ignore this email.</p>`
    };

    const info = await transporter.sendMail(mailOptions);
    // For Ethereal, log the preview URL to make it easy to view the email in dev
    if ((process.env.EMAIL_PROVIDER || '').toLowerCase() === 'ethereal') {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) console.log('Password reset email preview (Ethereal):', preview);
    }

    return res.status(200).json({ message: 'If an account exists for this email, a password reset link has been sent.' });
  } catch (error) {
    // Do not leak detailed errors to avoid enumeration
    return res.status(200).json({ message: 'If an account exists for this email, a password reset link has been sent.' });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    // Set new password and clear reset fields, also unlock account
    user.password = password;
    user.loginAttempts = 0;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.status(200).json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};