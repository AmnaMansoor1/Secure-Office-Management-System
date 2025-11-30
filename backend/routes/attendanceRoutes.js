// routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const { getAttendance, markAttendance, updateAttendance, deleteAttendance } = require('../controllers/attendanceController');
const { protect, checkPermission } = require('../middleware/auth');

router.route('/')
  .get(protect, checkPermission('attendance', 'view'), getAttendance)
  .post(protect, checkPermission('attendance', 'create'), markAttendance);

router.route('/:id')
  .put(protect, checkPermission('attendance', 'manage'), updateAttendance)
  .delete(protect, checkPermission('attendance', 'delete'), deleteAttendance);

module.exports = router;