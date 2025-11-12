import { useState } from 'react';
import { Card, Button, Row, Col, Modal } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import EmployeeTable from '../components/employees/EmployeeTable';
import EmployeeForm from '../components/employees/EmployeeForm';
import { setEmployee } from '../redux/slices/employeeSlice';

const Employees = () => {
  const [showModal, setShowModal] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const handleClose = () => {
    setShowModal(false);
    dispatch(setEmployee(null));
  };
  
  const handleShow = () => {
    setShowModal(true);
  };
  
  const handleAdd = () => {
    dispatch(setEmployee(null));
    handleShow();
  };
  
  return (
    <div className="employees-page">
      <Row className="mb-4 align-items-center">
        <Col>
          <h1>Employee Management</h1>
        </Col>
        <Col xs="auto">
          {user.permissions.employees.create && (
            <Button variant="primary" onClick={handleAdd}>
              <i className="bi bi-plus-circle me-2"></i>
              Add Employee
            </Button>
          )}
        </Col>
      </Row>
      
      <Card>
        <Card.Body>
          <EmployeeTable onEdit={handleShow} />
        </Card.Body>
      </Card>
      
      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {!dispatch(setEmployee(null)) ? 'Add Employee' : 'Edit Employee'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <EmployeeForm onClose={handleClose} />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Employees;