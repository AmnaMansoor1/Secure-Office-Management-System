// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'employee'],
    default: 'employee'
  },
  permissions: {
    employees: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    assets: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    expenses: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    income: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    analytics: {
      view: { type: Boolean, default: false }
    },
    tasks: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      manage: { type: Boolean, default: false }
    },
    files: {
      view: { type: Boolean, default: false },
      upload: { type: Boolean, default: false },
      download: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    // Added modules
    attendance: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      manage: { type: Boolean, default: false }
    },
    leave: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      manage: { type: Boolean, default: false }
    },
    // Newly added modules to persist role defaults
    performance: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    events: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      manage: { type: Boolean, default: false }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  // Multi-Factor Authentication fields
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  mfaSecret: {
    type: String,
    select: false
  },
  mfaBackupCodes: [{
    code: String,
    used: { type: Boolean, default: false },
    usedAt: Date
  }],
  // Simple login attempt tracking
  loginAttempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Encrypt password using bcrypt (fixed)
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified or is new
  if (!this.isModified('password')) {
    return next(); // prevent double-hashing
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});
// Set default permissions based on role
userSchema.pre('save', function(next) {
  if (this.isModified('role') || this.isNew) {
    if (this.role === 'admin') {
      // Admin has all permissions
      this.permissions = {
        employees: { view: true, create: true, update: true, delete: true },
        assets: { view: true, create: true, update: true, delete: true },
        expenses: { view: true, create: true, update: true, delete: true },
        income: { view: true, create: true, update: true, delete: true },
        analytics: { view: true },
        tasks: { view: true, create: true, update: true, delete: true, manage: true },
        files: { view: true, upload: true, download: true, delete: true },
        attendance: { view: true, create: true, update: true, delete: true, manage: true },
        leave: { view: true, create: true, update: true, delete: true, manage: true }
      };
    } else if (this.role === 'manager') {
      // Manager has view permissions for everything, create/update for most things
      this.permissions = {
        employees: { view: true, create: true, update: true, delete: false },
        assets: { view: true, create: true, update: true, delete: false },
        expenses: { view: true, create: true, update: true, delete: false },
        income: { view: true, create: true, update: true, delete: false },
        analytics: { view: true },
        tasks: { view: true, create: true, update: true, delete: false, manage: true },
        files: { view: true, upload: true, download: true, delete: false },
        attendance: { view: true, create: true, update: true, delete: false, manage: true },
        leave: { view: true, create: true, update: true, delete: false, manage: true }
      };
    } else {
      // Regular employee has limited permissions
      this.permissions = {
        employees: { view: true, create: false, update: false, delete: false },
        assets: { view: true, create: false, update: false, delete: false },
        expenses: { view: true, create: true, update: false, delete: false },
        income: { view: true, create: false, update: false, delete: false },
        analytics: { view: false },
        tasks: { view: true, create: false, update: true, delete: false, manage: false },
        files: { view: true, upload: true, download: true, delete: true },
        attendance: { view: true, create: true, update: false, delete: false, manage: false },
        leave: { view: true, create: true, update: false, delete: false, manage: false }
      };
    }
  }
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Generate MFA secret
userSchema.methods.generateMFASecret = function() {
  const speakeasy = require('speakeasy');
  const secret = speakeasy.generateSecret({
    name: `${this.name} (${this.email})`,
    issuer: 'Office Management System'
  });
  
  this.mfaSecret = secret.base32;
  return secret;
};

// Verify MFA token
userSchema.methods.verifyMFAToken = function(token) {
  const speakeasy = require('speakeasy');
  return speakeasy.totp.verify({
    secret: this.mfaSecret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time steps (60 seconds) of tolerance
  });
};

// Generate backup codes
userSchema.methods.generateBackupCodes = function() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push({
      code: Math.random().toString(36).substring(2, 10).toUpperCase(),
      used: false
    });
  }
  this.mfaBackupCodes = codes;
  return codes;
};

// Verify backup code
userSchema.methods.verifyBackupCode = function(code) {
  const backupCode = this.mfaBackupCodes.find(bc => bc.code === code && !bc.used);
  if (backupCode) {
    backupCode.used = true;
    backupCode.usedAt = new Date();
    this.save();
    return true;
  }
  return false;
};

// Simple account lock check
userSchema.methods.isAccountLocked = function() {
  return this.loginAttempts >= 5;
};

module.exports = mongoose.model('User', userSchema);