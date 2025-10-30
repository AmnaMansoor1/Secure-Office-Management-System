// routes/incomeRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getAllIncome, 
  getIncomeById, 
  createIncome, 
  updateIncome, 
  deleteIncome,
  getIncomeSummaryByCategory,
  getMonthlyIncomeSummary,
  getTopClients
} = require('../controllers/incomeController');
const { protect, checkPermission } = require('../middleware/auth');

// Summary routes
router.get('/summary/category', protect, checkPermission('income', 'view'), getIncomeSummaryByCategory);
router.get('/summary/monthly', protect, checkPermission('income', 'view'), getMonthlyIncomeSummary);
router.get('/summary/clients', protect, checkPermission('income', 'view'), getTopClients);

// Standard CRUD routes
router.route('/')
  .get(protect, checkPermission('income', 'view'), getAllIncome)
  .post(protect, checkPermission('income', 'create'), createIncome);

router.route('/:id')
  .get(protect, checkPermission('income', 'view'), getIncomeById)
  .put(protect, checkPermission('income', 'update'), updateIncome)
  .delete(protect, checkPermission('income', 'delete'), deleteIncome);

module.exports = router;