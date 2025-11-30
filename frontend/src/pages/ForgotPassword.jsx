// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import authService from '../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      setLoading(true);
      await authService.forgotPassword(email);
      setMessage('If an account exists for this email, a password reset link has been sent.');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send reset email';
      // Show generic success regardless to prevent enumeration
      setMessage('If an account exists for this email, a password reset link has been sent.');
      console.debug('Forgot password error:', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row className="justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Col md={6} lg={4}>
        <Card className="shadow">
          <Card.Body className="p-4">
            <h4 className="mb-3">Forgot Password</h4>
            {message && <Alert variant="success">{message}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={onSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>
              <Button type="submit" variant="primary" disabled={loading} className="w-100">
                {loading ? (<><Spinner animation="border" size="sm" className="me-2"/>Sending...</>) : 'Send Reset Link'}
              </Button>
            </Form>
            <div className="text-center mt-3">
              <p>
                Remembered your password? <Link to="/login">Login</Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default ForgotPassword;