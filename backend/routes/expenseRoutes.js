// routes/expenseRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getExpenses, 
  getExpenseById, 
  createExpense, 
  updateExpense, 
  deleteExpense,
  getExpenseSummaryByCategory,
  getMonthlyExpenseSummary
} = require('../controllers/expenseController');
const { protect, checkPermission } = require('../middleware/auth');

// Summary routes
router.get('/summary/category', protect, checkPermission('expenses', 'view'), getExpenseSummaryByCategory);
router.get('/summary/monthly', protect, checkPermission('expenses', 'view'), getMonthlyExpenseSummary);

// Standard CRUD routes
router.route('/')
  .get(protect, checkPermission('expenses', 'view'), getExpenses)
  .post(protect, checkPermission('expenses', 'create'), createExpense);

router.route('/:id')
  .get(protect, checkPermission('expenses', 'view'), getExpenseById)
  .put(protect, checkPermission('expenses', 'update'), updateExpense)
  .delete(protect, checkPermission('expenses', 'delete'), deleteExpense);

module.exports = router;