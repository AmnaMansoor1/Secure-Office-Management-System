// src/components/auth/LoginForm.jsx
import { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, setLoading, setError, reset } from '../../redux/slices/authSlice';
import authService from '../../services/authService';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    mfaToken: ''
  });
  
  const [mfaRequired, setMfaRequired] = useState(false);
  
  const { email, password, mfaToken } = formData;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isLoading, isError, isSuccess, message } = useSelector((state) => state.auth);
  
  useEffect(() => {
    if (isSuccess || user) {
      navigate('/dashboard');
    }
    
    dispatch(reset());
  }, [user, isSuccess, navigate, dispatch]);
  
  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };
  
  const onSubmit = async (e) => {
    e.preventDefault();
    
    const userData = {
      email,
      password,
      ...(mfaToken && { mfaToken })
    };
    
    try {
      dispatch(setLoading(true));
      const response = await authService.login(userData);
      
      // Check if MFA is required
      if (response.mfaRequired) {
        setMfaRequired(true);
        dispatch(setLoading(false));
        return;
      }
      
      dispatch(login(response));
      try {
        localStorage.setItem('user', JSON.stringify(response));
      } catch {
        // ignore storage errors
      }
      navigate('/dashboard');
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      dispatch(setError(message));
    }
  };
  
  return (
    <div className="login-form">
      <h1 className="mb-4">Login</h1>
      
      {isError && <Alert variant="danger">{message}</Alert>}
      
      {mfaRequired && (
        <Alert variant="info">
          <strong>Multi-Factor Authentication Required</strong><br />
          Please enter the 6-digit code from your authenticator app or use a backup code.
        </Alert>
      )}
      
      <Form onSubmit={onSubmit}>
        {!mfaRequired ? (
          <>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Email Address</Form.Label>
              <Form.Control 
                type="email" 
                name="email"
                value={email}
                onChange={onChange}
                placeholder="Enter your email"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control 
                type="password" 
                name="password"
                value={password}
                onChange={onChange}
                placeholder="Enter your password"
                required
              />
            </Form.Group>
          </>
        ) : (
          <Form.Group className="mb-3" controlId="mfaToken">
            <Form.Label>MFA Token</Form.Label>
            <Form.Control 
              type="text" 
              name="mfaToken"
              value={mfaToken}
              onChange={onChange}
              placeholder="Enter 6-digit code or backup code"
              maxLength={10}
              required
            />
            <Form.Text className="text-muted">
              Enter the 6-digit code from your authenticator app or use a backup code.
            </Form.Text>
          </Form.Group>
        )}
        
        <Button variant="primary" type="submit" disabled={isLoading} className="w-100">
          {isLoading ? (
            <>
              <Spinner 
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
              <span className="ms-2">Loading...</span>
            </>
          ) : mfaRequired ? 'Verify MFA' : 'Login'}
        </Button>
        
        {mfaRequired && (
          <Button 
            variant="outline-secondary" 
            className="w-100 mt-2"
            onClick={() => {
              setMfaRequired(false);
              setFormData(prev => ({ ...prev, mfaToken: '' }));
            }}
          >
            Back to Login
          </Button>
        )}
      </Form>
    </div>
  );
};

export default LoginForm;
