// routes/assetRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getAssets, 
  getAssetById, 
  createAsset, 
  updateAsset, 
  deleteAsset 
} = require('../controllers/assetController');
const { protect, checkPermission } = require('../middleware/auth');

// Apply protection and permission checks
router.route('/')
  .get(protect, checkPermission('assets', 'view'), getAssets)
  .post(protect, checkPermission('assets', 'create'), createAsset);

router.route('/:id')
  .get(protect, checkPermission('assets', 'view'), getAssetById)
  .put(protect, checkPermission('assets', 'update'), updateAsset)
  .delete(protect, checkPermission('assets', 'delete'), deleteAsset);

module.exports = router;