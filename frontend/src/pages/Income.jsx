import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Spinner, Alert, Badge, Form } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { getIncomes, deleteIncome, reset } from '../redux/slices/incomeSlice';
import { getEmployees } from '../redux/slices/employeeSlice';
import IncomeModal from '../components/income/IncomeModal';
import ConfirmModal from '../components/common/ConfirmModal';

const Income = () => {
  const [showModal, setShowModal] = useState(false);
  const [currentIncome, setCurrentIncome] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  
  const dispatch = useDispatch();
  
  // Updated selector to match your store configuration
  const { incomes, isLoading, isError, isSuccess, message } = useSelector((state) => state.income);
  const { employees } = useSelector((state) => state.employees);
  const { user } = useSelector((state) => state.auth);
  
  // Check permissions
  const canCreate = user?.permissions?.income?.create;
  const canUpdate = user?.permissions?.income?.update;
  const canDelete = user?.permissions?.income?.delete;
  const canViewIncome = user?.role === 'admin' || user?.permissions?.income?.view;
  
  useEffect(() => {
    dispatch(getIncomes());
    dispatch(getEmployees());
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);
  
  useEffect(() => {
    if (isSuccess) {
      closeModal();
    }
  }, [isSuccess]);
  
  const handleAddIncome = () => {
    setCurrentIncome(null);
    setShowModal(true);
  };
  
  const handleEditIncome = (income) => {
    setCurrentIncome(income);
    setShowModal(true);
  };
  
  const handleDeleteIncome = (income) => {
    setIncomeToDelete(income);
    setShowConfirmModal(true);
  };
  
  const confirmDelete = async () => {
    if (!incomeToDelete) return;
    
    dispatch(deleteIncome(incomeToDelete._id));
    setShowConfirmModal(false);
    setIncomeToDelete(null);
  };
  
  const closeModal = () => {
    setShowModal(false);
    setCurrentIncome(null);
  };

  // Helper function to find employee name by ID
  const getEmployeeName = (id) => {
    if (!id) return 'Not specified';
    const employee = employees.find(emp => emp._id === id);
    return employee ? employee.name : 'Unknown';
  };
  
  // Filter incomes based on category and date
  const filteredIncomes = incomes.filter(income => {
    const incomeDate = new Date(income.date);
    const incomeMonth = incomeDate.getMonth() + 1; // JavaScript months are 0-based
    const incomeYear = incomeDate.getFullYear();
    
    const matchesCategory = !filterCategory || income.category === filterCategory;
    const matchesMonth = !filterMonth || incomeMonth === parseInt(filterMonth);
    const matchesYear = !filterYear || incomeYear === parseInt(filterYear);
    
    return matchesCategory && matchesMonth && matchesYear;
  });
  
  // Calculate total income
  const totalIncome = filteredIncomes.reduce((total, income) => total + income.amount, 0);
  
  // Get unique categories for filter
  const categories = [...new Set(incomes.map(income => income.category))];
  
  // Generate months for filter
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];
  
  // Generate years for filter (last 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  
  if (!canViewIncome) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <h2>No Access</h2>
        <p className="text-muted mb-3">You do not have permission to view this page.</p>
        <a href="/profile" className="btn btn-primary">Go to My Profile</a>
      </div>
    );
  }
  
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
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h1>Income</h1>
            {canCreate && (
              <Button variant="primary" onClick={handleAddIncome}>
                <i className="bi bi-plus-circle me-2"></i>Add Income
              </Button>
            )}
          </div>
        </Col>
      </Row>
      
      {isError && (
        <Row>
          <Col>
            <Alert variant="danger">{message}</Alert>
          </Col>
        </Row>
      )}
      
      <Row className="mb-4">
        <Col md={12}>
          <Card className="bg-light">
            <Card.Body>
              <Row>
                <Col md={4} className="mb-3 mb-md-0">
                  <h5>Total: Ksh{totalIncome.toLocaleString()}</h5>
                </Col>
                <Col md={8}>
                  <Row>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Category</Form.Label>
                        <Form.Select 
                          value={filterCategory} 
                          onChange={(e) => setFilterCategory(e.target.value)}
                        >
                          <option value="">All Categories</option>
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Month</Form.Label>
                        <Form.Select 
                          value={filterMonth} 
                          onChange={(e) => setFilterMonth(e.target.value)}
                        >
                          <option value="">All Months</option>
                          {months.map(month => (
                            <option key={month.value} value={month.value}>{month.label}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Year</Form.Label>
                        <Form.Select 
                          value={filterYear} 
                          onChange={(e) => setFilterYear(e.target.value)}
                        >
                          <option value="">All Years</option>
                          {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">Income List</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Client</th>
                      <th>Payment Method</th>
                      <th>Received By</th>
                      <th>Recurring</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncomes.length > 0 ? (
                      filteredIncomes.map((income) => (
                        <tr key={income._id}>
                          <td>{income.title}</td>
                          <td>{income.category}</td>
                          <td>{new Date(income.date).toLocaleDateString()}</td>
                          <td>Ksh{income.amount.toLocaleString()}</td>
                          <td>{income.client || '-'}</td>
                          <td>{income.paymentMethod}</td>
                          <td>{income.receivedBy ? getEmployeeName(income.receivedBy) : '-'}</td>
                          <td>
                            {income.recurring ? (
                              <Badge bg="info">{income.recurringPeriod}</Badge>
                            ) : (
                              <Badge bg="secondary">No</Badge>
                            )}
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              {canUpdate && (
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => handleEditIncome(income)}
                                >
                                  <i className="bi bi-pencil"></i>
                                </Button>
                              )}
                              {canDelete && (
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => handleDeleteIncome(income)}
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
                        <td colSpan="9" className="text-center">No income records found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Income Add/Edit Modal */}
      <IncomeModal
        show={showModal}
        onHide={closeModal}
        income={currentIncome}
        isEdit={!!currentIncome}
        employees={employees}
      />
      
      {/* Confirm Delete Modal */}
      <ConfirmModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
        title="Delete Income"
        message={`Are you sure you want to delete "${incomeToDelete?.title}"? This action cannot be undone.`}
      />
    </Container>
  );
};

export default Income;