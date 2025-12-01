// controllers/incomeController.js
const Income = require('../models/Income');

// @desc    Get all income entries
// @route   GET /api/income
// @access  Public
exports.getAllIncome = async (req, res) => {
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
    
    // Filter by client if provided
    if (req.query.client) {
      filter.client = { $regex: req.query.client, $options: 'i' }; // Case-insensitive search
    }
    
    const incomeEntries = await Income.find(filter)
      .populate('receivedBy', 'name')
      .sort({ date: -1 });
    
    // Calculate total if requested
    if (req.query.calculateTotal === 'true') {
      const total = incomeEntries.reduce((sum, income) => sum + income.amount, 0);
      return res.json({
        count: incomeEntries.length,
        total,
        incomeEntries
      });
    }
    
    res.json(incomeEntries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get income by ID
// @route   GET /api/income/:id
// @access  Public
exports.getIncomeById = async (req, res) => {
  try {
    const income = await Income.findById(req.params.id)
      .populate('receivedBy', 'name');
    
    if (!income) {
      return res.status(404).json({ message: 'Income entry not found' });
    }
    
    res.json(income);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new income entry
// @route   POST /api/income
// @access  Public
exports.createIncome = async (req, res) => {
  try {
    const newIncome = new Income(req.body);
    const savedIncome = await newIncome.save();
    res.status(201).json(savedIncome);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update an income entry
// @route   PUT /api/income/:id
// @access  Public
exports.updateIncome = async (req, res) => {
  try {
    const updatedIncome = await Income.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedIncome) {
      return res.status(404).json({ message: 'Income entry not found' });
    }
    
    res.json(updatedIncome);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an income entry
// @route   DELETE /api/income/:id
// @access  Public
exports.deleteIncome = async (req, res) => {
  try {
    const deletedIncome = await Income.findByIdAndDelete(req.params.id);
    
    if (!deletedIncome) {
      return res.status(404).json({ message: 'Income entry not found' });
    }
    
    res.json({ message: 'Income entry removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get income summary by category
// @route   GET /api/income/summary/category
// @access  Public
exports.getIncomeSummaryByCategory = async (req, res) => {
  try {
    // Filter by date range if provided
    const matchStage = {};
    if (req.query.startDate && req.query.endDate) {
      matchStage.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    const summary = await Income.aggregate([
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

// @desc    Get monthly income totals for the past year
// @route   GET /api/income/summary/monthly
// @access  Public
exports.getMonthlyIncomeSummary = async (req, res) => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const summary = await Income.aggregate([
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

// @desc    Get top clients by income
// @route   GET /api/income/summary/clients
// @access  Public
exports.getTopClients = async (req, res) => {
  try {
    // Filter by date range if provided
    const matchStage = {};
    if (req.query.startDate && req.query.endDate) {
      matchStage.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Only include records with client information
    matchStage.client = { $exists: true, $ne: '' };
    
    const limit = parseInt(req.query.limit) || 10;
    
    const topClients = await Income.aggregate([
      { $match: matchStage },
      { 
        $group: {
          _id: '$client',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          lastTransaction: { $max: '$date' }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: limit }
    ]);
    
    res.json(topClients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
