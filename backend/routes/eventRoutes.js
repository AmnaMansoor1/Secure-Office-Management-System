// routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/auth');
const {
  listMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getParticipants
} = require('../controllers/meetingController');

// Apply protection to all routes
router.use(protect);

router.get('/', checkPermission('events', 'view'), listMeetings);
router.get('/participants', checkPermission('events', 'create'), getParticipants);
router.get('/:id', checkPermission('events', 'view'), getMeeting);
router.post('/', checkPermission('events', 'create'), createMeeting);
router.put('/:id', checkPermission('events', 'update'), updateMeeting);
router.delete('/:id', checkPermission('events', 'delete'), deleteMeeting);

module.exports = router;