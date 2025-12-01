// controllers/expenseController.js
const Expense = require('../models/Expense');
const User = require('../models/User');
const Employee = require('../models/Employee');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Public
exports.getExpenses = async (req, res) => {
  try {
    // Add filtering options
    const filter = {};
    
    // Filter by category if provided
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    const expenses = await Expense.find(filter)
      .populate('approvedBy', 'name')
      .sort({ date: -1 });
    
    // Calculate total if requested
    if (req.query.calculateTotal === 'true') {
      const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      return res.json({
        count: expenses.length,
        total,
        expenses
      });
    }
    
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get expense by ID
// @route   GET /api/expenses/:id
// @access  Public
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('approvedBy', 'name');
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private (expenses.create)
exports.createExpense = async (req, res) => {
  try {
    const body = { ...req.body };

    // Sanitize empty approvedBy values
    if (typeof body.approvedBy === 'string' && body.approvedBy.trim() === '') {
      delete body.approvedBy;
    }

    // If employee is creating the expense, force approvedBy to their employee id
    if (req.user && req.user.role === 'employee') {
      let employeeId = req.user.employee;
      if (!employeeId && req.user.email) {
        const emp = await Employee.findOne({ email: req.user.email });
        if (emp) employeeId = emp._id;
      }
      if (!employeeId) {
        const linkedUser = await User.findById(req.user._id);
        const createdEmp = await Employee.create({
          name: linkedUser?.name || 'Employee',
          email: linkedUser?.email || '',
          position: 'Employee',
          department: 'General',
          salary: 0,
          isActive: true,
          joinDate: new Date()
        });
        employeeId = createdEmp._id;
        if (linkedUser) {
          linkedUser.employee = employeeId;
          await linkedUser.save({ validateBeforeSave: false });
        }
      }
      body.approvedBy = employeeId;
    }

    const created = await Expense.create(body);
    const populated = await Expense.findById(created._id).populate('approvedBy', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private (expenses.update)
exports.updateExpense = async (req, res) => {
  try {
    const update = { ...req.body };
    // Sanitize empty approvedBy values
    if (typeof update.approvedBy === 'string' && update.approvedBy.trim() === '') {
      delete update.approvedBy;
    }
    // If employee is updating, keep approvedBy tied to their own employee id
    if (req.user && req.user.role === 'employee') {
      let employeeId = req.user.employee;
      if (!employeeId && req.user.email) {
        const emp = await Employee.findOne({ email: req.user.email });
        if (emp) employeeId = emp._id;
      }
      if (!employeeId) {
        const linkedUser = await User.findById(req.user._id);
        const createdEmp = await Employee.create({
          name: linkedUser?.name || 'Employee',
          email: linkedUser?.email || '',
          position: 'Employee',
          department: 'General',
          salary: 0,
          isActive: true,
          joinDate: new Date()
        });
        employeeId = createdEmp._id;
        if (linkedUser) {
          linkedUser.employee = employeeId;
          await linkedUser.save({ validateBeforeSave: false });
        }
      }
      update.approvedBy = employeeId;
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    
    if (!updatedExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.json(updatedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Public
exports.deleteExpense = async (req, res) => {
  try {
    const deletedExpense = await Expense.findByIdAndDelete(req.params.id);
    
    if (!deletedExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.json({ message: 'Expense removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get expense summary by category
// @route   GET /api/expenses/summary/category
// @access  Public
exports.getExpenseSummaryByCategory = async (req, res) => {
  try {
    // Filter by date range if provided
    const matchStage = {};
    if (req.query.startDate && req.query.endDate) {
      matchStage.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    const summary = await Expense.aggregate([
      { $match: matchStage },
      { 
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get monthly expense totals for the past year
// @route   GET /api/expenses/summary/monthly
// @access  Public
exports.getMonthlyExpenseSummary = async (req, res) => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const summary = await Expense.aggregate([
      { $match: { date: { $gte: oneYearAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Format the response to be more user-friendly
    const formattedSummary = summary.map(item => ({
      year: item._id.year,
      month: item._id.month,
      totalAmount: item.totalAmount,
      count: item.count
    }));
    
    res.json(formattedSummary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
