import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Spinner, Alert, Form, Badge } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { getAssets, deleteAsset, reset } from '../redux/slices/assetSlice';
import { getEmployees } from '../redux/slices/employeeSlice';
import AssetModal from '../components/assets/AssetModal';
import ConfirmModal from '../components/common/ConfirmModal';

const Assets = () => {
  const [showModal, setShowModal] = useState(false);
  const [currentAsset, setCurrentAsset] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');

  const dispatch = useDispatch();
  const { assets, isLoading, isError, isSuccess, message } = useSelector((state) => state.assets);
  const { employees } = useSelector((state) => state.employees);
  const { user } = useSelector((state) => state.auth);

  // Permissions (customize as needed)
  const canCreate = user?.permissions?.assets?.create;
  const canUpdate = user?.permissions?.assets?.update;
  const canDelete = user?.permissions?.assets?.delete;

  useEffect(() => {
    dispatch(getAssets());
    dispatch(getEmployees());
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  const handleAddAsset = () => {
    setCurrentAsset(null);
    setShowModal(true);
  };

  const handleEditAsset = (asset) => {
    setCurrentAsset(asset);
    setShowModal(true);
  };

  const handleDeleteAsset = (asset) => {
    setAssetToDelete(asset);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!assetToDelete) return;
    dispatch(deleteAsset(assetToDelete._id));
    setShowConfirmModal(false);
    setAssetToDelete(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentAsset(null);
  };

  // Helper to get employee name by ID
  const getEmployeeName = (id) => {
    if (!id) return 'Unassigned';
    const employee = employees.find(emp => emp._id === id);
    return employee ? employee.name : 'Unknown';
  };

  // Filter assets by category
  const filteredAssets = assets.filter(asset => {
    const matchesCategory = !filterCategory || asset.category === filterCategory;
    return matchesCategory;
  });

  // Get unique categories for filter
  const categories = [...new Set(assets.map(asset => asset.category))];

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
            <h1>Assets</h1>
            {canCreate && (
              <Button variant="primary" onClick={handleAddAsset}>
                <i className="bi bi-plus-circle me-2"></i>Add Asset
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
        <Col md={6} lg={4}>
          <Card className="bg-light">
            <Card.Body>
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
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Asset List</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Serial Number</th>
                      <th>Purchase Date</th>
                      <th>Purchase Price</th>
                      <th>Condition</th>
                      <th>Assigned To</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.length > 0 ? (
                      filteredAssets.map((asset) => (
                        <tr key={asset._id}>
                          <td>{asset.name}</td>
                          <td>{asset.category}</td>
                          <td>{asset.serialNumber}</td>
                          <td>{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}</td>
                          <td>${asset.purchasePrice?.toLocaleString()}</td>
                          <td>{asset.condition}</td>
                          <td>{getEmployeeName(asset.assignedTo)}</td>
                          <td>{asset.location}</td>
                          <td>
                            {asset.isActive ? (
                              <Badge bg="success">Active</Badge>
                            ) : (
                              <Badge bg="secondary">Inactive</Badge>
                            )}
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              {canUpdate && (
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => handleEditAsset(asset)}
                                >
                                  <i className="bi bi-pencil"></i>
                                </Button>
                              )}
                              {canDelete && (
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => handleDeleteAsset(asset)}
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
                        <td colSpan="10" className="text-center">No assets found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Asset Add/Edit Modal */}
      <AssetModal
        show={showModal}
        onHide={closeModal}
        asset={currentAsset}
        isEdit={!!currentAsset}
        employees={employees}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
        title="Delete Asset"
        message={`Are you sure you want to delete "${assetToDelete?.name}"? This action cannot be undone.`}
      />
    </Container>
  );
};

export default Assets;
