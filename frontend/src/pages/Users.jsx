import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Spinner, Alert, Badge, Form } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import api from '../services/api';
import UserModal from '../components/users/UserModal';
import ConfirmModal from '../components/common/ConfirmModal';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [filterRole, setFilterRole] = useState('');
  
  const { user } = useSelector((state) => state.auth);
  
  // Check if current user is admin
  const isAdmin = user && user.role === 'admin';
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/users');
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load users: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddUser = () => {
    setCurrentUser(null);
    setShowModal(true);
  };
  
  const handleEditUser = (user) => {
    setCurrentUser(user);
    setShowModal(true);
  };
  
  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowConfirmModal(true);
  };
  
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await api.delete(`/auth/users/${userToDelete._id}`);
      setUsers(users.filter(u => u._id !== userToDelete._id));
      setShowConfirmModal(false);
      setUserToDelete(null);
    } catch (err) {
      setError('Failed to delete user: ' + (err.response?.data?.message || err.message));
    }
  };
  
  const handleUserUpdated = (updatedUser) => {
    setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
  };
  
  const handleUserCreated = (newUser) => {
    setUsers([...users, newUser]);
  };
  
  const handleStatusChange = async (userId, isActive) => {
    try {
      const response = await api.put(`/auth/users/${userId}/status`, { isActive });
      setUsers(users.map(u => u._id === userId ? { ...u, isActive: response.data.isActive } : u));
    } catch (err) {
      setError('Failed to update user status: ' + (err.response?.data?.message || err.message));
    }
  };
  
  // Filter users based on role
  const filteredUsers = filterRole 
    ? users.filter(user => user.role === filterRole)
    : users;
  
  if (!isAdmin) {
    return (
      <Container>
        <Alert variant="danger">
          You do not have permission to access this page. Only administrators can manage users.
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h1>User Management</h1>
            <Button variant="primary" onClick={handleAddUser}>
              <i className="bi bi-plus-circle me-2"></i>Add User
            </Button>
          </div>
        </Col>
      </Row>
      
      {error && (
        <Row>
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          </Col>
        </Row>
      )}
      
      <Row className="mb-4">
        <Col>
          <Card className="bg-light">
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Filter by Role</Form.Label>
                    <Form.Select 
                      value={filterRole} 
                      onChange={(e) => setFilterRole(e.target.value)}
                    >
                      <option value="">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="employee">Employee</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={8} className="d-flex align-items-center">
                  <div className="ms-auto mt-3">
                    <Badge bg="primary" className="me-2">Total Users: {users.length}</Badge>
                    <Badge bg="success" className="me-2">Active: {users.filter(u => u.isActive).length}</Badge>
                    <Badge bg="danger">Inactive: {users.filter(u => !u.isActive).length}</Badge>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Users List</h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center my-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <tr key={user._id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                              <Badge 
                                bg={
                                  user.role === 'admin' ? 'danger' : 
                                  user.role === 'manager' ? 'warning' : 'info'
                                }
                              >
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </Badge>
                            </td>
                            <td>
                              <Form.Check 
                                type="switch"
                                checked={user.isActive}
                                onChange={(e) => handleStatusChange(user._id, e.target.checked)}
                                label={user.isActive ? "Active" : "Inactive"}
                              />
                            </td>
                            <td>
                              {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                            </td>
                            <td>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                >
                                  <i className="bi bi-pencil"></i>
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => handleDeleteUser(user)}
                                  disabled={user._id === currentUser?._id}
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center">No users found</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* User Add/Edit Modal */}
      <UserModal
        show={showModal}
        onHide={() => setShowModal(false)}
        user={currentUser}
        isEdit={!!currentUser}
        onUserCreated={handleUserCreated}
        onUserUpdated={handleUserUpdated}
      />
      
      {/* Confirm Delete Modal */}
      <ConfirmModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
      />
    </Container>
  );
};

export default Users;