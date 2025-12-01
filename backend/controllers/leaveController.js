// controllers/leaveController.js
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc Get leave requests
// @route GET /api/leave
// @access Private (leave.view)
exports.getLeaveRequests = async (req, res) => {
  try {
    const { status, userId, startDate, endDate } = req.query;
    const query = {};
    if (status) query.status = status;
    if (userId) query.user = userId;
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const requests = await LeaveRequest.find(query)
      .populate('user', 'name email role')
      .populate('employee', 'name department position')
      .populate('approver', 'name email role')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Apply for leave (employee)
// @route POST /api/leave
// @access Private (leave.create)
exports.applyLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    const applicant = await User.findById(req.user._id);
    if (!applicant) return res.status(404).json({ message: 'User not found' });

    const leave = await LeaveRequest.create({
      user: req.user._id,
      employee: applicant.employee,
      type,
      startDate,
      endDate,
      reason,
      status: 'pending'
    });

    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Approve/Reject leave (manager/admin)
// @route PUT /api/leave/:id/decision
// @access Private (leave.manage)
exports.decideLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments } = req.body; // action: 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use approve or reject.' });
    }

    const update = {
      status: action === 'approve' ? 'approved' : 'rejected',
      approver: req.user._id,
      decisionDate: new Date(),
      comments: comments || ''
    };

    const leave = await LeaveRequest.findByIdAndUpdate(id, update, { new: true });
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });

    // Notify the employee about the decision (non-blocking)
    try {
      const title = action === 'approve' ? 'Leave Request Approved' : 'Leave Request Rejected';
      const message = `Your leave request (${leave.type}) from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been ${action === 'approve' ? 'approved' : 'rejected'}${comments ? `: ${comments}` : '.'}`;
      await Notification.create({ user: leave.user, title, message, type: 'general' });
    } catch (e) {
      // Do not block the response if notification fails
      console.error('Failed to create leave decision notification:', e.message);
    }

    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete leave request
// @route DELETE /api/leave/:id
// @access Private (leave.delete)
exports.deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await LeaveRequest.findByIdAndDelete(id);
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    res.json({ message: 'Leave request deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};