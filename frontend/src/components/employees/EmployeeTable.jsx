// src/components/employees/EmployeeTable.jsx
import { useEffect, useState } from 'react';
import { Table, Button, Badge, Spinner, Modal } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { getEmployees, deleteEmployee, setEmployee } from '../../redux/slices/employeeSlice';
import EmployeeDocuments from './EmployeeDocuments';

const EmployeeTable = ({ onEdit }) => {
  const dispatch = useDispatch();
  const { employees, isLoading } = useSelector((state) => state.employees);
  const { user } = useSelector((state) => state.auth);
  
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  useEffect(() => {
    dispatch(getEmployees());
  }, [dispatch]);
  
  const handleSort = (field) => {
    const direction = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
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
  
  if (isLoading) {
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
              Salary
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
                <td>${employee.salary.toLocaleString()}</td>
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