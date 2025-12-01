// controllers/attendanceController.js
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc Get attendance records
// @route GET /api/attendance
// @access Private (attendance.view)
exports.getAttendance = async (req, res) => {
  try {
    const { startDate, endDate, userId, status } = req.query;
    const query = {};
    if (userId) query.user = userId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const records = await Attendance.find(query)
      .populate('user', 'name email role')
      .populate('employee', 'name department position')
      .sort({ date: -1, createdAt: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Mark attendance for a user (self or specified by manager/admin)
// @route POST /api/attendance
// @access Private (attendance.create)
exports.markAttendance = async (req, res) => {
  try {
    const { date, status, checkIn, checkOut, notes, userId } = req.body;

    let targetUserId = userId || req.user._id;
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    // Helpers to handle time-only inputs (e.g., "09:30") by combining with attendance date
    const isTimeOnly = (t) => typeof t === 'string' && /^\d{1,2}:\d{2}$/.test(t);
    const combineTime = (timeStr, baseDate) => {
      const [h, m] = timeStr.split(':').map(Number);
      const d = new Date(baseDate);
      d.setHours(h, m, 0, 0);
      return d;
    };

    // Upsert to avoid duplicates
    const update = {
      status: status || 'present',
      notes: notes || '',
      createdBy: req.user._id,
      updatedBy: req.user._id
    };
    if (checkIn) update.checkIn = isTimeOnly(checkIn) ? combineTime(checkIn, attendanceDate) : new Date(checkIn);
    if (checkOut) update.checkOut = isTimeOnly(checkOut) ? combineTime(checkOut, attendanceDate) : new Date(checkOut);

    const record = await Attendance.findOneAndUpdate(
      { user: targetUserId, date: attendanceDate },
      { $set: update, $setOnInsert: { user: targetUserId, employee: targetUser.employee, date: attendanceDate } },
      { new: true, upsert: true }
    );

    res.status(201).json(record);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Attendance for this user and date already exists.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc Update attendance record
// @route PUT /api/attendance/:id
// @access Private (attendance.manage)
exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body, updatedBy: req.user._id };
    const record = await Attendance.findByIdAndUpdate(id, update, { new: true });
    if (!record) return res.status(404).json({ message: 'Attendance record not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete attendance record
// @route DELETE /api/attendance/:id
// @access Private (attendance.delete)
exports.deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Attendance.findByIdAndDelete(id);
    if (!record) return res.status(404).json({ message: 'Attendance record not found' });
    res.json({ message: 'Attendance record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};