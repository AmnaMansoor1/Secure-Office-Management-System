// src/components/auth/MFASetup.jsx
import { useState, useEffect } from 'react';
import { Card, Button, Alert, Form, Row, Col, Modal } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import authService from '../../services/authService';

const MFASetup = ({ show, onHide, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: QR Code, 2: Verification, 3: Backup Codes
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user } = useSelector((state) => state.auth);

  // Remove auto-start, let user click the button

  const setupMFA = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Starting MFA setup...');
      const response = await authService.setupMFA();
      console.log('MFA setup response:', response);
      setQrCode(response.qrCode);
      setSecret(response.manualEntryKey);
      setStep(2);
    } catch (error) {
      console.error('MFA setup error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to setup MFA';
      
      // If MFA is already enabled, close the modal and show success
      if (errorMessage.includes('MFA is already enabled')) {
        setSuccess('MFA is already enabled for your account.');
        setTimeout(() => {
          onHide();
          onSuccess();
        }, 2000);
        return;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyMFA = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const response = await authService.verifyMFASetup(verificationToken);
      setBackupCodes(response.backupCodes);
      setStep(3);
      setSuccess('MFA enabled successfully!');
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid MFA token');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setQrCode('');
    setSecret('');
    setVerificationToken('');
    setBackupCodes([]);
    setError('');
    setSuccess('');
    onHide();
  };

  const handleSuccess = () => {
    onSuccess();
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Setup Multi-Factor Authentication</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {step === 1 && (
          <div className="text-center">
            <h5>Step 1: Setup MFA</h5>
            {user?.mfaEnabled ? (
              <div>
                <Alert variant="info">
                  <strong>MFA is already enabled</strong><br/>
                  Your account already has Multi-Factor Authentication enabled. 
                  You can manage your MFA settings from the profile page.
                </Alert>
                <div className="d-flex gap-2 justify-content-center">
                  <Button variant="secondary" onClick={onHide}>
                    Close
                  </Button>
                  <Button variant="outline-primary" onClick={() => {
                    onHide();
                    // You could add navigation to MFA management here
                  }}>
                    Manage MFA
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p>Click the button below to generate your MFA setup.</p>
                {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
                <Button onClick={setupMFA} disabled={loading}>
                  {loading ? 'Generating...' : 'Start MFA Setup'}
                </Button>
                <div className="mt-3">
                  <small className="text-muted">
                    Debug: Check browser console (F12) for detailed error messages
                  </small>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h5>Step 2: Scan QR Code</h5>
            <Row>
              <Col md={6}>
                <div className="text-center">
                  <h6>Scan with your authenticator app:</h6>
                  {qrCode && (
                    <img 
                      src={qrCode} 
                      alt="QR Code" 
                      className="img-fluid mb-3"
                      style={{ maxWidth: '200px' }}
                    />
                  )}
                </div>
              </Col>
              <Col md={6}>
                <div>
                  <h6>Or enter manually:</h6>
                  <Form.Control
                    type="text"
                    value={secret}
                    readOnly
                    className="mb-3"
                  />
                  <small className="text-muted">
                    Use this key if you can't scan the QR code
                  </small>
                </div>
              </Col>
            </Row>
            
            <hr />
            
            <Form onSubmit={verifyMFA}>
              <Form.Group className="mb-3">
                <Form.Label>Enter 6-digit code from your app:</Form.Label>
                <Form.Control
                  type="text"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </Form.Group>
              <Button type="submit" disabled={loading || verificationToken.length !== 6}>
                {loading ? 'Verifying...' : 'Verify & Enable MFA'}
              </Button>
            </Form>
          </div>
        )}

        {step === 3 && (
          <div>
            <h5>Step 3: Backup Codes</h5>
            <Alert variant="warning">
              <strong>Important:</strong> Save these backup codes in a safe place. 
              You can use them to access your account if you lose your authenticator device.
            </Alert>
            
            <Card className="mb-3">
              <Card.Header>
                <strong>Your Backup Codes:</strong>
              </Card.Header>
              <Card.Body>
                <div className="row">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="col-md-6 mb-2">
                      <code>{code}</code>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
            
            <div className="d-grid gap-2">
              <Button variant="success" onClick={handleSuccess}>
                MFA Setup Complete
              </Button>
              <Button variant="outline-secondary" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default MFASetup;
