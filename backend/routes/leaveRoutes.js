// routes/leaveRoutes.js
const express = require('express');
const router = express.Router();
const { getLeaveRequests, applyLeave, decideLeave, deleteLeave } = require('../controllers/leaveController');
const { protect, checkPermission } = require('../middleware/auth');

router.route('/')
  .get(protect, checkPermission('leave', 'view'), getLeaveRequests)
  .post(protect, checkPermission('leave', 'create'), applyLeave);

router.route('/:id/decision')
  .put(protect, checkPermission('leave', 'manage'), decideLeave);

router.route('/:id')
  .delete(protect, checkPermission('leave', 'delete'), deleteLeave);

module.exports = router;