// routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const { uploadFile, listFiles, downloadFile, deleteFile } = require('../controllers/fileController');
const { protect, checkPermission } = require('../middleware/auth');

// All file routes protected
router.use(protect);

// Upload (employees allowed by permission)
router.post('/upload', checkPermission('files', 'upload'), uploadFile);

// List
router.get('/', checkPermission('files', 'view'), listFiles);

// Download
router.get('/:id/download', checkPermission('files', 'download'), downloadFile);

// Delete
router.delete('/:id', checkPermission('files', 'delete'), deleteFile);

module.exports = router;