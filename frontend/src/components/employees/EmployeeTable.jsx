// src/components/employees/EmployeeTable.jsx
import { useEffect, useState } from 'react';
import { Table, Button, Badge, Spinner, Modal, Row, Col, Form, InputGroup, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { getEmployees, deleteEmployee, setEmployee, getEmployeeStats } from '../../redux/slices/employeeSlice';
import EmployeeDocuments from './EmployeeDocuments';

const EmployeeTable = ({ onEdit }) => {
  const dispatch = useDispatch();
  const { employees, isLoading, stats } = useSelector((state) => state.employees);
  const { user } = useSelector((state) => state.auth);
  
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [q, setQ] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');
  
  useEffect(() => {
    // Initial fetch
    dispatch(getEmployees());
    dispatch(getEmployeeStats());
  }, [dispatch]);
  
  const handleSort = (field) => {
    const direction = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
  };
  
  const handleFilter = (e) => {
    e?.preventDefault();
    const params = {};
    if (q) params.q = q;
    if (department) params.department = department;
    if (role) params.role = role;
    if (isActive !== '') params.isActive = isActive;
    dispatch(getEmployees(params));
  };

  const clearFilters = () => {
    setQ('');
    setDepartment('');
    setRole('');
    setIsActive('');
    dispatch(getEmployees());
  };
  
  const sortedEmployees = [...employees].sort((a, b) => {
    if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  const handleEdit = (employee) => {
    dispatch(setEmployee(employee));
    onEdit();
  };
  
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      dispatch(deleteEmployee(id));
    }
  };

  const handleDocuments = (employee) => {
    setSelectedEmployee(employee);
    setShowDocumentsModal(true);
  };

  const handleCloseDocuments = () => {
    setShowDocumentsModal(false);
    setSelectedEmployee(null);
  };
  
  if (isLoading && employees.length === 0) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }
  
  return (
    <>
      {/* Filters and Stats */}
      <Card className="mb-3">
        <Card.Body>
          <Form onSubmit={handleFilter}>
            <Row className="g-2 align-items-end">
              <Col md={4}>
                <Form.Label>Search</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search by name, email, position, department"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                  <Button variant="outline-secondary" onClick={handleFilter}>
                    <i className="bi bi-search"></i>
                  </Button>
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Label>Department</Form.Label>
                <Form.Select value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="">All</option>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                  <option value="Sales">Sales</option>
                  <option value="Executive">Executive</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label>Role</Form.Label>
                <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="">All</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Label>Status</Form.Label>
                <Form.Select value={isActive} onChange={(e) => setIsActive(e.target.value)}>
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Form.Select>
              </Col>
            </Row>
            <Row className="mt-2">
              <Col>
                <div className="d-flex gap-2">
                  <Button type="submit" variant="primary">
                    Apply Filters
                  </Button>
                  <Button type="button" variant="secondary" onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
          <Row className="mt-3">
            <Col md={3}>
              <div className="p-3 bg-light rounded text-center">
                <div className="fw-bold">Total Employees</div>
                <div className="display-6">{stats.total}</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="p-3 bg-light rounded text-center">
                <div className="fw-bold">Admins</div>
                <div className="display-6">{stats.admins}</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="p-3 bg-light rounded text-center">
                <div className="fw-bold">Managers</div>
                <div className="display-6">{stats.managers}</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="p-3 bg-light rounded text-center">
                <div className="fw-bold">Employees</div>
                <div className="display-6">{stats.employees}</div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
              Name
              {sortField === 'name' && (
                <span className="ms-1">
                  {sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </th>
            <th onClick={() => handleSort('position')} style={{ cursor: 'pointer' }}>
              Position
              {sortField === 'position' && (
                <span className="ms-1">
                  {sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </th>
            <th onClick={() => handleSort('department')} style={{ cursor: 'pointer' }}>
              Department
              {sortField === 'department' && (
                <span className="ms-1">
                  {sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </th>
            <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
              Email
              {sortField === 'email' && (
                <span className="ms-1">
                  {sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </th>
            <th onClick={() => handleSort('salary')} style={{ cursor: 'pointer' }}>
              Salary (PKR)
              {sortField === 'salary' && (
                <span className="ms-1">
                  {sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </th>
            <th onClick={() => handleSort('role')} style={{ cursor: 'pointer' }}>
              Role
              {sortField === 'role' && (
                <span className="ms-1">
                  {sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedEmployees.length > 0 ? (
            sortedEmployees.map((employee) => (
              <tr key={employee._id}>
                <td>{employee.name}</td>
                <td>{employee.position}</td>
                <td>{employee.department}</td>
                <td>{employee.email}</td>
                <td>PKR {employee.salary.toLocaleString()}</td>
                <td>
                  <Badge bg={
                    employee.role === 'admin' ? 'danger' : 
                    employee.role === 'manager' ? 'warning' : 
                    'primary'
                  }>
                    {employee.role?.charAt(0).toUpperCase() + employee.role?.slice(1) || 'Employee'}
                  </Badge>
                </td>
                <td>
                  {employee.isActive ? (
                    <Badge bg="success">Active</Badge>
                  ) : (
                    <Badge bg="danger">Inactive</Badge>
                  )}
                </td>
                <td>
                  <div className="d-flex gap-1">
                    {user.permissions.employees.update && (
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => handleEdit(employee)}
                        title="Edit Employee"
                      >
                        <i className="bi bi-pencil-square"></i>
                      </Button>
                    )}
                    
                    <Button 
                      variant="info" 
                      size="sm"
                      onClick={() => handleDocuments(employee)}
                      title="Manage Documents"
                    >
                      <i className="bi bi-file-earmark-text"></i>
                    </Button>
                    
                    {user.permissions.employees.delete && (
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleDelete(employee._id)}
                        title="Delete Employee"
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center">No employees found</td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Documents Modal */}
      <Modal show={showDocumentsModal} onHide={handleCloseDocuments} size="lg">
        <Modal.Body>
          {selectedEmployee && (
            <EmployeeDocuments 
              employee={selectedEmployee} 
              onClose={handleCloseDocuments}
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default EmployeeTable;