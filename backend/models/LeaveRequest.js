// models/LeaveRequest.js
const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  type: { type: String, enum: ['annual', 'sick', 'casual', 'unpaid', 'other'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  decisionDate: { type: Date },
  comments: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);