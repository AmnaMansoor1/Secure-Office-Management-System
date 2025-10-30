import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import authService from '../services/authService';
import { login } from '../redux/slices/authSlice';
import MFAManagement from '../components/auth/MFAManagement';
import MFASetup from '../components/auth/MFASetup';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    currentPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordShown, setPasswordShown] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        currentPassword: ''
      });
      
      // Fetch complete user data including MFA status
      fetchUserData();
    }
  }, [user]);
  
  const fetchUserData = async () => {
    try {
      const userProfile = await authService.getProfile();
      setUserData(userProfile);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleDisableMFA = async () => {
    if (window.confirm('Are you sure you want to disable MFA? This will make your account less secure.')) {
      try {
        setLoading(true);
        await authService.disableMFA();
        setMessage({ type: 'success', text: 'MFA disabled successfully' });
        fetchUserData(); // Refresh user data
      } catch (error) {
        setMessage({ 
          type: 'danger', 
          text: error.response?.data?.message || 'Failed to disable MFA' 
        });
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    // Validate passwords if user is trying to change it
    if (formData.password) {
      if (formData.password !== formData.confirmPassword) {
        setMessage({ type: 'danger', text: 'Passwords do not match' });
        return;
      }
      
      if (!formData.currentPassword) {
        setMessage({ type: 'danger', text: 'Current password is required to set a new password' });
        return;
      }
    }
    
    try {
      setLoading(true);
      
      // Prepare update data
      const updateData = {
        name: formData.name,
        email: formData.email
      };
      
      // Add password only if user is trying to change it
      if (formData.password && formData.currentPassword) {
        updateData.password = formData.password;
        updateData.currentPassword = formData.currentPassword;
      }
      
      // Update profile
      const updatedUser = await authService.updateProfile(updateData, user.token);
      
      // Update Redux state
      dispatch(login(updatedUser));
      
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      
      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
        currentPassword: ''
      }));
    } catch (error) {
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'Failed to update profile';
        
      setMessage({ type: 'danger', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container>
      <Row className="justify-content-center mb-4">
        <Col md={8} lg={6}>
          <h1 className="mb-4">Profile</h1>
          
          {message.text && (
            <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
              {message.text}
            </Alert>
          )}
          
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">User Information</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <hr className="my-4" />
                <h5 className="mb-3">Change Password</h5>
                <p className="text-muted mb-3">Leave blank if you don't want to change your password</p>
                
                <Form.Group className="mb-3">
                  <Form.Label>Current Password</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type={passwordShown ? "text" : "password"}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                    />
                    <Button 
                      variant="outline-secondary"
                      onClick={() => setPasswordShown(!passwordShown)}
                    >
                      <i className={`bi ${passwordShown ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </Button>
                  </div>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </Form.Group>
                
                <div className="d-grid mt-4">
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
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
                    ) : 'Update Profile'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Account Details</h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col sm={4} className="fw-bold">Role:</Col>
                <Col sm={8}>
                  <Badge 
                    bg={
                      user?.role === 'admin' ? 'danger' : 
                      user?.role === 'manager' ? 'warning' : 'info'
                    }
                  >
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Employee'}
                  </Badge>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col sm={4} className="fw-bold">Last Login:</Col>
                <Col sm={8}>
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col sm={4} className="fw-bold">Account Created:</Col>
                <Col sm={8}>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* MFA Management Section */}
      <Row className="justify-content-center mt-4">
        <Col md={8} lg={6}>
          <Card>
            <Card.Header>
              <h5>Multi-Factor Authentication (MFA)</h5>
            </Card.Header>
            <Card.Body>
              <p>MFA Status: {(userData?.mfaEnabled === true) ? 'Enabled' : 'Disabled'}</p>
              {(userData?.mfaEnabled === true) ? (
                <div>
                  <p className="text-success">✅ MFA is enabled for your account</p>
                  <div className="d-flex gap-2">
                    <Button variant="outline-primary" onClick={() => setShowMFASetup(true)}>
                      View MFA Settings
                    </Button>
                    <Button variant="outline-danger" onClick={handleDisableMFA}>
                      Disable MFA
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-warning">⚠️ MFA is not enabled</p>
                  <Button variant="primary" onClick={() => setShowMFASetup(true)}>
                    Enable MFA
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* MFA Setup Modal */}
      <MFASetup 
        show={showMFASetup}
        onHide={() => setShowMFASetup(false)}
        onSuccess={() => {
          setShowMFASetup(false);
          // Refresh user data
          window.location.reload();
        }}
      />
    </Container>
  );
};

export default Profile;