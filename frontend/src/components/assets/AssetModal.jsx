import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { createAsset, updateAsset, reset } from '../../redux/slices/assetSlice';

const AssetModal = ({ show, onHide, asset, isEdit, employees }) => {
  const initialFormState = {
    name: '',
    category: 'Electronics',
    serialNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: '',
    condition: 'Good',
    assignedTo: '',
    location: '',
    notes: '',
    isActive: true
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [validated, setValidated] = useState(false);
  
  const dispatch = useDispatch();
  const { isLoading, isSuccess } = useSelector((state) => state.assets);
  
  // Categories and conditions from the backend model
  const categories = ['Electronics', 'Furniture', 'Vehicle', 'Office Equipment', 'Software', 'Other'];
  const conditions = ['Excellent', 'Good', 'Fair', 'Poor'];
  
  useEffect(() => {
    if (asset && isEdit) {
      // Format purchaseDate for the date input
      const formattedPurchaseDate = asset.purchaseDate 
        ? new Date(asset.purchaseDate).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];
      
      setFormData({
        name: asset.name || '',
        category: asset.category || 'Electronics',
        serialNumber: asset.serialNumber || '',
        purchaseDate: formattedPurchaseDate,
        purchasePrice: asset.purchasePrice || '',
        condition: asset.condition || 'Good',
        assignedTo: asset.assignedTo || '',
        location: asset.location || '',
        notes: asset.notes || '',
        isActive: asset.isActive !== undefined ? asset.isActive : true
      });
    } else {
      setFormData(initialFormState);
    }
    
    setValidated(false);
  }, [asset, isEdit, show]);
  
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
    
    // Convert price to number
    const assetData = {
      ...formData,
      purchasePrice: parseFloat(formData.purchasePrice)
    };
    
    if (isEdit) {
      dispatch(updateAsset({ id: asset._id, assetData }));
    } else {
      dispatch(createAsset(assetData));
    }
  };
  
  return (
    <Modal show={show} onHide={onHide} backdrop="static" size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? 'Edit Asset' : 'Add New Asset'}</Modal.Title>
      </Modal.Header>
      
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Asset Name</Form.Label>
                <Form.Control 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide an asset name.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            
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
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Serial Number</Form.Label>
                <Form.Control 
                  type="text" 
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Purchase Date</Form.Label>
                <Form.Control 
                  type="date" 
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a purchase date.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Purchase Price (PKR)</Form.Label>
                <Form.Control 
                  type="number" 
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
                <Form.Control.Feedback type="invalid">
                  Please provide a valid purchase price.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Condition</Form.Label>
                <Form.Select 
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                >
                  {conditions.map((condition) => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Assigned To</Form.Label>
                <Form.Select 
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                >
                  <option value="">Unassigned</option>
                  {employees && employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control 
                  type="text" 
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
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
          
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Check 
                  type="checkbox"
                  label="Active"
                  name="isActive"
                  checked={formData.isActive}
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

export default AssetModal;