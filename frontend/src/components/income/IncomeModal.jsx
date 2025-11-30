import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { createIncome, updateIncome, reset } from '../../redux/slices/incomeSlice';

const IncomeModal = ({ show, onHide, income, isEdit, employees }) => {
  const initialFormState = {
    title: '',
    amount: '',
    category: 'Sales',
    date: new Date().toISOString().split('T')[0],
    client: '',
    paymentMethod: 'Bank Transfer',
    receiptNumber: '',
    notes: '',
    receivedBy: '',
    recurring: false,
    recurringPeriod: 'None',
    taxable: true
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [validated, setValidated] = useState(false);
  
  const dispatch = useDispatch();
  const { isLoading, isSuccess } = useSelector((state) => state.income);
  
  // Categories and payment methods from the backend model
  const categories = [
    'Sales', 'Services', 'Investments', 'Rental', 'Refunds', 'Grants', 'Royalties', 'Other'
  ];
  
  const paymentMethods = ['Cash', 'Credit Card', 'Bank Transfer', 'Check', 'Online Payment'];
  const recurringPeriods = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly', 'None'];
  
  useEffect(() => {
    if (income && isEdit) {
      // Format date for the date input
      const formattedDate = income.date 
        ? new Date(income.date).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];
      
      setFormData({
        title: income.title || '',
        amount: income.amount || '',
        category: income.category || 'Sales',
        date: formattedDate,
        client: income.client || '',
        paymentMethod: income.paymentMethod || 'Bank Transfer',
        receiptNumber: income.receiptNumber || '',
        notes: income.notes || '',
        receivedBy: income.receivedBy || '',
        recurring: income.recurring || false,
        recurringPeriod: income.recurringPeriod || 'None',
        taxable: income.taxable !== undefined ? income.taxable : true
      });
    } else {
      setFormData(initialFormState);
    }
    
    setValidated(false);
  }, [income, isEdit, show]);
  
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
    const incomeData = {
      ...formData,
      amount: parseFloat(formData.amount)
    };
    
    if (isEdit) {
      dispatch(updateIncome({ id: income._id, incomeData }));
    } else {
      dispatch(createIncome(incomeData));
    }
  };
  
  return (
    <Modal show={show} onHide={onHide} backdrop="static" size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? 'Edit Income' : 'Add New Income'}</Modal.Title>
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
                <Form.Label>Client</Form.Label>
                <Form.Control 
                  type="text" 
                  name="client"
                  value={formData.client}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            
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
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Receipt Number</Form.Label>
                <Form.Control 
                  type="text" 
                  name="receiptNumber"
                  value={formData.receiptNumber}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Received By</Form.Label>
                <Form.Select 
                  name="receivedBy"
                  value={formData.receivedBy}
                  onChange={handleChange}
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
              <Form.Group className="mb-3 d-flex align-items-center h-100">
                <Form.Check 
                  type="checkbox"
                  label="Recurring Income"
                  name="recurring"
                  checked={formData.recurring}
                  onChange={handleChange}
                  className="mt-4 me-4"
                />
                <Form.Check 
                  type="checkbox"
                  label="Taxable"
                  name="taxable"
                  checked={formData.taxable}
                  onChange={handleChange}
                  className="mt-4"
                />
              </Form.Group>
            </Col>
            
            {formData.recurring && (
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
            )}
          </Row>
          
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

export default IncomeModal;