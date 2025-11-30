// models/Meeting.js
const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  location: { type: String, default: '' },
  status: { type: String, enum: ['scheduled', 'cancelled', 'completed'], default: 'scheduled' },
  notes: { type: String, default: '' },
  notifyByEmail: { type: Boolean, default: false }
}, {
  timestamps: true
});

MeetingSchema.index({ startTime: 1 });
MeetingSchema.index({ organizer: 1, startTime: -1 });

module.exports = mongoose.model('Meeting', MeetingSchema);