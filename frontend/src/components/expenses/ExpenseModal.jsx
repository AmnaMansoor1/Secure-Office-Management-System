import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { createExpense, updateExpense, reset } from '../../redux/slices/expenseSlice';

const ExpenseModal = ({ show, onHide, expense, isEdit, employees }) => {
  const initialFormState = {
    title: '',
    amount: '',
    category: 'Office Supplies',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    receipt: '',
    notes: '',
    approvedBy: '',
    recurring: false,
    recurringPeriod: 'None'
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [validated, setValidated] = useState(false);
  
  const dispatch = useDispatch();
  const { isLoading, isSuccess } = useSelector((state) => state.expenses);
  const { user } = useSelector((state) => state.auth);
  
  // Categories and payment methods from the backend model
  const categories = [
    'Rent', 'Utilities', 'Salaries', 'Office Supplies', 'Equipment', 
    'Marketing', 'Travel', 'Maintenance', 'Insurance', 'Taxes', 'Miscellaneous'
  ];
  
  const paymentMethods = ['Cash', 'Credit Card', 'Bank Transfer', 'Check', 'Online Payment'];
  const recurringPeriods = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly', 'None'];
  
  useEffect(() => {
    if (expense && isEdit) {
      // Format date for the date input
      const formattedDate = expense.date 
        ? new Date(expense.date).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];
      
      setFormData({
        title: expense.title || '',
        amount: expense.amount || '',
        category: expense.category || 'Office Supplies',
        date: formattedDate,
        paymentMethod: expense.paymentMethod || 'Cash',
        receipt: expense.receipt || '',
        notes: expense.notes || '',
        approvedBy: expense.approvedBy || '',
        recurring: expense.recurring || false,
        recurringPeriod: expense.recurringPeriod || 'None'
      });
    } else {
      const myEmployeeId = (user?.employee && typeof user.employee === 'object') ? user.employee._id : user?.employee;
      setFormData({
        ...initialFormState,
        approvedBy: user?.role === 'employee' ? (myEmployeeId || '') : ''
      });
    }
    
    setValidated(false);
  }, [expense, isEdit, show]);
  
  useEffect(() => {
    if (isSuccess && !isLoading) {
      onHide();
      dispatch(reset());
    }
  }, [isSuccess, isLoading, onHide, dispatch]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    // Convert amount to number
    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount)
    };
    
    if (isEdit) {
      dispatch(updateExpense({ id: expense._id, expenseData }));
    } else {
      dispatch(createExpense(expenseData));
    }
  };
  
  return (
    <Modal show={show} onHide={onHide} backdrop="static" size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? 'Edit Expense' : 'Add New Expense'}</Modal.Title>
      </Modal.Header>
      
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a title.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Amount (PKR)</Form.Label>
                <Form.Control 
                  type="number" 
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid amount.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select 
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Date</Form.Label>
                <Form.Control 
                  type="date" 
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a date.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Payment Method</Form.Label>
                <Form.Select 
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  required
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Approved By</Form.Label>
                <Form.Select 
                  name="approvedBy"
                  value={formData.approvedBy}
                  onChange={handleChange}
                  disabled={user?.role === 'employee'}
                >
                  <option value="">Not specified</option>
                  {employees && employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Receipt URL/Reference</Form.Label>
                <Form.Control 
                  type="text" 
                  name="receipt"
                  value={formData.receipt}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
            <Form.Group className="mb-3 d-flex align-items-center h-100">
  <Form.Check 
    type="checkbox"
    label="Recurring Expense"
    name="recurring"
    checked={formData.recurring}
    onChange={handleChange}
    className="mt-4 me-4"
  />
</Form.Group>
            </Col>
          </Row>
          
          {formData.recurring && (
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Recurring Period</Form.Label>
                  <Form.Select 
                    name="recurringPeriod"
                    value={formData.recurringPeriod}
                    onChange={handleChange}
                    required={formData.recurring}
                  >
                    {recurringPeriods.filter(period => period !== 'None').map((period) => (
                      <option key={period} value={period}>{period}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          )}
          
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3}
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner 
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
                <span className="ms-2">Saving...</span>
              </>
            ) : (
              isEdit ? 'Update' : 'Save'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ExpenseModal;
