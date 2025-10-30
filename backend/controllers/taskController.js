// controllers/taskController.js
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Helper function to send email notification
const sendEmailNotification = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('Email notification error:', error);
  }
};

// @desc    Get all tasks (with role-based filtering)
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const { status, priority, overdue, assignedTo } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (overdue === 'true') filters.overdue = true;
    
    const tasks = await Task.getTasksForUser(req.user.id, req.user.role, filters);
    
    // Manually populate assignedTo for each task based on type
    const populatedTasks = await Promise.all(tasks.map(async (task) => {
      if (task.assignedTo) {
        if (task.assignedToType === 'Employee') {
          const Employee = require('../models/Employee');
          const employee = await Employee.findById(task.assignedTo);
          task.assignedTo = employee;
        } else {
          const user = await User.findById(task.assignedTo);
          task.assignedTo = user;
        }
      }
      return task;
    }));
    
    res.json(populatedTasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('assignedBy', 'name email role')
      .populate('comments.user', 'name email');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user can view this task
    if (!task.canModify(req.user.id, req.user.role) && 
        task.assignedTo._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Manager/Admin only)
exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate, priority, estimatedHours, tags } = req.body;
    
    // Check if user can create tasks
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers and admins can create tasks' });
    }
    
    // Verify assigned user/employee exists (only if assignedTo is provided)
    let assignedUser = null;
    let assignedUserId = null;
    let assignedToType = 'User';
    
    if (assignedTo) {
      // First try to find by user ID directly
      assignedUser = await User.findById(assignedTo);
      
      if (assignedUser) {
        assignedUserId = assignedUser._id;
        assignedToType = 'User';
      } else {
        // If not found, try to find by employee ID
        assignedUser = await User.findOne({ employee: assignedTo });
        
        if (assignedUser) {
          assignedUserId = assignedUser._id;
          assignedToType = 'User';
        } else {
          // If still not found, check if it's an employee without a user account
          const Employee = require('../models/Employee');
          const employee = await Employee.findById(assignedTo);
          
          if (employee) {
            // Try to find existing user by email match
            const existingUser = await User.findOne({ email: employee.email });
            
            if (existingUser) {
              // Link the employee to the existing user
              existingUser.employee = assignedTo;
              await existingUser.save();
              
              assignedUser = existingUser;
              assignedUserId = existingUser._id;
              assignedToType = 'User';
              console.log(`Linked employee ${employee.name} to existing user ${existingUser.email}`);
            } else {
              // Create new user account for the employee
              const salt = await bcrypt.genSalt(10);
              const hashedPassword = await bcrypt.hash('temp123', salt);
              
              const newUser = await User.create({
                name: employee.name,
                email: employee.email || `${employee.name.toLowerCase().replace(/\s+/g, '')}@company.com`,
                password: hashedPassword,
                role: 'employee',
                employee: assignedTo,
                isActive: true
              });
              
              assignedUser = newUser;
              assignedUserId = newUser._id;
              assignedToType = 'User';
              console.log(`Created new user account for employee ${employee.name}`);
            }
          } else {
            return res.status(400).json({ message: 'Assigned user/employee not found' });
          }
        }
      }
    }
    
    const task = await Task.create({
      title,
      description,
      assignedTo: assignedUserId,
      assignedToType: assignedToType,
      assignedBy: req.user.id,
      dueDate: new Date(dueDate),
      priority: priority || 'medium',
      estimatedHours,
      tags: tags || []
    });
    
    // Populate the created task with proper handling for both users and employees
    let populatedTask = await Task.findById(task._id)
      .populate('assignedBy', 'name email');
    
    // Handle assignedTo population based on type
    if (task.assignedTo) {
      if (task.assignedToType === 'Employee') {
        const Employee = require('../models/Employee');
        const employee = await Employee.findById(task.assignedTo);
        populatedTask.assignedTo = employee;
      } else {
        const user = await User.findById(task.assignedTo);
        populatedTask.assignedTo = user;
      }
    }
    
    // Create notification and send email (only if user is assigned)
    if (assignedUser) {
      // Create notification in database (always use the user account)
      await Notification.create({
        user: assignedUserId,
        title: 'New Task Assigned',
        message: `You have been assigned a new task: ${title}`,
        type: 'task_assigned',
        relatedTask: task._id
      });
      
      console.log(`Created notification for user ${assignedUser.name} (${assignedUser.email})`);

      // Send email notification
      let emailHtml = `
      <h2>New Task Assigned</h2>
      <p><strong>Task:</strong> ${title}</p>
      <p><strong>Description:</strong> ${description}</p>
      <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
      <p><strong>Priority:</strong> ${priority || 'medium'}</p>
      <p>Please log in to view and update your tasks.</p>
    `;
      
      // If we created a new user account, include login credentials
      if (assignedToType === 'User' && assignedUser.isNew) {
        emailHtml += `
          <hr>
          <h3>Login Credentials</h3>
          <p><strong>Email:</strong> ${assignedUser.email}</p>
          <p><strong>Password:</strong> temp123</p>
          <p><em>Please change your password after first login.</em></p>
        `;
      }
    
    await sendEmailNotification(
      assignedUser.email,
      `New Task Assigned: ${title}`,
      emailHtml
    );
    }
    
    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user can modify this task
    if (!task.canModify(req.user.id, req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { title, description, status, priority, dueDate, estimatedHours, actualHours, tags } = req.body;
    
    // Update fields
    if (title) task.title = title;
    if (description) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = new Date(dueDate);
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (actualHours !== undefined) task.actualHours = actualHours;
    if (tags) task.tags = tags;
    
    // Handle status change
    if (status && status !== task.status) {
      await task.updateStatus(status, req.user.id);
    }
    
    await task.save();
    
    let updatedTask = await Task.findById(task._id)
      .populate('assignedBy', 'name email')
      .populate('comments.user', 'name email');
    
    // Handle assignedTo population based on type
    if (updatedTask.assignedTo) {
      if (updatedTask.assignedToType === 'Employee') {
        const Employee = require('../models/Employee');
        const employee = await Employee.findById(updatedTask.assignedTo);
        updatedTask.assignedTo = employee;
      } else {
        const user = await User.findById(updatedTask.assignedTo);
        updatedTask.assignedTo = user;
      }
    }
    
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin/Manager only)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user can delete this task
    if (req.user.role !== 'admin' && 
        (req.user.role !== 'manager' || task.assignedBy.toString() !== req.user.id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    task.isActive = false;
    await task.save();
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user can comment on this task
    if (task.assignedTo.toString() !== req.user.id.toString() && 
        task.assignedBy.toString() !== req.user.id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await task.addComment(req.user.id, comment);
    
    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('comments.user', 'name email');
    
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Upload attachment to task
// @route   POST /api/tasks/:id/attachments
// @access  Private
exports.uploadAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user can modify this task
    if (!task.canModify(req.user.id, req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { name, type, url } = req.body;
    
    task.attachments.push({
      name,
      type,
      url
    });
    
    await task.save();
    
    res.json({ message: 'Attachment uploaded successfully', attachment: task.attachments[task.attachments.length - 1] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete attachment from task
// @route   DELETE /api/tasks/:id/attachments/:attachmentId
// @access  Private
exports.deleteAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user can modify this task
    if (!task.canModify(req.user.id, req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    task.attachments = task.attachments.filter(
      attachment => attachment._id.toString() !== req.params.attachmentId
    );
    
    await task.save();
    
    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
exports.getTaskStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let matchQuery = { isActive: true };
    
    if (userRole === 'employee') {
      matchQuery.assignedTo = userId;
    } else if (userRole === 'manager') {
      matchQuery.$or = [
        { assignedBy: userId },
        { assignedTo: userId }
      ];
    }
    
    const stats = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const overdueTasks = await Task.getOverdueTasks();
    
    const result = {
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      overdue: overdueTasks.length,
      total: stats.reduce((sum, stat) => sum + stat.count, 0)
    };
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send task reminders
// @route   POST /api/tasks/reminders
// @access  Private (Admin/Manager only)
exports.sendReminders = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const overdueTasks = await Task.getOverdueTasks();
    const dueSoonTasks = await Task.find({
      dueDate: { 
        $gte: new Date(), 
        $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
      },
      status: { $nin: ['completed', 'cancelled'] },
      isActive: true
    }).populate('assignedTo', 'name email');
    
    let remindersSent = 0;
    
    // Send overdue reminders
    for (const task of overdueTasks) {
      const emailHtml = `
        <h2>⚠️ Overdue Task Reminder</h2>
        <p><strong>Task:</strong> ${task.title}</p>
        <p><strong>Due Date:</strong> ${task.dueDate.toLocaleDateString()}</p>
        <p><strong>Status:</strong> ${task.status}</p>
        <p>This task is overdue. Please update the status or contact your manager.</p>
      `;
      
      await sendEmailNotification(
        task.assignedTo.email,
        `Overdue Task: ${task.title}`,
        emailHtml
      );
      
      task.notifications.reminderSent = true;
      task.notifications.lastReminderSent = new Date();
      task.notifications.reminderCount += 1;
      await task.save();
      
      remindersSent++;
    }
    
    // Send due soon reminders
    for (const task of dueSoonTasks) {
      const emailHtml = `
        <h2>📅 Task Due Soon</h2>
        <p><strong>Task:</strong> ${task.title}</p>
        <p><strong>Due Date:</strong> ${task.dueDate.toLocaleDateString()}</p>
        <p><strong>Status:</strong> ${task.status}</p>
        <p>This task is due soon. Please review and update if needed.</p>
      `;
      
      await sendEmailNotification(
        task.assignedTo.email,
        `Task Due Soon: ${task.title}`,
        emailHtml
      );
      
      remindersSent++;
    }
    
    res.json({ 
      message: `Reminders sent successfully`, 
      remindersSent,
      overdue: overdueTasks.length,
      dueSoon: dueSoonTasks.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

