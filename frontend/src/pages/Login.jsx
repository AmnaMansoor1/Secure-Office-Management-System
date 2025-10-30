// src/pages/Login.jsx
import { Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

const Login = () => {
  return (
    <Row className="justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
      <Col md={6} lg={4}>
        <Card className="shadow">
          <Card.Body className="p-4">
            <LoginForm />
            <div className="text-center mt-3">
              <p>Don't have an account? <Link to="/register">Register</Link></p>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default Login;