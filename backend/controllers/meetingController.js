// controllers/meetingController.js
const Meeting = require('../models/Meeting');
const Notification = require('../models/Notification');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const createTransporter = () => {
  if (!EMAIL_USER || !EMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
  });
};

const sendMeetingEmails = async (meeting, attendeeUsers) => {
  const transporter = createTransporter();
  if (!transporter) return;

  const organizer = await User.findById(meeting.organizer);
  const subject = `Meeting Invitation: ${meeting.title}`;
  const html = `
    <p>You have been invited to a meeting.</p>
    <p><strong>Title:</strong> ${meeting.title}</p>
    <p><strong>Organizer:</strong> ${organizer?.name || 'Organizer'}</p>
    <p><strong>When:</strong> ${new Date(meeting.startTime).toLocaleString()} - ${new Date(meeting.endTime).toLocaleString()}</p>
    ${meeting.location ? `<p><strong>Location:</strong> ${meeting.location}</p>` : ''}
    ${meeting.description ? `<p><strong>Description:</strong> ${meeting.description}</p>` : ''}
  `;

  for (const user of attendeeUsers) {
    if (!user.email) continue;
    try {
      await transporter.sendMail({
        from: EMAIL_USER,
        to: user.email,
        subject,
        html
      });
    } catch (e) {
      // swallow errors to not block meeting creation
      console.error('Email send error:', e.message);
    }
  }
};

// @desc    List meetings
// @route   GET /api/events
// @access  Private
exports.listMeetings = async (req, res) => {
  try {
    const { from, to } = req.query;
    const query = {};
    if (from || to) {
      query.startTime = {};
      if (from) query.startTime.$gte = new Date(from);
      if (to) query.startTime.$lte = new Date(to);
    }

    // Visibility: admins/managers see all, employees only their meetings
    if (req.user.role === 'employee') {
      query.$or = [
        { organizer: req.user.id },
        { attendees: req.user.id }
      ];
    }

    const meetings = await Meeting.find(query)
      .populate('organizer', 'name email')
      .populate('attendees', 'name email')
      .sort({ startTime: 1 });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get meeting by ID
// @route   GET /api/events/:id
// @access  Private
exports.getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('organizer', 'name email')
      .populate('attendees', 'name email');

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (req.user.role === 'employee') {
      const isParticipant = meeting.organizer._id.toString() === req.user.id.toString() ||
                            meeting.attendees.some(a => a._id.toString() === req.user.id.toString());
      if (!isParticipant) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create meeting
// @route   POST /api/events
// @access  Private (events.create)
exports.createMeeting = async (req, res) => {
  try {
    const { title, description, attendees = [], startTime, endTime, location, notes, notifyByEmail } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: 'Title, startTime and endTime are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date/time values' });
    }
    if (end <= start) {
      return res.status(400).json({ message: 'endTime must be after startTime' });
    }

    // Resolve attendees: can be array of user IDs or emails
    let attendeeUsers = [];
    if (attendees && attendees.length) {
      const ids = attendees.filter(a => typeof a === 'string' && a.match(/^[0-9a-fA-F]{24}$/));
      const emails = attendees.filter(a => typeof a === 'string' && !a.match(/^[0-9a-fA-F]{24}$/));
      const byId = ids.length ? await User.find({ _id: { $in: ids } }) : [];
      const byEmail = emails.length ? await User.find({ email: { $in: emails } }) : [];
      attendeeUsers = [...byId, ...byEmail];
    }

    const meeting = await Meeting.create({
      title,
      description,
      organizer: req.user.id,
      attendees: attendeeUsers.map(u => u._id),
      startTime: start,
      endTime: end,
      location,
      status: 'scheduled',
      notes,
      notifyByEmail: !!notifyByEmail
    });

    // Create notifications for attendees
    const organizer = await User.findById(req.user.id);
    const notifPromises = attendeeUsers.map(user => Notification.create({
      user: user._id,
      title: `Meeting Invitation: ${title}`,
      message: `${organizer?.name || 'Organizer'} invited you to a meeting on ${start.toLocaleString()}${location ? ' at ' + location : ''}.`,
      type: 'general'
    }));
    await Promise.all(notifPromises);

    // Optionally send emails
    if (meeting.notifyByEmail && attendeeUsers.length) {
      await sendMeetingEmails(meeting, attendeeUsers);
    }

    const populated = await Meeting.findById(meeting._id)
      .populate('organizer', 'name email')
      .populate('attendees', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update meeting
// @route   PUT /api/events/:id
// @access  Private (events.update)
exports.updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    // Only organizer or admin/manager can update
    const isOrganizer = meeting.organizer.toString() === req.user.id.toString();
    if (!(isOrganizer || req.user.role === 'admin' || req.user.role === 'manager')) {
      return res.status(403).json({ message: 'Only organizer, manager or admin can update meeting' });
    }

    const { title, description, attendees, startTime, endTime, location, status, notes, notifyByEmail } = req.body;
    if (title !== undefined) meeting.title = title;
    if (description !== undefined) meeting.description = description;
    if (location !== undefined) meeting.location = location;
    if (status !== undefined) meeting.status = status;
    if (notes !== undefined) meeting.notes = notes;
    if (notifyByEmail !== undefined) meeting.notifyByEmail = !!notifyByEmail;
    if (startTime) meeting.startTime = new Date(startTime);
    if (endTime) meeting.endTime = new Date(endTime);

    let attendeeUsers = null;
    if (Array.isArray(attendees)) {
      const ids = attendees.filter(a => typeof a === 'string' && a.match(/^[0-9a-fA-F]{24}$/));
      const emails = attendees.filter(a => typeof a === 'string' && !a.match(/^[0-9a-fA-F]{24}$/));
      const byId = ids.length ? await User.find({ _id: { $in: ids } }) : [];
      const byEmail = emails.length ? await User.find({ email: { $in: emails } }) : [];
      attendeeUsers = [...byId, ...byEmail];
      meeting.attendees = attendeeUsers.map(u => u._id);
    }

    await meeting.save();

    // Notify attendees on update
    if (attendeeUsers && attendeeUsers.length) {
      const organizer = await User.findById(meeting.organizer);
      const notifPromises = attendeeUsers.map(user => Notification.create({
        user: user._id,
        title: `Meeting Updated: ${meeting.title}`,
        message: `${organizer?.name || 'Organizer'} updated the meeting. New schedule: ${new Date(meeting.startTime).toLocaleString()}${meeting.location ? ' at ' + meeting.location : ''}.`,
        type: 'general'
      }));
      await Promise.all(notifPromises);

      if (meeting.notifyByEmail) {
        await sendMeetingEmails(meeting, attendeeUsers);
      }
    }

    const populated = await Meeting.findById(meeting._id)
      .populate('organizer', 'name email')
      .populate('attendees', 'name email');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete meeting
// @route   DELETE /api/events/:id
// @access  Private (events.delete)
exports.deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    const isOrganizer = meeting.organizer.toString() === req.user.id.toString();
    if (!(isOrganizer || req.user.role === 'admin' || req.user.role === 'manager')) {
      return res.status(403).json({ message: 'Only organizer, manager or admin can delete meeting' });
    }

    await meeting.remove();
    res.json({ message: 'Meeting deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get participants (for selection when creating meetings)
// @route   GET /api/events/participants
// @access  Private (events.create)
exports.getParticipants = async (req, res) => {
  try {
    const users = await User.find({}, 'name email');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};