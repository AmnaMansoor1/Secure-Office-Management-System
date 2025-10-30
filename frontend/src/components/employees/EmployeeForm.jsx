// src/components/employees/EmployeeForm.jsx
import { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { createEmployee, updateEmployee, reset } from '../../redux/slices/employeeSlice';

const EmployeeForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    department: '',
    email: '',
    phone: '',
    salary: '',
    isActive: true,
    joinDate: new Date().toISOString().split('T')[0],
    role: 'employee',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    skills: [],
    notes: ''
  });
  
  const dispatch = useDispatch();
  const { employee, isLoading, isSuccess } = useSelector((state) => state.employees);
  
  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        position: employee.position || '',
        department: employee.department || '',
        email: employee.email || '',
        phone: employee.phone || '',
        salary: employee.salary || '',
        isActive: employee.isActive !== undefined ? employee.isActive : true,
        joinDate: employee.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        role: employee.role || 'employee',
        address: employee.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        emergencyContact: employee.emergencyContact || {
          name: '',
          relationship: '',
          phone: '',
          email: ''
        },
        skills: employee.skills || [],
        notes: employee.notes || ''
      });
    }
  }, [employee]);
  
  useEffect(() => {
    if (isSuccess) {
      dispatch(reset());
      onClose();
    }
  }, [isSuccess, dispatch, onClose]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested objects (address, emergencyContact)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prevState) => ({
        ...prevState,
        [parent]: {
          ...prevState[parent],
          [child]: value
        }
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
    setFormData((prevState) => ({
      ...prevState,
      skills
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.position.trim()) errors.position = 'Position is required';
    if (!formData.department.trim()) errors.department = 'Department is required';
    if (!formData.salary || formData.salary <= 0) errors.salary = 'Valid salary is required';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    return errors;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      alert('Please fix the following errors:\n' + Object.values(errors).join('\n'));
      return;
    }
    
    const employeeData = {
      ...formData,
      salary: Number(formData.salary)
    };
    
    if (employee) {
      dispatch(updateEmployee({ id: employee._id, employeeData }));
    } else {
      dispatch(createEmployee(employeeData));
    }
  };
  
  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder=""
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder=""
            />
          </Form.Group>
        </Col>
      </Row>
      
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Position</Form.Label>
            <Form.Control
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              required
              placeholder=""
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Department</Form.Label>
            <Form.Select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="">Select Department</option>
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Marketing">Marketing</option>
              <option value="Operations">Operations</option>
              <option value="Sales">Sales</option>
              <option value="Executive">Executive</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Phone</Form.Label>
            <Form.Control
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder=""
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Salary</Form.Label>
            <Form.Control
              type="number"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              required
              min="0"
              step="1000"
              placeholder=""
            />
          </Form.Group>
        </Col>
      </Row>
      
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Join Date</Form.Label>
            <Form.Control
              type="date"
              name="joinDate"
              value={formData.joinDate}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3 mt-4">
            <Form.Check
              type="checkbox"
              name="isActive"
              label="Active Employee"
              checked={formData.isActive}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Role Assignment */}
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Role</Form.Label>
            <Form.Select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Skills (comma-separated)</Form.Label>
            <Form.Control
              type="text"
              name="skills"
              value={formData.skills.join(', ')}
              onChange={handleSkillsChange}
              placeholder="e.g., JavaScript, React, Project Management"
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Address Section */}
      <h6 className="mt-4 mb-3">Address Information</h6>
      <Row>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>Street Address</Form.Label>
            <Form.Control
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
              placeholder="123 Main Street"
            />
          </Form.Group>
        </Col>
      </Row>
      
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>City</Form.Label>
            <Form.Control
              type="text"
              name="address.city"
              value={formData.address.city}
              onChange={handleChange}
              placeholder="City"
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>State</Form.Label>
            <Form.Control
              type="text"
              name="address.state"
              value={formData.address.state}
              onChange={handleChange}
              placeholder="State"
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Zip Code</Form.Label>
            <Form.Control
              type="text"
              name="address.zipCode"
              value={formData.address.zipCode}
              onChange={handleChange}
              placeholder="12345"
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Emergency Contact Section */}
      <h6 className="mt-4 mb-3">Emergency Contact</h6>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Contact Name</Form.Label>
            <Form.Control
              type="text"
              name="emergencyContact.name"
              value={formData.emergencyContact.name}
              onChange={handleChange}
              placeholder="Emergency contact name"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Relationship</Form.Label>
            <Form.Control
              type="text"
              name="emergencyContact.relationship"
              value={formData.emergencyContact.relationship}
              onChange={handleChange}
              placeholder="e.g., Spouse, Parent, Sibling"
            />
          </Form.Group>
        </Col>
      </Row>
      
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Emergency Phone</Form.Label>
            <Form.Control
              type="text"
              name="emergencyContact.phone"
              value={formData.emergencyContact.phone}
              onChange={handleChange}
              placeholder="Emergency contact phone"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Emergency Email</Form.Label>
            <Form.Control
              type="email"
              name="emergencyContact.email"
              value={formData.emergencyContact.email}
              onChange={handleChange}
              placeholder="Emergency contact email"
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Notes Section */}
      <Row>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes about the employee..."
            />
          </Form.Group>
        </Col>
      </Row>
      
      <div className="d-flex justify-content-end">
        <Button variant="secondary" onClick={onClose} className="me-2">
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span className="ms-2">Saving...</span>
            </>
          ) : (
            employee ? 'Update Employee' : 'Add Employee'
          )}
        </Button>
      </div>
    </Form>
  );
};

export default EmployeeForm;