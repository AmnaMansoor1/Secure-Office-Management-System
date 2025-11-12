// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

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
    files: { view: false, upload: false, download: false, delete: false }
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
      break;
    case 'manager':
      // Manager has view and create permissions
      permissions.employees = { view: true, create: true, update: true, delete: false };
      permissions.assets = { view: true, create: true, update: true, delete: false };
      permissions.expenses = { view: true, create: true, update: true, delete: false };
      permissions.income = { view: true, create: true, update: true, delete: false };
      permissions.analytics = { view: true };
      permissions.tasks = { view: true, create: true, update: true, delete: false, manage: true };
      permissions.files = { view: true, upload: true, download: true, delete: false };
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
      break;
  }

  return permissions;
};

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail', // You can change this to your preferred email service
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