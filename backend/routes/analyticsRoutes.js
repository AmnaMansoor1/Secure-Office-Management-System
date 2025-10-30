// routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getDashboardSummary,
  getFinancialOverview,
  getEmployeeAnalytics,
  getAssetAnalytics,
  getComparativeAnalytics
} = require('../controllers/analyticsController');
const { protect, checkPermission } = require('../middleware/auth');

// All analytics routes require 'analytics.view' permission
router.get('/dashboard', protect, checkPermission('analytics', 'view'), getDashboardSummary);
router.get('/financial-overview', protect, checkPermission('analytics', 'view'), getFinancialOverview);
router.get('/employees', protect, checkPermission('analytics', 'view'), getEmployeeAnalytics);
router.get('/assets', protect, checkPermission('analytics', 'view'), getAssetAnalytics);
router.get('/comparative', protect, checkPermission('analytics', 'view'), getComparativeAnalytics);

module.exports = router;