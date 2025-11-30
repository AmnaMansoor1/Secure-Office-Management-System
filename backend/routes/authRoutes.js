// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  updateProfile,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  setupMFA,
  verifyMFASetup,
  disableMFA,
  generateBackupCodes,
  logout,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect, checkRole } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (require authentication)
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.post('/logout', protect, logout);

// MFA routes
router.post('/mfa/setup', protect, setupMFA);
router.post('/mfa/verify', protect, verifyMFASetup);
router.post('/mfa/disable', protect, disableMFA);
router.post('/mfa/backup-codes', protect, generateBackupCodes);

// Admin routes
router.get('/users', protect, checkRole('admin'), getUsers);
router.route('/users/:id')
  .get(protect, checkRole('admin'), getUserById)
  .put(protect, checkRole('admin'), updateUser)
  .delete(protect, checkRole('admin'), deleteUser);

module.exports = router;