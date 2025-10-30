// src/components/auth/MFAManagement.jsx
import { useState } from 'react';
import { Card, Button, Alert, Form, Modal, Row, Col } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import authService from '../../services/authService';

const MFAManagement = ({ onSetupClick }) => {
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user } = useSelector((state) => state.auth);
  
  // Debug: Log user data to see MFA status
  console.log('User MFA Status:', user?.mfaEnabled);

  const handleDisableMFA = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await authService.disableMFA({ password, mfaToken });
      setSuccess('MFA disabled successfully');
      setShowDisableModal(false);
      setPassword('');
      setMfaToken('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBackupCodes = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const response = await authService.generateBackupCodes({ password });
      setNewBackupCodes(response.backupCodes);
      setShowBackupModal(true);
      setPassword('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to generate backup codes');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModals = () => {
    setShowDisableModal(false);
    setShowBackupModal(false);
    setPassword('');
    setMfaToken('');
    setNewBackupCodes([]);
    setError('');
    setSuccess('');
  };

  return (
    <Card>
      <Card.Header>
        <h5>Multi-Factor Authentication</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Row>
          <Col md={8}>
            <div className="mb-3">
              <strong>Status:</strong>{' '}
              <span className={(user?.mfaEnabled === true) ? 'text-success' : 'text-danger'}>
                {(user?.mfaEnabled === true) ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            
            {(user?.mfaEnabled === true) ? (
              <div>
                <p className="text-muted">
                  Your account is protected with Multi-Factor Authentication. 
                  You'll need to enter a code from your authenticator app when logging in.
                </p>
                
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-danger" 
                    onClick={() => setShowDisableModal(true)}
                  >
                    Disable MFA
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => setShowBackupModal(true)}
                  >
                    Generate New Backup Codes
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-muted">
                  Multi-Factor Authentication adds an extra layer of security to your account. 
                  We recommend enabling it for better protection.
                </p>
                <Button variant="primary" onClick={onSetupClick}>
                  Enable MFA
                </Button>
              </div>
            )}
          </Col>
          <Col md={4}>
            <div className="text-center">
              <div className={`mfa-status-icon ${user?.mfaEnabled ? 'enabled' : 'disabled'}`}>
                <i className={`bi bi-${user?.mfaEnabled ? 'shield-check' : 'shield'} fs-1`}></i>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

      {/* Disable MFA Modal */}
      <Modal show={showDisableModal} onHide={handleCloseModals} centered>
        <Modal.Header closeButton>
          <Modal.Title>Disable Multi-Factor Authentication</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>Warning:</strong> Disabling MFA will reduce the security of your account.
          </Alert>
          
          <Form onSubmit={handleDisableMFA}>
            <Form.Group className="mb-3">
              <Form.Label>Current Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>MFA Token</Form.Label>
              <Form.Control
                type="text"
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value)}
                placeholder="Enter 6-digit code or backup code"
                maxLength={10}
                required
              />
              <Form.Text className="text-muted">
                Enter the 6-digit code from your authenticator app or use a backup code.
              </Form.Text>
            </Form.Group>
            
            <div className="d-flex gap-2">
              <Button type="submit" variant="danger" disabled={loading}>
                {loading ? 'Disabling...' : 'Disable MFA'}
              </Button>
              <Button variant="outline-secondary" onClick={handleCloseModals}>
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Generate Backup Codes Modal */}
      <Modal show={showBackupModal} onHide={handleCloseModals} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Generate New Backup Codes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {newBackupCodes.length > 0 ? (
            <div>
              <Alert variant="warning">
                <strong>Important:</strong> Save these new backup codes in a safe place. 
                Your old backup codes are no longer valid.
              </Alert>
              
              <Card>
                <Card.Header>
                  <strong>Your New Backup Codes:</strong>
                </Card.Header>
                <Card.Body>
                  <div className="row">
                    {newBackupCodes.map((code, index) => (
                      <div key={index} className="col-md-6 mb-2">
                        <code>{code}</code>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
              
              <div className="d-grid gap-2 mt-3">
                <Button variant="success" onClick={handleCloseModals}>
                  I've Saved These Codes
                </Button>
              </div>
            </div>
          ) : (
            <Form onSubmit={handleGenerateBackupCodes}>
              <Form.Group className="mb-3">
                <Form.Label>Current Password</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </Form.Group>
              
              <div className="d-flex gap-2">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Generating...' : 'Generate New Codes'}
                </Button>
                <Button variant="outline-secondary" onClick={handleCloseModals}>
                  Cancel
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </Card>
  );
};

export default MFAManagement;
