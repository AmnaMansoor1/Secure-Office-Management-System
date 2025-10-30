// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in the Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password -mfaSecret');

      // Check if user exists
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Check if user is active
      if (!req.user.isActive) {
        return res.status(401).json({ message: 'Account is inactive. Please contact an administrator' });
      }

      // Check if account is locked
      if (req.user.isAccountLocked()) {
        return res.status(423).json({ 
          message: 'Account is temporarily locked due to too many failed login attempts.' 
        });
      }

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired. Please refresh your token.' });
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Check user role
exports.checkRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role ${req.user.role} is not authorized to access this resource` });
    }
    next();
  };
};

// Check resource permission
exports.checkPermission = (resource, action) => {
  return (req, res, next) => {
    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    if (!req.user.permissions || !req.user.permissions[resource] || !req.user.permissions[resource][action]) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
    next();
  };
};