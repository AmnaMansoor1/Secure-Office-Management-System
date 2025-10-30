// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  uploadAttachment,
  deleteAttachment,
  getTaskStats,
  sendReminders
} = require('../controllers/taskController');
const { protect, checkPermission } = require('../middleware/auth');

// Apply protection to all routes
router.use(protect);

// Task CRUD routes
router.route('/')
  .get(getTasks)
  .post(checkPermission('tasks', 'create'), createTask);

router.route('/stats')
  .get(getTaskStats);

router.route('/reminders')
  .post(checkPermission('tasks', 'manage'), sendReminders);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(checkPermission('tasks', 'delete'), deleteTask);

// Comment routes
router.route('/:id/comments')
  .post(addComment);

// Attachment routes
router.route('/:id/attachments')
  .post(uploadAttachment);

router.route('/:id/attachments/:attachmentId')
  .delete(deleteAttachment);

module.exports = router;

