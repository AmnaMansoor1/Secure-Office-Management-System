import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Spinner, Alert, Badge, Form } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { getExpenses, deleteExpense, reset } from '../redux/slices/expenseSlice';
import { getEmployees } from '../redux/slices/employeeSlice';
import ExpenseModal from '../components/expenses/ExpenseModal';
import ConfirmModal from '../components/common/ConfirmModal';

const Expenses = () => {
  const [showModal, setShowModal] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  
  const dispatch = useDispatch();
  
  // Updated selector to match your store configuration
  const { expenses, isLoading, isError, isSuccess, message } = useSelector((state) => state.expenses);
  const { employees } = useSelector((state) => state.employees);
  const { user } = useSelector((state) => state.auth);
  
  // Check permissions
  const canCreate = user?.permissions?.expenses?.create;
  const canUpdate = user?.permissions?.expenses?.update;
  const canDelete = user?.permissions?.expenses?.delete;
  const canViewExpenses = user?.role === 'admin' || user?.permissions?.expenses?.view;
  
  useEffect(() => {
    dispatch(getExpenses());
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
  
  const handleAddExpense = () => {
    setCurrentExpense(null);
    setShowModal(true);
  };
  
  const handleEditExpense = (expense) => {
    setCurrentExpense(expense);
    setShowModal(true);
  };
  
  const handleDeleteExpense = (expense) => {
    setExpenseToDelete(expense);
    setShowConfirmModal(true);
  };
  
  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    
    dispatch(deleteExpense(expenseToDelete._id));
    setShowConfirmModal(false);
    setExpenseToDelete(null);
  };
  
  const closeModal = () => {
    setShowModal(false);
    setCurrentExpense(null);
  };

  // Helper function to find employee name by ID
  const getEmployeeName = (id) => {
    if (!id) return 'Not specified';
    const employee = employees.find(emp => emp._id === id);
    return employee ? employee.name : 'Unknown';
  };
  
  // Filter expenses based on category and date
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const expenseMonth = expenseDate.getMonth() + 1; // JavaScript months are 0-based
    const expenseYear = expenseDate.getFullYear();
    
    const matchesCategory = !filterCategory || expense.category === filterCategory;
    const matchesMonth = !filterMonth || expenseMonth === parseInt(filterMonth);
    const matchesYear = !filterYear || expenseYear === parseInt(filterYear);
    
    return matchesCategory && matchesMonth && matchesYear;
  });
  
  // Calculate total expenses
  const totalExpenses = filteredExpenses.reduce((total, expense) => total + expense.amount, 0);
  
  // Get unique categories for filter
  const categories = [...new Set(expenses.map(expense => expense.category))];
  
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
  
  if (!canViewExpenses) {
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
            <h1>Expenses</h1>
            {canCreate && (
              <Button variant="primary" onClick={handleAddExpense}>
                <i className="bi bi-plus-circle me-2"></i>Add Expense
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
                  <h5>Total: PKR{totalExpenses.toLocaleString()}</h5>
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
      
      {/* Expense List Card Section Start */}
      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">Expense List</h5>
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
                      <th>Payment Method</th>
                      <th>Approved By</th>
                      <th>Recurring</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.length > 0 ? (
                      filteredExpenses.map((expense) => (
                        <tr key={expense._id}>
                          <td>{expense.title}</td>
                          <td>{expense.category}</td>
                          <td>{new Date(expense.date).toLocaleDateString()}</td>
                          <td>PKR{expense.amount.toLocaleString()}</td>
                          <td>{expense.paymentMethod}</td>
                          <td>{expense.approvedBy ? getEmployeeName(expense.approvedBy) : '-'}</td>
                          <td>
                            {expense.recurring ? (
                              <Badge bg="info">{expense.recurringPeriod}</Badge>
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
                                  onClick={() => handleEditExpense(expense)}
                                >
                                  <i className="bi bi-pencil"></i>
                                </Button>
                              )}
                              {canDelete && (
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => handleDeleteExpense(expense)}
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
                        <td colSpan="8" className="text-center">No expenses found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {/* Expense List Card Section End */}
      
      {/* Expense Add/Edit Modal */}
      <ExpenseModal
        show={showModal}
        onHide={closeModal}
        expense={currentExpense}
        isEdit={!!currentExpense}
        employees={employees}
      />
      
      {/* Confirm Delete Modal */}
      <ConfirmModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
        title="Delete Expense"
        message={`Are you sure you want to delete "${expenseToDelete?.title}"? This action cannot be undone.`}
      />
    </Container>
  );
};

export default Expenses;