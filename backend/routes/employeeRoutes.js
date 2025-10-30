// routes/employeeRoutes.js (updated with auth)
const express = require('express');
const router = express.Router();
const { 
  getEmployees, 
  getEmployeeById, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee,
  uploadDocument,
  deleteDocument,
  updateRole
} = require('../controllers/employeeController');
const { protect, checkPermission } = require('../middleware/auth');

// Apply protection and permission checks
router.route('/')
  .get(protect, checkPermission('employees', 'view'), getEmployees)
  .post(protect, checkPermission('employees', 'create'), createEmployee);

router.route('/:id')
  .get(protect, checkPermission('employees', 'view'), getEmployeeById)
  .put(protect, checkPermission('employees', 'update'), updateEmployee)
  .delete(protect, checkPermission('employees', 'delete'), deleteEmployee);

// Document management routes
router.route('/:id/documents')
  .post(protect, checkPermission('employees', 'update'), uploadDocument);

router.route('/:id/documents/:docId')
  .delete(protect, checkPermission('employees', 'update'), deleteDocument);

// Role management route
router.route('/:id/role')
  .put(protect, checkPermission('employees', 'update'), updateRole);

module.exports = router;