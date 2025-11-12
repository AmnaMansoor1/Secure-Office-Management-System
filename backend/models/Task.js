// models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a task title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a task description'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'assignedToType'
  },
  assignedToType: {
    type: String,
    enum: ['User', 'Employee'],
    default: 'User'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify who assigned the task']
  },
  dueDate: {
    type: Date,
    required: [true, 'Please set a due date']
  },
  completedAt: {
    type: Date
  },
  attachments: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Notification settings
  notifications: {
    reminderSent: {
      type: Boolean,
      default: false
    },
    lastReminderSent: Date,
    reminderCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ assignedBy: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ status: 1, priority: 1 });

// Virtual for checking if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && this.status !== 'completed' && this.status !== 'cancelled';
});

// Virtual for task progress percentage
taskSchema.virtual('progressPercentage').get(function() {
  switch (this.status) {
    case 'pending': return 0;
    case 'in-progress': return 50;
    case 'completed': return 100;
    case 'cancelled': return 0;
    default: return 0;
  }
});

// Method to update task status
taskSchema.methods.updateStatus = function(newStatus, userId) {
  this.status = newStatus;
  
  if (newStatus === 'completed') {
    this.completedAt = new Date();
  }
  
  // Add a comment about status change
  this.comments.push({
    user: userId,
    comment: `Task status changed to ${newStatus}`
  });
  
  return this.save();
};

// Method to add comment
taskSchema.methods.addComment = function(userId, comment) {
  this.comments.push({
    user: userId,
    comment: comment
  });
  
  return this.save();
};

// Method to check if user can modify task
taskSchema.methods.canModify = function(userId, userRole) {
  // Admin can modify any task
  if (userRole === 'admin') return true;
  
  // Manager can modify tasks they assigned or manage
  if (userRole === 'manager' && this.assignedBy.toString() === userId.toString()) return true;
  
  // Employee can only modify their own assigned tasks
  if (userRole === 'employee' && this.assignedTo.toString() === userId.toString()) return true;
  
  return false;
};

// Static method to get tasks for a user
taskSchema.statics.getTasksForUser = function(userId, userRole, filters = {}) {
  let query = {};
  
  if (userRole === 'employee') {
    query.assignedTo = userId;
  } else if (userRole === 'manager') {
    query.$or = [
      { assignedBy: userId },
      { assignedTo: userId }
    ];
  }
  // Admin can see all tasks (no additional filter)
  
  // Apply additional filters
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.overdue) query.dueDate = { $lt: new Date() };
  
  return this.find(query)
    .populate('assignedBy', 'name email')
    .populate('comments.user', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get overdue tasks
taskSchema.statics.getOverdueTasks = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] },
    isActive: true
  }).populate('assignedTo', 'name email');
};

module.exports = mongoose.model('Task', taskSchema);
