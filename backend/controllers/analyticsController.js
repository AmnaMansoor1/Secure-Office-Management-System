// controllers/analyticsController.js
const Employee = require('../models/Employee');
const Asset = require('../models/Asset');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const mongoose = require('mongoose');

// @desc    Get dashboard summary
// @route   GET /api/analytics/dashboard
// @access  Public
exports.getDashboardSummary = async (req, res) => {
  try {
    // Get counts
    const employeeCount = await Employee.countDocuments({ isActive: true });
    const assetCount = await Asset.countDocuments({ isActive: true });
    
    // Get financial summary for current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Get total expenses for current month
    const expenseTotal = await Expense.aggregate([
      { 
        $match: { 
          date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' } 
        } 
      }
    ]);
    
    // Get total income for current month
    const incomeTotal = await Income.aggregate([
      { 
        $match: { 
          date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' } 
        } 
      }
    ]);
    
    // Calculate profit/loss
    const monthlyExpense = expenseTotal.length > 0 ? expenseTotal[0].total : 0;
    const monthlyIncome = incomeTotal.length > 0 ? incomeTotal[0].total : 0;
    const profit = monthlyIncome - monthlyExpense;
    
    // Recent activities (last 5 of each type)
    const recentEmployees = await Employee.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name position department createdAt');
      
    const recentAssets = await Asset.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name category purchaseDate purchasePrice condition');
      
    const recentExpenses = await Expense.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title amount category date');
      
    const recentIncome = await Income.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title amount category date client');
      
    // Return dashboard data
    res.json({
      counts: {
        employees: employeeCount,
        assets: assetCount
      },
      financialSummary: {
        currentMonth: {
          month: now.getMonth() + 1, // JavaScript months are 0-indexed
          year: now.getFullYear(),
          income: monthlyIncome,
          expenses: monthlyExpense,
          profit: profit
        }
      },
      recentActivity: {
        employees: recentEmployees,
        assets: recentAssets,
        expenses: recentExpenses,
        income: recentIncome
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get financial overview
// @route   GET /api/analytics/financial-overview
// @access  Public
exports.getFinancialOverview = async (req, res) => {
  try {
    // Get date range params or set defaults (last year)
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    
    // Default to 12 months before end date if not specified
    let startDate;
    if (req.query.startDate) {
      startDate = new Date(req.query.startDate);
    } else {
      startDate = new Date(endDate);
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    // Get monthly data for expenses
    const monthlyExpenses = await Expense.aggregate([
      { 
        $match: { 
          date: { $gte: startDate, $lte: endDate } 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Get monthly data for income
    const monthlyIncome = await Income.aggregate([
      { 
        $match: { 
          date: { $gte: startDate, $lte: endDate } 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Get expense breakdown by category
    const expensesByCategory = await Expense.aggregate([
      { 
        $match: { 
          date: { $gte: startDate, $lte: endDate } 
        } 
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
    
    // Get income breakdown by category
    const incomeByCategory = await Income.aggregate([
      { 
        $match: { 
          date: { $gte: startDate, $lte: endDate } 
        } 
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
    
    // Calculate totals
    const totalExpenses = expensesByCategory.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalIncome = incomeByCategory.reduce((sum, item) => sum + item.totalAmount, 0);
    const netProfit = totalIncome - totalExpenses;
    
    // Format the monthly data for easier consumption
    const formattedMonthlyData = [];
    
    // Create array of all months in the range
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      // Find expense and income for this month
      const expense = monthlyExpenses.find(e => 
        e._id.year === year && e._id.month === month
      );
      
      const income = monthlyIncome.find(i => 
        i._id.year === year && i._id.month === month
      );
      
      formattedMonthlyData.push({
        year,
        month,
        expenses: expense ? expense.totalAmount : 0,
        income: income ? income.totalAmount : 0,
        profit: (income ? income.totalAmount : 0) - (expense ? expense.totalAmount : 0)
      });
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    res.json({
      summary: {
        startDate,
        endDate,
        totalIncome,
        totalExpenses,
        netProfit,
        profitMargin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0
      },
      monthlyData: formattedMonthlyData,
      expensesByCategory,
      incomeByCategory
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get employee analytics
// @route   GET /api/analytics/employees
// @access  Public
exports.getEmployeeAnalytics = async (req, res) => {
  try {
    // Get basic employee stats
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ isActive: true });
    
    // Get department breakdown
    const departmentBreakdown = await Employee.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          averageSalary: { $avg: '$salary' },
          totalSalary: { $sum: '$salary' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get position breakdown
    const positionBreakdown = await Employee.aggregate([
      {
        $group: {
          _id: '$position',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }  // Top 10 positions
    ]);
    
    // Get salary statistics
    const salaryStats = await Employee.aggregate([
      {
        $group: {
          _id: null,
          averageSalary: { $avg: '$salary' },
          minSalary: { $min: '$salary' },
          maxSalary: { $max: '$salary' },
          totalSalary: { $sum: '$salary' }
        }
      }
    ]);
    
    // Get join date statistics (employees by year)
    const joinDateStats = await Employee.aggregate([
      {
        $group: {
          _id: { $year: '$joinDate' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    res.json({
      overview: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees: totalEmployees - activeEmployees,
        ...salaryStats[0]
      },
      departmentBreakdown,
      positionBreakdown,
      joinDateStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get asset analytics
// @route   GET /api/analytics/assets
// @access  Public
exports.getAssetAnalytics = async (req, res) => {
  try {
    // Get basic asset stats
    const totalAssets = await Asset.countDocuments();
    const activeAssets = await Asset.countDocuments({ isActive: true });
    
    // Get category breakdown
    const categoryBreakdown = await Asset.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: '$purchasePrice' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get condition breakdown
    const conditionBreakdown = await Asset.aggregate([
      {
        $group: {
          _id: '$condition',
          count: { $sum: 1 },
          totalValue: { $sum: '$purchasePrice' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get asset value statistics
    const valueStats = await Asset.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$purchasePrice' },
          averageValue: { $avg: '$purchasePrice' },
          minValue: { $min: '$purchasePrice' },
          maxValue: { $max: '$purchasePrice' }
        }
      }
    ]);
    
    // Get purchase date statistics (assets by year)
    const purchaseDateStats = await Asset.aggregate([
      {
        $group: {
          _id: { $year: '$purchaseDate' },
          count: { $sum: 1 },
          totalValue: { $sum: '$purchasePrice' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    // Get assigned vs unassigned assets
    const assignedAssets = await Asset.countDocuments({ assignedTo: { $exists: true, $ne: null } });
    
    res.json({
      overview: {
        totalAssets,
        activeAssets,
        inactiveAssets: totalAssets - activeAssets,
        assignedAssets,
        unassignedAssets: totalAssets - assignedAssets,
        ...valueStats[0]
      },
      categoryBreakdown,
      conditionBreakdown,
      purchaseDateStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get comparative analytics
// @route   GET /api/analytics/comparative
// @access  Public
exports.getComparativeAnalytics = async (req, res) => {
  try {
    // Get date range params
    const currentEndDate = req.query.currentEndDate ? new Date(req.query.currentEndDate) : new Date();
    const currentStartDate = req.query.currentStartDate ? new Date(req.query.currentStartDate) : new Date(currentEndDate.getFullYear(), currentEndDate.getMonth() - 11, 1); // Default: last 12 months
    
    // Calculate the previous period with the same duration
    const periodDuration = currentEndDate - currentStartDate;
    const previousEndDate = new Date(currentStartDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setTime(previousEndDate.getTime() - periodDuration);
    
    // Get current period income total
    const currentIncome = await Income.aggregate([
      { 
        $match: { 
          date: { $gte: currentStartDate, $lte: currentEndDate } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' } 
        } 
      }
    ]);
    
    // Get current period expense total
    const currentExpenses = await Expense.aggregate([
      { 
        $match: { 
          date: { $gte: currentStartDate, $lte: currentEndDate } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' } 
        } 
      }
    ]);
    
    // Get previous period income total
    const previousIncome = await Income.aggregate([
      { 
        $match: { 
          date: { $gte: previousStartDate, $lte: previousEndDate } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' } 
        } 
      }
    ]);
    
    // Get previous period expense total
    const previousExpenses = await Expense.aggregate([
      { 
        $match: { 
          date: { $gte: previousStartDate, $lte: previousEndDate } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' } 
        } 
      }
    ]);
    
    // Calculate metrics
    const currentIncomeTotal = currentIncome.length > 0 ? currentIncome[0].total : 0;
    const currentExpenseTotal = currentExpenses.length > 0 ? currentExpenses[0].total : 0;
    const previousIncomeTotal = previousIncome.length > 0 ? previousIncome[0].total : 0;
    const previousExpenseTotal = previousExpenses.length > 0 ? previousExpenses[0].total : 0;
    
    const currentProfit = currentIncomeTotal - currentExpenseTotal;
    const previousProfit = previousIncomeTotal - previousExpenseTotal;
    
    // Calculate percentage changes
    const incomeChange = previousIncomeTotal > 0 
      ? ((currentIncomeTotal - previousIncomeTotal) / previousIncomeTotal) * 100 
      : currentIncomeTotal > 0 ? 100 : 0;
      
    const expenseChange = previousExpenseTotal > 0 
      ? ((currentExpenseTotal - previousExpenseTotal) / previousExpenseTotal) * 100 
      : currentExpenseTotal > 0 ? 100 : 0;
      
    const profitChange = previousProfit > 0 
      ? ((currentProfit - previousProfit) / previousProfit) * 100 
      : currentProfit > 0 ? 100 : 0;
    
    // Get expense comparison by category
    const currentExpensesByCategory = await Expense.aggregate([
      { 
        $match: { 
          date: { $gte: currentStartDate, $lte: currentEndDate } 
        } 
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const previousExpensesByCategory = await Expense.aggregate([
      { 
        $match: { 
          date: { $gte: previousStartDate, $lte: previousEndDate } 
        } 
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    // Get income comparison by category
    const currentIncomeByCategory = await Income.aggregate([
      { 
        $match: { 
          date: { $gte: currentStartDate, $lte: currentEndDate } 
        } 
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const previousIncomeByCategory = await Income.aggregate([
      { 
        $match: { 
          date: { $gte: previousStartDate, $lte: previousEndDate } 
        } 
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    res.json({
      currentPeriod: {
        startDate: currentStartDate,
        endDate: currentEndDate,
        income: currentIncomeTotal,
        expenses: currentExpenseTotal,
        profit: currentProfit
      },
      previousPeriod: {
        startDate: previousStartDate,
        endDate: previousEndDate,
        income: previousIncomeTotal,
        expenses: previousExpenseTotal,
        profit: previousProfit
      },
      changes: {
        income: {
          value: currentIncomeTotal - previousIncomeTotal,
          percentage: incomeChange
        },
        expenses: {
          value: currentExpenseTotal - previousExpenseTotal,
          percentage: expenseChange
        },
        profit: {
          value: currentProfit - previousProfit,
          percentage: profitChange
        }
      },
      expensesByCategory: {
        current: currentExpensesByCategory,
        previous: previousExpensesByCategory
      },
      incomeByCategory: {
        current: currentIncomeByCategory,
        previous: previousIncomeByCategory
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};