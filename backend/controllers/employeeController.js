// controllers/employeeController.js
const Employee = require('../models/Employee');

// @desc    Get all employees (with search & filters)
// @route   GET /api/employees
// @access  Public
exports.getEmployees = async (req, res) => {
  try {
    const { q, department, role, isActive } = req.query;

    const filter = {};
    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { position: regex },
        { department: regex }
      ];
    }
    if (department) {
      filter.department = department;
    }
    if (role) {
      filter.role = role;
    }
    if (typeof isActive !== 'undefined') {
      filter.isActive = isActive === 'true';
    }

    const employees = await Employee.find(filter);
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Public
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new employee
// @route   POST /api/employees
// @access  Public
exports.createEmployee = async (req, res) => {
  try {
    const newEmployee = new Employee(req.body);
    const savedEmployee = await newEmployee.save();
    res.status(201).json(savedEmployee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update an employee
// @route   PUT /api/employees/:id
// @access  Public
exports.updateEmployee = async (req, res) => {
  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(updatedEmployee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an employee
// @route   DELETE /api/employees/:id
// @access  Public
exports.deleteEmployee = async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    
    if (!deletedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json({ message: 'Employee removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload document for employee
// @route   POST /api/employees/:id/documents
// @access  Private
exports.uploadDocument = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // In a real application, you'd handle file upload here
    // For now, we'll simulate document upload
    const { name, type, url } = req.body;
    
    employee.documents.push({
      name,
      type,
      url,
      uploadedAt: new Date()
    });
    
    await employee.save();
    
    res.json({ message: 'Document uploaded successfully', document: employee.documents[employee.documents.length - 1] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete document for employee
// @route   DELETE /api/employees/:id/documents/:docId
// @access  Private
exports.deleteDocument = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    employee.documents = employee.documents.filter(doc => doc._id.toString() !== req.params.docId);
    await employee.save();
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update employee role
// @route   PUT /api/employees/:id/role
// @access  Private
exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['admin', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json({ message: 'Role updated successfully', employee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get employee statistics
// @route   GET /api/employees/stats
// @access  Private
exports.getEmployeeStats = async (req, res) => {
  try {
    const total = await Employee.countDocuments();
    const admins = await Employee.countDocuments({ role: 'admin' });
    const managers = await Employee.countDocuments({ role: 'manager' });
    const employees = await Employee.countDocuments({ role: 'employee' });

    res.json({ total, admins, managers, employees });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};