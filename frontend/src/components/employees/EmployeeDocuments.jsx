// src/components/employees/EmployeeDocuments.jsx
import { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { uploadDocument, deleteDocument } from '../../redux/slices/employeeSlice';

const EmployeeDocuments = ({ employee, onClose }) => {
  const [documents, setDocuments] = useState(employee?.documents || []);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    name: '',
    type: '',
    url: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const dispatch = useDispatch();

  useEffect(() => {
    setDocuments(employee?.documents || []);
  }, [employee]);

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // In a real application, you'd handle file upload here
      // For now, we'll simulate document upload
      const newDocument = {
        name: uploadData.name,
        type: uploadData.type,
        url: uploadData.url || `https://example.com/documents/${uploadData.name}`,
        uploadedAt: new Date()
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDocuments(prev => [...prev, newDocument]);
      setUploadData({ name: '', type: '', url: '' });
      setShowUploadModal(false);
      setMessage('Document uploaded successfully');
    } catch (error) {
      setMessage('Error uploading document: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setDocuments(prev => prev.filter(doc => doc._id !== docId));
        setMessage('Document deleted successfully');
      } catch (error) {
        setMessage('Error deleting document: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const getDocumentTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'pdf': return 'danger';
      case 'doc': case 'docx': return 'primary';
      case 'jpg': case 'jpeg': case 'png': return 'success';
      case 'xlsx': case 'xls': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Documents for {employee?.name}</h5>
          <div>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => setShowUploadModal(true)}
              className="me-2"
            >
              <i className="bi bi-plus-circle me-1"></i>
              Upload Document
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {message && (
            <Alert variant={message.includes('Error') ? 'danger' : 'success'} dismissible>
              {message}
            </Alert>
          )}

          {documents.length > 0 ? (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Type</th>
                  <th>Uploaded Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, index) => (
                  <tr key={doc._id || index}>
                    <td>{doc.name}</td>
                    <td>
                      <Badge bg={getDocumentTypeColor(doc.type)}>
                        {doc.type.toUpperCase()}
                      </Badge>
                    </td>
                    <td>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => window.open(doc.url, '_blank')}
                      >
                        <i className="bi bi-eye"></i> View
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(doc._id || index)}
                        disabled={loading}
                      >
                        <i className="bi bi-trash"></i> Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-4">
              <i className="bi bi-file-earmark-text display-4 text-muted"></i>
              <p className="text-muted mt-2">No documents uploaded yet</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpload}>
            <Form.Group className="mb-3">
              <Form.Label>Document Name</Form.Label>
              <Form.Control
                type="text"
                value={uploadData.name}
                onChange={(e) => setUploadData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter document name"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Document Type</Form.Label>
              <Form.Select
                value={uploadData.type}
                onChange={(e) => setUploadData(prev => ({ ...prev, type: e.target.value }))}
                required
              >
                <option value="">Select document type</option>
                <option value="pdf">PDF</option>
                <option value="doc">Word Document</option>
                <option value="xlsx">Excel Spreadsheet</option>
                <option value="jpg">Image (JPG)</option>
                <option value="png">Image (PNG)</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Document URL (Optional)</Form.Label>
              <Form.Control
                type="url"
                value={uploadData.url}
                onChange={(e) => setUploadData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com/document.pdf"
              />
              <Form.Text className="text-muted">
                Leave empty to use a placeholder URL
              </Form.Text>
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                onClick={() => setShowUploadModal(false)}
                className="me-2"
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Uploading...</span>
                  </>
                ) : (
                  'Upload Document'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default EmployeeDocuments;
